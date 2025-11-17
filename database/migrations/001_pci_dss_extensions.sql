-- ============================================================================
-- GUAIR.APP - EXTENSIONES Y CONFIGURACIONES PCI-DSS
-- ============================================================================
-- Descripción: Migración para agregar extensiones PostgreSQL, funciones de
--              auditoría, triggers, y particionamiento para compliance PCI-DSS
-- Versión: 1.0
-- Compliance: PCI-DSS 10, 11
-- ============================================================================

-- ============================================================================
-- EXTENSIONES REQUERIDAS
-- ============================================================================

-- pgcrypto: Para funciones de encriptación y hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- uuid-ossp: Para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_stat_statements: Para análisis de performance (PCI-DSS 11.5)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- pg_trgm: Para búsquedas de texto full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para generar hash SHA-256
CREATE OR REPLACE FUNCTION generate_content_hash(content TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(content, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para generar HMAC signature
CREATE OR REPLACE FUNCTION generate_hmac_signature(content TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(hmac(content, secret, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para validar integridad de audit log
-- PCI-DSS 10.5.2: Los logs de auditoría deben ser protegidos contra modificación
CREATE OR REPLACE FUNCTION validate_audit_log_integrity(log_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  log_record RECORD;
  computed_hash TEXT;
  content TEXT;
BEGIN
  SELECT * INTO log_record FROM audit_logs WHERE id = log_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Reconstruir contenido para validar hash
  content := CONCAT(
    COALESCE(log_record."userId", ''), '|',
    log_record.action, '|',
    COALESCE(log_record.resource, ''), '|',
    COALESCE(log_record."resourceId", ''), '|',
    log_record."createdAt"::TEXT
  );

  computed_hash := generate_content_hash(content);

  RETURN computed_hash = log_record.hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Función trigger para audit log automático en cambios críticos
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  secret_key TEXT;
  content TEXT;
  hash_value TEXT;
  signature_value TEXT;
BEGIN
  -- Determinar acción
  IF TG_OP = 'INSERT' THEN
    audit_action := 'CREATE';
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE';
  END IF;

  -- Generar hash y signature
  content := CONCAT(
    COALESCE(NEW."userId"::TEXT, OLD."userId"::TEXT, ''), '|',
    audit_action, '|',
    TG_TABLE_NAME, '|',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT, ''), '|',
    NOW()::TEXT
  );

  hash_value := generate_content_hash(content);

  -- En producción, secret_key debe venir de variable de entorno
  -- Por ahora usamos una constante (CAMBIAR EN PRODUCCIÓN)
  secret_key := COALESCE(current_setting('app.hmac_secret', true), 'CHANGE_THIS_SECRET');
  signature_value := generate_hmac_signature(content, secret_key);

  -- Insertar en audit_logs
  INSERT INTO audit_logs (
    id,
    "userId",
    action,
    resource,
    "resourceId",
    "createdAt",
    hash,
    signature,
    result
  ) VALUES (
    gen_random_uuid(),
    COALESCE(NEW."userId", OLD."userId"),
    audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    NOW(),
    hash_value,
    signature_value,
    'SUCCESS'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APLICAR TRIGGERS A TABLAS CRÍTICAS
-- ============================================================================

-- Trigger en users (solo para cambios críticos)
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  WHEN (
    TG_OP = 'DELETE' OR
    (TG_OP = 'UPDATE' AND (
      OLD.role IS DISTINCT FROM NEW.role OR
      OLD."accountLocked" IS DISTINCT FROM NEW."accountLocked" OR
      OLD."passwordHash" IS DISTINCT FROM NEW."passwordHash"
    ))
  )
  EXECUTE FUNCTION audit_trigger_function();

-- Trigger en wallets
CREATE TRIGGER audit_wallets_trigger
  AFTER INSERT OR UPDATE OF status, balance OR DELETE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Trigger en payments (todas las operaciones)
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- FUNCIÓN PARA PREVENIR MODIFICACIÓN DE AUDIT LOGS
-- ============================================================================

-- PCI-DSS 10.5.2: Los logs de auditoría no deben ser modificables
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_changes
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- FUNCIÓN PARA PREVENIR MODIFICACIÓN DE LEDGER ENTRIES
-- ============================================================================

-- PCI-DSS: Entradas del libro mayor son inmutables
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Ledger entries are immutable and cannot be modified or deleted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_changes
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_modification();

-- ============================================================================
-- PARTICIONAMIENTO DE TABLAS TRANSACCIONALES
-- ============================================================================

-- Configurar particionamiento para audit_logs por mes
-- Esto mejora el performance y facilita archivado (PCI-DSS 10.7)

-- Nota: Prisma no soporta particionamiento nativo, así que debemos hacerlo manualmente
-- Primero, convertir audit_logs a tabla particionada (requiere recrear la tabla)

-- IMPORTANTE: Esta migración asume que la tabla audit_logs ya existe desde Prisma
-- Para implementar particionamiento, se debe hacer después de la primera migración de Prisma

-- ============================================================================
-- VISTAS MATERIALIZADAS PARA REPORTING Y ANALYTICS
-- ============================================================================

-- Vista materializada para balance diario por wallet
-- PCI-DSS 10.2: Monitoreo de actividad diaria
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_wallet_balances AS
SELECT
  w.id as wallet_id,
  w."userId" as user_id,
  DATE(le."createdAt") as balance_date,
  SUM(le.credit - le.debit) as net_change,
  w.balance as current_balance
FROM wallets w
LEFT JOIN ledger_entries le ON w.id = le."walletId"
WHERE le."createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY w.id, w."userId", w.balance, DATE(le."createdAt")
ORDER BY balance_date DESC;

-- Índices para la vista materializada
CREATE INDEX IF NOT EXISTS idx_daily_balances_wallet
  ON daily_wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_daily_balances_date
  ON daily_wallet_balances(balance_date);

-- Vista materializada para detección de anomalías en transacciones
-- PCI-DSS 11.4: Detección de intrusos y anomalías
CREATE MATERIALIZED VIEW IF NOT EXISTS transaction_anomalies AS
SELECT
  t.id,
  t."userId",
  t.amount,
  t.currency,
  t.type,
  t.status,
  t."createdAt",
  -- Calcular promedio y desviación estándar por usuario
  AVG(t.amount) OVER (
    PARTITION BY t."userId"
    ORDER BY t."createdAt"
    ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
  ) as avg_amount_30d,
  STDDEV(t.amount) OVER (
    PARTITION BY t."userId"
    ORDER BY t."createdAt"
    ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
  ) as stddev_amount_30d,
  -- Detectar si el monto es anómalo (>3 desviaciones estándar)
  CASE
    WHEN t.amount > (
      AVG(t.amount) OVER (
        PARTITION BY t."userId"
        ORDER BY t."createdAt"
        ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
      ) + 3 * STDDEV(t.amount) OVER (
        PARTITION BY t."userId"
        ORDER BY t."createdAt"
        ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
      )
    ) THEN true
    ELSE false
  END as is_anomaly
FROM transactions t
WHERE t."createdAt" >= NOW() - INTERVAL '90 days'
  AND t.status = 'SUCCEEDED';

-- Índices para la vista de anomalías
CREATE INDEX IF NOT EXISTS idx_anomalies_user
  ON transaction_anomalies("userId");
CREATE INDEX IF NOT EXISTS idx_anomalies_date
  ON transaction_anomalies("createdAt");
CREATE INDEX IF NOT EXISTS idx_anomalies_flag
  ON transaction_anomalies(is_anomaly) WHERE is_anomaly = true;

-- ============================================================================
-- FUNCIÓN PARA REFRESCAR VISTAS MATERIALIZADAS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_wallet_balances;
  REFRESH MATERIALIZED VIEW CONCURRENTLY transaction_anomalies;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÍNDICES ESPECIALIZADOS PARA PERFORMANCE
-- ============================================================================

-- Índices para búsquedas de auditoría (PCI-DSS 10.6)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_brin
  ON audit_logs USING BRIN("createdAt");

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action
  ON audit_logs("userId", action)
  WHERE result = 'FAILURE';

-- Índices para ledger_entries (búsquedas por rango de fecha)
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_brin
  ON ledger_entries USING BRIN("createdAt");

CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet_date
  ON ledger_entries("walletId", "createdAt" DESC);

-- Índice GiST para búsquedas de texto en audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin
  ON audit_logs USING GIN(metadata);

-- Índice para búsquedas de transacciones sospechosas
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved
  ON security_events(severity, "createdAt")
  WHERE resolved = false;

-- ============================================================================
-- POLÍTICAS DE ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en tablas sensibles (opcional, según arquitectura de la app)
-- PCI-DSS 7.1: Limitar acceso a datos de acuerdo con necesidad de conocer

-- Ejemplo para audit_logs (solo admins y auditors pueden ver todos los logs)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios logs
CREATE POLICY audit_logs_user_policy ON audit_logs
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true)::UUID);

-- Política: Los admins pueden ver todo
CREATE POLICY audit_logs_admin_policy ON audit_logs
  FOR ALL
  USING (current_setting('app.user_role', true) IN ('ADMIN', 'AUDITOR'));

-- ============================================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS (DOCUMENTACIÓN)
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Audit logs inmutables para compliance PCI-DSS 10. Registra todas las acciones críticas del sistema';
COMMENT ON COLUMN audit_logs.hash IS 'SHA-256 hash del contenido del log para verificar integridad';
COMMENT ON COLUMN audit_logs.signature IS 'HMAC-SHA256 signature para autenticación del log';

COMMENT ON TABLE ledger_entries IS 'Libro mayor con double-entry accounting. Cada transacción genera 2 entradas (DR + CR)';
COMMENT ON COLUMN ledger_entries.debit IS 'Monto de débito (salida de fondos)';
COMMENT ON COLUMN ledger_entries.credit IS 'Monto de crédito (entrada de fondos)';
COMMENT ON COLUMN ledger_entries.hash IS 'SHA-256 hash para integridad';

COMMENT ON TABLE security_events IS 'Eventos de seguridad para monitoreo y compliance PCI-DSS 11';

-- ============================================================================
-- GRANTS Y PERMISOS (EJEMPLO)
-- ============================================================================

-- Crear roles específicos (opcional, según arquitectura)
-- PCI-DSS 7.1.2: Asignar privilegios basados en clasificación y necesidad

-- Ejemplo de roles:
-- CREATE ROLE guaira_app_user;
-- CREATE ROLE guaira_app_admin;
-- CREATE ROLE guaira_app_auditor;

-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO guaira_app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO guaira_app_admin;
-- GRANT SELECT ON audit_logs, security_events, ledger_entries TO guaira_app_auditor;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
