-- ============================================================================
-- GUAIR.APP - PARTICIONAMIENTO DE TABLAS TRANSACCIONALES
-- ============================================================================
-- Descripción: Script para implementar particionamiento por fecha en tablas
--              de alto volumen para optimizar queries y archivado
-- Versión: 1.0
-- Compliance: PCI-DSS 10.7 (Retención de logs de auditoría por 1 año mínimo)
-- ============================================================================

-- ============================================================================
-- IMPORTANTE: NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- Este script debe ejecutarse DESPUÉS de que Prisma haya creado las tablas
-- El particionamiento no es soportado nativamente por Prisma, por lo que
-- se debe implementar manualmente
--
-- PASOS PARA IMPLEMENTAR:
-- 1. Backup completo de la base de datos
-- 2. Ejecutar este script en una ventana de mantenimiento
-- 3. Verificar que las queries siguen funcionando correctamente
-- 4. Configurar cron job para crear particiones futuras automáticamente
-- ============================================================================

-- ============================================================================
-- FUNCIÓN PARA CREAR PARTICIONES AUTOMÁTICAMENTE
-- ============================================================================

-- Función para crear partición de audit_logs por mes
CREATE OR REPLACE FUNCTION create_audit_logs_partition(partition_date DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calcular inicio y fin del mes
  start_date := DATE_TRUNC('month', partition_date)::DATE;
  end_date := (DATE_TRUNC('month', partition_date) + INTERVAL '1 month')::DATE;

  -- Nombre de la partición: audit_logs_y2025m01
  partition_name := 'audit_logs_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');

  -- Verificar si ya existe
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    RAISE NOTICE 'Partition % already exists, skipping', partition_name;
    RETURN;
  END IF;

  -- Crear partición
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );

  -- Crear índices en la partición
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I("userId")',
    partition_name || '_user_idx',
    partition_name
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I(action)',
    partition_name || '_action_idx',
    partition_name
  );

  RAISE NOTICE 'Created partition % for range [%, %)',
    partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

-- Función para crear partición de ledger_entries por mes
CREATE OR REPLACE FUNCTION create_ledger_entries_partition(partition_date DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := DATE_TRUNC('month', partition_date)::DATE;
  end_date := (DATE_TRUNC('month', partition_date) + INTERVAL '1 month')::DATE;

  partition_name := 'ledger_entries_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    RAISE NOTICE 'Partition % already exists, skipping', partition_name;
    RETURN;
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF ledger_entries
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );

  -- Índices especializados para ledger
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I("walletId", "createdAt" DESC)',
    partition_name || '_wallet_idx',
    partition_name
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I("ledgerRef")',
    partition_name || '_ref_idx',
    partition_name
  );

  RAISE NOTICE 'Created partition % for range [%, %)',
    partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

-- Función para crear partición de transactions por mes
CREATE OR REPLACE FUNCTION create_transactions_partition(partition_date DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := DATE_TRUNC('month', partition_date)::DATE;
  end_date := (DATE_TRUNC('month', partition_date) + INTERVAL '1 month')::DATE;

  partition_name := 'transactions_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    RAISE NOTICE 'Partition % already exists, skipping', partition_name;
    RETURN;
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF transactions
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );

  -- Índices para transactions
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I("userId", "createdAt" DESC)',
    partition_name || '_user_idx',
    partition_name
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I(status)',
    partition_name || '_status_idx',
    partition_name
  );

  RAISE NOTICE 'Created partition % for range [%, %)',
    partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN MAESTRA PARA CREAR TODAS LAS PARTICIONES
-- ============================================================================

CREATE OR REPLACE FUNCTION create_monthly_partitions(start_month DATE, num_months INTEGER DEFAULT 12)
RETURNS void AS $$
DECLARE
  current_month DATE;
  i INTEGER;
BEGIN
  current_month := DATE_TRUNC('month', start_month)::DATE;

  FOR i IN 0..(num_months - 1) LOOP
    -- Crear particiones para cada tabla
    PERFORM create_audit_logs_partition(current_month);
    PERFORM create_ledger_entries_partition(current_month);
    PERFORM create_transactions_partition(current_month);

    -- Siguiente mes
    current_month := current_month + INTERVAL '1 month';
  END LOOP;

  RAISE NOTICE 'Created partitions for % months starting from %',
    num_months, start_month;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDIMIENTO PARA ARCHIVAR PARTICIONES ANTIGUAS
-- ============================================================================

-- Función para archivar particiones antiguas (mover a tablespace de archivo)
-- PCI-DSS 10.7: Retener logs de auditoría por al menos 1 año
CREATE OR REPLACE FUNCTION archive_old_partitions(months_to_keep INTEGER DEFAULT 13)
RETURNS void AS $$
DECLARE
  partition_record RECORD;
  cutoff_date DATE;
  partition_date DATE;
BEGIN
  cutoff_date := (DATE_TRUNC('month', NOW()) - (months_to_keep || ' months')::INTERVAL)::DATE;

  -- Listar particiones de audit_logs para archivar
  FOR partition_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'audit_logs_y%'
  LOOP
    -- Extraer fecha de la partición
    -- Ejemplo: audit_logs_y2024m01 -> 2024-01-01
    partition_date := TO_DATE(
      SUBSTRING(partition_record.tablename FROM 'y(\d{4})m(\d{2})'),
      'YYYYMM'
    );

    IF partition_date < cutoff_date THEN
      RAISE NOTICE 'Archiving partition: %', partition_record.tablename;

      -- Opción 1: Mover a tablespace de archivo (si existe)
      -- EXECUTE format(
      --   'ALTER TABLE %I SET TABLESPACE archive_tablespace',
      --   partition_record.tablename
      -- );

      -- Opción 2: Detach y exportar (para archivado externo)
      -- EXECUTE format(
      --   'ALTER TABLE audit_logs DETACH PARTITION %I',
      --   partition_record.tablename
      -- );

      -- Opción 3: Solo comprimir (PostgreSQL 14+)
      EXECUTE format(
        'ALTER TABLE %I SET (toast.compression = lz4)',
        partition_record.tablename
      );

      RAISE NOTICE 'Archived partition: %', partition_record.tablename;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONVERSIÓN DE TABLAS A PARTICIONADAS (EJECUTAR SOLO SI ES NECESARIO)
-- ============================================================================

-- ADVERTENCIA: Este proceso requiere downtime o migración en vivo compleja
-- Solo ejecutar si las tablas ya tienen datos y necesitan ser particionadas

-- Script de ejemplo para convertir audit_logs a particionada:
/*
BEGIN;

-- 1. Renombrar tabla original
ALTER TABLE audit_logs RENAME TO audit_logs_old;

-- 2. Crear nueva tabla particionada
CREATE TABLE audit_logs (
  LIKE audit_logs_old INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

-- 3. Recrear constraints y triggers
-- (copiar de la tabla original)

-- 4. Crear particiones para rangos existentes
SELECT create_monthly_partitions('2024-01-01', 24);

-- 5. Copiar datos (puede tomar tiempo)
INSERT INTO audit_logs SELECT * FROM audit_logs_old;

-- 6. Verificar counts
-- SELECT COUNT(*) FROM audit_logs;
-- SELECT COUNT(*) FROM audit_logs_old;

-- 7. Drop tabla antigua (SOLO DESPUÉS DE VERIFICAR)
-- DROP TABLE audit_logs_old;

COMMIT;
*/

-- ============================================================================
-- MANTENIMIENTO AUTOMÁTICO DE PARTICIONES
-- ============================================================================

-- Función para mantenimiento mensual (crear particiones futuras)
CREATE OR REPLACE FUNCTION monthly_partition_maintenance()
RETURNS void AS $$
BEGIN
  -- Crear particiones para los próximos 3 meses
  PERFORM create_monthly_partitions(NOW(), 3);

  -- Archivar particiones antiguas (mantener 13 meses)
  PERFORM archive_old_partitions(13);

  -- Reindex particiones activas
  PERFORM maintenance_reindex_active_partitions();

  RAISE NOTICE 'Monthly partition maintenance completed';
END;
$$ LANGUAGE plpgsql;

-- Función para reindexar particiones activas (últimos 3 meses)
CREATE OR REPLACE FUNCTION maintenance_reindex_active_partitions()
RETURNS void AS $$
DECLARE
  partition_record RECORD;
  cutoff_date DATE;
  partition_date DATE;
BEGIN
  cutoff_date := (DATE_TRUNC('month', NOW()) - INTERVAL '3 months')::DATE;

  FOR partition_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND (
        tablename LIKE 'audit_logs_y%' OR
        tablename LIKE 'ledger_entries_y%' OR
        tablename LIKE 'transactions_y%'
      )
  LOOP
    -- Extraer fecha
    partition_date := TO_DATE(
      SUBSTRING(partition_record.tablename FROM 'y(\d{4})m(\d{2})'),
      'YYYYMM'
    );

    IF partition_date >= cutoff_date THEN
      RAISE NOTICE 'Reindexing partition: %', partition_record.tablename;
      EXECUTE format('REINDEX TABLE CONCURRENTLY %I', partition_record.tablename);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ESTADÍSTICAS Y MONITOREO DE PARTICIONES
-- ============================================================================

-- Vista para monitorear tamaño de particiones
CREATE OR REPLACE VIEW partition_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
  SUBSTRING(tablename FROM 'y(\d{4})m(\d{2})') as partition_period
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    tablename LIKE 'audit_logs_y%' OR
    tablename LIKE 'ledger_entries_y%' OR
    tablename LIKE 'transactions_y%'
  )
ORDER BY size_bytes DESC;

-- Vista para contar registros por partición
CREATE OR REPLACE FUNCTION partition_row_counts()
RETURNS TABLE(partition_name TEXT, row_count BIGINT) AS $$
DECLARE
  partition_record RECORD;
BEGIN
  FOR partition_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND (
        tablename LIKE 'audit_logs_y%' OR
        tablename LIKE 'ledger_entries_y%' OR
        tablename LIKE 'transactions_y%'
      )
  LOOP
    RETURN QUERY EXECUTE format(
      'SELECT %L::TEXT, COUNT(*)::BIGINT FROM %I',
      partition_record.tablename,
      partition_record.tablename
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INICIALIZACIÓN: CREAR PARTICIONES PARA EL AÑO ACTUAL Y SIGUIENTE
-- ============================================================================

-- Ejecutar esta función después de aplicar la migración
-- SELECT create_monthly_partitions('2025-01-01', 24);

-- ============================================================================
-- CRON JOB RECOMENDADO (con pg_cron extension)
-- ============================================================================

-- Si tiene pg_cron instalado, puede automatizar el mantenimiento:
/*
-- Crear particiones nuevas el primer día de cada mes
SELECT cron.schedule(
  'create-monthly-partitions',
  '0 0 1 * *', -- Día 1 de cada mes a medianoche
  $$SELECT create_monthly_partitions(NOW(), 3);$$
);

-- Mantenimiento completo el primer domingo de cada mes
SELECT cron.schedule(
  'partition-maintenance',
  '0 2 * * 0', -- Domingos a las 2am
  $$SELECT monthly_partition_maintenance();$$
);
*/

-- ============================================================================
-- FIN DE SCRIPT DE PARTICIONAMIENTO
-- ============================================================================
