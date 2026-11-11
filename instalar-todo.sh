#!/usr/bin/env bash
# ==============================================================================
# INSTALADOR COMPLETO 1-CLIC PARA CUALQUIER MINI-PC NUEVO CON UBUNTU:
# Instala de golpe:
#   1) AETHER-VJ (Visuales Kiosco + Mando Móvil puerto 8080/80)
#   2) GrandDas DMX512 Studio + Hahan SL04 4-XLR (Luces puerto 5175/3031/3000)
#   3) Quita todas las contraseñas (Auto-login Ubuntu + Chrome Keyring + Sudoers)
#
# Uso en un Mini-PC con Ubuntu recién instalado:
#   curl -fsSL https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | sudo bash
# ==============================================================================

set -e

REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [ -z "$REAL_USER" ] || [ "$REAL_USER" = "root" ]; then
  REAL_USER="$(ls -1 /home 2>/dev/null | head -n 1)"
fi
REAL_USER="${REAL_USER:-root}"
USER_HOME="$(eval echo "~$REAL_USER")"

AETHER_DIR="$USER_HOME/resolumeplugin"
REPO_URL="https://github.com/Gabichuelo/resolumeplugin.git"

echo "===================================================================="
echo "  🚀 INSTALANDO SISTEMA COMPLETO (AETHER-VJ + GRANDDAS SL04 + SIN CLAVES)"
echo "  👤 Usuario: $REAL_USER ($USER_HOME)"
echo "===================================================================="

apt-get update -y
apt-get install -y git curl wget nodejs network-manager unclutter xdotool rsync parted gdisk dosfstools e2fsprogs x11-xserver-utils avahi-daemon libnss-mdns libcap2-bin dnsmasq-base

# 1.Activar sudo sin clave antes de lanzar sub-scripts
mkdir -p /etc/sudoers.d
echo "$REAL_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/90-aether-nopasswd
chmod 0440 /etc/sudoers.d/90-aether-nopasswd

# 2. Descargar AETHER-VJ (rama main)
if [ ! -d "$AETHER_DIR/.git" ]; then
  rm -rf "$AETHER_DIR"
  sudo -u "$REAL_USER" git clone -b main "$REPO_URL" "$AETHER_DIR"
else
  cd "$AETHER_DIR"
  git -c safe.directory="*" fetch origin main
  git -c safe.directory="*" reset --hard origin/main
fi
chown -R "$REAL_USER:$REAL_USER" "$AETHER_DIR"

# 3. Ejecutar instalador de AETHER-VJ
cd "$AETHER_DIR"
sudo -u "$REAL_USER" bash "$AETHER_DIR/setup-linux-pi-kiosk.sh" --no-hotspot

# 4. Instalar GrandDas DMX512 + Hahan SL04 unificado en /opt/planecreator
bash "$AETHER_DIR/instalar-luces-sl04.sh"

# 5. Quitar todas las contraseñas y preparar UEFI/Red para clonación
bash "$AETHER_DIR/quitar-claves.sh"

echo "===================================================================="
echo "  ✅ ¡MINI-PC COMPLETO INSTALADO Y LISTO!"
echo "===================================================================="
