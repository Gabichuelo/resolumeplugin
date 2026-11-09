#!/usr/bin/env bash
# ==============================================================================
# CREAR PUNTO DE ACCESO WI-FI PROPIO EN EL MINI PC LINUX (SIN ROUTER NI INTERNET)
# Nombre Wi-Fi (SSID): GRANDDAS_LUCES
# Contraseña:          luces1234
# Dirección del Móvil: http://10.42.0.1:5175/?remote=1&pin=1234
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Ejecuta con sudo: sudo bash CREAR_WIFI_PROPIA_LINUX.sh"
  exit 1
fi

SSID="${1:-GRANDDAS_LUCES}"
PASS="${2:-luces1234}"

WIFI_IFACE="$(nmcli -t -f DEVICE,TYPE device status | awk -F: '$2=="wifi"{print $1; exit}')"

if [ -z "$WIFI_IFACE" ]; then
  echo "❌ No se detectó tarjeta Wi-Fi en este Mini PC."
  exit 1
fi

echo "📡 Configurando Punto de Acceso Wi-Fi '$SSID' en la tarjeta $WIFI_IFACE..."

nmcli connection delete "GRANDDAS_HOTSPOT" >/dev/null 2>&1 || true
nmcli device wifi hotspot ifname "$WIFI_IFACE" con-name "GRANDDAS_HOTSPOT" ssid "$SSID" password "$PASS"
nmcli connection modify "GRANDDAS_HOTSPOT" connection.autoconnect yes ipv4.addresses 10.42.0.1/24
nmcli connection up "GRANDDAS_HOTSPOT"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIN="1234"
[ -f "$APP_DIR/shows/remote_pin.txt" ] && PIN="$(cat "$APP_DIR/shows/remote_pin.txt" | tr -d '[:space:]')"

echo ""
echo "=================================================================="
echo "✅ WI-FI PROPIA DEL MINI PC ACTIVADA (ARRANCA SOLA AL ENCENDER)"
echo "=================================================================="
echo "1. Conecta tu móvil al Wi-Fi:  $SSID"
echo "2. Contraseña del Wi-Fi:       $PASS"
echo "3. Abre en el navegador del móvil (y guárdalo en pantalla de inicio):"
echo "   👉 http://10.42.0.1:5175/?remote=1&pin=$PIN"
echo "=================================================================="
