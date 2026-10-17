#!/bin/bash
# ============================================
# Net-On — Production Health Monitor
# ============================================
# Checks all critical services and sends alerts
# on failure. Designed to run via cron.
#
# Usage:
#   ./scripts/monitor.sh              Run all checks
#   ./scripts/monitor.sh --once       Run once, print results, exit
#
# Cron (every 5 minutes):
#   */5 * * * * cd /opt/neton && ./scripts/monitor.sh >> /var/log/neton-monitor.log 2>&1
# ============================================

set -uo pipefail

# --- Configuration ---
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
ALERT_LOG="./logs/alerts.log"
STATE_DIR="./logs/monitor-state"

# Load env
[ -f .env ] && source .env

# Alert settings — configure in .env
ALERT_WEBHOOK_URL="${MONITOR_WEBHOOK_URL:-}"       # Slack/Discord/Teams webhook
ALERT_EMAIL="${MONITOR_ALERT_EMAIL:-}"              # Email alerts (requires mailutils)
API_BASE_URL="${API_URL:-http://localhost:3001}"
WEB_BASE_URL="${APP_URL:-http://localhost:3000}"

# Colors (for interactive use)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Setup ---
mkdir -p "$(dirname "$ALERT_LOG")" "$STATE_DIR"

log()   { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${BLUE}[MONITOR]${NC} $1"; }
ok()    { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[  OK   ]${NC} $1"; }
warn()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[ WARN  ]${NC} $1"; }
fail()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[ FAIL  ]${NC} $1"; }

FAILURES=()
WARNINGS=()

record_failure() {
    FAILURES+=("$1")
    fail "$1"
}

record_warning() {
    WARNINGS+=("$1")
    warn "$1"
}

# ============================================
# Send Alert
# ============================================
send_alert() {
    local SUBJECT="$1"
    local BODY="$2"
    local SEVERITY="${3:-CRITICAL}"

    # Log all alerts
    echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [$SEVERITY] $SUBJECT: $BODY" >> "$ALERT_LOG"

    # Deduplicate: don't re-alert for the same issue within 30 minutes
    local ALERT_HASH
    ALERT_HASH=$(echo "$SUBJECT" | md5sum | cut -d' ' -f1)
    local STATE_FILE="$STATE_DIR/alert_${ALERT_HASH}"

    if [ -f "$STATE_FILE" ]; then
        local LAST_ALERT
        LAST_ALERT=$(cat "$STATE_FILE")
        local NOW
        NOW=$(date +%s)
        local DIFF=$(( NOW - LAST_ALERT ))

        if [ $DIFF -lt 1800 ]; then
            log "Suppressing duplicate alert (sent ${DIFF}s ago): $SUBJECT"
            return 0
        fi
    fi

    date +%s > "$STATE_FILE"

    # --- Slack/Discord/Teams webhook ---
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        local EMOJI="🔴"
        [ "$SEVERITY" = "WARNING" ] && EMOJI="🟡"
        [ "$SEVERITY" = "RECOVERED" ] && EMOJI="🟢"

        local PAYLOAD
        PAYLOAD=$(cat <<EOF
{
    "text": "$EMOJI *[Net-On $SEVERITY]* $SUBJECT\n$BODY\nServer: $(hostname)\nTime: $(date -u '+%Y-%m-%d %H:%M UTC')"
}
EOF
)
        curl -s -X POST "$ALERT_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "$PAYLOAD" > /dev/null 2>&1 || true
    fi

    # --- Email alert ---
    if [ -n "$ALERT_EMAIL" ] && command -v mail &>/dev/null; then
        echo "$BODY" | mail -s "[Net-On $SEVERITY] $SUBJECT" "$ALERT_EMAIL"
    fi
}

# ============================================
# Check: Docker containers running
# ============================================
check_containers() {
    log "Checking Docker containers..."

    local REQUIRED_CONTAINERS=("neton-api" "neton-web" "neton-nginx" "neton-postgres" "neton-redis" "neton-worker")

    for CONTAINER in "${REQUIRED_CONTAINERS[@]}"; do
        local STATUS
        STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")

        if [ "$STATUS" = "running" ]; then
            # Check if it's restarting (crash loop)
            local RESTART_COUNT
            RESTART_COUNT=$(docker inspect -f '{{.RestartCount}}' "$CONTAINER" 2>/dev/null || echo "0")
            if [ "$RESTART_COUNT" -gt 5 ]; then
                record_failure "$CONTAINER has restarted $RESTART_COUNT times (crash loop?)"
            else
                ok "$CONTAINER: running"
            fi
        else
            record_failure "$CONTAINER is $STATUS"
        fi
    done
}

# ============================================
# Check: API health endpoint
# ============================================
check_api_health() {
    log "Checking API health..."

    # Liveness
    local LIVE_STATUS
    LIVE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 5 --max-time 10 \
        "$API_BASE_URL/api/v1/health/live" 2>/dev/null || echo "000")

    if [ "$LIVE_STATUS" = "200" ]; then
        ok "API liveness: HTTP $LIVE_STATUS"
    else
        record_failure "API liveness check failed: HTTP $LIVE_STATUS"
    fi

    # Readiness (includes DB check)
    local READY_STATUS
    READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 5 --max-time 10 \
        "$API_BASE_URL/api/v1/health/ready" 2>/dev/null || echo "000")

    if [ "$READY_STATUS" = "200" ]; then
        ok "API readiness (DB): HTTP $READY_STATUS"
    else
        record_failure "API readiness check failed (database may be down): HTTP $READY_STATUS"
    fi
}

# ============================================
# Check: Web frontend
# ============================================
check_web() {
    log "Checking web frontend..."

    local WEB_STATUS
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 5 --max-time 10 \
        "$WEB_BASE_URL" 2>/dev/null || echo "000")

    if [ "$WEB_STATUS" = "200" ]; then
        ok "Web frontend: HTTP $WEB_STATUS"
    else
        record_failure "Web frontend unreachable: HTTP $WEB_STATUS"
    fi
}

# ============================================
# Check: Database connectivity + size
# ============================================
check_database() {
    log "Checking database..."

    local DB_READY
    DB_READY=$(docker exec neton-postgres pg_isready -U "${DB_USER:-neton}" -d "${DB_NAME:-neton}" 2>/dev/null || echo "failed")

    if echo "$DB_READY" | grep -q "accepting connections"; then
        ok "PostgreSQL: accepting connections"
    else
        record_failure "PostgreSQL is not accepting connections"
        return
    fi

    # Check disk usage of DB
    local DB_SIZE
    DB_SIZE=$(docker exec neton-postgres \
        psql -U "${DB_USER:-neton}" -d "${DB_NAME:-neton}" -t -c \
        "SELECT pg_size_pretty(pg_database_size('${DB_NAME:-neton}'))" \
        2>/dev/null | tr -d ' ')

    if [ -n "$DB_SIZE" ]; then
        ok "Database size: $DB_SIZE"
    fi
}

# ============================================
# Check: Redis
# ============================================
check_redis() {
    log "Checking Redis..."

    local REDIS_PING
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        REDIS_PING=$(docker exec neton-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null || echo "failed")
    else
        REDIS_PING=$(docker exec neton-redis redis-cli ping 2>/dev/null || echo "failed")
    fi

    if [ "$REDIS_PING" = "PONG" ]; then
        ok "Redis: PONG"
    else
        record_failure "Redis is not responding"
    fi
}

# ============================================
# Check: Disk space
# ============================================
check_disk() {
    log "Checking disk space..."

    local DISK_USAGE
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

    if [ "$DISK_USAGE" -gt 90 ]; then
        record_failure "Disk usage is at ${DISK_USAGE}% — critical!"
    elif [ "$DISK_USAGE" -gt 80 ]; then
        record_warning "Disk usage is at ${DISK_USAGE}%"
    else
        ok "Disk usage: ${DISK_USAGE}%"
    fi
}

# ============================================
# Check: SSL certificate expiry
# ============================================
check_ssl() {
    log "Checking SSL certificate..."

    local DOMAIN
    DOMAIN=$(echo "$APP_URL" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)

    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "localhost" ]; then
        log "Skipping SSL check (localhost)"
        return
    fi

    local EXPIRY_DATE
    EXPIRY_DATE=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null \
        | cut -d= -f2)

    if [ -z "$EXPIRY_DATE" ]; then
        record_warning "Could not check SSL certificate for $DOMAIN"
        return
    fi

    local EXPIRY_EPOCH
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -jf "%b %d %T %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
    local NOW_EPOCH
    NOW_EPOCH=$(date +%s)
    local DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -lt 7 ]; then
        record_failure "SSL certificate expires in $DAYS_LEFT days!"
    elif [ "$DAYS_LEFT" -lt 30 ]; then
        record_warning "SSL certificate expires in $DAYS_LEFT days"
    else
        ok "SSL certificate: $DAYS_LEFT days remaining"
    fi
}

# ============================================
# Check: Recent backup exists
# ============================================
check_backups() {
    log "Checking backups..."

    local BACKUP_DIR="./backups"
    local LATEST
    LATEST=$(ls -t "$BACKUP_DIR"/neton_db_* 2>/dev/null | head -1)

    if [ -z "$LATEST" ]; then
        record_failure "No backups found!"
        return
    fi

    # Check backup age
    local BACKUP_AGE_HOURS
    local BACKUP_MOD
    BACKUP_MOD=$(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null)
    local NOW
    NOW=$(date +%s)
    BACKUP_AGE_HOURS=$(( (NOW - BACKUP_MOD) / 3600 ))

    if [ "$BACKUP_AGE_HOURS" -gt 48 ]; then
        record_failure "Latest backup is $BACKUP_AGE_HOURS hours old (>48h)"
    elif [ "$BACKUP_AGE_HOURS" -gt 25 ]; then
        record_warning "Latest backup is $BACKUP_AGE_HOURS hours old"
    else
        ok "Latest backup: $BACKUP_AGE_HOURS hours ago"
    fi

    # Check backup is encrypted
    if [[ "$LATEST" != *.enc ]]; then
        record_warning "Latest backup is NOT encrypted: $(basename "$LATEST")"
    else
        ok "Backup encrypted: ✓"
    fi
}

# ============================================
# Check: M-Pesa webhook (recent activity)
# ============================================
# Thresholds (configurable via .env):
#   CRITICAL (>10/hr): Sustained attack, broken webhook auth,
#     or Safaricom IP range changed. Investigate immediately.
#   WARNING (>3/hr): Could be legitimate retries or a scanner.
#     A single M-Pesa timeout/retry shouldn't alarm.
# ============================================
check_mpesa() {
    log "Checking M-Pesa webhook logs..."

    local MPESA_CRITICAL_THRESHOLD="${MONITOR_MPESA_CRITICAL:-10}"
    local MPESA_WARNING_THRESHOLD="${MONITOR_MPESA_WARNING:-3}"

    # Check API logs for recent webhook rejections
    local REJECT_COUNT
    REJECT_COUNT=$(docker logs neton-api --since 1h 2>&1 | grep -ci "M-Pesa.*rejected\|webhook.*unauthorized\|invalid.*signature\|invalid.*token" || echo "0")

    if [ "$REJECT_COUNT" -gt "$MPESA_CRITICAL_THRESHOLD" ]; then
        record_failure "M-Pesa webhook: $REJECT_COUNT rejections in the last hour (threshold: >$MPESA_CRITICAL_THRESHOLD)"
    elif [ "$REJECT_COUNT" -gt "$MPESA_WARNING_THRESHOLD" ]; then
        record_warning "M-Pesa webhook: $REJECT_COUNT rejections in the last hour (threshold: >$MPESA_WARNING_THRESHOLD)"
    else
        ok "M-Pesa webhook: $REJECT_COUNT rejections in the last hour (OK)"
    fi
}

# ============================================
# Main
# ============================================
main() {
    echo ""
    log "═══════════════════════════════════════════════"
    log "   🔍 Net-On Health Monitor"
    log "═══════════════════════════════════════════════"
    echo ""

    check_containers
    check_api_health
    check_web
    check_database
    check_redis
    check_disk
    check_ssl
    check_backups
    check_mpesa

    echo ""
    log "═══════════════════════════════════════════════"

    # --- Report ---
    if [ ${#FAILURES[@]} -gt 0 ]; then
        fail "CRITICAL: ${#FAILURES[@]} failure(s) detected"

        local BODY=""
        for F in "${FAILURES[@]}"; do
            BODY+="• $F\n"
            fail "  → $F"
        done

        send_alert "Service failures detected (${#FAILURES[@]})" "$BODY" "CRITICAL"
        echo ""
        exit 1
    elif [ ${#WARNINGS[@]} -gt 0 ]; then
        warn "WARNING: ${#WARNINGS[@]} warning(s)"

        local BODY=""
        for W in "${WARNINGS[@]}"; do
            BODY+="• $W\n"
        done

        send_alert "Service warnings (${#WARNINGS[@]})" "$BODY" "WARNING"
        echo ""
        exit 0
    else
        ok "All checks passed ✓"

        # Clear any previous alert states (send recovery)
        if ls "$STATE_DIR"/alert_* 1>/dev/null 2>&1; then
            send_alert "All services recovered" "All health checks are passing." "RECOVERED"
            rm -f "$STATE_DIR"/alert_*
        fi

        echo ""
        exit 0
    fi
}

main "$@"
