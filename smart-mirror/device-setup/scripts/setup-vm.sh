#!/bin/bash
set -euo pipefail

# Smart Mirror - VM Dev Setup Script
# Debian 12 (Bookworm) on VirtualBox/QEMU
# Adapted from setup-device.sh for development/testing
# Run as root: sudo bash setup-vm.sh [HOST_IP]

HOST_IP="${1:-10.0.2.2}"  # VirtualBox NAT default gateway to host
MIRROR_USER="mirror"
APP_DIR="/opt/smart-mirror"
DATA_DIR="/var/smart-mirror"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Smart Mirror VM Setup (Debian 12) ==="
echo "Host IP: $HOST_IP"
echo ""

# Check root
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Run as root (sudo bash setup-vm.sh [HOST_IP])"
    exit 1
fi

# 1. Create mirror user (no GPIO/i2c groups -- VM has no hardware GPIO)
echo "[1/7] Creating user '$MIRROR_USER'..."
if ! id "$MIRROR_USER" &>/dev/null; then
    useradd -m -s /bin/bash -G video,audio,input "$MIRROR_USER"
    echo "User created."
else
    echo "User already exists."
fi

# 2. Install system dependencies
echo "[2/7] Installing system packages..."
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
    git \
    fonts-inter

# 2b. VirtualBox Guest Additions (skip if QEMU/KVM)
if lspci 2>/dev/null | grep -qi "virtualbox"; then
    echo "[2b/7] Installing VirtualBox Guest Additions..."
    apt-get install -y -qq virtualbox-guest-x11 virtualbox-guest-utils
elif lspci 2>/dev/null | grep -qi "virtio\|qemu\|redhat"; then
    echo "[2b/7] Installing QEMU/KVM guest tools..."
    apt-get install -y -qq spice-vdagent qemu-guest-agent
fi

# 2c. Install Node.js 20 LTS
echo "[2c/7] Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    echo "Node.js $(node --version) installed."
else
    echo "Node.js $(node --version) already installed."
fi

# 3. Create directories
echo "[3/7] Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR/photos"
mkdir -p "$DATA_DIR/media"
chown -R "$MIRROR_USER:$MIRROR_USER" "$DATA_DIR"

# 4. Install Openbox config (kiosk environment)
echo "[4/7] Installing Openbox config..."
mkdir -p /home/$MIRROR_USER/.config/openbox
cp "$SCRIPT_DIR/../configs/openbox-autostart" /home/$MIRROR_USER/.config/openbox/autostart
cp "$SCRIPT_DIR/../configs/xinitrc" /home/$MIRROR_USER/.xinitrc
chmod +x /home/$MIRROR_USER/.xinitrc
chown -R "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.config
chown "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.xinitrc

# 5. Install systemd service (VM variant)
echo "[5/7] Installing systemd service..."
sed "s|__HOST_IP__|$HOST_IP|g" "$SCRIPT_DIR/../systemd/smart-mirror-vm.service" \
    > /etc/systemd/system/smart-mirror.service
systemctl daemon-reload
systemctl enable smart-mirror.service

# 6. Install udev rules for microscope USB passthrough
echo "[6/7] Installing udev rules..."
cp "$SCRIPT_DIR/../udev/99-microscope.rules" /etc/udev/rules.d/
udevadm control --reload-rules

# 7. Create helper script to launch in dev mode
echo "[7/7] Creating dev launcher..."
cat > "$APP_DIR/run-dev.sh" << 'DEVLAUNCHER'
#!/bin/bash
# Launch Smart Mirror in dev mode with kiosk
cd /opt/smart-mirror/mirror-app
export FORCE_KIOSK=1
npm run dev
DEVLAUNCHER
chmod +x "$APP_DIR/run-dev.sh"
chown "$MIRROR_USER:$MIRROR_USER" "$APP_DIR/run-dev.sh"

echo ""
echo "=== VM Setup complete ==="
echo ""
echo "Host API URL: http://$HOST_IP:8000/api"
echo "Host IA URL:  http://$HOST_IP:3001"
echo ""
echo "Next steps:"
echo "  Option A (dev mode - recommended):"
echo "    1. su - mirror"
echo "    2. git clone <repo> $APP_DIR/mirror-app"
echo "    3. cd $APP_DIR/mirror-app && npm install"
echo "    4. startx  (starts Openbox session)"
echo "    5. FORCE_KIOSK=1 npm run dev"
echo ""
echo "  Option B (AppImage - production-like):"
echo "    1. Copy SmartMirror.AppImage to $APP_DIR/"
echo "    2. chmod +x $APP_DIR/SmartMirror.AppImage"
echo "    3. sudo systemctl start smart-mirror"
echo ""
echo "  Microscope USB passthrough:"
echo "    VirtualBox: Devices > USB > Select Ninyoon 4K"
echo "    Verify: v4l2-ctl --list-devices"
echo ""
