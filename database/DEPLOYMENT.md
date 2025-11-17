# Guair.app - Database Deployment Guide

## Guía Paso a Paso para Deploy en Producción

Este documento contiene instrucciones detalladas para deployar la base de datos de Guair.app en el servidor de producción (64.23.201.2).

---

## Pre-requisitos

### En tu máquina local

- [x] Git instalado
- [x] SSH access al servidor (64.23.201.2)
- [x] GPG key para encriptación de backups (opcional pero recomendado)

### En el servidor (64.23.201.2)

- [x] Ubuntu 22.04 LTS o superior
- [x] Acceso root o sudo
- [x] Firewall configurado (UFW o iptables)

---

## Paso 1: Preparar el Servidor

### 1.1. Conectarse al servidor

```bash
ssh root@64.23.201.2
# O si tienes un usuario con sudo:
ssh usuario@64.23.201.2
```

### 1.2. Actualizar el sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3. Instalar dependencias

```bash
# Herramientas básicas
sudo apt install -y curl wget git unzip gnupg

# Mail utils (para notificaciones)
sudo apt install -y mailutils

# GPG (para encriptar backups)
sudo apt install -y gnupg2
```

---

## Paso 2: Instalar PostgreSQL 16

### 2.1. Agregar repositorio oficial de PostgreSQL

```bash
# Importar GPG key
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
```

### 2.2. Instalar PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

### 2.3. Verificar instalación

```bash
sudo systemctl status postgresql@16-main

# Ver versión
psql --version
# Debe mostrar: psql (PostgreSQL) 16.x
```

---

## Paso 3: Configurar PostgreSQL

### 3.1. Subir archivos de configuración al servidor

Desde tu máquina local:

```bash
# Copiar configuraciones optimizadas al servidor
scp database/config/postgresql.conf root@64.23.201.2:/tmp/
scp database/config/pg_hba.conf root@64.23.201.2:/tmp/
```

### 3.2. Aplicar configuraciones en el servidor

```bash
# En el servidor
cd /tmp

# Backup de configs originales
sudo cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.backup
sudo cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.backup

# Copiar nuevas configs
sudo cp postgresql.conf /etc/postgresql/16/main/
sudo cp pg_hba.conf /etc/postgresql/16/main/

# Ajustar permisos
sudo chown postgres:postgres /etc/postgresql/16/main/postgresql.conf
sudo chown postgres:postgres /etc/postgresql/16/main/pg_hba.conf
sudo chmod 644 /etc/postgresql/16/main/postgresql.conf
sudo chmod 640 /etc/postgresql/16/main/pg_hba.conf
```

### 3.3. IMPORTANTE: Editar pg_hba.conf

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Agregar/modificar las siguientes líneas según tu infraestructura:

```conf
# Conexiones desde la aplicación Next.js
hostssl guaira_db  guaira_app  [IP_APP_SERVER]/32  scram-sha-256

# Si la app está en el mismo servidor:
hostssl guaira_db  guaira_app  127.0.0.1/32        scram-sha-256

# Para desarrollo temporal (REMOVER en producción):
# host    all        all         0.0.0.0/0          scram-sha-256
```

### 3.4. Reiniciar PostgreSQL

```bash
sudo systemctl restart postgresql@16-main

# Verificar que inició correctamente
sudo systemctl status postgresql@16-main

# Ver logs si hay errores
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## Paso 4: Crear Base de Datos y Usuario

### 4.1. Conectarse como postgres

```bash
sudo -u postgres psql
```

### 4.2. Crear database, usuario y permisos

```sql
-- Crear base de datos
CREATE DATABASE guaira_db
  WITH ENCODING='UTF8'
  LC_COLLATE='en_US.UTF-8'
  LC_CTYPE='en_US.UTF-8'
  TEMPLATE=template0;

-- Crear usuario de aplicación
CREATE USER guaira_app WITH ENCRYPTED PASSWORD 'CAMBIAR_ESTE_PASSWORD_FUERTE';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE guaira_db TO guaira_app;

-- Conectarse a la base de datos
\c guaira_db

-- Dar permisos sobre schema public
GRANT ALL ON SCHEMA public TO guaira_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO guaira_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO guaira_app;

-- Permisos futuros (para tablas que se creen después)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO guaira_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO guaira_app;

-- Salir
\q
```

### 4.3. Generar password seguro

```bash
# Generar password aleatorio fuerte
openssl rand -base64 32
```

**IMPORTANTE:** Guardar este password en un password manager seguro.

---

## Paso 5: Subir y Ejecutar Migraciones

### 5.1. Clonar repositorio en el servidor

```bash
cd /opt
sudo git clone https://github.com/tu-org/guaira_app.git
cd guaira_app/apps/guaira-pos-web
```

O subir solo los archivos necesarios:

```bash
# Desde tu máquina local
scp -r database/ root@64.23.201.2:/opt/guaira_app/apps/guaira-pos-web/
scp -r prisma/ root@64.23.201.2:/opt/guaira_app/apps/guaira-pos-web/
```

### 5.2. Configurar variables de entorno

```bash
# En el servidor
cd /opt/guaira_app/apps/guaira-pos-web

# Crear archivo .env
nano .env
```

Agregar:

```env
# Database
DATABASE_URL="postgresql://guaira_app:PASSWORD_AQUI@localhost:5432/guaira_db?schema=public&sslmode=prefer"

# HMAC Secret para audit logs (generar uno único)
HMAC_SECRET="GENERAR_STRING_ALEATORIO_LARGO_AQUI"

# Backup config
BACKUP_DIR="/var/backups/postgresql/guaira"
ENCRYPT_BACKUP="true"
GPG_RECIPIENT="backups@guair.app"

# Notificaciones
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
EMAIL_TO="admin@guair.app"
```

### 5.3. Instalar Node.js y Prisma

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version

# Instalar dependencias del proyecto
npm install
```

### 5.4. Ejecutar migraciones de Prisma

```bash
# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones (esto crea las tablas)
npx prisma migrate deploy
```

### 5.5. Ejecutar migraciones SQL customizadas

```bash
# Conectarse a la base de datos
export DATABASE_URL="postgresql://guaira_app:PASSWORD@localhost:5432/guaira_db"

# Ejecutar extensiones y funciones PCI-DSS
psql $DATABASE_URL < database/migrations/001_pci_dss_extensions.sql

# Ejecutar particionamiento
psql $DATABASE_URL < database/migrations/002_partitioning.sql
```

### 5.6. Crear particiones iniciales

```bash
psql $DATABASE_URL -c "SELECT create_monthly_partitions('2025-01-01', 24);"
```

---

## Paso 6: Configurar Backups Automáticos

### 6.1. Crear directorio de backups

```bash
sudo mkdir -p /var/backups/postgresql/guaira
sudo chown postgres:postgres /var/backups/postgresql/guaira
sudo chmod 700 /var/backups/postgresql/guaira
```

### 6.2. Hacer scripts ejecutables

```bash
cd /opt/guaira_app/apps/guaira-pos-web/database/scripts
chmod +x backup.sh restore.sh maintenance.sh
```

### 6.3. Probar backup manualmente

```bash
# Exportar variables de entorno
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="guaira_db"
export DB_USER="guaira_app"
export DB_PASSWORD="PASSWORD_AQUI"
export BACKUP_DIR="/var/backups/postgresql/guaira"

# Ejecutar backup
./backup.sh
```

Verificar que se creó el archivo en `/var/backups/postgresql/guaira/`

### 6.4. Configurar GPG para encriptación (opcional pero recomendado)

```bash
# Generar GPG key
sudo -u postgres gpg --gen-key
# Seguir las instrucciones, usar email: backups@guair.app

# Exportar public key (para guardar en lugar seguro)
sudo -u postgres gpg --export --armor backups@guair.app > guaira_backup_public.key

# IMPORTANTE: Exportar private key y guardar en lugar MUY SEGURO
sudo -u postgres gpg --export-secret-keys --armor backups@guair.app > guaira_backup_private.key
```

### 6.5. Configurar cron jobs

```bash
# Editar crontab de postgres
sudo -u postgres crontab -e
```

Agregar:

```cron
# Backup diario a las 2am
0 2 * * * /opt/guaira_app/apps/guaira-pos-web/database/scripts/backup.sh >> /var/log/postgresql/backup.log 2>&1

# Mantenimiento semanal (domingos a las 3am)
0 3 * * 0 /opt/guaira_app/apps/guaira-pos-web/database/scripts/maintenance.sh >> /var/log/postgresql/maintenance.log 2>&1

# Crear particiones futuras (primer día del mes)
0 1 1 * * psql $DATABASE_URL -c "SELECT create_monthly_partitions(NOW(), 3);" >> /var/log/postgresql/partitions.log 2>&1
```

---

## Paso 7: Configurar Firewall

### 7.1. Configurar UFW

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# PostgreSQL solo desde IPs específicas
# Opción 1: Solo localhost (si app está en el mismo servidor)
sudo ufw allow from 127.0.0.1 to any port 5432

# Opción 2: Desde IP específica del servidor de aplicación
sudo ufw allow from [IP_APP_SERVER] to any port 5432

# Ver reglas
sudo ufw status verbose
```

---

## Paso 8: Seed Inicial (Solo si es necesario)

### 8.1. Ejecutar seed de prueba

**ADVERTENCIA:** Solo ejecutar en desarrollo o staging, NO en producción con datos reales.

```bash
# Compilar TypeScript
npx ts-node prisma/seed-pci-compliant.ts
```

---

## Paso 9: Verificación Post-Deployment

### 9.1. Verificar conectividad

```bash
# Desde el servidor
psql -h localhost -U guaira_app -d guaira_db -c "SELECT version();"
```

### 9.2. Verificar tablas creadas

```bash
psql -h localhost -U guaira_app -d guaira_db -c "\dt"
```

Debes ver todas las tablas: users, wallets, transactions, ledger_entries, payments, etc.

### 9.3. Verificar extensiones

```bash
psql -h localhost -U guaira_app -d guaira_db -c "\dx"
```

Debes ver: pgcrypto, uuid-ossp, pg_stat_statements, pg_trgm

### 9.4. Verificar triggers

```bash
psql -h localhost -U guaira_app -d guaira_db -c "
  SELECT trigger_name, event_manipulation, event_object_table
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
"
```

### 9.5. Probar query básico

```bash
psql -h localhost -U guaira_app -d guaira_db -c "SELECT COUNT(*) FROM users;"
```

---

## Paso 10: Configurar Monitoreo

### 10.1. Habilitar pg_stat_statements

Ya está habilitado en postgresql.conf, verificar:

```sql
SELECT * FROM pg_stat_statements LIMIT 5;
```

### 10.2. Crear script de health check

```bash
cat > /opt/guaira_app/health_check.sh <<'EOF'
#!/bin/bash
psql postgresql://guaira_app:PASSWORD@localhost:5432/guaira_db \
  -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "OK"
  exit 0
else
  echo "FAIL"
  exit 1
fi
EOF

chmod +x /opt/guaira_app/health_check.sh
```

### 10.3. Configurar alertas (opcional)

Integrar con Prometheus, Grafana, o servicio de monitoreo preferido.

---

## Paso 11: Seguridad Final

### 11.1. Deshabilitar acceso remoto de postgres

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Comentar cualquier línea que permita acceso remoto de superuser:

```conf
# local   all   postgres   peer  ✓ MANTENER (solo local)
# host    all   postgres   0.0.0.0/0   md5  ✗ ELIMINAR (peligroso)
```

### 11.2. Cambiar password de usuario postgres

```bash
sudo -u postgres psql
```

```sql
ALTER USER postgres WITH PASSWORD 'NUEVO_PASSWORD_MUY_FUERTE';
```

### 11.3. Configurar fail2ban (opcional)

```bash
sudo apt install -y fail2ban

# Crear filtro para PostgreSQL
sudo nano /etc/fail2ban/filter.d/postgresql.conf
```

Agregar:

```conf
[Definition]
failregex = FATAL:.*authentication failed for user.*
ignoreregex =
```

Habilitar:

```bash
sudo nano /etc/fail2ban/jail.local
```

```conf
[postgresql]
enabled = true
port = 5432
filter = postgresql
logpath = /var/log/postgresql/postgresql-16-main.log
maxretry = 5
bantime = 3600
```

```bash
sudo systemctl restart fail2ban
```

---

## Paso 12: Documentar Credenciales

### 12.1. Guardar información crítica

En un password manager seguro (1Password, Bitwarden, etc.):

```yaml
Servidor: 64.23.201.2
Database: guaira_db
Usuario: guaira_app
Password: [GUARDADO_EN_PASSWORD_MANAGER]
PostgreSQL Superuser Password: [GUARDADO_EN_PASSWORD_MANAGER]
GPG Key Passphrase: [GUARDADO_EN_PASSWORD_MANAGER]
HMAC_SECRET: [GUARDADO_EN_PASSWORD_MANAGER]
```

### 12.2. Backup de GPG keys

Guardar en lugar seguro offline:
- guaira_backup_public.key
- guaira_backup_private.key

---

## Troubleshooting

### Problema: No puedo conectarme a PostgreSQL

```bash
# Ver logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Verificar que está corriendo
sudo systemctl status postgresql@16-main

# Verificar puerto
sudo netstat -tulpn | grep 5432
```

### Problema: Error de autenticación

```bash
# Verificar pg_hba.conf
sudo cat /etc/postgresql/16/main/pg_hba.conf

# Recargar configuración
sudo systemctl reload postgresql@16-main
```

### Problema: Migraciones fallan

```bash
# Ver estado de migraciones
npx prisma migrate status

# Forzar reset (SOLO EN DESARROLLO)
npx prisma migrate reset

# En producción, resolver manualmente
```

---

## Rollback Procedure

Si algo sale mal:

### 1. Restaurar configuraciones originales

```bash
sudo cp /etc/postgresql/16/main/postgresql.conf.backup /etc/postgresql/16/main/postgresql.conf
sudo cp /etc/postgresql/16/main/pg_hba.conf.backup /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql@16-main
```

### 2. Restaurar backup

```bash
./database/scripts/restore.sh --file [BACKUP_FILE]
```

---

## Checklist Final

Antes de dar por completado el deployment:

- [ ] PostgreSQL 16 instalado y corriendo
- [ ] Configuraciones optimizadas aplicadas
- [ ] Base de datos creada
- [ ] Usuario de aplicación creado con permisos
- [ ] Migraciones de Prisma ejecutadas
- [ ] Extensiones y funciones SQL creadas
- [ ] Particiones iniciales creadas
- [ ] Backups automatizados configurados
- [ ] Cron jobs configurados
- [ ] Firewall configurado
- [ ] GPG keys generadas y respaldadas
- [ ] Health check funcionando
- [ ] Credenciales documentadas y guardadas
- [ ] Logs monitoreados
- [ ] Conectividad desde aplicación verificada

---

## Próximos Pasos

1. **Configurar replicación** para high availability (opcional)
2. **Integrar con monitoring** (Prometheus + Grafana)
3. **Configurar alertas** en Slack/Email
4. **Implementar CI/CD** para migraciones automáticas
5. **Documentar runbooks** para operaciones comunes

---

## Contacto

Para soporte durante el deployment:

- **Email:** devops@guair.app
- **Slack:** #database-deploy
- **Emergency:** +58 XXX XXX XXXX

---

**Última actualización:** 2025-01-16
**Versión:** 1.0
