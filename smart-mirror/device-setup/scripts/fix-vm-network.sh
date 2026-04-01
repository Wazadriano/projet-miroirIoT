#!/bin/bash
# Fix VM network: ensure DOCKER-USER chain allows virbr0 traffic
# Run on the HOST after Docker restart
# Usage: sudo bash fix-vm-network.sh

set -euo pipefail

echo "[network] Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 > /dev/null

echo "[network] Adding DOCKER-USER rules for virbr0 (192.168.122.0/24)..."
iptables -C DOCKER-USER -s 192.168.122.0/24 -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 192.168.122.0/24 -j ACCEPT
iptables -C DOCKER-USER -d 192.168.122.0/24 -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -d 192.168.122.0/24 -j ACCEPT

echo "[network] Adding NAT masquerade for VM internet access..."
iptables -t nat -C POSTROUTING -s 192.168.122.0/24 -j MASQUERADE 2>/dev/null || \
    iptables -t nat -A POSTROUTING -s 192.168.122.0/24 -j MASQUERADE

echo "[network] Done. VM can reach host services and internet."
