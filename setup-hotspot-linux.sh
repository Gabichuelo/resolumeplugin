#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ: Punto Wi-Fi propio (Hotspot) + nombre fácil http://aether.local
# Para Ubuntu / Debian / Raspberry Pi OS con NetworkManager.
#
# Uso:
#   ./setup-hotspot-linux.sh                     # crea/actualiza y enciende el hotspot
#   ./setup-hotspot-linux.sh MI-RED miclave123   # SSID y contraseña por argumentos
#   SSID=MI-RED PASS=miclave123 IFACE=wlan0 ./setup-hotspot-linux.sh
#   ./setup-hotspot-linux.sh --status            # muestra el estado
#   ./setup-hotspot-linux.sh --off               # apaga y borra el hotspot
#
# Es idempotente: se puede ejecutar tantas veces como se quiera.
# ==============================================================================

set -euo pipefail

CON_NAME="AETHER-HOTSPOT"
HOTSPOT_IP="10.42.0.1"
NEW_HOSTNAME="aether"
DNSMASQ_DIR="/etc/NetworkManager/dnsmasq-shared.d"
DNSMASQ_FILE="$DNSMASQ_DIR/aether.conf"

ACTION="up"
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --off|off|--down) ACTION="off" ;;
    --status|status) ACTION="status" ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done

SSID="${POSITIONAL[0]:-${SSID:-AETHER-VJ}}"
PASS="${POSITIONAL[1]:-${PASS:-aethervj2026}}"
IFACE="${IFACE:-}"

# Ejecutar comandos de administrador (con o sin sudo según quién lance el script)
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

info()  { echo "[AETHER-VJ] $*"; }
fatal() { echo "[AETHER-VJ] ❌ $*" >&2; exit 1; }

require_nmcli() {
  if ! command -v nmcli >/dev/null 2>&1; then
    info "NetworkManager no está instalado. Instalándolo..."
    $SUDO apt-get update -y
    $SUDO apt-get install -y network-manager
    $SUDO systemctl enable --now NetworkManager || true
  fi
  command -v nmcli >/dev/null 2>&1 || fatal "No se encontró nmcli (NetworkManager). Instálalo y vuelve a intentarlo."
}

detect_iface() {
  if [ -z "$IFACE" ]; then
    IFACE="$(nmcli -t -f DEVICE,TYPE device 2>/dev/null | awk -F: '$2=="wifi"{print $1; exit}' || true)"
  fi
  [ -n "$IFACE" ] || fatal "No se encontró ninguna tarjeta Wi-Fi. Conecta un adaptador Wi-Fi o indica IFACE=wlan0."
}

con_exists() {
  nmcli -t -f NAME connection show 2>/dev/null | grep -Fxq "$CON_NAME"
}

# ------------------------------------------------------------------------------
# --status
# ------------------------------------------------------------------------------
if [ "$ACTION" = "status" ]; then
  require_nmcli
  echo "===================================================================="
  echo "  ESTADO DEL HOTSPOT AETHER-VJ"
  echo "===================================================================="
  echo "  Nombre del equipo: $(hostname)"
  if con_exists; then
    ACTIVE="no"
    if nmcli -t -f NAME connection show --active 2>/dev/null | grep -Fxq "$CON_NAME"; then ACTIVE="sí"; fi
    CUR_SSID="$(nmcli -g 802-11-wireless.ssid connection show "$CON_NAME" 2>/dev/null || true)"
    CUR_IFACE="$(nmcli -g connection.interface-name connection show "$CON_NAME" 2>/dev/null || true)"
    echo "  Conexión '$CON_NAME': creada (activa: $ACTIVE)"
    echo "  Red Wi-Fi (SSID):  $CUR_SSID"
    echo "  Tarjeta:           ${CUR_IFACE:-auto}"
    echo "  IP del hotspot:    $HOTSPOT_IP"
  else
    echo "  Conexión '$CON_NAME': no existe (ejecuta este script sin parámetros para crearla)"
  fi
  if [ -f "$DNSMASQ_FILE" ]; then
    echo "  DNS aether.local:  configurado ($DNSMASQ_FILE)"
  else
    echo "  DNS aether.local:  no configurado"
  fi
  if systemctl is-active --quiet avahi-daemon 2>/dev/null; then
    echo "  Avahi (mDNS):      activo"
  else
    echo "  Avahi (mDNS):      inactivo"
  fi
  echo "===================================================================="
  exit 0
fi

# ------------------------------------------------------------------------------
# --off
# ------------------------------------------------------------------------------
if [ "$ACTION" = "off" ]; then
  require_nmcli
  if con_exists; then
    $SUDO nmcli connection down "$CON_NAME" >/dev/null 2>&1 || true
    $SUDO nmcli connection delete "$CON_NAME" >/dev/null 2>&1 || true
    info "✅ Hotspot '$CON_NAME' apagado y eliminado."
  else
    info "El hotspot '$CON_NAME' no existía. Nada que hacer."
  fi
  if [ -f "$DNSMASQ_FILE" ]; then
    $SUDO rm -f "$DNSMASQ_FILE"
    info "Eliminada la redirección DNS de aether.local ($DNSMASQ_FILE)."
  fi
  exit 0
fi

# ------------------------------------------------------------------------------
# Encender / crear el hotspot
# ------------------------------------------------------------------------------
if [ "${#PASS}" -lt 8 ]; then
  fatal "La contraseña del Wi-Fi debe tener al menos 8 caracteres (WPA2)."
fi
if [ "${#SSID}" -lt 1 ] || [ "${#SSID}" -gt 32 ]; then
  fatal "El nombre de la red (SSID) debe tener entre 1 y 32 caracteres."
fi

echo "===================================================================="
echo "  AETHER-VJ // CONFIGURANDO PUNTO WI-FI PROPIO + http://aether.local"
echo "===================================================================="

require_nmcli

# 1. Avahi (mDNS) para que los móviles encuentren "aether.local"
info "Instalando Avahi (mDNS)..."
if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get install -y avahi-daemon libnss-mdns >/dev/null || info "Aviso: no se pudo instalar avahi-daemon/libnss-mdns (¿sin internet?). Se continúa."
fi
$SUDO systemctl enable --now avahi-daemon >/dev/null 2>&1 || true

# 2. Nombre del equipo: "aether"
CURRENT_HOSTNAME="$(hostname)"
if [ "$CURRENT_HOSTNAME" != "$NEW_HOSTNAME" ]; then
  info "Cambiando el nombre del equipo de '$CURRENT_HOSTNAME' a '$NEW_HOSTNAME'..."
  $SUDO hostnamectl set-hostname "$NEW_HOSTNAME"
else
  info "El equipo ya se llama '$NEW_HOSTNAME'."
fi
# /etc/hosts: que el propio equipo resuelva su nombre (evita avisos de sudo)
if grep -qE '^127\.0\.1\.1[[:space:]]' /etc/hosts; then
  if ! grep -qE "^127\.0\.1\.1[[:space:]]+$NEW_HOSTNAME([[:space:]]|$)" /etc/hosts; then
    $SUDO sed -i -E "s/^127\.0\.1\.1[[:space:]].*/127.0.1.1\t$NEW_HOSTNAME $NEW_HOSTNAME.local/" /etc/hosts
  fi
else
  echo -e "127.0.1.1\t$NEW_HOSTNAME $NEW_HOSTNAME.local" | $SUDO tee -a /etc/hosts >/dev/null
fi
$SUDO systemctl restart avahi-daemon >/dev/null 2>&1 || true

# 3. Tarjeta Wi-Fi
detect_iface
info "Tarjeta Wi-Fi detectada: $IFACE"
$SUDO nmcli radio wifi on >/dev/null 2>&1 || true

# 4. DNS del hotspot: aether.local y aether.vj → 10.42.0.1 (para Android sin mDNS)
$SUDO mkdir -p "$DNSMASQ_DIR"
$SUDO tee "$DNSMASQ_FILE" >/dev/null <<EOF
# AETHER-VJ: nombres fáciles para los móviles conectados al hotspot
address=/aether.local/$HOTSPOT_IP
address=/aether.vj/$HOTSPOT_IP
EOF
info "DNS configurado: aether.local y aether.vj → $HOTSPOT_IP"

# 5. Conexión persistente de NetworkManager (sin fijar nombre de tarjeta para que funcione si mueves el SSD a otro Mini-PC)
if ! con_exists; then
  info "Creando la conexión '$CON_NAME'..."
  $SUDO nmcli connection add type wifi ifname "*" con-name "$CON_NAME" ssid "$SSID" >/dev/null
else
  info "Actualizando la conexión '$CON_NAME'..."
fi
$SUDO nmcli connection modify "$CON_NAME" \
  connection.interface-name "" \
  connection.autoconnect yes \
  connection.autoconnect-priority 100 \
  802-11-wireless.ssid "$SSID" \
  802-11-wireless.mode ap \
  802-11-wireless.band bg \
  ipv4.method shared \
  ipv4.addresses "$HOTSPOT_IP/24" \
  ipv6.method ignore \
  wifi-sec.key-mgmt wpa-psk \
  wifi-sec.proto rsn \
  wifi-sec.pairwise ccmp \
  wifi-sec.group ccmp \
  wifi-sec.psk "$PASS"

# 6. Permitir que Node abra el puerto 80 sin ser root (http://aether.local sin :8080)
NODE_BIN="$(command -v node || command -v nodejs || true)"
if [ -n "$NODE_BIN" ]; then
  NODE_REAL="$(readlink -f "$NODE_BIN")"
  if ! command -v setcap >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
    $SUDO apt-get install -y libcap2-bin >/dev/null || true
  fi
  if command -v setcap >/dev/null 2>&1 && $SUDO setcap 'cap_net_bind_service=+ep' "$NODE_REAL"; then
    info "Node ($NODE_REAL) ya puede usar el puerto 80."
  else
    info "Aviso: no se pudo dar permiso de puerto 80 a Node. Se usará http://aether.local:8080"
  fi
else
  info "Aviso: Node.js no está instalado todavía; el puerto 80 se habilitará al instalarlo y repetir este script."
fi

# 7. Encender el hotspot (si había otra Wi-Fi conectada en esa tarjeta, se sustituye)
info "Encendiendo el hotspot..."
if ! $SUDO nmcli connection up "$CON_NAME" ifname "$IFACE" >/dev/null; then
  fatal "No se pudo encender el hotspot. Puede que la tarjeta Wi-Fi no soporte modo punto de acceso (AP)."
fi

# Reiniciar el servidor AETHER-VJ si existe, para que abra el puerto 80
if systemctl list-unit-files aether-vj.service >/dev/null 2>&1 && systemctl is-enabled --quiet aether-vj.service 2>/dev/null; then
  $SUDO systemctl restart aether-vj.service || true
fi

echo "===================================================================="
echo "  ✅ HOTSPOT AETHER-VJ ACTIVO"
echo "--------------------------------------------------------------------"
echo "  📡  Red Wi-Fi (SSID):     $SSID"
echo "  🔒  Contraseña Wi-Fi:     $PASS"
echo "  📱  Abre en el móvil:     http://aether.local"
echo "  🔢  Si no carga, usa:     http://$HOTSPOT_IP   (o http://aether.vj)"
echo "  🛠  Puerto alternativo:   http://$HOTSPOT_IP:8080/remote.html"
echo "--------------------------------------------------------------------"
echo "  Ver estado:  $0 --status"
echo "  Apagar:      $0 --off"
echo "===================================================================="
