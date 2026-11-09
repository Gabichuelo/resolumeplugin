#!/usr/bin/env bash
# ==============================================================================
# GRANDDAS DMX512 STUDIO - INSTALADOR AUTOMATICO PARA MINI PC LINUX
# (Ubuntu / Debian / Linux Mint / Lubuntu / Xubuntu)
# ==============================================================================
# Qué hace este instalador:
#   1. Instala Node.js (si no está instalado) y herramientas de red.
#   2. Configura Linux (udev + NetworkManager) para que al enchufar la caja
#      Hahan SL04 Box por USB (MAC 00:13:26:*) le asigne sola la IP 2.0.0.10/8.
#   3. Crea el servicio automático "granddas-dmx.service" para que al pulsar
#      el botón de encendido del Mini PC (sin pantalla ni teclado) arranque solo
#      y encienda el LED verde del Hahan.
#   4. Fija el PIN del mando móvil en 1234 (editable) y muestra la dirección
#      exacta para abrir los 4 Botones desde el móvil.
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Por favor ejecuta este instalador con sudo:"
  echo "   sudo bash INSTALAR_EN_LINUX.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=================================================================="
echo "🚀 Instalando GrandDas DMX512 Studio en Mini PC Linux..."
echo "📂 Carpeta detectada: $APP_DIR"
echo "=================================================================="

# 1. Instalar Node.js y herramientas de red si faltan
if ! command -v node >/dev/null 2>&1; then
  echo "📦 Instalando Node.js y utilidades de red..."
  apt-get update -y
  apt-get install -y nodejs npm iproute2 network-manager curl
else
  echo "✅ Node.js ya está instalado: $(node -v)"
  apt-get update -y >/dev/null 2>&1 || true
  apt-get install -y iproute2 network-manager >/dev/null 2>&1 || true
fi

# 2. Asegurar un PIN fijo y fácil (1234) si no existe o dejarlo listo para el móvil
mkdir -p "$APP_DIR/shows"
if [ ! -f "$APP_DIR/shows/remote_pin.txt" ]; then
  echo "1234" > "$APP_DIR/shows/remote_pin.txt"
fi
CURRENT_PIN="$(cat "$APP_DIR/shows/remote_pin.txt" | tr -d '[:space:]')"
chmod -R 777 "$APP_DIR/shows" || true

# 3. Regla automática udev + script para la interfaz USB Hahan SL04 Box (MAC 00:13:26:*)
echo "🔌 Configurando IP automática 2.0.0.10/8 para Hahan SL04 Box USB..."
cat >/usr/local/bin/granddas-hahan-ip.sh <<'EOF'
#!/usr/bin/env bash
# Busca cualquier tarjeta de red USB RNDIS del Hahan (MAC 00:13:26:* o usb0/enx001326*)
for devpath in /sys/class/net/*; do
  iface="$(basename "$devpath")"
  [ "$iface" = "lo" ] && continue
  mac="$(cat "$devpath/address" 2>/dev/null | tr '[:upper:]' '[:lower:]')"
  if [[ "$mac" == 00:13:26* ]] || [[ "$iface" == usb* ]] || [[ "$iface" == enx001326* ]]; then
    ip link set "$iface" up 2>/dev/null || true
    if ! ip -4 addr show "$iface" | grep -q "2.0.0.10"; then
      ip addr add 2.0.0.10/8 broadcast 2.255.255.255 dev "$iface" 2>/dev/null || true
    fi
  fi
done
EOF
chmod +x /usr/local/bin/granddas-hahan-ip.sh

cat >/etc/udev/rules.d/99-granddas-hahan.rules <<'EOF'
ACTION=="add", SUBSYSTEM=="net", ATTR{address}=="00:13:26:*", RUN+="/usr/local/bin/granddas-hahan-ip.sh"
ACTION=="add", SUBSYSTEM=="net", KERNEL=="usb*", RUN+="/usr/local/bin/granddas-hahan-ip.sh"
EOF
udevadm control --reload-rules 2>/dev/null || true
/usr/local/bin/granddas-hahan-ip.sh || true

# 4. Crear servicio systemd para auto-arranque 24/7 sin monitor ni teclado
echo "⚙️  Creando servicio de arranque automático (granddas-dmx.service)..."
NODE_BIN="$(command -v node)"

cat >/etc/systemd/system/granddas-dmx.service <<EOF
[Unit]
Description=GrandDas DMX512 Studio + Hahan Art-Net Engine (Mini PC)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStartPre=-/usr/local/bin/granddas-hahan-ip.sh
ExecStart=$NODE_BIN $APP_DIR/server/artnetServer.cjs
Restart=always
RestartSec=2
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable granddas-dmx.service
systemctl restart granddas-dmx.service

# 5. Abrir puertos 5175 (Web/Móvil), 3031 (API) y 6454 (Art-Net UDP) si UFW está activo
if command -v ufw >/dev/null 2>&1; then
  ufw allow 5175/tcp >/dev/null 2>&1 || true
  ufw allow 3031/tcp >/dev/null 2>&1 || true
  ufw allow 6454/udp >/dev/null 2>&1 || true
fi

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
[ -z "$LAN_IP" ] && LAN_IP="10.42.0.1"

echo ""
echo "=================================================================="
echo "✅ ¡INSTALACIÓN COMPLETADA CON ÉXITO!"
echo "=================================================================="
echo "• El motor GrandDas DMX512 ya está corriendo y arrancará SOLO"
echo "  cada vez que enciendas el Mini PC (sin necesitar pantalla)."
echo ""
echo "📱 CÓMO CONECTAR EL MÓVIL A LOS 4 BOTONES:"
echo "   Abre en el navegador del móvil:"
echo "   👉 http://${LAN_IP}:5175/?remote=1&pin=${CURRENT_PIN}"
echo ""
echo "📡 ¿NO HAY ROUTER NI WI-FI EN LA NAVE / EVENTO?"
echo "   Ejecuta una sola vez:"
echo "   sudo bash CREAR_WIFI_PROPIA_LINUX.sh"
echo "   y el Mini PC creará su propio Wi-Fi llamado GRANDDAS_LUCES"
echo "   (contraseña: luces1234) con dirección fija:"
echo "   👉 http://10.42.0.1:5175/?remote=1&pin=${CURRENT_PIN}"
echo "=================================================================="
