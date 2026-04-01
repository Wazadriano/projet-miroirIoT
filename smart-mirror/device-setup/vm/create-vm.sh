#!/bin/bash
set -euo pipefail

# Smart Mirror - Create QEMU/KVM VM for kiosk testing
# Usage: bash create-vm.sh

VM_NAME="smart-mirror-vm"
VM_DIR="$HOME/.local/share/libvirt/images"
ISO_PATH="$VM_DIR/debian-12-netinst.iso"
DISK_PATH="$VM_DIR/$VM_NAME.qcow2"
PRESEED_PATH="$(cd "$(dirname "$0")" && pwd)/preseed.cfg"
RAM_MB=4096
CPUS=2
DISK_GB=20

echo "=== Smart Mirror VM Creation (QEMU/KVM) ==="
echo ""

# Check prerequisites
if ! command -v virt-install &>/dev/null; then
    echo "ERROR: virt-install not found. Install: sudo pacman -S virt-manager"
    exit 1
fi

if [ ! -f "$ISO_PATH" ]; then
    echo "ERROR: ISO not found at $ISO_PATH"
    echo "Download: wget -O $ISO_PATH https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-12.11.0-amd64-netinst.iso"
    exit 1
fi

# Create disk if not exists
if [ ! -f "$DISK_PATH" ]; then
    echo "[1/3] Creating disk image (${DISK_GB}G)..."
    qemu-img create -f qcow2 "$DISK_PATH" "${DISK_GB}G"
else
    echo "[1/3] Disk already exists: $DISK_PATH"
fi

# Check if VM already exists
if virsh --connect qemu:///session list --all --name 2>/dev/null | grep -q "^${VM_NAME}$"; then
    echo "VM '$VM_NAME' already exists."
    echo "  Start:   virsh --connect qemu:///session start $VM_NAME"
    echo "  Console: virt-viewer --connect qemu:///session $VM_NAME"
    echo "  Delete:  virsh --connect qemu:///session destroy $VM_NAME && virsh --connect qemu:///session undefine $VM_NAME"
    exit 0
fi

echo "[2/3] Creating VM..."
echo "  RAM: ${RAM_MB}MB | CPUs: $CPUS | Disk: ${DISK_GB}G"
echo "  ISO: $ISO_PATH"
echo ""

# Create and boot VM with preseed for automated install
# Use --location with the ISO to allow --initrd-inject and --extra-args
virt-install \
    --connect qemu:///session \
    --name "$VM_NAME" \
    --ram "$RAM_MB" \
    --vcpus "$CPUS" \
    --disk path="$DISK_PATH",format=qcow2 \
    --location "$ISO_PATH" \
    --os-variant debian12 \
    --network user \
    --graphics spice \
    --video virtio \
    --noautoconsole \
    --initrd-inject="$PRESEED_PATH" \
    --extra-args "auto=true priority=critical preseed/file=/preseed.cfg"

echo ""
echo "[3/3] VM created and booting installer."
echo ""
echo "=== Next Steps ==="
echo "  View console:  virt-viewer --connect qemu:///session $VM_NAME"
echo "  SSH (after install): ssh -p 2222 mirror@localhost"
echo "  Stop VM:       virsh --connect qemu:///session shutdown $VM_NAME"
echo "  Start VM:      virsh --connect qemu:///session start $VM_NAME"
echo ""
echo "After Debian install completes and VM reboots:"
echo "  1. SSH in: ssh mirror@<vm-ip>"
echo "  2. Run: sudo bash setup-vm.sh"
echo "  3. Clone repo and launch kiosk"
echo ""
