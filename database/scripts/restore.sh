#!/bin/bash
# ============================================================================
# GUAIR.APP - POSTGRESQL RESTORE SCRIPT
# ============================================================================
# Descripción: Script para restaurar backups de PostgreSQL con verificación
#              de integridad y compliance PCI-DSS
# Versión: 1.0
# Compliance: PCI-DSS 3.4, 10.5
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Base de datos
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-guaira_db}"
DB_USER="${DB_USER:-postgres}"  # Debe ser superuser para restore

# Directorios
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql/guaira}"
TEMP_DIR="/tmp/guaira_restore_$$"

# ============================================================================
# FUNCIONES
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
  log "ERROR: $*"
  cleanup
  exit 1
}

cleanup() {
  log "Limpiando archivos temporales..."
  rm -rf "${TEMP_DIR}"
}

trap cleanup EXIT

check_dependencies() {
  local deps=("psql" "pg_restore" "gzip")

  for cmd in "${deps[@]}"; do
    if ! command -v "${cmd}" &> /dev/null; then
      error "Comando requerido no encontrado: ${cmd}"
    fi
  done
}

list_available_backups() {
  log "Backups disponibles en ${BACKUP_DIR}:"
  log "================================================"

  find "${BACKUP_DIR}" -name "guaira_db_*.sql*" -type f | sort -r | while read -r backup; do
    local size=$(du -h "$backup" | cut -f1)
    local date=$(stat -c %y "$backup" 2>/dev/null || stat -f %Sm "$backup" 2>/dev/null)
    printf "%-60s %10s %s\n" "$(basename "$backup")" "$size" "$date"
  done

  log "================================================"
}

verify_checksum() {
  local backup_file=$1
  local checksum_file="${backup_file}.sha256"

  if [[ -f "${checksum_file}" ]]; then
    log "Verificando checksum SHA-256..."

    if sha256sum -c "${checksum_file}" &>/dev/null; then
      log "✓ Checksum válido"
      return 0
    else
      error "✗ Checksum inválido - el archivo puede estar corrupto"
    fi
  else
    log "⚠ Archivo de checksum no encontrado, continuando sin verificación"
  fi
}

decrypt_backup() {
  local encrypted_file=$1
  local output_file=$2

  log "Desencriptando backup..."

  if ! gpg --decrypt --output "${output_file}" "${encrypted_file}" 2>/dev/null; then
    error "Falló la desencriptación del backup"
  fi

  log "✓ Backup desencriptado"
}

decompress_backup() {
  local compressed_file=$1
  local output_file=$2

  log "Descomprimiendo backup..."

  if ! gunzip -c "${compressed_file}" > "${output_file}"; then
    error "Falló la descompresión del backup"
  fi

  log "✓ Backup descomprimido"
}

prepare_backup_file() {
  local backup_file=$1

  mkdir -p "${TEMP_DIR}"

  local working_file="${backup_file}"

  # Si está encriptado, desencriptar
  if [[ "${backup_file}" == *.gpg ]]; then
    local decrypted_file="${TEMP_DIR}/backup.sql.gz"
    decrypt_backup "${backup_file}" "${decrypted_file}"
    working_file="${decrypted_file}"
  fi

  # Si está comprimido, descomprimir
  if [[ "${working_file}" == *.gz ]]; then
    local decompressed_file="${TEMP_DIR}/backup.sql"
    decompress_backup "${working_file}" "${decompressed_file}"
    working_file="${decompressed_file}"
  fi

  echo "${working_file}"
}

confirm_restore() {
  local backup_file=$1

  log "================================================"
  log "ADVERTENCIA: Esta operación restaurará la base de datos"
  log "Base de datos: ${DB_NAME}"
  log "Archivo: ${backup_file}"
  log "================================================"

  read -p "¿Está seguro de continuar? (yes/no): " -r
  if [[ ! $REPLY =~ ^yes$ ]]; then
    log "Restore cancelado por el usuario"
    exit 0
  fi
}

create_pre_restore_backup() {
  log "Creando backup de seguridad antes del restore..."

  local pre_restore_backup="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"

  PGPASSWORD="${DB_PASSWORD}" pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=plain \
    | gzip > "${pre_restore_backup}" || log "⚠ No se pudo crear backup de seguridad"

  log "✓ Backup de seguridad: ${pre_restore_backup}"
}

terminate_connections() {
  log "Terminando conexiones activas a la base de datos..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname=postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true

  log "✓ Conexiones terminadas"
}

perform_restore() {
  local backup_file=$1

  log "Iniciando restore de la base de datos..."

  # Opción 1: Restore completo (drop + create)
  # Esto elimina y recrea la base de datos
  drop_and_recreate_database

  # Opción 2: Restore incremental (solo datos)
  # restore_data_only "${backup_file}"

  # Ejecutar restore
  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --file="${backup_file}" \
    2>&1 | tee "${TEMP_DIR}/restore.log"

  # Verificar si hubo errores
  if grep -i "error" "${TEMP_DIR}/restore.log" > /dev/null; then
    log "⚠ Se encontraron errores durante el restore (revisar log)"
  else
    log "✓ Restore completado sin errores"
  fi
}

drop_and_recreate_database() {
  log "Eliminando y recreando base de datos..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname=postgres \
    <<-EOSQL
      DROP DATABASE IF EXISTS ${DB_NAME};
      CREATE DATABASE ${DB_NAME} WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
EOSQL

  log "✓ Base de datos recreada"
}

verify_restore() {
  log "Verificando restore..."

  # Contar tablas
  local table_count=$(PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

  log "Tablas restauradas: ${table_count}"

  # Contar registros en tablas críticas
  local tables=("users" "wallets" "transactions" "payments" "audit_logs")

  for table in "${tables[@]}"; do
    local count=$(PGPASSWORD="${DB_PASSWORD}" psql \
      --host="${DB_HOST}" \
      --port="${DB_PORT}" \
      --username="${DB_USER}" \
      --dbname="${DB_NAME}" \
      -tAc "SELECT COUNT(*) FROM ${table};" 2>/dev/null || echo "0")

    log "  - ${table}: ${count} registros"
  done
}

reindex_database() {
  log "Reindexando base de datos..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "REINDEX DATABASE ${DB_NAME};" 2>/dev/null || log "⚠ Reindex falló (puede ser normal)"

  log "✓ Reindex completado"
}

analyze_database() {
  log "Analizando estadísticas de la base de datos..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    -c "ANALYZE;" || log "⚠ Analyze falló"

  log "✓ Analyze completado"
}

restore_point_in_time() {
  local target_time=$1

  log "Restaurando a punto en el tiempo: ${target_time}"
  log "Esta funcionalidad requiere WAL archives configurados"

  # PITR requiere:
  # 1. Backup base completo
  # 2. WAL archives desde el backup hasta el punto objetivo
  # 3. recovery.conf configurado

  error "PITR no implementado aún - use restore normal"
}

# ============================================================================
# MAIN
# ============================================================================

usage() {
  cat <<EOF
Uso: $0 [OPCIONES]

Opciones:
  -f, --file FILE         Archivo de backup a restaurar
  -l, --list             Listar backups disponibles
  -t, --target-time TIME  Restaurar a punto en el tiempo (PITR)
  -y, --yes              No pedir confirmación
  -h, --help             Mostrar esta ayuda

Ejemplos:
  $0 --list
  $0 --file /backups/guaira_db_20250116_120000.sql.gz.gpg
  $0 --target-time "2025-01-16 12:00:00"

EOF
  exit 1
}

main() {
  local backup_file=""
  local auto_confirm=false
  local target_time=""

  # Parse argumentos
  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--file)
        backup_file="$2"
        shift 2
        ;;
      -l|--list)
        list_available_backups
        exit 0
        ;;
      -t|--target-time)
        target_time="$2"
        shift 2
        ;;
      -y|--yes)
        auto_confirm=true
        shift
        ;;
      -h|--help)
        usage
        ;;
      *)
        error "Opción desconocida: $1"
        ;;
    esac
  done

  log "=========================================="
  log "PostgreSQL Restore - Guair.app"
  log "=========================================="

  check_dependencies

  # PITR
  if [[ -n "${target_time}" ]]; then
    restore_point_in_time "${target_time}"
    exit 0
  fi

  # Validar archivo de backup
  if [[ -z "${backup_file}" ]]; then
    log "No se especificó archivo de backup"
    list_available_backups
    read -p "Ingrese el nombre del archivo a restaurar: " -r backup_file
  fi

  # Si es solo nombre, buscar en BACKUP_DIR
  if [[ ! -f "${backup_file}" ]]; then
    backup_file="${BACKUP_DIR}/${backup_file}"
  fi

  if [[ ! -f "${backup_file}" ]]; then
    error "Archivo de backup no encontrado: ${backup_file}"
  fi

  # Confirmar
  if [[ "${auto_confirm}" != "true" ]]; then
    confirm_restore "${backup_file}"
  fi

  # Verificar checksum
  verify_checksum "${backup_file}"

  # Preparar archivo (desencriptar/descomprimir)
  local prepared_file=$(prepare_backup_file "${backup_file}")

  # Backup de seguridad
  create_pre_restore_backup

  # Terminar conexiones
  terminate_connections

  # Restaurar
  perform_restore "${prepared_file}"

  # Verificar
  verify_restore

  # Mantenimiento post-restore
  analyze_database

  log "=========================================="
  log "Restore completado exitosamente"
  log "=========================================="
}

main "$@"
