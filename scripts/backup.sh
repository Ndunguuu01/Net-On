#!/bin/bash
# ============================================
# Net-On — Production Backup Script
# ============================================
# Backs up PostgreSQL (encrypted) + .env (encrypted),
# verifies integrity, and ships copies offsite.
#
# ENCRYPTION KEY: The backup encryption key is sourced
# SEPARATELY from .env to avoid key+ciphertext on same
# disk. Resolution order:
#   1. BACKUP_ENCRYPTION_KEY env var (set externally)
#   2. /etc/neton/backup.key file (root-only readable)
#   3. Interactive prompt (manual runs only)
# Do NOT put BACKUP_ENCRYPTION_KEY in .env.
#
# Usage:
#   ./scripts/backup.sh                  Full backup (local + offsite)
#   ./scripts/backup.sh --verify         Verify latest local backup
#   ./scripts/backup.sh --verify-offsite Pull from S3 + verify end-to-end
#   ./scripts/backup.sh --list           List all backups
#   ./scripts/backup.sh --restore <f>    Restore from a specific backup
#
# Cron (daily at 2 AM, weekly offsite verify on Sunday):
#   0 2 * * * cd /opt/neton && ./scripts/backup.sh >> /var/log/neton-backup.log 2>&1
#   0 4 * * 0 cd /opt/neton && ./scripts/backup.sh --verify-offsite >> /var/log/neton-backup.log 2>&1
# ============================================

set -euo pipefail

# --- Configuration ---
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPOSE_FILE="docker-compose.prod.yml"

# Offsite backup (S3-compatible). Set these in .env or environment.
# Supports AWS S3, DigitalOcean Spaces, Backblaze B2, MinIO, etc.
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_PREFIX="${BACKUP_S3_PREFIX:-neton-backups}"

# Load env if available
[ -f .env ] && source .env

DB_NAME="${DB_NAME:-neton}"
DB_USER="${DB_USER:-neton}"
DB_CONTAINER="neton-postgres"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${BLUE}[BACKUP]${NC} $1"; }
ok()    { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[  OK  ]${NC} $1"; }
warn()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[ WARN ]${NC} $1"; }
error() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[ERROR ]${NC} $1"; exit 1; }

# ============================================
# Ensure backup directory exists
# ============================================
mkdir -p "$BACKUP_DIR"

# ============================================
# Resolve backup encryption key
# ============================================
# Key is intentionally NOT read from .env — if an
# attacker compromises the server, they should NOT
# get the key and the ciphertext from the same place.
# ============================================
BACKUP_KEY=""

resolve_encryption_key() {
    # 1. Environment variable (set externally, e.g. by secrets manager or CI/CD)
    if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        BACKUP_KEY="$BACKUP_ENCRYPTION_KEY"
        return 0
    fi

    # 2. Key file (root-only readable, created during server setup)
    local KEYFILE="/etc/neton/backup.key"
    if [ -f "$KEYFILE" ]; then
        BACKUP_KEY=$(cat "$KEYFILE")
        if [ -n "$BACKUP_KEY" ]; then
            return 0
        fi
    fi

    # 3. Interactive prompt (only works for manual runs, not cron)
    if [ -t 0 ]; then
        echo -n "Enter backup encryption passphrase: "
        read -rs BACKUP_KEY
        echo ""
        if [ -n "$BACKUP_KEY" ]; then
            return 0
        fi
    fi

    error "No backup encryption key found. Set one via:\n  1. export BACKUP_ENCRYPTION_KEY=<key>\n  2. echo '<key>' | sudo tee /etc/neton/backup.key && sudo chmod 600 /etc/neton/backup.key\n  Do NOT put this key in .env — it must live separately from the encrypted data."
}

# ============================================
# Encrypt a file with AES-256
# ============================================
encrypt_file() {
    local INPUT="$1"
    local OUTPUT="$2"

    [ -n "$BACKUP_KEY" ] || resolve_encryption_key

    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "$INPUT" \
        -out "$OUTPUT" \
        -pass "pass:${BACKUP_KEY}"
}

# ============================================
# Decrypt a file
# ============================================
decrypt_file() {
    local INPUT="$1"
    local OUTPUT="$2"

    [ -n "$BACKUP_KEY" ] || resolve_encryption_key

    openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
        -in "$INPUT" \
        -out "$OUTPUT" \
        -pass "pass:${BACKUP_KEY}"
}

# ============================================
# Upload to S3-compatible storage
# ============================================
offsite_upload() {
    local FILE="$1"

    if [ -z "$S3_BUCKET" ]; then
        warn "No BACKUP_S3_BUCKET configured — backup is LOCAL ONLY (single point of failure)"
        warn "Set BACKUP_S3_BUCKET in .env for offsite copies"
        return 0
    fi

    if ! command -v aws &>/dev/null; then
        warn "AWS CLI not installed — cannot upload to S3. Install: apt install awscli"
        return 1
    fi

    local S3_ARGS=""
    if [ -n "$S3_ENDPOINT" ]; then
        S3_ARGS="--endpoint-url $S3_ENDPOINT"
    fi

    log "Uploading $(basename "$FILE") to s3://$S3_BUCKET/$S3_PREFIX/..."
    aws s3 cp "$FILE" "s3://$S3_BUCKET/$S3_PREFIX/$(basename "$FILE")" \
        $S3_ARGS \
        --storage-class STANDARD_IA \
        --quiet

    ok "Uploaded to s3://$S3_BUCKET/$S3_PREFIX/$(basename "$FILE")"

    # Clean up old offsite backups
    log "Cleaning offsite backups older than $RETENTION_DAYS days..."
    local CUTOFF_DATE
    CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y-%m-%d)

    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" $S3_ARGS 2>/dev/null | while read -r line; do
        local FILE_DATE
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
            local FILE_NAME
            FILE_NAME=$(echo "$line" | awk '{print $4}')
            aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX/$FILE_NAME" $S3_ARGS --quiet
        fi
    done
}

# ============================================
# Full Backup
# ============================================
do_backup() {
    log "Starting full backup..."

    # --- 1. PostgreSQL dump ---
    local DB_DUMP_RAW="/tmp/neton_db_${TIMESTAMP}_$$.sql.gz"
    local DB_BACKUP="$BACKUP_DIR/neton_db_${TIMESTAMP}.sql.gz.enc"

    log "Dumping PostgreSQL database '$DB_NAME'..."

    # Check container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        error "PostgreSQL container '$DB_CONTAINER' is not running"
    fi

    docker exec "$DB_CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-privileges \
        > "$DB_DUMP_RAW"

    local RAW_SIZE
    RAW_SIZE=$(du -h "$DB_DUMP_RAW" | cut -f1)

    # Verify dump is not empty
    local DB_BYTES
    DB_BYTES=$(stat -c%s "$DB_DUMP_RAW" 2>/dev/null || stat -f%z "$DB_DUMP_RAW" 2>/dev/null || echo "0")
    if [ "$DB_BYTES" -lt 1024 ]; then
        rm -f "$DB_DUMP_RAW"
        error "Database dump is suspiciously small ($DB_BYTES bytes) — possible empty database or failed dump"
    fi

    # Encrypt the database dump
    log "Encrypting database dump..."
    encrypt_file "$DB_DUMP_RAW" "$DB_BACKUP"

    # Securely delete the unencrypted dump
    shred -u "$DB_DUMP_RAW" 2>/dev/null || rm -f "$DB_DUMP_RAW"

    local ENC_SIZE
    ENC_SIZE=$(du -h "$DB_BACKUP" | cut -f1)
    ok "Database backup (encrypted): $DB_BACKUP ($RAW_SIZE → $ENC_SIZE)"

    # --- 2. Backup .env (encrypted) ---
    local ENV_BACKUP="$BACKUP_DIR/neton_env_${TIMESTAMP}.enc"

    if [ -f .env ]; then
        encrypt_file .env "$ENV_BACKUP"
        ok "Encrypted .env backup: $ENV_BACKUP"
    fi

    # --- 3. Create manifest ---
    local MANIFEST="$BACKUP_DIR/neton_manifest_${TIMESTAMP}.json"
    local DB_CHECKSUM
    DB_CHECKSUM=$(sha256sum "$DB_BACKUP" | cut -d' ' -f1)

    cat > "$MANIFEST" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "$(grep '"version"' package.json | head -1 | cut -d'"' -f4)",
    "database": {
        "file": "$(basename "$DB_BACKUP")",
        "size_raw": "$RAW_SIZE",
        "size_encrypted": "$ENC_SIZE",
        "sha256": "$DB_CHECKSUM",
        "db_name": "$DB_NAME",
        "encrypted": true,
        "encryption_method": "AES-256-CBC-PBKDF2"
    },
    "env_backup": "$(basename "${ENV_BACKUP:-none}")",
    "server": "$(hostname)",
    "retention_days": $RETENTION_DAYS,
    "offsite": "$( [ -n "$S3_BUCKET" ] && echo "s3://$S3_BUCKET/$S3_PREFIX" || echo "none" )"
}
EOF
    ok "Manifest: $MANIFEST"

    # --- 4. Upload offsite ---
    offsite_upload "$DB_BACKUP"
    offsite_upload "$MANIFEST"

    # --- 5. Clean up old local backups ---
    log "Removing local backups older than $RETENTION_DAYS days..."
    local DELETED
    DELETED=$(find "$BACKUP_DIR" -name "neton_*" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
    ok "Removed $DELETED old local backup files"

    # --- 6. Summary ---
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   ✅ Backup Complete"
    echo ""
    echo "   Database:   $DB_BACKUP"
    echo "   Size:       $RAW_SIZE raw → $ENC_SIZE encrypted"
    echo "   Encrypted:  AES-256-CBC ✓"
    echo "   Checksum:   ${DB_CHECKSUM:0:16}..."
    if [ -n "$S3_BUCKET" ]; then
    echo "   Offsite:    s3://$S3_BUCKET/$S3_PREFIX ✓"
    else
    echo "   Offsite:    ⚠ NOT CONFIGURED"
    fi
    echo "   Retention:  $RETENTION_DAYS days"
    echo ""
    echo "   Total backups: $(find "$BACKUP_DIR" -name "neton_db_*" | wc -l)"
    echo "   Disk usage:    $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "═══════════════════════════════════════════════"
    echo ""
}

# ============================================
# Verify Latest Backup (test-restore)
# ============================================
do_verify() {
    log "Verifying latest backup is restorable..."

    # Find latest DB backup (encrypted)
    local LATEST
    LATEST=$(ls -t "$BACKUP_DIR"/neton_db_*.sql.gz.enc 2>/dev/null | head -1)

    # Fallback: try unencrypted (legacy backups)
    if [ -z "$LATEST" ]; then
        LATEST=$(ls -t "$BACKUP_DIR"/neton_db_*.sql.gz 2>/dev/null | head -1)
    fi

    if [ -z "$LATEST" ]; then
        error "No backup files found in $BACKUP_DIR"
    fi

    log "Testing: $LATEST"

    # Verify checksum if manifest exists
    local MANIFEST_NAME
    MANIFEST_NAME=$(basename "$LATEST" | sed 's/neton_db_/neton_manifest_/' | sed 's/.sql.gz.*/\.json/')
    local MANIFEST="$BACKUP_DIR/$MANIFEST_NAME"

    if [ -f "$MANIFEST" ]; then
        local EXPECTED_HASH ACTUAL_HASH
        EXPECTED_HASH=$(grep '"sha256"' "$MANIFEST" | cut -d'"' -f4)
        ACTUAL_HASH=$(sha256sum "$LATEST" | cut -d' ' -f1)

        if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
            ok "Checksum verified ✓"
        else
            error "Checksum MISMATCH — backup file may be corrupt!"
        fi
    else
        warn "No manifest found — skipping checksum verification"
    fi

    # Decrypt if encrypted
    local RESTORE_FILE="$LATEST"
    local TEMP_DECRYPTED=""

    if [[ "$LATEST" == *.enc ]]; then
        log "Decrypting backup for verification..."
        TEMP_DECRYPTED="/tmp/neton_verify_$$.sql.gz"
        decrypt_file "$LATEST" "$TEMP_DECRYPTED"
        RESTORE_FILE="$TEMP_DECRYPTED"
        ok "Decryption successful ✓"
    fi

    # Test restore into a temporary database
    log "Spinning up temporary PostgreSQL to test restore..."

    local TEST_CONTAINER="neton-backup-verify-$$"

    docker run -d \
        --name "$TEST_CONTAINER" \
        -e POSTGRES_DB=neton_verify \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD=verify_test_only \
        postgres:16-alpine > /dev/null 2>&1

    # Wait for temp DB
    log "Waiting for test database..."
    sleep 5

    local RETRIES=10
    while [ $RETRIES -gt 0 ]; do
        if docker exec "$TEST_CONTAINER" pg_isready -U "$DB_USER" -d neton_verify > /dev/null 2>&1; then
            break
        fi
        RETRIES=$((RETRIES - 1))
        sleep 2
    done

    if [ $RETRIES -eq 0 ]; then
        docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
        [ -n "$TEMP_DECRYPTED" ] && shred -u "$TEMP_DECRYPTED" 2>/dev/null
        error "Test database failed to start"
    fi

    # Restore into test DB
    log "Restoring backup into test database..."
    local RESTORE_RESULT=0

    docker exec -i "$TEST_CONTAINER" \
        pg_restore -U "$DB_USER" -d neton_verify \
        --no-owner --no-privileges --clean --if-exists \
        < "$RESTORE_FILE" || RESTORE_RESULT=$?

    if [ $RESTORE_RESULT -eq 0 ] || [ $RESTORE_RESULT -eq 1 ]; then
        ok "Restore completed successfully"
    else
        docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
        [ -n "$TEMP_DECRYPTED" ] && shred -u "$TEMP_DECRYPTED" 2>/dev/null
        error "Restore FAILED with exit code $RESTORE_RESULT — this backup is NOT usable!"
    fi

    # Verify tables exist
    local TABLE_COUNT
    TABLE_COUNT=$(docker exec "$TEST_CONTAINER" \
        psql -U "$DB_USER" -d neton_verify -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" \
        2>/dev/null | tr -d ' ')

    if [ "$TABLE_COUNT" -gt 0 ]; then
        ok "Verified: $TABLE_COUNT tables restored"
    else
        docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
        [ -n "$TEMP_DECRYPTED" ] && shred -u "$TEMP_DECRYPTED" 2>/dev/null
        error "Restore produced 0 tables — backup is empty or corrupt!"
    fi

    # Count rows in critical tables
    log "Checking critical table row counts..."
    for TABLE in "User" "Customer" "Invoice" "Payment"; do
        local ROW_COUNT
        ROW_COUNT=$(docker exec "$TEST_CONTAINER" \
            psql -U "$DB_USER" -d neton_verify -t -c \
            "SELECT COUNT(*) FROM \"$TABLE\"" \
            2>/dev/null | tr -d ' ' || echo "N/A")
        log "  $TABLE: $ROW_COUNT rows"
    done

    # Cleanup
    docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
    [ -n "$TEMP_DECRYPTED" ] && shred -u "$TEMP_DECRYPTED" 2>/dev/null

    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   ✅ Backup Verification PASSED"
    echo ""
    echo "   File:       $(basename "$LATEST")"
    echo "   Size:       $(du -h "$LATEST" | cut -f1)"
    echo "   Encrypted:  $( [[ "$LATEST" == *.enc ]] && echo "Yes ✓" || echo "No ⚠" )"
    echo "   Tables:     $TABLE_COUNT"
    echo "   Status:     RESTORABLE ✓"
    echo "═══════════════════════════════════════════════"
    echo ""
}

# ============================================
# List Backups
# ============================================
do_list() {
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   📦 Net-On Backups"
    echo "═══════════════════════════════════════════════"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR"/neton_db_* 2>/dev/null)" ]; then
        warn "No backups found in $BACKUP_DIR"
        return
    fi

    printf "%-45s %10s %5s %s\n" "FILE" "SIZE" "ENC" "DATE"
    printf "%-45s %10s %5s %s\n" "----" "----" "---" "----"

    for f in $(ls -t "$BACKUP_DIR"/neton_db_* 2>/dev/null); do
        local SIZE DATE ENC
        SIZE=$(du -h "$f" | cut -f1)
        DATE=$(date -r "$f" '+%Y-%m-%d %H:%M' 2>/dev/null || stat -c '%y' "$f" 2>/dev/null | cut -d'.' -f1)
        ENC=$( [[ "$f" == *.enc ]] && echo "✓" || echo "✗" )
        printf "%-45s %10s %5s %s\n" "$(basename "$f")" "$SIZE" "$ENC" "$DATE"
    done

    echo ""
    echo "Total: $(find "$BACKUP_DIR" -name "neton_db_*" | wc -l) backups, $(du -sh "$BACKUP_DIR" | cut -f1) disk usage"
    if [ -n "$S3_BUCKET" ]; then
        echo "Offsite: s3://$S3_BUCKET/$S3_PREFIX"
    else
        echo "Offsite: ⚠ NOT CONFIGURED — local only!"
    fi
    echo ""
}

# ============================================
# Restore from Backup
# ============================================
do_restore() {
    local BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
            BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
        else
            error "Backup file not found: $BACKUP_FILE"
        fi
    fi

    echo ""
    warn "═══════════════════════════════════════════════"
    warn "   ⚠️  DATABASE RESTORE"
    warn "═══════════════════════════════════════════════"
    warn ""
    warn "   This will OVERWRITE the current database"
    warn "   with: $(basename "$BACKUP_FILE")"
    warn ""
    warn "   All current data will be REPLACED."
    warn ""

    read -p "   Type 'RESTORE' to confirm: " CONFIRM
    if [ "$CONFIRM" != "RESTORE" ]; then
        log "Restore cancelled."
        return
    fi

    # Create a backup of current state first
    log "Backing up current database before restore..."
    do_backup

    # Decrypt if encrypted
    local RESTORE_FILE="$BACKUP_FILE"
    local TEMP_DECRYPTED=""

    if [[ "$BACKUP_FILE" == *.enc ]]; then
        log "Decrypting backup..."
        TEMP_DECRYPTED="/tmp/neton_restore_$$.sql.gz"
        decrypt_file "$BACKUP_FILE" "$TEMP_DECRYPTED"
        RESTORE_FILE="$TEMP_DECRYPTED"
        ok "Decryption successful"
    fi

    log "Restoring from: $(basename "$BACKUP_FILE")"

    docker exec -i "$DB_CONTAINER" \
        pg_restore -U "$DB_USER" -d "$DB_NAME" \
        --no-owner --no-privileges --clean --if-exists \
        < "$RESTORE_FILE"

    # Cleanup decrypted temp file
    [ -n "$TEMP_DECRYPTED" ] && shred -u "$TEMP_DECRYPTED" 2>/dev/null

    ok "Database restored from $(basename "$BACKUP_FILE")"

    # Restart API to clear any caches
    log "Restarting API..."
    docker compose -f "$COMPOSE_FILE" restart api worker

    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   ✅ Restore Complete"
    echo ""
    echo "   Source:  $(basename "$BACKUP_FILE")"
    echo "   API restarted to clear caches"
    echo "═══════════════════════════════════════════════"
    echo ""
}

# ============================================
# Verify Offsite Backup (pull from S3 + restore)
# ============================================
do_verify_offsite() {
    log "Verifying offsite backup (full end-to-end)..."

    if [ -z "$S3_BUCKET" ]; then
        error "BACKUP_S3_BUCKET is not configured — cannot verify offsite"
    fi

    if ! command -v aws &>/dev/null; then
        error "AWS CLI not installed — cannot pull from S3"
    fi

    local S3_ARGS=""
    if [ -n "$S3_ENDPOINT" ]; then
        S3_ARGS="--endpoint-url $S3_ENDPOINT"
    fi

    # Find the latest offsite backup
    log "Listing offsite backups in s3://$S3_BUCKET/$S3_PREFIX/..."
    local LATEST_OFFSITE
    LATEST_OFFSITE=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" $S3_ARGS 2>/dev/null \
        | grep 'neton_db_' | sort | tail -1 | awk '{print $4}')

    if [ -z "$LATEST_OFFSITE" ]; then
        error "No backup files found in s3://$S3_BUCKET/$S3_PREFIX/"
    fi

    log "Latest offsite backup: $LATEST_OFFSITE"

    # Download to temp
    local TEMP_DOWNLOAD="/tmp/neton_offsite_verify_$$.sql.gz.enc"
    log "Downloading from S3..."
    aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$LATEST_OFFSITE" "$TEMP_DOWNLOAD" $S3_ARGS --quiet

    local DL_SIZE
    DL_SIZE=$(du -h "$TEMP_DOWNLOAD" | cut -f1)
    ok "Downloaded: $DL_SIZE"

    # Verify checksum against manifest if available
    local MANIFEST_NAME
    MANIFEST_NAME=$(echo "$LATEST_OFFSITE" | sed 's/neton_db_/neton_manifest_/' | sed 's/.sql.gz.*/\.json/')
    local TEMP_MANIFEST="/tmp/neton_offsite_manifest_$$.json"

    if aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$MANIFEST_NAME" "$TEMP_MANIFEST" $S3_ARGS --quiet 2>/dev/null; then
        local EXPECTED_HASH ACTUAL_HASH
        EXPECTED_HASH=$(grep '"sha256"' "$TEMP_MANIFEST" | cut -d'"' -f4)
        ACTUAL_HASH=$(sha256sum "$TEMP_DOWNLOAD" | cut -d' ' -f1)

        if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
            ok "Offsite checksum verified ✓"
        else
            rm -f "$TEMP_DOWNLOAD" "$TEMP_MANIFEST"
            error "Offsite checksum MISMATCH — file corrupt or tampered!"
        fi
        rm -f "$TEMP_MANIFEST"
    else
        warn "No manifest found offsite — skipping checksum"
    fi

    # Decrypt
    log "Decrypting offsite backup..."
    local TEMP_DECRYPTED="/tmp/neton_offsite_decrypted_$$.sql.gz"
    decrypt_file "$TEMP_DOWNLOAD" "$TEMP_DECRYPTED"
    ok "Decryption successful ✓"

    # Test restore into temp container
    log "Spinning up temporary PostgreSQL to test offsite restore..."
    local TEST_CONTAINER="neton-offsite-verify-$$"

    docker run -d \
        --name "$TEST_CONTAINER" \
        -e POSTGRES_DB=neton_verify \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD=verify_test_only \
        postgres:16-alpine > /dev/null 2>&1

    sleep 5
    local RETRIES=10
    while [ $RETRIES -gt 0 ]; do
        if docker exec "$TEST_CONTAINER" pg_isready -U "$DB_USER" -d neton_verify > /dev/null 2>&1; then
            break
        fi
        RETRIES=$((RETRIES - 1))
        sleep 2
    done

    if [ $RETRIES -eq 0 ]; then
        docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
        shred -u "$TEMP_DOWNLOAD" "$TEMP_DECRYPTED" 2>/dev/null
        error "Test database failed to start"
    fi

    local RESTORE_RESULT=0
    docker exec -i "$TEST_CONTAINER" \
        pg_restore -U "$DB_USER" -d neton_verify \
        --no-owner --no-privileges --clean --if-exists \
        < "$TEMP_DECRYPTED" || RESTORE_RESULT=$?

    if [ $RESTORE_RESULT -eq 0 ] || [ $RESTORE_RESULT -eq 1 ]; then
        ok "Offsite restore completed successfully"
    else
        docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
        shred -u "$TEMP_DOWNLOAD" "$TEMP_DECRYPTED" 2>/dev/null
        error "Offsite restore FAILED (exit code $RESTORE_RESULT) — this backup is NOT usable!"
    fi

    # Verify tables
    local TABLE_COUNT
    TABLE_COUNT=$(docker exec "$TEST_CONTAINER" \
        psql -U "$DB_USER" -d neton_verify -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" \
        2>/dev/null | tr -d ' ')

    # Cleanup
    docker rm -f "$TEST_CONTAINER" > /dev/null 2>&1
    shred -u "$TEMP_DOWNLOAD" "$TEMP_DECRYPTED" 2>/dev/null

    if [ "$TABLE_COUNT" -gt 0 ]; then
        ok "Verified: $TABLE_COUNT tables from offsite backup"
    else
        error "Offsite restore produced 0 tables — backup is empty or corrupt!"
    fi

    echo ""
    echo "═══════════════════════════════════════════════"
    echo "   ✅ Offsite Backup Verification PASSED"
    echo ""
    echo "   Source:     s3://$S3_BUCKET/$S3_PREFIX/$LATEST_OFFSITE"
    echo "   Downloaded: $DL_SIZE"
    echo "   Decrypted:  ✓"
    echo "   Restored:   ✓"
    echo "   Tables:     $TABLE_COUNT"
    echo "   Status:     FULLY RESTORABLE ✓"
    echo "═══════════════════════════════════════════════"
    echo ""
}

# ============================================
# Main
# ============================================
case "${1:-backup}" in
    --verify)
        do_verify
        ;;
    --verify-offsite)
        do_verify_offsite
        ;;
    --list)
        do_list
        ;;
    --restore)
        [ -n "${2:-}" ] || error "Usage: ./scripts/backup.sh --restore <backup-file>"
        do_restore "$2"
        ;;
    backup|*)
        do_backup
        ;;
esac
