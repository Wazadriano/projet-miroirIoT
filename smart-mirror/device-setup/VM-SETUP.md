# Smart Mirror - VM Debian 12 Setup Guide

Guide pour configurer une VM VirtualBox/QEMU qui simule l'environnement kiosk du Raspberry Pi.

## 1. Creation de la VM (VirtualBox)

- **ISO** : Debian 12 netinst (amd64) - https://www.debian.org/download
- **RAM** : 4 Go
- **CPU** : 2 vCPU
- **Disque** : 20 Go (dynamique)
- **Video** : VMSVGA, 128 Mo VRAM, acceleration 3D activee
- **Reseau** : NAT (host accessible via 10.0.2.2) ou Bridged (IP LAN directe). Le microscope etant en WiFi/TCP (`192.168.34.1:8080`, JHCMD), prevoir l'acces reseau au hotspot du microscope plutot qu'un passthrough USB.
- **USB** : controleur USB 3.0 utile pour le retour tactile HID de l'ecran ; **pas requis pour le microscope** (WiFi, pas USB).

### Port Forwarding (mode NAT)

| Protocole | Host Port | Guest Port | Usage |
|-----------|-----------|------------|-------|
| TCP | 2222 | 22 | SSH |

## 2. Installation Debian 12

Installation minimale :
- Pas d'environnement de bureau
- Cocher uniquement : SSH server + system utilities
- Creer un utilisateur temporaire (sera remplace par `mirror`)

## 3. Post-installation

```bash
# Depuis le host, copier le dossier device-setup dans la VM
scp -P 2222 -r device-setup/ user@localhost:~/

# Se connecter en SSH
ssh -p 2222 user@localhost

# Lancer le setup (NAT : host = 10.0.2.2)
sudo bash ~/device-setup/scripts/setup-vm.sh 10.0.2.2

# Ou en bridged (utiliser l'IP LAN du host)
sudo bash ~/device-setup/scripts/setup-vm.sh 192.168.1.X
```

## 4. Lancer l'application

### Option A : Dev mode (recommande)

```bash
su - mirror
git clone <repo-url> /opt/smart-mirror/mirror-app
cd /opt/smart-mirror/mirror-app
npm install

# Demarrer X11 + Openbox
startx

# Dans le terminal Openbox (clic droit > Terminal)
FORCE_KIOSK=1 npm run dev
```

### Option B : AppImage (production-like)

```bash
# Depuis le host, builder l'AppImage
cd smart-mirror/mirror-app
npm run package:x64

# Copier vers la VM
scp -P 2222 dist/SmartMirror-*.AppImage user@localhost:/opt/smart-mirror/SmartMirror.AppImage

# Dans la VM
sudo chmod +x /opt/smart-mirror/SmartMirror.AppImage
sudo systemctl start smart-mirror
```

## 5. Microscope WiFi/TCP (JHCMD)

Le microscope Ninyoon 4K est connecte en **WiFi/TCP** (`192.168.34.1:8080`, handshake protocole JHCMD), pas en USB. Les anciennes references USB/UVC/V4L2 sont des vestiges morts.

1. Connecter la VM (ou le host avec relais reseau vers la VM) au hotspot WiFi du microscope (`192.168.34.1`).
2. Verifier l'atteignabilite du microscope :
   ```bash
   nc -vz 192.168.34.1 8080
   # Doit etablir la connexion TCP
   ```
3. Le proxy (`proxy.js`) etablit le handshake JHCMD, transcode le flux H.264 en MJPEG via ffmpeg et le sert sur `localhost:9100`.
4. L'app detecte automatiquement le microscope via `MicroscopeService`.

## 6. Acces aux services Docker du host

Les services Docker tournent sur le host :

| Service | URL depuis la VM |
|---------|-----------------|
| Mock API (Laravel) | http://10.0.2.2:8000/api |
| Mock IA Proxy | http://10.0.2.2:3001 |
| Adminer (DB) | http://10.0.2.2:8080 |

En mode bridged, remplacer `10.0.2.2` par l'IP LAN du host.

## 7. Troubleshooting

### Electron ne se lance pas (GPU)

Si l'acceleration 3D de VirtualBox pose probleme :
```bash
# Ajouter --disable-gpu au lancement
FORCE_KIOSK=1 npm run dev -- --disable-gpu
```

Le service systemd VM inclut deja `--disable-gpu` par defaut.

### Pas de son

```bash
# VirtualBox : Settings > Audio > Enable Audio
# Choisir le controleur audio ICH AC97 ou Intel HD Audio
```

### Resolution ecran

```bash
# Ajuster la resolution dans VirtualBox : View > Virtual Screen > 1920x1080
# Ou via xrandr dans la VM :
xrandr --output Virtual-1 --mode 1920x1080
```
