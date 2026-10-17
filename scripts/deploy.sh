#!/bin/bash
# ============================================
# Net-On — Production Deployment Script
# ============================================
# Usage:
#   ./scripts/deploy.sh              Full deploy (build + migrate + start)
#   ./scripts/deploy.sh --no-build   Skip Docker build (restart only)
#   ./scripts/deploy.sh --migrate    Run migrations only
# ============================================

set -euo pipefail

# --- Configuration ---
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()   { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
ok()    { echo -e "${GREEN}[  OK  ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
error() { echo -e "${RED}[ERROR ]${NC} $1"; exit 1; }

# --- Pre-flight Checks ---
preflight() {
    log "Running pre-flight checks..."

    # Check Docker
    command -v docker &>/dev/null || error "Docker is not installed"
    docker compose version &>/dev/null || error "Docker Compose is not installed"

    # Check .env exists
    [ -f .env ] || error ".env file not found. Copy .env.production to .env and configure it."

    # Check critical env vars
    source .env
    [ "$NODE_ENV" = "production" ] || warn "NODE_ENV is not set to 'production' (current: ${NODE_ENV:-unset})"
    [ "${DB_PASSWORD:-}" != "neton_dev_password" ] || error "DB_PASSWORD is still the default dev password!"
    [ "${JWT_ACCESS_SECRET:-}" != "change-this-to-a-long-random-string-at-least-64-chars" ] || error "JWT_ACCESS_SECRET is still the placeholder!"
    [ "${ENCRYPTION_SECRET:-}" != "change-this-to-a-random-string-at-least-32-chars" ] || error "ENCRYPTION_SECRET is still the placeholder!"
    [ "${MPESA_WEBHOOK_SECRET:-}" != "change-this-to-a-random-webhook-secret" ] || error "MPESA_WEBHOOK_SECRET is still the placeholder!"
    [ "${ADMIN_PASSWORD:-}" != "ChangeThisPassword123!" ] || warn "ADMIN_PASSWORD is still the default — change it!"

    # Check SSL certs
    if [ ! -f infrastructure/nginx/ssl/fullchain.pem ]; then
        warn "SSL certificate not found at infrastructure/nginx/ssl/fullchain.pem"
        warn "HTTPS will not work until SSL is configured"
    fi

    # --- Server Hardening Checks ---
    # These block deploy if the server hasn't been hardened
    if command -v ufw &>/dev/null; then
        if ! ufw status | grep -q "Status: active"; then
            error "Firewall (UFW) is not active. Run: sudo ./scripts/harden-server.sh"
        fi
        ok "Firewall is active"
    else
        warn "UFW not found — verify your firewall is configured"
    fi

    if command -v fail2ban-client &>/dev/null; then
        if systemctl is-active --quiet fail2ban; then
            ok "Fail2Ban is running"
        else
            warn "Fail2Ban installed but not running — start it: sudo systemctl start fail2ban"
        fi
    else
        warn "Fail2Ban not installed — run: sudo ./scripts/harden-server.sh"
    fi

    # Check we're not running as root — hard block, not a warning
    if [ "$(id -u)" -eq 0 ]; then
        error "Running as root. Deploy as the 'neton' user: su - neton -c './scripts/deploy.sh'"
    fi

    ok "Pre-flight checks passed"
}


# --- Build ---
build() {
    log "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    ok "Docker images built"
}

# --- Start Infrastructure ---
start_infra() {
    log "Starting PostgreSQL and Redis..."
    docker compose -f "$COMPOSE_FILE" up -d postgres redis
    
    log "Waiting for services to be healthy..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "healthy" && \
           docker compose -f "$COMPOSE_FILE" ps redis | grep -q "healthy"; then
            ok "PostgreSQL and Redis are healthy"
            return 0
        fi
        retries=$((retries - 1))
        sleep 2
    done
    error "Infrastructure services did not become healthy in time"
}

# --- Migrations ---
migrate() {
    log "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" run --rm api npx prisma migrate deploy
    ok "Database migrations complete"
}

# --- Start All Services ---
start_all() {
    log "Starting all services..."
    docker compose -f "$COMPOSE_FILE" up -d
    ok "All services started"
}

# --- Health Check ---
health_check() {
    log "Running health checks..."
    sleep 10  # Give services time to start

    local retries=12
    while [ $retries -gt 0 ]; do
        if docker compose -f "$COMPOSE_FILE" ps api | grep -q "healthy"; then
            ok "API is healthy"
            break
        fi
        retries=$((retries - 1))
        log "Waiting for API to become healthy... ($retries attempts left)"
        sleep 5
    done

    if [ $retries -eq 0 ]; then
        warn "API health check timed out — check logs: docker logs neton-api"
    fi

    echo ""
    log "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
}

# --- Backup Before Deploy ---
backup() {
    if [ -f scripts/backup.sh ]; then
        log "Creating pre-deployment backup..."
        bash scripts/backup.sh || warn "Backup failed — continuing deployment"
    fi
}

# --- Main ---
main() {
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   🚀 Net-On Production Deployment"
    echo "═══════════════════════════════════════════════"
    echo ""

    case "${1:-full}" in
        --no-build)
            preflight
            backup
            start_infra
            migrate
            start_all
            health_check
            ;;
        --migrate)
            start_infra
            migrate
            ;;
        --restart)
            docker compose -f "$COMPOSE_FILE" restart
            health_check
            ;;
        --status)
            docker compose -f "$COMPOSE_FILE" ps
            echo ""
            docker stats --no-stream
            ;;
        --logs)
            docker compose -f "$COMPOSE_FILE" logs -f --tail 100
            ;;
        full|*)
            preflight
            backup
            build
            start_infra
            migrate
            start_all
            health_check
            ;;
    esac

    echo "═══════════════════════════════════════════════"
    echo "   ✅ Deployment complete"
    echo ""
    echo "   Useful commands:"
    echo "     ./scripts/deploy.sh --status   View service status"
    echo "     ./scripts/deploy.sh --logs     Follow all logs"
    echo "     ./scripts/deploy.sh --restart  Restart all services"
    echo "═══════════════════════════════════════════════"
    echo ""
}

main "$@"
