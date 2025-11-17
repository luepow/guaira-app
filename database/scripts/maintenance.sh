#!/bin/bash
# ============================================================================
# GUAIR.APP - POSTGRESQL MAINTENANCE SCRIPT
# ============================================================================
# Descripción: Script de mantenimiento automático para PostgreSQL
#              con optimización y compliance PCI-DSS
# Versión: 1.0
# Compliance: PCI-DSS 11.5 (Monitoreo de integridad)
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-guaira_db}"
DB_USER="${DB_USER:-postgres}"

LOG_DIR="/var/log/postgresql/maintenance"
mkdir -p "${LOG_DIR}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/maintenance_${TIMESTAMP}.log"

# ============================================================================
# FUNCIONES
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

run_query() {
  local query=$1
  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "${query}"
}

# ============================================================================
# 1. VACUUM Y ANALYZE
# ============================================================================

vacuum_analyze() {
  log "=========================================="
  log "Ejecutando VACUUM ANALYZE..."
  log "=========================================="

  # VACUUM ANALYZE en todas las tablas
  run_query "VACUUM ANALYZE;"

  log "✓ VACUUM ANALYZE completado"
}

# ============================================================================
# 2. REINDEX CONCURRENTE
# ============================================================================

reindex_tables() {
  log "=========================================="
  log "Reindexando tablas críticas..."
  log "=========================================="

  local tables=("users" "wallets" "transactions" "payments" "ledger_entries" "audit_logs")

  for table in "${tables[@]}"; do
    log "Reindexando ${table}..."
    run_query "REINDEX TABLE CONCURRENTLY ${table};" || log "⚠ Reindex de ${table} falló"
  done

  log "✓ Reindex completado"
}

# ============================================================================
# 3. ACTUALIZAR ESTADÍSTICAS
# ============================================================================

update_statistics() {
  log "=========================================="
  log "Actualizando estadísticas de tablas..."
  log "=========================================="

  run_query "ANALYZE VERBOSE;"

  log "✓ Estadísticas actualizadas"
}

# ============================================================================
# 4. LIMPIAR TABLAS TEMPORALES Y LOGS ANTIGUOS
# ============================================================================

cleanup_old_data() {
  log "=========================================="
  log "Limpiando datos antiguos..."
  log "=========================================="

  # Eliminar rate_limit_logs antiguos (más de 7 días)
  log "Limpiando rate_limit_logs..."
  run_query "DELETE FROM rate_limit_logs WHERE \"createdAt\" < NOW() - INTERVAL '7 days';"

  # Eliminar OTP codes expirados (más de 24 horas)
  log "Limpiando otp_codes expirados..."
  run_query "DELETE FROM otp_codes WHERE \"expiresAt\" < NOW() - INTERVAL '24 hours';"

  # Eliminar security_events resueltos antiguos (más de 90 días)
  log "Limpiando security_events antiguos..."
  run_query "DELETE FROM security_events WHERE resolved = true AND \"createdAt\" < NOW() - INTERVAL '90 days';"

  # Limpiar sessions expirados
  log "Limpiando sessions expirados..."
  run_query "DELETE FROM sessions WHERE expires < NOW();"

  log "✓ Cleanup completado"
}

# ============================================================================
# 5. VERIFICAR INTEGRIDAD DE DOUBLE-ENTRY
# ============================================================================

verify_double_entry_integrity() {
  log "=========================================="
  log "Verificando integridad de double-entry accounting..."
  log "=========================================="

  # Verificar que cada ledgerRef tiene balance cero (DR = CR)
  local unbalanced=$(PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -tAc "
      SELECT COUNT(DISTINCT \"ledgerRef\")
      FROM (
        SELECT \"ledgerRef\", SUM(debit - credit) as balance
        FROM ledger_entries
        GROUP BY \"ledgerRef\"
        HAVING ABS(SUM(debit - credit)) > 0.01
      ) unbalanced;
    ")

  if [[ "${unbalanced}" -gt 0 ]]; then
    log "⚠ ADVERTENCIA: ${unbalanced} transacciones desbalanceadas detectadas!"
    log "Esto viola el principio de double-entry accounting"

    # Generar reporte
    PGPASSWORD="${DB_PASSWORD}" psql \
      --host="${DB_HOST}" \
      --port="${DB_PORT}" \
      --username="${DB_USER}" \
      --dbname="${DB_NAME}" \
      -c "
        SELECT \"ledgerRef\", SUM(debit) as total_debit, SUM(credit) as total_credit, SUM(debit - credit) as balance
        FROM ledger_entries
        GROUP BY \"ledgerRef\"
        HAVING ABS(SUM(debit - credit)) > 0.01
        ORDER BY ABS(SUM(debit - credit)) DESC
        LIMIT 20;
      " >> "${LOG_FILE}"
  else
    log "✓ Integridad de double-entry verificada (todas las transacciones están balanceadas)"
  fi
}

# ============================================================================
# 6. VERIFICAR INTEGRIDAD DE AUDIT LOGS
# ============================================================================

verify_audit_log_integrity() {
  log "=========================================="
  log "Verificando integridad de audit logs..."
  log "=========================================="

  # Contar logs con hash inválido
  local invalid_hashes=$(PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -tAc "
      SELECT COUNT(*)
      FROM audit_logs
      WHERE NOT validate_audit_log_integrity(id)
      LIMIT 100;
    " 2>/dev/null || echo "0")

  if [[ "${invalid_hashes}" -gt 0 ]]; then
    log "⚠ ALERTA DE SEGURIDAD: ${invalid_hashes} logs de auditoría con hash inválido!"
    log "Esto puede indicar manipulación de datos - PCI-DSS 10.5.2"
  else
    log "✓ Integridad de audit logs verificada"
  fi
}

# ============================================================================
# 7. MONITOREAR TAMAÑO DE BASE DE DATOS
# ============================================================================

monitor_database_size() {
  log "=========================================="
  log "Monitoreando tamaño de base de datos..."
  log "=========================================="

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 20;
    " | tee -a "${LOG_FILE}"
}

# ============================================================================
# 8. DETECTAR QUERIES LENTAS
# ============================================================================

detect_slow_queries() {
  log "=========================================="
  log "Top 10 queries más lentas (pg_stat_statements)..."
  log "=========================================="

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "
      SELECT
        ROUND(total_exec_time::numeric, 2) AS total_time_ms,
        calls,
        ROUND((total_exec_time / calls)::numeric, 2) AS avg_time_ms,
        ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total,
        LEFT(query, 100) AS query_snippet
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY total_exec_time DESC
      LIMIT 10;
    " | tee -a "${LOG_FILE}"
}

# ============================================================================
# 9. DETECTAR LOCKS Y DEADLOCKS
# ============================================================================

detect_locks() {
  log "=========================================="
  log "Detectando locks activos..."
  log "=========================================="

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "
      SELECT
        pg_locks.pid,
        pg_locks.mode,
        pg_locks.granted,
        pg_stat_activity.usename,
        pg_stat_activity.query,
        pg_stat_activity.query_start
      FROM pg_locks
      JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
      WHERE NOT pg_locks.granted
      ORDER BY pg_stat_activity.query_start;
    " | tee -a "${LOG_FILE}"
}

# ============================================================================
# 10. REFRESCAR VISTAS MATERIALIZADAS
# ============================================================================

refresh_materialized_views() {
  log "=========================================="
  log "Refrescando vistas materializadas..."
  log "=========================================="

  run_query "SELECT refresh_materialized_views();" || log "⚠ Refresh de vistas falló"

  log "✓ Vistas materializadas actualizadas"
}

# ============================================================================
# 11. GENERAR REPORTE DE SALUD
# ============================================================================

generate_health_report() {
  log "=========================================="
  log "Generando reporte de salud de la base de datos..."
  log "=========================================="

  # Database age
  local db_age=$(PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -tAc "SELECT age(datfrozenxid) FROM pg_database WHERE datname = '${DB_NAME}';")

  log "Database transaction age: ${db_age}"

  if [[ ${db_age} -gt 1000000000 ]]; then
    log "⚠ ADVERTENCIA: Database age muy alto, considerar VACUUM FREEZE"
  fi

  # Bloat estimado
  log "Estimando bloat en tablas principales..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        n_dead_tup AS dead_tuples,
        ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
      FROM pg_stat_user_tables
      WHERE n_dead_tup > 1000
      ORDER BY n_dead_tup DESC
      LIMIT 10;
    " | tee -a "${LOG_FILE}"
}

# ============================================================================
# 12. CREAR PARTICIONES FUTURAS
# ============================================================================

create_future_partitions() {
  log "=========================================="
  log "Creando particiones para próximos 3 meses..."
  log "=========================================="

  run_query "SELECT create_monthly_partitions(NOW(), 3);" || log "⚠ Creación de particiones falló"

  log "✓ Particiones creadas"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  log "=========================================="
  log "Iniciando mantenimiento de PostgreSQL"
  log "Base de datos: ${DB_NAME}"
  log "=========================================="

  local start_time=$(date +%s)

  # Ejecutar tareas de mantenimiento
  monitor_database_size
  vacuum_analyze
  update_statistics
  cleanup_old_data
  verify_double_entry_integrity
  verify_audit_log_integrity
  detect_slow_queries
  detect_locks
  refresh_materialized_views
  create_future_partitions
  generate_health_report

  # Opcional: reindex (puede ser pesado)
  # reindex_tables

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "=========================================="
  log "Mantenimiento completado en ${duration} segundos"
  log "Log guardado en: ${LOG_FILE}"
  log "=========================================="
}

main "$@"
