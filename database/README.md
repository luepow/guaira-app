# Guair.app - Database Architecture Documentation

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Compliance PCI-DSS](#compliance-pci-dss)
4. [Modelo de Datos](#modelo-de-datos)
5. [Double-Entry Accounting](#double-entry-accounting)
6. [Seguridad](#seguridad)
7. [Performance y Optimización](#performance-y-optimización)
8. [Backup y Disaster Recovery](#backup-y-disaster-recovery)
9. [Deployment](#deployment)
10. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## Introducción

Este documento describe la arquitectura completa de la base de datos de Guair.app, una plataforma de billetera digital y POS (Point of Sale) con compliance PCI-DSS Level 1.

### Tecnologías Principales

- **Base de Datos:** PostgreSQL 16+
- **ORM:** Prisma 5+
- **Arquitectura:** Double-Entry Accounting, CQRS, Event Sourcing
- **Compliance:** PCI-DSS Level 1, GDPR, CCPA

### Características Principales

- ✅ Double-entry accounting para integridad financiera
- ✅ Audit logs inmutables (PCI-DSS 10)
- ✅ Encriptación de datos sensibles (PCI-DSS 3.4)
- ✅ Particionamiento de tablas transaccionales
- ✅ High availability con replicación
- ✅ Backup automatizado encriptado
- ✅ Monitoreo y alertas en tiempo real

---

## Arquitectura General

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                        │
│                    (Next.js + Prisma Client)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16 Database                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Users     │  │   Wallets    │  │  Payments    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Ledger Entries (Double-Entry)              │       │
│  │        Particionado por fecha (mensual)              │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Audit Logs (Inmutables - PCI-DSS 10)         │       │
│  │        Particionado por fecha (mensual)              │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Patrones de Arquitectura

#### 1. Double-Entry Accounting

Cada transacción financiera genera **dos entradas** en el ledger:
- **Débito (DR):** Salida de fondos
- **Crédito (CR):** Entrada de fondos

**Invariante:** `SUM(DR) = SUM(CR)` para cada `ledgerRef`

Ejemplo de pago:
```sql
-- Transacción: Customer paga $100 a Merchant

-- Entrada 1: Débito de wallet del customer
INSERT INTO ledger_entries (ledgerRef, entryType, walletId, debit, credit)
VALUES ('TXN-12345', 'DR', 'wallet-customer', 100, 0);

-- Entrada 2: Crédito a wallet del merchant
INSERT INTO ledger_entries (ledgerRef, entryType, walletId, debit, credit)
VALUES ('TXN-12345', 'CR', 'wallet-merchant', 0, 100);

-- Verificación: SUM(DR) = SUM(CR) = 100
```

#### 2. CQRS (Command Query Responsibility Segregation)

- **Write Model:** Transacciones y ledger entries (normalized)
- **Read Model:** Vistas materializadas para reportes (denormalized)

```sql
-- Vista materializada para balance diario
CREATE MATERIALIZED VIEW daily_wallet_balances AS
SELECT
  wallet_id,
  DATE(created_at) as date,
  SUM(credit - debit) as net_change
FROM ledger_entries
GROUP BY wallet_id, DATE(created_at);
```

#### 3. Event Sourcing

Los audit logs funcionan como event store inmutable:
- Todos los eventos del sistema son registrados
- Logs son append-only (no se pueden modificar ni eliminar)
- Cada log tiene hash y signature para integridad

---

## Compliance PCI-DSS

### Requerimientos Implementados

#### PCI-DSS 3.4: Protección de Datos Almacenados

**Nunca almacenar:**
- ❌ PAN completo (Primary Account Number)
- ❌ CVV/CVC
- ❌ PIN

**Solo almacenar:**
- ✅ Últimos 4 dígitos de tarjeta (para display)
- ✅ Tokens de payment providers (Stripe, PayPal)
- ✅ Datos encriptados con AES-256-GCM

```prisma
model Payment {
  // ✅ Solo últimos 4 dígitos
  cardLast4  String?
  cardBrand  String?

  // ❌ NUNCA almacenar esto:
  // cardNumber String // PROHIBIDO
  // cvv        String // PROHIBIDO
}
```

#### PCI-DSS 8.2: Autenticación de Usuarios

- ✅ Passwords hasheados con bcrypt (12 rounds)
- ✅ Bloqueo de cuenta después de 5 intentos fallidos
- ✅ Expiración de password cada 90 días
- ✅ MFA/2FA con TOTP

```typescript
// Hashear password con bcrypt
const passwordHash = await bcrypt.hash(password, 12);

// Validar password
const isValid = await bcrypt.compare(password, user.passwordHash);
```

#### PCI-DSS 10: Audit Trails

- ✅ Logs de todas las acciones críticas
- ✅ Logs inmutables (trigger previene UPDATE/DELETE)
- ✅ Hash SHA-256 para integridad
- ✅ HMAC signature para autenticación
- ✅ Retención mínima de 1 año

```sql
-- Trigger para prevenir modificación de audit logs
CREATE TRIGGER prevent_audit_log_changes
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();
```

#### PCI-DSS 11: Monitoreo de Seguridad

- ✅ Detección de intentos de brute force
- ✅ Alertas de actividad sospechosa
- ✅ Monitoreo de queries lentas
- ✅ Detección de anomalías en transacciones

---

## Modelo de Datos

### Entidades Principales

#### Users
```prisma
model User {
  id               String    @id @default(uuid())
  phone            String    @unique
  passwordHash     String    // bcrypt hash
  mfaEnabled       Boolean   @default(false)
  mfaSecret        String?   // Encrypted TOTP secret
  kycStatus        KYCStatus @default(PENDING)
  accountLocked    Boolean   @default(false)
  // ... más campos
}
```

#### Wallets
```prisma
model Wallet {
  id               String   @id @default(uuid())
  userId           String
  walletNumber     String   @unique // Número público
  balance          Decimal  @db.Decimal(19, 4)
  availableBalance Decimal  @db.Decimal(19, 4)
  holdBalance      Decimal  @db.Decimal(19, 4)
  currency         String   @default("USD")
  status           WalletStatus @default(ACTIVE)
  // Encriptación PCI-DSS 3.4
  encryptedData    String?  // Datos sensibles encriptados
  encryptionKeyId  String?  // ID de key en Vault
}
```

#### LedgerEntry (Double-Entry)
```prisma
model LedgerEntry {
  id            String   @id @default(uuid())
  ledgerRef     String   // UUID compartido entre DR y CR
  entryType     EntryType // DR o CR
  debit         Decimal  @db.Decimal(19, 4)
  credit        Decimal  @db.Decimal(19, 4)
  balanceAfter  Decimal  @db.Decimal(19, 4)
  // Integridad PCI-DSS 10.5.2
  hash          String   // SHA-256
  signature     String   // HMAC-SHA256
  previousHash  String?  // Blockchain-like chain
}
```

#### Payments
```prisma
model Payment {
  id              String   @id @default(uuid())
  amount          Decimal  @db.Decimal(19, 4)
  feeAmount       Decimal  @db.Decimal(19, 4)
  merchantAmount  Decimal  @db.Decimal(19, 4)
  status          PaymentStatus
  // PCI-DSS 3.2: Solo últimos 4 dígitos
  cardLast4       String?
  cardBrand       String?
  // Idempotencia
  idempotencyKey  String   @unique
}
```

### Relaciones Principales

```
User 1 ──── N Wallet
User 1 ──── N Transaction
User 1 ──── N Payment
Wallet 1 ──── N LedgerEntry
Transaction 1 ──── N LedgerEntry
Payment 1 ──── N LedgerEntry
```

---

## Double-Entry Accounting

### Principios

1. **Toda transacción tiene dos lados:**
   - Un débito (salida)
   - Un crédito (entrada)

2. **Balance siempre cero:**
   - `SUM(Debit) = SUM(Credit)`

3. **Tipos de cuentas:**
   - **ASSET:** Wallets de usuarios (aumenta con CR, disminuye con DR)
   - **LIABILITY:** Fondos en hold, garantías
   - **EQUITY:** Capital del sistema
   - **REVENUE:** Ingresos por fees
   - **EXPENSE:** Gastos operativos

### Ejemplo Completo: Pago con Fee

**Escenario:** Customer paga $100 a Merchant, fee de $3

```sql
-- Transaction
INSERT INTO transactions (id, type, amount, status)
VALUES ('txn-001', 'PAYMENT', 100, 'SUCCEEDED');

-- Ledger Entry 1: Débito de Customer Wallet
INSERT INTO ledger_entries (
  ledgerRef, entryType, walletId, accountType, debit, credit
) VALUES (
  'ref-001', 'DR', 'wallet-customer', 'ASSET', 100, 0
);

-- Ledger Entry 2: Crédito a Merchant Wallet (menos fee)
INSERT INTO ledger_entries (
  ledgerRef, entryType, walletId, accountType, debit, credit
) VALUES (
  'ref-001', 'CR', 'wallet-merchant', 'ASSET', 0, 97
);

-- Ledger Entry 3: Crédito de Fee a Revenue
INSERT INTO ledger_entries (
  ledgerRef, entryType, accountType, debit, credit
) VALUES (
  'ref-001', 'CR', 'REVENUE', 0, 3
);

-- Verificación:
-- SUM(DR) = 100
-- SUM(CR) = 97 + 3 = 100
-- ✓ Balance OK
```

### Verificación de Integridad

```sql
-- Query para verificar transacciones desbalanceadas
SELECT
  ledgerRef,
  SUM(debit) as total_debit,
  SUM(credit) as total_credit,
  SUM(debit - credit) as balance
FROM ledger_entries
GROUP BY ledgerRef
HAVING ABS(SUM(debit - credit)) > 0.01;

-- Si retorna filas, hay error en double-entry!
```

---

## Seguridad

### Encriptación

#### En Tránsito
- ✅ TLS 1.3 para todas las conexiones
- ✅ SSL obligatorio en PostgreSQL
- ✅ Certificados SSL válidos

```bash
# pg_hba.conf
hostssl all all 0.0.0.0/0 scram-sha-256
```

#### En Reposo
- ✅ Datos sensibles encriptados con AES-256-GCM
- ✅ Keys almacenadas en HashiCorp Vault
- ✅ Backups encriptados con GPG

```typescript
// Encriptar datos sensibles
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = cipher.update(data, 'utf8', 'hex');
```

### Control de Acceso

#### Row-Level Security (RLS)
```sql
-- Los usuarios solo ven sus propios datos
CREATE POLICY user_isolation ON wallets
  FOR SELECT
  USING (userId = current_setting('app.current_user_id')::uuid);
```

#### Roles y Permisos
```sql
-- Role para aplicación
CREATE ROLE guaira_app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES TO guaira_app_user;

-- Role para auditor (solo lectura)
CREATE ROLE guaira_auditor;
GRANT SELECT ON audit_logs, security_events TO guaira_auditor;
```

### Password Policy

```typescript
// Validación de password (PCI-DSS 8.2.3)
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // días
};
```

---

## Performance y Optimización

### Índices Estratégicos

```sql
-- Índices para queries frecuentes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_wallets_user ON wallets(userId);
CREATE INDEX idx_transactions_wallet_date
  ON transactions(walletId, createdAt DESC);
CREATE INDEX idx_ledger_entries_wallet_date
  ON ledger_entries(walletId, createdAt DESC);

-- Índice BRIN para tablas grandes (audit logs)
CREATE INDEX idx_audit_logs_timestamp_brin
  ON audit_logs USING BRIN(createdAt);

-- Índice GIN para búsquedas JSON
CREATE INDEX idx_payments_metadata_gin
  ON payments USING GIN(metadata);
```

### Particionamiento

Las tablas de alto volumen están particionadas por mes:

```sql
-- Crear partición para enero 2025
CREATE TABLE ledger_entries_y2025m01
  PARTITION OF ledger_entries
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Beneficios:**
- ✅ Queries más rápidas (partition pruning)
- ✅ Mantenimiento más eficiente (VACUUM por partición)
- ✅ Archivado más fácil (detach old partitions)

### Vistas Materializadas

```sql
-- Balance diario (para dashboard)
CREATE MATERIALIZED VIEW daily_wallet_balances AS
SELECT
  wallet_id,
  DATE(created_at) as date,
  SUM(credit - debit) as net_change
FROM ledger_entries
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY wallet_id, DATE(created_at);

-- Refrescar cada hora con cron
SELECT cron.schedule(
  'refresh-balances',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_wallet_balances'
);
```

### Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool
  connection_limit = 20
  pool_timeout = 20
}
```

---

## Backup y Disaster Recovery

### Estrategia de Backup

#### 1. Backup Diario Completo

```bash
# Ejecutar backup.sh diariamente a las 2am
0 2 * * * /path/to/database/scripts/backup.sh
```

**Características:**
- ✅ Backup completo con pg_dump
- ✅ Compresión con gzip
- ✅ Encriptación con GPG
- ✅ Verificación de integridad (checksum SHA-256)
- ✅ Upload a S3 (opcional)
- ✅ Retención de 30 días

#### 2. WAL Archiving (PITR)

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

**Permite:**
- ✅ Point-in-Time Recovery (PITR)
- ✅ Recuperación hasta un segundo específico
- ✅ Recuperación de errores humanos

### Recovery Procedures

#### Restore Completo

```bash
# Restaurar último backup
./database/scripts/restore.sh --file guaira_db_20250116_020000.sql.gz.gpg
```

#### Point-in-Time Recovery

```bash
# Restaurar a un punto específico en el tiempo
./database/scripts/restore.sh --target-time "2025-01-16 14:30:00"
```

### RTO y RPO

- **RTO (Recovery Time Objective):** < 4 horas
- **RPO (Recovery Point Objective):** < 15 minutos (con WAL)

---

## Deployment

### Requisitos del Servidor

```yaml
Hardware Mínimo:
  CPU: 4 cores
  RAM: 8 GB
  Disco: 100 GB SSD
  Red: 1 Gbps

Software:
  OS: Ubuntu 22.04 LTS
  PostgreSQL: 16.x
  Node.js: 20.x (para Prisma)
```

### Pasos de Deployment

#### 1. Instalar PostgreSQL 16

```bash
# Agregar repositorio
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Instalar
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16
```

#### 2. Configurar PostgreSQL

```bash
# Copiar configuraciones optimizadas
sudo cp database/config/postgresql.conf /etc/postgresql/16/main/
sudo cp database/config/pg_hba.conf /etc/postgresql/16/main/

# Reiniciar
sudo systemctl restart postgresql@16-main
```

#### 3. Crear Base de Datos

```bash
# Como usuario postgres
sudo -u postgres psql

# Crear database y usuario
CREATE DATABASE guaira_db WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
CREATE USER guaira_app WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE guaira_db TO guaira_app;
```

#### 4. Ejecutar Migraciones

```bash
# Configurar DATABASE_URL
export DATABASE_URL="postgresql://guaira_app:PASSWORD@localhost:5432/guaira_db"

# Ejecutar migraciones de Prisma
cd apps/guaira-pos-web
npx prisma migrate deploy

# Ejecutar extensiones y funciones PCI-DSS
psql $DATABASE_URL < database/migrations/001_pci_dss_extensions.sql
psql $DATABASE_URL < database/migrations/002_partitioning.sql
```

#### 5. Seed Inicial (Solo Desarrollo)

```bash
# Ejecutar seed con datos de prueba
npx prisma db seed
```

#### 6. Configurar Backups

```bash
# Hacer ejecutables los scripts
chmod +x database/scripts/*.sh

# Agregar cron job
crontab -e

# Backup diario a las 2am
0 2 * * * /path/to/database/scripts/backup.sh

# Mantenimiento semanal (domingos a las 3am)
0 3 * * 0 /path/to/database/scripts/maintenance.sh
```

---

## Monitoreo y Mantenimiento

### Métricas Clave

#### 1. Performance

```sql
-- Top 10 queries más lentas
SELECT
  ROUND(total_exec_time::numeric, 2) as total_ms,
  calls,
  ROUND((total_exec_time / calls)::numeric, 2) as avg_ms,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

#### 2. Tamaño de Base de Datos

```sql
-- Tamaño por tabla
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### 3. Integridad de Double-Entry

```sql
-- Verificar transacciones desbalanceadas
SELECT COUNT(*) as unbalanced_transactions
FROM (
  SELECT ledgerRef, SUM(debit - credit) as balance
  FROM ledger_entries
  GROUP BY ledgerRef
  HAVING ABS(SUM(debit - credit)) > 0.01
) t;

-- Resultado esperado: 0
```

#### 4. Audit Log Integrity

```sql
-- Verificar integridad de audit logs
SELECT COUNT(*) as invalid_logs
FROM audit_logs
WHERE NOT validate_audit_log_integrity(id);

-- Resultado esperado: 0
```

### Alertas Recomendadas

1. **Database Size > 80%:** Expandir disco
2. **Conexiones > 180:** Revisar connection pool
3. **Queries lentas > 5s:** Optimizar índices
4. **Transacciones desbalanceadas > 0:** Alerta crítica
5. **Audit logs con hash inválido:** Alerta de seguridad

### Mantenimiento Regular

```bash
# Ejecutar script de mantenimiento
./database/scripts/maintenance.sh
```

**Tareas incluidas:**
- ✅ VACUUM ANALYZE
- ✅ REINDEX de tablas críticas
- ✅ Cleanup de datos antiguos
- ✅ Verificación de integridad
- ✅ Creación de particiones futuras
- ✅ Refresh de vistas materializadas

---

## Troubleshooting

### Problemas Comunes

#### 1. Conexión rechazada

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql@16-main

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### 2. Performance lento

```sql
-- Verificar queries bloqueadas
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Detectar locks
SELECT * FROM pg_locks WHERE NOT granted;
```

#### 3. Espacio en disco

```bash
# Liberar espacio con VACUUM FULL
VACUUM FULL;

# Archivar particiones antiguas
SELECT archive_old_partitions(13);
```

---

## Contacto y Soporte

Para preguntas o problemas relacionados con la base de datos:

- **Email:** dba@guair.app
- **Slack:** #database-support
- **On-call:** +58 412 XXX XXXX

---

## Changelog

- **v1.0 (2025-01-16):** Arquitectura inicial con PCI-DSS compliance
- Schema con double-entry accounting
- Migraciones y scripts de mantenimiento
- Documentación completa

---

**Última actualización:** 2025-01-16
**Versión:** 1.0
**Mantenido por:** Database Team - Guair.app
