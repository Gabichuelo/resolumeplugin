#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ: Instalador automático del adaptador USB Wi-Fi AIC8800DC (a69c:5721 -> a69c:88dc)
# + paquetes OpenCV para limpieza automática de logos en el Mini-PC.
#
# Uso:
#   sudo bash instalar-wifi-aic8800.sh [SSID_OPCIONAL] [PASS_OPCIONAL]
# ==============================================================================

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

CUSTOM_SSID="${1:-}"
CUSTOM_PASS="${2:-}"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
info()  { echo "[AETHER-WIFI] $*"; }
warn()  { echo "[AETHER-WIFI] ⚠️ $*" >&2; }

echo "===================================================================="
echo "  📡 INSTALANDO DRIVER USB WI-FI (AIC8800DC) + OPENCV LOGOS"
echo "===================================================================="

KVER="$(uname -r)"
info "Kernel detectado: $KVER"

# 1. Dependencias de compilación DKMS + expulsión modo disco + OpenCV
$SUDO apt-get -o DPkg::Lock::Timeout=120 update -y
if ! $SUDO apt-get -o DPkg::Lock::Timeout=120 install -y --no-upgrade \
  dkms build-essential git eject iw sg3-utils usb-modeswitch mokutil openssl \
  python3-pil python3-numpy python3-opencv "linux-headers-$KVER"; then
  $SUDO apt-get -o DPkg::Lock::Timeout=120 install -y --no-upgrade \
    dkms build-essential git eject iw sg3-utils usb-modeswitch mokutil openssl \
    python3-pil python3-numpy python3-opencv linux-headers-generic
fi

# 2. Compilar e instalar DKMS AIC8800DC si no está instalado para este kernel
if ! dkms status -m aic8800dc 2>/dev/null | grep -q "${KVER}.*installed"; then
  DRV_TMP="/tmp/aic8800-drv"
  rm -rf "$DRV_TMP"
  info "Descargando driver AIC8800DC compatible con kernel 6.x / 7.x..."
  git clone --depth=1 https://github.com/Kiborgik/aic8800dc-linux-patched.git "$DRV_TMP"

  PKG_NAME="$(sed -n 's/^PACKAGE_NAME="\?\([^"]*\)"\?/\1/p' "$DRV_TMP/dkms.conf" | head -n 1)"
  PKG_VER="$(sed -n 's/^PACKAGE_VERSION="\?\([^"]*\)"\?/\1/p' "$DRV_TMP/dkms.conf" | head -n 1)"
  PKG_NAME="${PKG_NAME:-aic8800dc}"
  PKG_VER="${PKG_VER:-6.4.3.0-patched.21}"
  SRC_DIR="/usr/src/${PKG_NAME}-${PKG_VER}"

  info "Instalando firmware y regla udev (cambio automático de USB disco -> Wi-Fi)..."
  $SUDO mkdir -p /lib/firmware
  $SUDO cp -rf "$DRV_TMP/fw/aic8800DC" /lib/firmware/
  $SUDO cp -f "$DRV_TMP/tools/aic.rules" /etc/udev/rules.d/
  $SUDO udevadm control --reload || true
  $SUDO udevadm trigger || true
  $SUDO udevadm settle || true

  for dev in /dev/aicudisk* /dev/disk/by-id/usb-AIC_flash*; do
    [ -e "$dev" ] || continue
    $SUDO eject "$dev" 2>/dev/null || true
  done

  # Generar clave MOK no interactiva si Secure Boot está activo (evita bloqueo debconf)
  if command -v mokutil >/dev/null 2>&1 && mokutil --sb-state 2>/dev/null | grep -qi enabled; then
    MOK_DIR="/var/lib/shim-signed/mok"
    if [ ! -f "$MOK_DIR/MOK.priv" ] || [ ! -f "$MOK_DIR/MOK.der" ]; then
      info "Generando clave MOK local para firmar el driver bajo UEFI Secure Boot..."
      $SUDO mkdir -p "$MOK_DIR"
      $SUDO chmod 0700 "$MOK_DIR"
      $SUDO openssl req -new -x509 -newkey rsa:2048 \
        -keyout "$MOK_DIR/MOK.priv" -outform DER -out "$MOK_DIR/MOK.der" \
        -nodes -days 36500 -subj "/CN=$(hostname) Secure Boot Module Signature key/" >/dev/null 2>&1
      $SUDO chmod 0600 "$MOK_DIR/MOK.priv"
    fi
  fi

  info "Preparando árbol DKMS ${PKG_NAME}/${PKG_VER}..."
  old_vers="$(dkms status -m "$PKG_NAME" 2>/dev/null | sed -n -e "s@^${PKG_NAME}/\([^,:]*\)[,:].*@\1@p" -e "s@^${PKG_NAME}, \([^,:]*\)[,:].*@\1@p" | sort -u || true)"
  for ov in $old_vers; do
    $SUDO dkms remove -m "$PKG_NAME" -v "$ov" --all >/dev/null 2>&1 || true
  done
  $SUDO rm -rf /usr/src/"${PKG_NAME}"-*
  $SUDO mkdir -p "$SRC_DIR"
  $SUDO cp -rp "$DRV_TMP/." "$SRC_DIR/"

  info "Compilando módulos aic_load_fw y aic8800_fdrv (puede tardar ~1 minuto)..."
  $SUDO dkms add -m "$PKG_NAME" -v "$PKG_VER"
  $SUDO dkms build -m "$PKG_NAME" -v "$PKG_VER"
  $SUDO dkms install -m "$PKG_NAME" -v "$PKG_VER"
  rm -rf "$DRV_TMP"
else
  info "Driver DKMS aic8800dc ya instalado para el kernel $KVER."
fi

# 3. Asegurar autocarga en arranque
$SUDO tee /etc/modules-load.d/aic8800.conf >/dev/null <<'EOF'
aic_load_fw
aic8800_fdrv
EOF

# 4. Pasar USB de disco virtual -> Wi-Fi si sigue en a69c:5721 y cargar módulos
for dev in /dev/aicudisk* /dev/disk/by-id/usb-AIC_flash*; do
  [ -e "$dev" ] || continue
  $SUDO eject "$dev" 2>/dev/null || true
done
sleep 2

if $SUDO modprobe aic_load_fw 2>/dev/null && $SUDO modprobe aic8800_fdrv 2>/dev/null; then
  sleep 3
  if nmcli -t -f DEVICE,TYPE device 2>/dev/null | grep -q ':wifi$'; then
    info "✅ Adaptador Wi-Fi activo en NetworkManager. Encendiendo Hotspot..."
    if [ -n "$CUSTOM_SSID" ] && [ -n "$CUSTOM_PASS" ]; then
      $SUDO bash "$SCRIPT_DIR/setup-hotspot-linux.sh" --no-restart "$CUSTOM_SSID" "$CUSTOM_PASS"
    elif [ -n "$CUSTOM_SSID" ]; then
      $SUDO bash "$SCRIPT_DIR/setup-hotspot-linux.sh" --no-restart "$CUSTOM_SSID"
    else
      $SUDO bash "$SCRIPT_DIR/setup-hotspot-linux.sh" --no-restart
    fi
  else
    echo "✅ Driver AIC8800DC instalado y cargado. Enchufa la antena USB Wi-Fi y pulsa Activar Wi-Fi Propio."
  fi
else
  if command -v mokutil >/dev/null 2>&1 && mokutil --sb-state 2>/dev/null | grep -qi enabled && [ -f /var/lib/shim-signed/mok/MOK.der ]; then
    if ! $SUDO mokutil --test-key /var/lib/shim-signed/mok/MOK.der 2>&1 | grep -qiE 'already enrolled|already in the enrollment request'; then
      printf '12345678\n12345678\n' | $SUDO mokutil --import /var/lib/shim-signed/mok/MOK.der >/dev/null 2>&1 || true
    fi
    echo "===================================================================="
    echo "  🔐 DRIVER COMPILADO — SOLO FALTA AUTORIZAR SECURE BOOT UNA VEZ"
    echo "--------------------------------------------------------------------"
    echo "  1) Reinicia el Mini-PC"
    echo "  2) En la pantalla azul pulsa: Enroll MOK -> Continue -> Yes"
    echo "  3) Clave:  12345678   (luego Reboot)"
    echo "  4) Al volver, pulsa 'Activar Wi-Fi Propio'"
    echo "===================================================================="
  else
    warn "Driver instalado, pero no se pudo cargar aic8800_fdrv ahora (prueba a reiniciar o revisar dmesg)."
  fi
fi
