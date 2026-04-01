#!/bin/bash
set -euo pipefail

# Smart Mirror - Virtual Keyboard Setup
# Installs Onboard (virtual keyboard for touchscreen)
# Active on: Search client + New client screens
# Run as root: sudo bash setup-keyboard.sh

MIRROR_USER="mirror"

echo "=== Smart Mirror Virtual Keyboard Setup ==="

if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Run as root (sudo bash setup-keyboard.sh)"
    exit 1
fi

# 1. Install Onboard
echo "[1/3] Installing Onboard..."
apt-get update -qq
apt-get install -y -qq onboard

# 2. Configure Onboard for kiosk mode
echo "[2/3] Configuring Onboard..."
mkdir -p /home/$MIRROR_USER/.config/onboard

cat > /home/$MIRROR_USER/.config/onboard/onboard-defaults.conf << 'CONF'
[main]
layout=Compact
theme=Nightshade
show-status-icon=False
start-minimized=True
auto-show=True
auto-hide=True

[auto-show]
enabled=True
widget-detect=True

[window]
docking-enabled=True
docking-edge=bottom
force-to-top=True
CONF

chown -R "$MIRROR_USER:$MIRROR_USER" /home/$MIRROR_USER/.config/onboard

# 3. Add Onboard to autostart
echo "[3/3] Adding Onboard to autostart..."
AUTOSTART_FILE="/home/$MIRROR_USER/.config/openbox/autostart"
if ! grep -q "onboard" "$AUTOSTART_FILE" 2>/dev/null; then
    echo "" >> "$AUTOSTART_FILE"
    echo "# Virtual keyboard for touchscreen input" >> "$AUTOSTART_FILE"
    echo "onboard --not-show-in=GNOME --layout=Compact --theme=Nightshade &" >> "$AUTOSTART_FILE"
fi

echo ""
echo "=== Virtual keyboard setup complete ==="
echo "Onboard will auto-show when text inputs are focused."
echo "Active on Search and New Client screens."
echo "Reboot to apply: sudo reboot"
