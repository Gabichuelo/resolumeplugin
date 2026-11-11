#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ: Instalador Automático Modo Kiosco + Punto Wi-Fi Propio (Hotspot)
# Para Lenovo ThinkCentre Mini-PC (Ubuntu/Debian) o Raspberry Pi 5/4
#
# Uso:
#   chmod +x setup-linux-pi-kiosk.sh
#   ./setup-linux-pi-kiosk.sh                # pregunta si quieres el Wi-Fi propio (por defecto: no)
#   ./setup-linux-pi-kiosk.sh --hotspot      # además crea el Wi-Fi propio + http://aether.local
#   ./setup-linux-pi-kiosk.sh --no-hotspot   # sin preguntar, sin Wi-Fi propio
# ==============================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_NAME="$(whoami)"

# ¿Configurar el Punto Wi-Fi propio? (auto = preguntar si hay terminal interactiva)
WANT_HOTSPOT="auto"
for arg in "$@"; do
  case "$arg" in
    --hotspot) WANT_HOTSPOT="yes" ;;
    --no-hotspot) WANT_HOTSPOT="no" ;;
  esac
done

# Configuración personalizable de Red Wi-Fi Propia y Claves de Acceso Web
WIFI_SSID="${WIFI_SSID:-AETHER-VJ}"
WIFI_PASS="${WIFI_PASS:-aethervj2026}"
ADMIN_PIN="${ADMIN_PIN:-1234}"
DJ_PIN="${DJ_PIN:-dj}"
# USE_MIC=1: escucha la tarjeta de sonido USB / entrada de línea al arrancar (la mesa del DJ). USE_MIC=0: simulador de bombo.
USE_MIC="${USE_MIC:-1}"
KIOSK_URL="http://localhost:8080/?kiosk=1"
if [ "$USE_MIC" = "1" ]; then
  KIOSK_URL="http://localhost:8080/?kiosk=1&mic=1"
fi

echo "===================================================================="
echo "  INSTALANDO AETHER-VJ EN MODO CAJA AUTÓNOMA (LINUX / MINI-PC / PI)"
echo "  Directorio: $APP_DIR"
echo "===================================================================="

# 1. Instalar todas las dependencias mientras hay conexión a Internet
# (antes de encender el Hotspot, por si usamos la misma tarjeta Wi-Fi)
export DEBIAN_FRONTEND=noninteractive
sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=120 update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=120 install -y nodejs network-manager unclutter x11-xserver-utils avahi-daemon libnss-mdns libcap2-bin dnsmasq-base wget curl git htop

# 1.5 Instalar navegador con aceleración GPU y soporte completo de vídeo MP4 (H.264)
ARCH="$(dpkg --print-architecture 2>/dev/null || uname -m)"
CHROMIUM_BIN=""
if command -v google-chrome-stable >/dev/null 2>&1; then
  CHROMIUM_BIN="google-chrome-stable"
elif [ "$ARCH" = "amd64" ] || [ "$ARCH" = "x86_64" ]; then
  echo "[AETHER-VJ] Instalando Google Chrome (.deb oficial) para soporte MP4 H.264 y GPU Intel..."
  TMP_DEB="/tmp/google-chrome-stable_current_amd64.deb"
  if wget -q -O "$TMP_DEB" "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb" && sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=120 install -y "$TMP_DEB"; then
    CHROMIUM_BIN="google-chrome-stable"
  fi
  rm -f "$TMP_DEB"
fi

if [ -z "$CHROMIUM_BIN" ]; then
  if command -v chromium >/dev/null 2>&1; then
    CHROMIUM_BIN="chromium"
  elif command -v chromium-browser >/dev/null 2>&1; then
    CHROMIUM_BIN="chromium-browser"
  else
    sudo apt-get install -y chromium chromium-codecs-ffmpeg-extra 2>/dev/null || sudo apt-get install -y chromium || sudo apt-get install -y chromium-browser
    if command -v chromium >/dev/null 2>&1; then
      CHROMIUM_BIN="chromium"
    else
      CHROMIUM_BIN="chromium-browser"
    fi
  fi
fi

# Desactivar ahorro de pantalla y suspensión automática en Ubuntu (GNOME) y Xubuntu/Mint (XFCE)
gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null || true
gsettings set org.gnome.desktop.screensaver lock-enabled false 2>/dev/null || true
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true
xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/blank-on-ac -s 0 --create -t int 2>/dev/null || true
xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-sleep -s 0 --create -t int 2>/dev/null || true
xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-off -s 0 --create -t int 2>/dev/null || true

# 2. Punto de Acceso Wi-Fi Propio (Hotspot Autónomo con Contraseña) — opcional
# Así cualquier DJ o técnico se puede conectar al Mini-PC sin necesitar router ni tu móvil,
# y abrir el mando escribiendo simplemente http://aether.local
if [ "$WANT_HOTSPOT" = "auto" ]; then
  WANT_HOTSPOT="no"
  if [ -t 0 ]; then
    read -r -p "¿Crear el Wi-Fi propio '$WIFI_SSID' + http://aether.local? [s/N]: " REPLY_HOTSPOT || true
    case "$REPLY_HOTSPOT" in
      s|S|si|SI|sí|Sí|y|Y|yes) WANT_HOTSPOT="yes" ;;
    esac
  fi
fi

HOTSPOT_OK="no"
if [ "$WANT_HOTSPOT" = "yes" ]; then
  if [ -f "$APP_DIR/setup-hotspot-linux.sh" ]; then
    if SSID="$WIFI_SSID" PASS="$WIFI_PASS" bash "$APP_DIR/setup-hotspot-linux.sh"; then
      HOTSPOT_OK="yes"
    else
      echo "[AETHER-VJ] Aviso: no se pudo crear el Wi-Fi propio. La instalación continúa."
    fi
  else
    echo "[AETHER-VJ] Aviso: falta setup-hotspot-linux.sh junto a este script. Se omite el Wi-Fi propio."
  fi
fi

# Ruta real de Node (en Raspberry Pi OS / NodeSource puede no ser /usr/bin/node)
NODE_BIN="$(command -v node || command -v nodejs || echo /usr/bin/node)"
NODE_REAL="$(readlink -f "$NODE_BIN" 2>/dev/null || echo "$NODE_BIN")"

# Asegurar que el equipo se llame 'aether', Avahi esté activo y Node pueda abrir el puerto 80 incluso por cable Ethernet (sin tarjeta Wi-Fi)
sudo hostnamectl set-hostname aether 2>/dev/null || true
if grep -qE '^127\.0\.1\.1[[:space:]]' /etc/hosts; then
  sudo sed -i -E "s/^127\.0\.1\.1[[:space:]].*/127.0.1.1\taether aether.local/" /etc/hosts 2>/dev/null || true
else
  echo -e "127.0.1.1\taether aether.local" | sudo tee -a /etc/hosts >/dev/null || true
fi
sudo systemctl enable --now avahi-daemon 2>/dev/null || true
sudo systemctl restart avahi-daemon 2>/dev/null || true
sudo setcap 'cap_net_bind_service=+ep' "$NODE_REAL" 2>/dev/null || true

# Asegurar que el usuario sea propietario de la carpeta y que Git permita actualizar sin error "dubious ownership"
sudo chown -R "$USER_NAME:$USER_NAME" "$APP_DIR" 2>/dev/null || true
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
sudo git config --system --add safe.directory "*" 2>/dev/null || true

# 3. Crear servicio systemd para el Servidor Wi-Fi Remoto (Puerto 8080 + puerto 80 si hay permiso)
SERVICE_FILE="/etc/systemd/system/aether-vj.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=AETHER-VJ Wi-Fi Remote & Visual Server
After=network.target NetworkManager.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN $APP_DIR/server-remote.js
Restart=always
RestartSec=3
Environment=PORT=8080
Environment=ADMIN_PIN=$ADMIN_PIN
Environment=DJ_PIN=$DJ_PIN
# Permite abrir el puerto 80 (http://aether.local sin :8080) sin ser root
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable aether-vj.service
sudo systemctl restart aether-vj.service

# 4. Configurar Auto-Arranque de Pantalla Completa Limpia (Kiosk Mode) al encender
mkdir -p "/home/$USER_NAME/.config/autostart"
cat > "/home/$USER_NAME/.config/autostart/aether-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=AETHER-VJ Kiosk Projector
Comment=Arranca AETHER-VJ a pantalla completa limpia sin bordes
Exec=bash -c "xset s off; xset -dpms; xset s noblank; pactl set-source-mute @DEFAULT_SOURCE@ 0 2>/dev/null || true; pactl set-source-volume @DEFAULT_SOURCE@ 100% 2>/dev/null || true; unclutter -idle 0.5 -root & sleep 3 && while true; do sed -i 's/\"exit_type\":\"Crashed\"/\"exit_type\":\"Normal\"/g; s/\"exited_cleanly\":false/\"exited_cleanly\":true/g' ~/.config/google-chrome/Default/Preferences ~/.config/chromium/Default/Preferences 2>/dev/null || true; $CHROMIUM_BIN --kiosk --password-store=basic --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --enable-gpu-rasterization --ignore-gpu-blocklist --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream '$KIOSK_URL'; sleep 2; done"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

# 5. Quitar peticiones de contraseña (Auto-Login GDM3/LightDM, Llavero Chrome y Sudoers) + preparar SSD para clonación
if [ -f "$APP_DIR/quitar-claves.sh" ]; then
  sudo bash "$APP_DIR/quitar-claves.sh" || true
fi

echo "===================================================================="
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "--------------------------------------------------------------------"
if [ "$HOTSPOT_OK" = "yes" ]; then
  echo "  📡  RED WI-FI PROPIA DEL MINI-PC:   $WIFI_SSID"
  echo "  🔒  CONTRASEÑA DEL WI-FI:           $WIFI_PASS"
  echo "  📱  URL PARA CUALQUIER MÓVIL:       http://aether.local"
  echo "  🔢  SI NO CARGA:                    http://10.42.0.1  (o http://10.42.0.1:8080/remote.html)"
else
  echo "  📱  URL PARA CUALQUIER MÓVIL:       http://$(hostname).local:8080/remote.html"
  echo "      (o http://<IP-de-esta-máquina>:8080/remote.html en la misma Wi-Fi)"
  echo "  📡  Wi-Fi propio + aether.local:    ./setup-hotspot-linux.sh"
fi
echo "--------------------------------------------------------------------"
echo "  🎧  CLAVE WEB PARA DJS (Logo, Textos y Vídeos): $DJ_PIN"
echo "  🎛️  CLAVE WEB PARA TÉCNICO (Total): $ADMIN_PIN"
echo "===================================================================="
