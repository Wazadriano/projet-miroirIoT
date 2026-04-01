#!/bin/bash
set -euo pipefail

# Smart Mirror - Device Setup Script
# Raspberry Pi OS Lite 64-bit (Debian 12 Bookworm)
# Run as root: sudo bash setup-device.sh

MIRROR_USER="mirror"
APP_DIR="/opt/smart-mirror"
DATA_DIR="/var/smart-mirror"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Smart Mirror Device Setup ==="
echo ""

# Check root
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Run as root (sudo bash setup-device.sh)"
    exit 1
fi

# 1. Create mirror user
echo "[1/8] Creating user '$MIRROR_USER'..."
if ! id "$MIRROR_USER" &>/dev/null; then
    useradd -m -s /bin/bash -G video,audio,input,gpio,i2c "$MIRROR_USER"
    echo "User created."
else
    echo "User already exists."
fi

# 2. Install system dependencies
echo "[2/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq \
    xserver-xorg \
    xinit \
    openbox \
    unclutter \
    network-manager \
    v4l-utils \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libgbm1 \
    libfuse2 \
    curl \
    fonts-inter

# 2b. Install Node.js 20 LTS (required for Electron runtime)
echo "[2b/9] Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    echo "Node.js $(node --version) installed."
else
    echo "Node.js $(node --version) already installed."
fi

# 3. Create directories
echo "[3/8] Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR/photos"
mkdir -p "$DATA_DIR/media"
chown -R "$MIRROR_USER:$MIRROR_USER" "$DATA_DIR"

# 4. Configure auto-login
echo "[4/8] Configuring auto-login..."
mkdir -p /etc/systemd/system/getty@tty1.service.d/
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << 'AUTOLOGIN'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin mirror --noclear %I $TERM
Type=idle
AUTOLOGIN

# 5. Configure X11 auto-start on login
echo "[5/8] Configuring X11 auto-start..."
cat > /home/$MIRROR_USER/.bash_profile << 'BASHPROFILE'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx -- -nocursor
fi
BASHPROFILE
chown "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.bash_profile

# 6. Install Openbox config
echo "[6/8] Installing Openbox config..."
mkdir -p /home/$MIRROR_USER/.config/openbox
cp "$SCRIPT_DIR/../configs/openbox-autostart" /home/$MIRROR_USER/.config/openbox/autostart
cp "$SCRIPT_DIR/../configs/xinitrc" /home/$MIRROR_USER/.xinitrc
chmod +x /home/$MIRROR_USER/.xinitrc
chown -R "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.config
chown "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.xinitrc

# 7. Install systemd service and udev rules
echo "[7/8] Installing systemd service and udev rules..."
cp "$SCRIPT_DIR/../systemd/smart-mirror.service" /etc/systemd/system/
cp "$SCRIPT_DIR/../udev/99-microscope.rules" /etc/udev/rules.d/
systemctl daemon-reload
systemctl enable smart-mirror.service
udevadm control --reload-rules

# 8. SSH hardening
echo "[8/8] Hardening SSH..."
SSH_PORT=2222
sed -i "s/#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i "s/#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config
sed -i "s/#PubkeyAuthentication yes/PubkeyAuthentication yes/" /etc/ssh/sshd_config
systemctl restart sshd

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Copy SmartMirror.AppImage to $APP_DIR/"
echo "  2. chmod +x $APP_DIR/SmartMirror.AppImage"
echo "  3. Reboot: sudo reboot"
echo "  4. SSH access: ssh -p $SSH_PORT mirror@<device-ip>"
echo ""
