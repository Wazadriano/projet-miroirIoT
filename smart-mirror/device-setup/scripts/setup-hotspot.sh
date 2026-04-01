#!/bin/bash
set -euo pipefail

# Smart Mirror - WiFi Hotspot Setup (provisioning mode)
# Creates a hotspot for first-boot configuration

DEVICE_ID="${1:-0000}"
SUFFIX="${DEVICE_ID: -4}"
SSID="SmartMirror-Setup-${SUFFIX^^}"
PASSWORD="smartmirror"
CON_NAME="smart-mirror-setup"

echo "=== Smart Mirror Hotspot Setup ==="
echo "SSID: $SSID"

# Check if NetworkManager is running
if ! systemctl is-active --quiet NetworkManager; then
    echo "ERROR: NetworkManager is not running"
    exit 1
fi

# Remove existing hotspot connection if any
nmcli connection delete "$CON_NAME" 2>/dev/null || true

# Create hotspot
nmcli device wifi hotspot \
    con-name "$CON_NAME" \
    ssid "$SSID" \
    band bg \
    channel 6 \
    password "$PASSWORD"

echo "Hotspot active: $SSID"
echo "IP: 192.168.4.1"
echo "Password: $PASSWORD"
echo ""
echo "To stop: nmcli connection down $CON_NAME"
