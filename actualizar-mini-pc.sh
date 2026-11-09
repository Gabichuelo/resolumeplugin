#!/usr/bin/env bash
# Actualizador directo por Internet desde https://github.com/Gabichuelo/resolumeplugin.git
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REPO_URL="https://github.com/Gabichuelo/resolumeplugin.git"

echo "===================================================================="
echo " 🌐 DESCARGANDO ÚLTIMA VERSIÓN DESDE GITHUB ($REPO_URL)..."
echo "===================================================================="

if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y git
fi

if [ ! -d ".git" ]; then
  git init
  git remote add origin "$REPO_URL"
else
  git remote set-url origin "$REPO_URL"
fi

git fetch --all
git reset --hard origin/main
node build-bundle.js 2>/dev/null || true

NODE_BIN="$(command -v node || command -v nodejs || echo /usr/bin/node)"
NODE_REAL="$(readlink -f "$NODE_BIN" 2>/dev/null || echo "$NODE_BIN")"
sudo setcap 'cap_net_bind_service=+ep' "$NODE_REAL" 2>/dev/null || true
sudo hostnamectl set-hostname aether 2>/dev/null || true
sudo systemctl restart avahi-daemon 2>/dev/null || true
if [ -f "$SCRIPT_DIR/quitar-claves.sh" ]; then
  sudo bash "$SCRIPT_DIR/quitar-claves.sh" || true
fi
sudo systemctl restart aether-vj.service

LAN_IP="$(hostname -I | awk '{print $1}')"
echo "===================================================================="
echo " ✅ AETHER-VJ ACTUALIZADO DESDE INTERNET"
echo " 👉 Pulsa F5 (o Ctrl+R) en la ventana de los visuales del Mini-PC."
echo " 📱 Dirección para el móvil / PC:"
echo "    http://$LAN_IP:8080/remote.html"
echo "===================================================================="
