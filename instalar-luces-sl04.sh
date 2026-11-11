#!/usr/bin/env bash
# ==============================================================================
# INSTALADOR Y ACTUALIZADOR RÁPIDO: GRANDDAS DMX512 + CAJA USB HAHAN SL04 (4 XLR)
# Descarga la rama 'luces', configura la IP Art-Net 2.0.0.10/8 (broadcast 2.255.255.255)
# EXCLUSIVAMENTE en adaptadores USB (nunca en eno1), desactiva servicios antiguos
# duplicados, activa granddas-luces.service y crea el acceso directo en Escritorio.
# ==============================================================================

set -e

REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [ -z "$REAL_USER" ] || [ "$REAL_USER" = "root" ]; then
  REAL_USER="$(ls -1 /home 2>/dev/null | head -n 1)"
fi
REAL_USER="${REAL_USER:-aether}"
USER_HOME="$(eval echo "~$REAL_USER")"

LUCES_DIR="/opt/planecreator"
REPO_URL="https://github.com/Gabichuelo/resolumeplugin.git"

echo "===================================================================="
echo "  💡 INSTALANDO / ACTUALIZANDO GRANDDAS DMX512 + HAHAN SL04 (4-XLR)"
echo "===================================================================="

mkdir -p "$LUCES_DIR"
git config --global --add safe.directory "*" 2>/dev/null || true

if [ -d "$LUCES_DIR/.git" ]; then
  cd "$LUCES_DIR"
  git -c safe.directory="*" remote set-url origin "$REPO_URL" || true
  git -c safe.directory="*" fetch --force origin luces
  git -c safe.directory="*" reset --hard origin/luces
  git -c safe.directory="*" clean -fd
else
  rm -rf "$LUCES_DIR"
  git clone -b luces --single-branch "$REPO_URL" "$LUCES_DIR"
fi

# Asegurar PIN 1234 para el mando móvil de luces
mkdir -p "$LUCES_DIR/shows"
if [ ! -f "$LUCES_DIR/shows/remote_pin.txt" ]; then
  echo "1234" > "$LUCES_DIR/shows/remote_pin.txt"
fi
chown -R "$REAL_USER:$REAL_USER" "$LUCES_DIR" 2>/dev/null || true

# Quitar IP 2.0.0.x de eno1 si estaba fijada, para que jamás robe tráfico ni bloquee Internet DHCP
for eth_pci in eno1 eno0 enp1s0 enp2s0 enp3s0 eth0; do
  ip addr del 2.0.0.10/8 dev "$eth_pci" 2>/dev/null || true
  ip addr del 2.0.0.1/24 dev "$eth_pci" 2>/dev/null || true
done
rm -f /etc/udev/rules.d/99-hahan-sl04-usb.rules /etc/NetworkManager/dispatcher.d/99-sl04-usb-dmx /etc/NetworkManager/dispatcher.d/99-hahan-sl04 2>/dev/null || true

# Script oficial USB-ONLY para la caja Hahan SL04 (2.0.0.10/8 -> 2.0.0.44, broadcast 2.255.255.255)
cat > /usr/local/bin/sl04-usb-net.sh << 'EOF'
#!/usr/bin/env bash
# Asigna 2.0.0.10/8 SOLO a interfaces de red USB (Hahan SL04 MAC 00:13:26:*, enx*, usb*)
# NUNCA toca eno1 / enp* / eth* (cable de Internet / Router)
ip addr del 2.0.0.10/8 dev eno1 2>/dev/null || true
for devpath in /sys/class/net/*; do
  iface="$(basename "$devpath")"
  case "$iface" in
    lo|eno*|enp*|eth*|wl*|wlan*|docker*|veth*|br*) continue ;;
  esac
  mac="$(cat "$devpath/address" 2>/dev/null | tr '[:upper:]' '[:lower:]')"
  bus_path="$(readlink -f "$devpath/device" 2>/dev/null || true)"
  if [[ "$mac" == 00:13:26* ]] || [[ "$iface" == usb* ]] || [[ "$iface" == enx* ]] || [[ "$bus_path" == *"/usb"* ]]; then
    ip link set "$iface" up 2>/dev/null || true
    ip addr del 2.0.0.1/24 dev "$iface" 2>/dev/null || true
    if ! ip -4 addr show dev "$iface" | grep -q "2.0.0.10"; then
      ip addr add 2.0.0.10/8 broadcast 2.255.255.255 dev "$iface" 2>/dev/null || true
    fi
  fi
done
EOF
chmod +x /usr/local/bin/sl04-usb-net.sh
cp -f /usr/local/bin/sl04-usb-net.sh /usr/local/bin/granddas-hahan-ip.sh 2>/dev/null || true

# Regla udev EXCLUSIVA para dispositivos USB (ENV{ID_BUS}=="usb" o MAC 00:13:26:*)
cat > /etc/udev/rules.d/99-granddas-hahan.rules << 'EOF'
ACTION=="add", SUBSYSTEM=="net", ENV{ID_BUS}=="usb", RUN+="/usr/local/bin/sl04-usb-net.sh"
ACTION=="add", SUBSYSTEM=="net", ATTR{address}=="00:13:26:*", RUN+="/usr/local/bin/sl04-usb-net.sh"
EOF
udevadm control --reload-rules 2>/dev/null || true
/usr/local/bin/sl04-usb-net.sh || true

# Desactivar TODOS los servicios antiguos que puedan chocar en los puertos 3000 / 3031 / 5175 / 6454
for old_svc in planecreator.service planecreator-dmx.service granddas-dmx.service; do
  systemctl stop "$old_svc" 2>/dev/null || true
  systemctl disable "$old_svc" 2>/dev/null || true
  rm -f "/etc/systemd/system/$old_svc" 2>/dev/null || true
done

NODE_BIN="$(command -v node || command -v nodejs || echo /usr/bin/node)"
cat > /etc/systemd/system/granddas-luces.service <<EOF
[Unit]
Description=GrandDas DMX512 Studio + Hahan SL04 4-XLR Server
After=network.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$LUCES_DIR
Environment=NODE_ENV=production
Environment=PORT=3031
ExecStartPre=-/usr/bin/sudo -n /usr/local/bin/sl04-usb-net.sh
ExecStart=$NODE_BIN $LUCES_DIR/server-dmx.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable granddas-luces.service
systemctl restart granddas-luces.service

# Crear comando rápido en /usr/local/bin/actualizar-luces-sl04
cat > /usr/local/bin/actualizar-luces-sl04 <<EOF
#!/usr/bin/env bash
sudo bash "$USER_HOME/resolumeplugin/instalar-luces-sl04.sh"
EOF
chmod +x /usr/local/bin/actualizar-luces-sl04

# Crear acceso directo limpio en el Escritorio para abrir la consola de Luces GrandDas SL04 (puerto 5175)
for ddir in "$USER_HOME/Escritorio" "$USER_HOME/Desktop"; do
  if [ -d "$ddir" ]; then
    rm -f "$ddir/PlaneCreator-SL04-Luces.desktop" 2>/dev/null || true
    cat > "$ddir/GrandDas-Luces-SL04.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GrandDas Luces DMX + SL04
Comment=Consola de Iluminación DMX512 + Hahan SL04 4-XLR
Exec=xdg-open http://localhost:5175
Icon=utilities-terminal
Terminal=false
Categories=AudioVideo;
EOF
    chmod +x "$ddir/GrandDas-Luces-SL04.desktop"
    chown "$REAL_USER:$REAL_USER" "$ddir/GrandDas-Luces-SL04.desktop" 2>/dev/null || true
  fi
done

sleep 1
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "Estado del servicio granddas-luces.service: $(systemctl is-active granddas-luces.service)"
echo "✅ ¡GrandDas DMX512 + SL04 listo!"
echo "   💻 Consola PC:   http://${LAN_IP:-localhost}:5175"
echo "   📱 Mando Móvil:  http://${LAN_IP:-localhost}:5175/?remote=1&pin=1234"
