#!/usr/bin/env bash
# ==============================================================================
# INSTALADOR COMPLETO 1-CLIC PARA CUALQUIER MINI-PC NUEVO CON UBUNTU:
# Instala de golpe:
#   1) AETHER-VJ (Visuales Kiosco + Mando Móvil puerto 8080/80)
#   2) GrandDas DMX512 Studio + Hahan SL04 4-XLR (Luces puerto 5175/3031/3000)
#   3) Quita todas las contraseñas (Auto-login Ubuntu + Chrome Keyring + Sudoers)
#
# Uso en un Mini-PC con Xubuntu/Ubuntu recién instalado (wget ya viene instalado de serie):
#   wget -qO- https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | sudo bash
# ==============================================================================

set -e
export DEBIAN_FRONTEND=noninteractive

if [ "$EUID" -ne 0 ]; then
  exec sudo DEBIAN_FRONTEND=noninteractive bash "$0" "$@"
fi

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

timedatectl set-ntp true 2>/dev/null || true

wait_for_internet() {
  for i in $(seq 1 30); do
    if getent hosts github.com >/dev/null 2>&1 || ping -c 1 -W 1 8.8.8.8 >/dev/null 2>&1; then
      return 0
    fi
    echo "⏳ Esperando a que vuelva la conexión de red ($i/30)..."
    sleep 2
  done
}

wait_for_internet
apt-get -o DPkg::Lock::Timeout=120 update -y
# IMPORTANTE: --no-upgrade evita que apt reinicie NetworkManager y corte Internet a mitad de instalación
apt-get -o DPkg::Lock::Timeout=120 install -y --no-upgrade ca-certificates git curl wget nodejs unclutter xdotool rsync parted gdisk dosfstools e2fsprogs x11-xserver-utils avahi-daemon libnss-mdns libcap2-bin dnsmasq-base

# 1. Activar sudo sin clave antes de lanzar sub-scripts
mkdir -p /etc/sudoers.d
echo "$REAL_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/90-aether-nopasswd
chmod 0440 /etc/sudoers.d/90-aether-nopasswd

# 2. Descargar AETHER-VJ (rama main, con espera de red y reintento automático)
wait_for_internet
if [ ! -d "$AETHER_DIR/.git" ]; then
  rm -rf "$AETHER_DIR"
  for attempt in 1 2 3; do
    if sudo -u "$REAL_USER" git clone -4 -b main "$REPO_URL" "$AETHER_DIR" || sudo -u "$REAL_USER" git clone -b main "$REPO_URL" "$AETHER_DIR"; then
      break
    fi
    echo "⚠️ Reintentando descarga de AETHER-VJ ($attempt/3)..."
    sleep 4
    wait_for_internet
  done
else
  cd "$AETHER_DIR"
  git -c safe.directory="*" fetch -4 origin main || git -c safe.directory="*" fetch origin main
  git -c safe.directory="*" reset --hard origin/main
fi
chown -R "$REAL_USER:$REAL_USER" "$AETHER_DIR"

# 3. Ejecutar instalador de AETHER-VJ (dejando quitar-claves para el final del todo para no tocar la red aún)
cd "$AETHER_DIR"
sudo -u "$REAL_USER" SKIP_QUITAR_CLAVES=1 bash "$AETHER_DIR/setup-linux-pi-kiosk.sh" --no-hotspot

# 4. Instalar GrandDas DMX512 + Hahan SL04 unificado en /opt/planecreator
wait_for_internet
bash "$AETHER_DIR/instalar-luces-sl04.sh"

# 4.5. Instalar driver USB Wi-Fi AIC8800DC + Python OpenCV (para auto-limpiar logos y Hotspot)
if [ -f "$AETHER_DIR/instalar-wifi-aic8800.sh" ]; then
  wait_for_internet
  bash "$AETHER_DIR/instalar-wifi-aic8800.sh" || echo "⚠️ Aviso: driver Wi-Fi AIC8800 pendiente de revisión/MOK."
fi

# 5. Quitar todas las contraseñas y preparar UEFI/Red para clonación (al final, cuando ya se descargó todo)
bash "$AETHER_DIR/quitar-claves.sh"

echo "===================================================================="
echo "  ✅ ¡MINI-PC COMPLETO INSTALADO Y LISTO!"
echo "===================================================================="
