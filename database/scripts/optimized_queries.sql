-- ============================================================================
-- GUAIR.APP - OPTIMIZED QUERIES COLLECTION
-- ============================================================================
-- Descripción: Colección de queries optimizadas para operaciones comunes
--              con índices apropiados y performance garantizado
-- Versión: 1.0
-- ============================================================================

-- ============================================================================
-- 1. CONSULTAS DE USUARIOS Y AUTENTICACIÓN
-- ============================================================================

-- Login: Obtener usuario con validación de password
-- Índice usado: idx_users_phone
SELECT
  id,
  phone,
  "passwordHash",
  name,
  email,
  role,
  "accountLocked",
  "mfaEnabled",
  "failedLoginAttempts",
  "lastLogin"
FROM users
WHERE phone = $1
  AND "deletedAt" IS NULL;

-- Verificar si email ya existe (para registro)
-- Índice usado: idx_users_email
SELECT EXISTS(
  SELECT 1 FROM users
  WHERE email = $1
    AND "deletedAt" IS NULL
);

-- Obtener perfil completo de usuario con wallet
-- Índice usado: idx_users_id (PK)
SELECT
  u.id,
  u.phone,
  u.name,
  u.email,
  u.role,
  u.avatar,
  u."kycStatus",
  u."kycLevel",
  u."createdAt",
  w.id as wallet_id,
  w."walletNumber",
  w.balance,
  w."availableBalance",
  w.currency,
  w.status as wallet_status
FROM users u
LEFT JOIN wallets w ON w."userId" = u.id
WHERE u.id = $1
  AND u."deletedAt" IS NULL;

-- ============================================================================
-- 2. CONSULTAS DE WALLET Y BALANCE
-- ============================================================================

-- Obtener balance actual de wallet
-- Índice usado: idx_wallets_userId
SELECT
  id,
  "walletNumber",
  balance,
  "availableBalance",
  "holdBalance",
  currency,
  status,
  "dailyLimit",
  "monthlyLimit"
FROM wallets
WHERE "userId" = $1
  AND status = 'ACTIVE';

-- Obtener balance histórico (últimos 30 días)
-- Índice usado: idx_ledger_entries_wallet_date
SELECT
  DATE("createdAt") as date,
  SUM(credit - debit) as net_change,
  SUM(SUM(credit - debit)) OVER (ORDER BY DATE("createdAt")) as cumulative_balance
FROM ledger_entries
WHERE "walletId" = $1
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Verificar si wallet tiene fondos suficientes
-- Índice usado: idx_wallets_id (PK)
SELECT
  "availableBalance" >= $2 as has_sufficient_funds,
  "availableBalance"
FROM wallets
WHERE id = $1
  AND status = 'ACTIVE'
FOR UPDATE; -- Lock para prevenir race conditions

-- ============================================================================
-- 3. CONSULTAS DE TRANSACCIONES
-- ============================================================================

-- Obtener transacciones de usuario (paginado)
-- Índice usado: idx_transactions_user_created
SELECT
  t.id,
  t.type,
  t.amount,
  t.currency,
  t.status,
  t.description,
  t."createdAt",
  t."ipAddress",
  -- Incluir detalles de wallet
  w."walletNumber"
FROM transactions t
JOIN wallets w ON t."walletId" = w.id
WHERE t."userId" = $1
  AND t."createdAt" >= $2 -- Filtro de fecha para particionamiento
ORDER BY t."createdAt" DESC
LIMIT $3 OFFSET $4;

-- Obtener transacción por ID con detalles de ledger
-- Índice usado: idx_transactions_id (PK)
SELECT
  t.id,
  t."userId",
  t."walletId",
  t.type,
  t.amount,
  t.currency,
  t.status,
  t.description,
  t."createdAt",
  t.hash,
  t.signature,
  -- Ledger entries relacionadas
  json_agg(
    json_build_object(
      'id', le.id,
      'entryType', le."entryType",
      'debit', le.debit,
      'credit', le.credit,
      'balanceAfter', le."balanceAfter",
      'accountType', le."accountType"
    ) ORDER BY le."createdAt"
  ) as ledger_entries
FROM transactions t
LEFT JOIN ledger_entries le ON le."transactionId" = t.id
WHERE t.id = $1
GROUP BY t.id;

-- Buscar transacción por idempotency key (prevenir duplicados)
-- Índice usado: idx_transactions_idempotencyKey
SELECT
  id,
  status,
  amount,
  "createdAt"
FROM transactions
WHERE "idempotencyKey" = $1;

-- Transacciones pendientes para procesamiento
-- Índice usado: idx_transactions_status_created
SELECT
  id,
  "userId",
  "walletId",
  type,
  amount,
  currency,
  "createdAt"
FROM transactions
WHERE status = 'PENDING'
  AND "createdAt" >= NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" ASC
LIMIT 100;

-- ============================================================================
-- 4. CONSULTAS DE PAGOS
-- ============================================================================

-- Obtener pagos de usuario (últimos 30 días)
-- Índice usado: idx_payments_user_created
SELECT
  p.id,
  p."merchantId",
  p.amount,
  p.currency,
  p."feeAmount",
  p."merchantAmount",
  p.status,
  p.description,
  p.items,
  p."createdAt",
  p."completedAt",
  -- Payment method info
  pm.type as payment_method_type,
  pm.last4,
  pm.brand
FROM payments p
LEFT JOIN payment_methods pm ON p."paymentMethodId" = pm.id
WHERE p."userId" = $1
  AND p."createdAt" >= NOW() - INTERVAL '30 days'
ORDER BY p."createdAt" DESC;

-- Obtener pago por idempotency key
-- Índice usado: idx_payments_idempotencyKey
SELECT
  id,
  status,
  amount,
  "merchantId",
  "createdAt"
FROM payments
WHERE "idempotencyKey" = $1;

-- Pagos por merchant (reporte de ventas)
-- Índice usado: idx_payments_merchant_status
SELECT
  DATE("createdAt") as sale_date,
  COUNT(*) as transaction_count,
  SUM(amount) as gross_revenue,
  SUM("feeAmount") as total_fees,
  SUM("merchantAmount") as net_revenue,
  currency
FROM payments
WHERE "merchantId" = $1
  AND status = 'SUCCEEDED'
  AND "createdAt" >= $2
  AND "createdAt" < $3
GROUP BY DATE("createdAt"), currency
ORDER BY sale_date DESC;

-- ============================================================================
-- 5. CONSULTAS DE DOUBLE-ENTRY LEDGER
-- ============================================================================

-- Obtener entradas de ledger para una transacción
-- Índice usado: idx_ledger_entries_ledgerRef
SELECT
  id,
  "ledgerRef",
  "entryType",
  "userId",
  "walletId",
  "merchantId",
  "accountType",
  debit,
  credit,
  currency,
  "balanceAfter",
  description,
  "createdAt"
FROM ledger_entries
WHERE "ledgerRef" = $1
ORDER BY "createdAt" ASC;

-- Verificar balance de double-entry para un ledgerRef
-- Índice usado: idx_ledger_entries_ledgerRef
SELECT
  "ledgerRef",
  SUM(debit) as total_debit,
  SUM(credit) as total_credit,
  SUM(debit - credit) as balance
FROM ledger_entries
WHERE "ledgerRef" = $1
GROUP BY "ledgerRef"
HAVING ABS(SUM(debit - credit)) > 0.01; -- Solo retorna si está desbalanceado

-- Obtener estado de cuenta de wallet (últimas 50 entradas)
-- Índice usado: idx_ledger_entries_wallet_date
SELECT
  le.id,
  le."ledgerRef",
  le."entryType",
  le.debit,
  le.credit,
  le."balanceAfter",
  le.description,
  le."createdAt",
  -- Info de transacción relacionada
  t.type as transaction_type,
  t.status as transaction_status
FROM ledger_entries le
LEFT JOIN transactions t ON le."transactionId" = t.id
WHERE le."walletId" = $1
ORDER BY le."createdAt" DESC
LIMIT 50;

-- Calcular balance desde ledger (verificación)
-- Índice usado: idx_ledger_entries_wallet_date
SELECT
  "walletId",
  SUM(credit - debit) as calculated_balance,
  MAX("balanceAfter") as last_balance_snapshot
FROM ledger_entries
WHERE "walletId" = $1
GROUP BY "walletId";

-- ============================================================================
-- 6. CONSULTAS DE AUDITORÍA (PCI-DSS 10)
-- ============================================================================

-- Obtener logs de auditoría de usuario (últimas 100)
-- Índice usado: idx_audit_logs_user_timestamp
SELECT
  id,
  action,
  resource,
  "resourceId",
  result,
  "ipAddress",
  "userAgent",
  "createdAt"
FROM audit_logs
WHERE "userId" = $1
ORDER BY "createdAt" DESC
LIMIT 100;

-- Buscar eventos de seguridad críticos (últimas 24h)
-- Índice usado: idx_audit_logs_timestamp, idx_audit_logs_result
SELECT
  al.id,
  al."userId",
  al."userName",
  al.action,
  al.resource,
  al."resourceId",
  al.result,
  al."ipAddress",
  al."createdAt",
  -- Join con user info si existe
  u.phone,
  u.name
FROM audit_logs al
LEFT JOIN users u ON al."userId" = u.id
WHERE al.result = 'FAILURE'
  AND al."createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY al."createdAt" DESC;

-- Detectar intentos de login fallidos (brute force)
-- Índice usado: idx_audit_logs_action_timestamp
SELECT
  "ipAddress",
  COUNT(*) as failed_attempts,
  MAX("createdAt") as last_attempt,
  array_agg(DISTINCT "userId") as targeted_users
FROM audit_logs
WHERE action = 'USER_LOGIN_FAILED'
  AND "createdAt" >= NOW() - INTERVAL '1 hour'
GROUP BY "ipAddress"
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- ============================================================================
-- 7. CONSULTAS DE SEGURIDAD
-- ============================================================================

-- Obtener eventos de seguridad no resueltos
-- Índice usado: idx_security_events_unresolved
SELECT
  id,
  type,
  severity,
  "userId",
  "ipAddress",
  description,
  details,
  "createdAt"
FROM security_events
WHERE resolved = false
ORDER BY
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  "createdAt" DESC;

-- Rate limiting: verificar si se excedió límite
-- Índice usado: idx_rate_limit_logs_identifier_action
SELECT
  COUNT(*) as request_count,
  MAX("createdAt") as last_request
FROM rate_limit_logs
WHERE identifier = $1
  AND action = $2
  AND "createdAt" >= NOW() - INTERVAL '1 hour'
GROUP BY identifier;

-- ============================================================================
-- 8. CONSULTAS DE PAYMENT METHODS
-- ============================================================================

-- Obtener métodos de pago activos de usuario
-- Índice usado: idx_payment_methods_user_status
SELECT
  id,
  type,
  provider,
  last4,
  brand,
  "expiryMonth",
  "expiryYear",
  "isDefault",
  "createdAt",
  "lastUsedAt"
FROM payment_methods
WHERE "userId" = $1
  AND status = 'ACTIVE'
ORDER BY "isDefault" DESC, "lastUsedAt" DESC NULLS LAST;

-- ============================================================================
-- 9. ANALYTICS Y REPORTES
-- ============================================================================

-- Reporte de actividad diaria (dashboard)
-- Índice usado: idx_transactions_created, idx_payments_created
SELECT
  DATE(t."createdAt") as activity_date,
  COUNT(DISTINCT t."userId") as active_users,
  COUNT(CASE WHEN t.type = 'DEPOSIT' THEN 1 END) as deposits_count,
  SUM(CASE WHEN t.type = 'DEPOSIT' AND t.status = 'SUCCEEDED' THEN t.amount ELSE 0 END) as deposits_amount,
  COUNT(CASE WHEN t.type = 'PAYMENT' THEN 1 END) as payments_count,
  SUM(CASE WHEN t.type = 'PAYMENT' AND t.status = 'SUCCEEDED' THEN t.amount ELSE 0 END) as payments_amount,
  COUNT(CASE WHEN t.type = 'WITHDRAWAL' THEN 1 END) as withdrawals_count,
  SUM(CASE WHEN t.type = 'WITHDRAWAL' AND t.status = 'SUCCEEDED' THEN t.amount ELSE 0 END) as withdrawals_amount
FROM transactions t
WHERE t."createdAt" >= $1
  AND t."createdAt" < $2
GROUP BY DATE(t."createdAt")
ORDER BY activity_date DESC;

-- Top usuarios por volumen transaccional
-- Índice usado: idx_transactions_user_status
SELECT
  u.id,
  u.name,
  u.phone,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_volume,
  AVG(t.amount) as avg_transaction,
  MAX(t."createdAt") as last_transaction
FROM users u
JOIN transactions t ON u.id = t."userId"
WHERE t.status = 'SUCCEEDED'
  AND t."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.phone
ORDER BY total_volume DESC
LIMIT 50;

-- Detección de anomalías usando vista materializada
-- Vista: transaction_anomalies
SELECT
  ta.id,
  ta."userId",
  ta.amount,
  ta.type,
  ta."avg_amount_30d",
  ta."stddev_amount_30d",
  ta."createdAt",
  u.name,
  u.phone
FROM transaction_anomalies ta
JOIN users u ON ta."userId" = u.id
WHERE ta.is_anomaly = true
  AND ta."createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY ta.amount DESC;

-- ============================================================================
-- 10. CONSULTAS DE CONCILIACIÓN
-- ============================================================================

-- Transacciones sin reconciliar (últimas 24h)
-- Índice usado: idx_ledger_entries_reconciled
SELECT
  le."ledgerRef",
  le."walletId",
  SUM(le.debit) as total_debit,
  SUM(le.credit) as total_credit,
  MAX(le."createdAt") as latest_entry,
  COUNT(*) as entry_count
FROM ledger_entries le
WHERE le."reconciledAt" IS NULL
  AND le."createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY le."ledgerRef", le."walletId"
ORDER BY latest_entry DESC;

-- ============================================================================
-- FIN DE QUERIES OPTIMIZADAS
-- ============================================================================

-- NOTAS DE PERFORMANCE:
-- 1. Todos los queries usan índices apropiados
-- 2. Se evitan full table scans
-- 3. Se usa paginación para resultados grandes
-- 4. Los joins están optimizados
-- 5. Se prefiere EXISTS sobre COUNT cuando es apropiado
-- 6. Se usan vistas materializadas para analytics pesados
