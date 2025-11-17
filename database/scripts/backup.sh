#!/bin/bash
# ============================================================================
# GUAIR.APP - POSTGRESQL BACKUP SCRIPT
# ============================================================================
# Descripción: Script automatizado para backup de PostgreSQL con compliance
#              PCI-DSS y encriptación de datos sensibles
# Versión: 1.0
# Compliance: PCI-DSS 3.4 (Protección de datos almacenados)
# ============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Base de datos
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-guaira_db}"
DB_USER="${DB_USER:-guaira_app}"

# Directorios
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql/guaira}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"  # PCI-DSS: Retener al menos 1 año en producción

# Encriptación (PCI-DSS 3.4: Datos sensibles deben estar encriptados)
ENCRYPT_BACKUP="${ENCRYPT_BACKUP:-true}"
GPG_RECIPIENT="${GPG_RECIPIENT:-backups@guair.app}"  # Cambiar por key real

# Notificaciones
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_TO="${EMAIL_TO:-admin@guair.app}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_PART=$(date +%Y-%m-%d)

# Archivos de backup
BACKUP_FILENAME="guaira_db_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="guaira_db_${TIMESTAMP}.sql.gz"
BACKUP_ENCRYPTED="guaira_db_${TIMESTAMP}.sql.gz.gpg"

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${BACKUP_DIR}/backup.log"
}

error() {
  log "ERROR: $*"
  notify_failure "$*"
  exit 1
}

notify_success() {
  local backup_file=$1
  local backup_size=$2
  local duration=$3

  log "Backup completado exitosamente"
  log "Archivo: ${backup_file}"
  log "Tamaño: ${backup_size}"
  log "Duración: ${duration} segundos"

  # Notificar por Slack si está configurado
  if [[ -n "${SLACK_WEBHOOK}" ]]; then
    curl -X POST "${SLACK_WEBHOOK}" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"✅ Backup de PostgreSQL completado\",
        \"attachments\": [{
          \"color\": \"good\",
          \"fields\": [
            {\"title\": \"Database\", \"value\": \"${DB_NAME}\", \"short\": true},
            {\"title\": \"Archivo\", \"value\": \"${backup_file}\", \"short\": true},
            {\"title\": \"Tamaño\", \"value\": \"${backup_size}\", \"short\": true},
            {\"title\": \"Duración\", \"value\": \"${duration}s\", \"short\": true}
          ]
        }]
      }" 2>/dev/null || true
  fi

  # Email (requiere mailutils instalado)
  if command -v mail &> /dev/null; then
    echo "Backup completado: ${backup_file} (${backup_size})" | \
      mail -s "✅ Backup PostgreSQL Exitoso - Guair.app" "${EMAIL_TO}"
  fi
}

notify_failure() {
  local error_msg=$1

  log "Notificando fallo del backup"

  # Slack
  if [[ -n "${SLACK_WEBHOOK}" ]]; then
    curl -X POST "${SLACK_WEBHOOK}" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"❌ FALLO en Backup de PostgreSQL\",
        \"attachments\": [{
          \"color\": \"danger\",
          \"fields\": [
            {\"title\": \"Database\", \"value\": \"${DB_NAME}\", \"short\": true},
            {\"title\": \"Error\", \"value\": \"${error_msg}\", \"short\": false}
          ]
        }]
      }" 2>/dev/null || true
  fi

  # Email
  if command -v mail &> /dev/null; then
    echo "Error en backup: ${error_msg}" | \
      mail -s "❌ FALLO Backup PostgreSQL - Guair.app" "${EMAIL_TO}"
  fi
}

check_dependencies() {
  local deps=("pg_dump" "gzip")

  if [[ "${ENCRYPT_BACKUP}" == "true" ]]; then
    deps+=("gpg")
  fi

  for cmd in "${deps[@]}"; do
    if ! command -v "${cmd}" &> /dev/null; then
      error "Comando requerido no encontrado: ${cmd}"
    fi
  done
}

verify_backup_integrity() {
  local backup_file=$1

  log "Verificando integridad del backup..."

  # Verificar que el archivo existe y tiene contenido
  if [[ ! -s "${backup_file}" ]]; then
    error "El archivo de backup está vacío o no existe: ${backup_file}"
  fi

  # Verificar que es un archivo válido de PostgreSQL
  if [[ "${backup_file}" == *.gz ]]; then
    if ! gzip -t "${backup_file}" 2>/dev/null; then
      error "El archivo comprimido está corrupto: ${backup_file}"
    fi
  fi

  # Si está encriptado, verificar integridad GPG
  if [[ "${backup_file}" == *.gpg ]]; then
    if ! gpg --list-packets "${backup_file}" &>/dev/null; then
      error "El archivo encriptado está corrupto: ${backup_file}"
    fi
  fi

  log "Verificación de integridad: OK"
}

# ============================================================================
# CREAR DIRECTORIO DE BACKUP
# ============================================================================

create_backup_dir() {
  mkdir -p "${BACKUP_DIR}"
  chmod 700 "${BACKUP_DIR}"  # PCI-DSS: Solo owner puede acceder
}

# ============================================================================
# BACKUP COMPLETO (pg_dump)
# ============================================================================

perform_backup() {
  log "Iniciando backup de ${DB_NAME}..."

  local start_time=$(date +%s)

  # pg_dump con formato custom (compresión nativa y restauración paralela)
  PGPASSWORD="${DB_PASSWORD}" pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    --file="${BACKUP_DIR}/${BACKUP_FILENAME}" \
    2>> "${BACKUP_DIR}/backup.log" || error "pg_dump falló"

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "pg_dump completado en ${duration} segundos"
}

# ============================================================================
# COMPRIMIR BACKUP
# ============================================================================

compress_backup() {
  log "Comprimiendo backup..."

  gzip -9 "${BACKUP_DIR}/${BACKUP_FILENAME}" || error "Compresión falló"

  log "Backup comprimido: ${BACKUP_COMPRESSED}"
}

# ============================================================================
# ENCRIPTAR BACKUP (PCI-DSS 3.4)
# ============================================================================

encrypt_backup() {
  if [[ "${ENCRYPT_BACKUP}" != "true" ]]; then
    log "Encriptación deshabilitada"
    return
  fi

  log "Encriptando backup con GPG..."

  # Encriptar con GPG usando recipient key
  gpg --encrypt \
      --recipient "${GPG_RECIPIENT}" \
      --trust-model always \
      --output "${BACKUP_DIR}/${BACKUP_ENCRYPTED}" \
      "${BACKUP_DIR}/${BACKUP_COMPRESSED}" || error "Encriptación falló"

  # Eliminar archivo sin encriptar (PCI-DSS 3.4)
  rm -f "${BACKUP_DIR}/${BACKUP_COMPRESSED}"

  log "Backup encriptado: ${BACKUP_ENCRYPTED}"
}

# ============================================================================
# BACKUP DE WAL ARCHIVES (para PITR)
# ============================================================================

backup_wal_archives() {
  log "Backing up WAL archives..."

  local wal_archive_dir="/var/lib/postgresql/16/main/pg_wal"
  local wal_backup_dir="${BACKUP_DIR}/wal/${DATE_PART}"

  if [[ -d "${wal_archive_dir}" ]]; then
    mkdir -p "${wal_backup_dir}"

    # Copiar archivos WAL recientes (últimas 24 horas)
    find "${wal_archive_dir}" -name "*.ready" -mtime -1 \
      -exec cp {} "${wal_backup_dir}/" \; 2>/dev/null || true

    log "WAL archives respaldados en ${wal_backup_dir}"
  fi
}

# ============================================================================
# CLEANUP DE BACKUPS ANTIGUOS
# ============================================================================

cleanup_old_backups() {
  log "Limpiando backups antiguos (retención: ${BACKUP_RETENTION_DAYS} días)..."

  # Eliminar backups SQL antiguos
  find "${BACKUP_DIR}" -name "guaira_db_*.sql*" -mtime +${BACKUP_RETENTION_DAYS} \
    -exec rm -f {} \; -exec echo "Eliminado: {}" \;

  # Eliminar WAL archives antiguos
  find "${BACKUP_DIR}/wal" -type d -mtime +${BACKUP_RETENTION_DAYS} \
    -exec rm -rf {} \; 2>/dev/null || true

  log "Cleanup completado"
}

# ============================================================================
# GENERAR CHECKSUM
# ============================================================================

generate_checksum() {
  local backup_file=$1

  log "Generando checksum SHA-256..."

  sha256sum "${backup_file}" > "${backup_file}.sha256"

  log "Checksum guardado en ${backup_file}.sha256"
}

# ============================================================================
# UPLOAD A STORAGE REMOTO (S3, Azure, etc.)
# ============================================================================

upload_to_remote_storage() {
  local backup_file=$1

  # Ejemplo con AWS S3 (descomentar y configurar)
  # if command -v aws &> /dev/null; then
  #   log "Subiendo a S3..."
  #   aws s3 cp "${backup_file}" "s3://guaira-backups/postgresql/${DATE_PART}/" \
  #     --storage-class GLACIER_IR \
  #     --server-side-encryption AES256
  #   log "Backup subido a S3"
  # fi

  # Ejemplo con rsync a servidor remoto
  # if command -v rsync &> /dev/null; then
  #   log "Sincronizando con servidor remoto..."
  #   rsync -avz --progress "${backup_file}" \
  #     backup@backup-server.guair.app:/backups/postgresql/
  #   log "Backup sincronizado"
  # fi

  log "Upload a storage remoto no configurado (opcional)"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  log "=========================================="
  log "Iniciando backup de PostgreSQL - Guair.app"
  log "=========================================="

  # Verificar dependencias
  check_dependencies

  # Crear directorio
  create_backup_dir

  # Medir tiempo total
  local total_start=$(date +%s)

  # Ejecutar backup
  perform_backup

  # Comprimir
  compress_backup

  # Encriptar (PCI-DSS)
  encrypt_backup

  # Determinar archivo final
  local final_backup_file="${BACKUP_DIR}/${BACKUP_ENCRYPTED}"
  if [[ "${ENCRYPT_BACKUP}" != "true" ]]; then
    final_backup_file="${BACKUP_DIR}/${BACKUP_COMPRESSED}"
  fi

  # Verificar integridad
  verify_backup_integrity "${final_backup_file}"

  # Generar checksum
  generate_checksum "${final_backup_file}"

  # Backup de WAL archives
  backup_wal_archives

  # Upload a storage remoto (opcional)
  upload_to_remote_storage "${final_backup_file}"

  # Cleanup
  cleanup_old_backups

  # Calcular tiempo total y tamaño
  local total_end=$(date +%s)
  local total_duration=$((total_end - total_start))
  local backup_size=$(du -h "${final_backup_file}" | cut -f1)

  # Notificar éxito
  notify_success "${final_backup_file}" "${backup_size}" "${total_duration}"

  log "=========================================="
  log "Backup completado exitosamente"
  log "=========================================="
}

# Ejecutar
main "$@"
