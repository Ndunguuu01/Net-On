# Net-On — Production Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying Net-On to a production cloud server (Ubuntu 22.04 LTS / Debian 12) using Docker Compose and Nginx.

---

## 1. Prerequisites
- Docker Engine `>= 26.0` and Docker Compose `>= v2.24`
- Node.js `>= 22.0` (for CLI scripts and migrations)
- Registered domain name (e.g., `neton.yourisp.co.ke`) pointing to the server's public IP
- SSL Certificates (via Let's Encrypt / Certbot)
- Safaricom Daraja Production Credentials (Consumer Key, Secret, Passkey, Shortcode)
- Africa's Talking Production Credentials

---

## 2. Server Provisioning & Initial Setup

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Clone Repository
git clone https://github.com/your-org/net-on.git /opt/net-on
cd /opt/net-on

# 4. Create Production Environment File
cp .env.example .env
nano .env
```

---

## 3. Environment Variable Checklist

Ensure the following variables are configured with strong, random secrets in production:

| Variable | Description | Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection string | Use strong password, no default |
| `DB_PASSWORD` | PostgreSQL user password | 32+ characters random string |
| `JWT_ACCESS_SECRET` | Access token signing key | 64+ characters random string |
| `JWT_REFRESH_SECRET` | Refresh token signing key | 64+ characters random string |
| `ENCRYPTION_SECRET` | AES-256-GCM encryption secret | 32+ characters random string |
| `MPESA_MODE` | Payment provider mode | `live` |
| `MPESA_WEBHOOK_SECRET` | Webhook verification secret | 32+ characters random string |
| `MIKROTIK_MODE` | Router adapter mode | `live` |
| `ADMIN_PASSWORD` | Initial admin seed password | Unique, high-entropy password |

---

## 4. Deploying with Docker Compose

```bash
# 1. Build and start containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 2. Verify all services are healthy
docker compose -f docker-compose.prod.yml ps

# 3. Apply Prisma database migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 4. Seed initial administrative accounts and default settings
docker compose -f docker-compose.prod.yml exec api npm run prisma:seed
```

---

## 5. SSL / TLS Setup with Nginx & Certbot

```bash
# Install Certbot
sudo apt install certbot -y

# Generate SSL certificates for your domain
sudo certbot certonly --standalone -d neton.yourisp.co.ke

# Mount certificate directory into /opt/net-on/infrastructure/nginx/ssl
```

---

## 6. Automated Backup Strategy

Add daily database backup cron job:

```bash
# Add to crontab (runs daily at 02:00 AM)
crontab -e

# Insert line:
0 2 * * * /opt/net-on/scripts/backup.sh >> /var/log/neton-backup.log 2>&1
```

---

## 7. Rollback Procedure

If a deployment encounters issues:

```bash
# 1. Rollback to previous Docker image tag
docker compose -f docker-compose.prod.yml down

# 2. Restore database from backup if schema was corrupted
gunzip -c /opt/net-on/backups/neton_PREVIOUS_TIMESTAMP.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U neton -d neton

# 3. Restart stable release
docker compose -f docker-compose.prod.yml up -d
```
