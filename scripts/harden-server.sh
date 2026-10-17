#!/bin/bash
# ============================================
# Net-On — Server Hardening Script
# ============================================
# Run this BEFORE deploying any application code.
# Tested on Ubuntu 22.04+ / Debian 12+
#
# Usage:
#   sudo ./scripts/harden-server.sh
# ============================================

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[HARDEN]${NC} $1"; }
ok()    { echo -e "${GREEN}[  OK  ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
error() { echo -e "${RED}[ERROR ]${NC} $1"; exit 1; }

# --- Must run as root ---
[ "$(id -u)" -eq 0 ] || error "This script must be run as root (use sudo)"

echo ""
echo "═══════════════════════════════════════════════"
echo "   🔒 Net-On Server Hardening"
echo "═══════════════════════════════════════════════"
echo ""

# ============================================
# 1. System Updates
# ============================================
log "Step 1/8 — Applying system updates..."

apt update -y && apt upgrade -y
apt install -y \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-listchanges \
    logwatch \
    curl \
    gnupg \
    ca-certificates

ok "System updated and security packages installed"

# ============================================
# 2. Create non-root deploy user
# ============================================
log "Step 2/8 — Creating deploy user..."

DEPLOY_USER="neton"

if id "$DEPLOY_USER" &>/dev/null; then
    warn "User '$DEPLOY_USER' already exists — skipping"
else
    adduser --disabled-password --gecos "Net-On Deploy" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER" 2>/dev/null || true

    # Copy SSH keys from root to deploy user
    if [ -d /root/.ssh ]; then
        mkdir -p /home/$DEPLOY_USER/.ssh
        cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
        chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
        chmod 700 /home/$DEPLOY_USER/.ssh
        chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
    fi

    ok "Deploy user '$DEPLOY_USER' created"
fi

# ============================================
# 3. SSH Hardening
# ============================================
log "Step 3/8 — Hardening SSH..."

SSHD_CONFIG="/etc/ssh/sshd_config"
SSHD_BACKUP="/etc/ssh/sshd_config.bak.$(date +%Y%m%d)"

# Backup original
cp "$SSHD_CONFIG" "$SSHD_BACKUP"

# Apply hardened settings
cat > /etc/ssh/sshd_config.d/neton-hardened.conf <<'EOF'
# ============================================
# Net-On — SSH Hardening
# ============================================

# Disable root login (use deploy user + sudo)
PermitRootLogin no

# Disable password authentication (SSH keys only)
PasswordAuthentication no

# Disable empty passwords
PermitEmptyPasswords no

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 3

# Timeout idle sessions (5 minutes)
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable X11 forwarding
X11Forwarding no

# Disable TCP forwarding (unless you need SSH tunnels)
AllowTcpForwarding no

# Only allow the deploy user
AllowUsers neton

# Use strong key exchange algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Log level
LogLevel VERBOSE
EOF

# Validate config before restarting
sshd -t || { error "SSH config validation failed — check /etc/ssh/sshd_config.d/neton-hardened.conf"; }

warn "SSH hardened — root login disabled, password auth disabled"
warn "IMPORTANT: Make sure you can SSH in as '$DEPLOY_USER' with a key BEFORE disconnecting!"
ok "SSH hardening applied (restart will happen at the end)"

# ============================================
# 4. Firewall (UFW)
# ============================================
log "Step 4/8 — Configuring firewall..."

ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp comment "SSH"

# HTTP/HTTPS (Nginx)
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

# Enable firewall
ufw --force enable

ok "Firewall configured: SSH(22), HTTP(80), HTTPS(443) allowed"
log "Firewall rules:"
ufw status verbose

# ============================================
# 5. Fail2Ban (brute-force protection)
# ============================================
log "Step 5/8 — Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local <<'EOF'
# ============================================
# Net-On — Fail2Ban Configuration
# ============================================
# Aggressive settings for a billing/payment system.

[DEFAULT]
# Default: ban 12 hours after 5 failures in 10 minutes
bantime  = 43200
findtime = 600
maxretry = 5
banaction = ufw

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 86400
# 3 failed SSH attempts → 24-hour ban

# Permanent ban on repeat offenders (3+ bans)
[recidive]
enabled  = true
logpath  = /var/log/fail2ban.log
bantime  = -1
findtime = 604800
maxretry = 3
# 3 bans within 7 days → permanent ban

# Ban repeated Nginx 401/403 (API brute force)
[nginx-http-auth]
enabled  = true
port     = http,https
filter   = nginx-http-auth
logpath  = /var/log/nginx/error.log
maxretry = 5
bantime  = 43200
# 5 failed auth attempts → 12-hour ban

# Ban bots scanning for vulnerabilities
[nginx-botsearch]
enabled  = true
port     = http,https
filter   = nginx-botsearch
logpath  = /var/log/nginx/access.log
maxretry = 2
bantime  = 86400
# 2 vulnerability scan attempts → 24-hour ban
EOF

systemctl enable fail2ban
systemctl restart fail2ban

ok "Fail2Ban configured — SSH(3 attempts/24hr), recidive(3 bans/permanent), Nginx(5 attempts/12hr)"

# ============================================
# 6. Automatic Security Updates
# ============================================
log "Step 6/8 — Enabling automatic security updates..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Auto-remove unused dependencies
Unattended-Upgrade::Remove-Unused-Dependencies "true";

// Reboot automatically at 4 AM if required by security update
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";

// Log
Unattended-Upgrade::SyslogEnable "true";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

ok "Automatic security updates enabled (reboot at 4 AM if needed)"

# ============================================
# 7. Kernel & System Hardening
# ============================================
log "Step 7/8 — Applying kernel hardening..."

cat > /etc/sysctl.d/99-neton-hardening.conf <<'EOF'
# ============================================
# Net-On — Kernel Hardening
# ============================================

# Prevent IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable ICMP redirect acceptance
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Disable IPv6 if not needed (uncomment if applicable)
# net.ipv6.conf.all.disable_ipv6 = 1
# net.ipv6.conf.default.disable_ipv6 = 1
EOF

sysctl --system > /dev/null 2>&1

ok "Kernel hardening applied"

# ============================================
# 8. File Permissions & Misc
# ============================================
log "Step 8/8 — Setting file permissions..."

# Restrict cron to root and deploy user
echo "root" > /etc/cron.allow
echo "$DEPLOY_USER" >> /etc/cron.allow

# Secure shared memory (prevent /dev/shm exploits)
if ! grep -q "/run/shm" /etc/fstab; then
    echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab
fi

# Set restrictive umask
if ! grep -q "umask 027" /etc/profile; then
    echo "umask 027" >> /etc/profile
fi

ok "File permissions hardened"

# ============================================
# 9. Backup Encryption Key (separate from .env)
# ============================================
log "Step 9 — Setting up backup encryption key..."

KEYFILE="/etc/neton/backup.key"
mkdir -p /etc/neton

if [ -f "$KEYFILE" ]; then
    warn "Backup key already exists at $KEYFILE — skipping"
else
    # Generate a strong random key
    BACKUP_KEY=$(openssl rand -base64 48)
    echo "$BACKUP_KEY" > "$KEYFILE"
    chmod 600 "$KEYFILE"
    chown root:root "$KEYFILE"

    ok "Backup encryption key created at $KEYFILE (root-only)"
    warn "SAVE THIS KEY SOMEWHERE SAFE (password manager, offline):"
    warn "  $BACKUP_KEY"
    warn "If you lose this key AND the server, encrypted backups are unrecoverable."
fi

# ============================================
# Apply SSH changes
# ============================================
log "Restarting SSH with hardened config..."
systemctl restart sshd

# ============================================
# Summary
# ============================================
echo ""
echo "═══════════════════════════════════════════════"
echo "   ✅ Server Hardening Complete"
echo "═══════════════════════════════════════════════"
echo ""
echo "   What was done:"
echo "   ✔ System updated + security packages"
echo "   ✔ Deploy user 'neton' created"
echo "   ✔ SSH: root login disabled, keys only"
echo "   ✔ Firewall: only 22, 80, 443 open"
echo "   ✔ Fail2Ban: SSH(24hr), recidive(permanent)"
echo "   ✔ Auto security updates enabled"
echo "   ✔ Kernel hardening applied"
echo "   ✔ File permissions restricted"
echo "   ✔ Backup encryption key at /etc/neton/backup.key"
echo ""
echo "   ⚠️  CRITICAL — verify before disconnecting:"
echo ""
echo "   1. Open a NEW terminal (don't close this one)"
echo "   2. Run: ssh neton@<your-server-ip>"
echo "   3. Confirm you can log in"
echo "   4. Confirm: sudo whoami  →  root"
echo ""
echo "   If you get locked out, this terminal is still"
echo "   connected and you can revert SSH config."
echo ""
echo "   🔑 LOCKOUT RECOVERY (if Fail2Ban bans you):"
echo ""
echo "   The recidive jail permanently bans IPs after"
echo "   3 strikes in 7 days. If you lock yourself out:"
echo ""
echo "   1. Use your VPS provider's web console/VNC"
echo "      (DigitalOcean, Vultr, Hetzner all offer this)"
echo "   2. Run: sudo fail2ban-client set sshd unbanip <your-ip>"
echo "   3. Run: sudo fail2ban-client set recidive unbanip <your-ip>"
echo ""
echo "   SAVE your VPS provider's console access URL now."
echo "   You cannot SSH in to unban yourself."
echo ""
echo "═══════════════════════════════════════════════"
echo ""

