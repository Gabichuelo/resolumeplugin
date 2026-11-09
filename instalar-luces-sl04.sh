#!/usr/bin/env bash
# ==============================================================================
# INSTALADOR Y ACTUALIZADOR RÁPIDO: GRANDDAS DMX512 + CAJA USB HAHAN SL04 (4 XLR)
# Descarga la rama 'luces', configura la IP 2.0.0.1 -> 2.0.0.44 para el SL04,
# activa el servicio granddas-luces.service y crea el acceso directo en Escritorio.
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
chown -R "$REAL_USER:$REAL_USER" "$LUCES_DIR" 2>/dev/null || true

# Quitar IP 2.0.0.10/8 de eno1 si estaba fijada, para que no robe el tráfico 2.0.0.44 a la caja USB SL04
ip addr del 2.0.0.10/8 dev eno1 2>/dev/null || true

# Configurar regla automática para la tarjeta USB Ethernet de la caja Hahan SL04 (2.0.0.1 -> 2.0.0.44)
mkdir -p /etc/NetworkManager/dispatcher.d
cat > /etc/NetworkManager/dispatcher.d/99-hahan-sl04 << 'EOF'
#!/usr/bin/env bash
IFACE="$1"
ACTION="$2"
if [[ "$IFACE" == enx* ]] || [[ "$IFACE" == usb* ]]; then
  if [ "$ACTION" = "up" ] || [ "$ACTION" = "dhcp4-change" ] || [ "$ACTION" = "connectivity-change" ]; then
    ip addr add 2.0.0.1/24 dev "$IFACE" 2>/dev/null || true
    ip route replace 2.0.0.44/32 dev "$IFACE" src 2.0.0.1 metric 50 2>/dev/null || true
    ip route replace 2.0.0.0/24 dev "$IFACE" src 2.0.0.1 metric 50 2>/dev/null || true
    ip link set "$IFACE" up 2>/dev/null || true
  fi
fi
EOF
chmod +x /etc/NetworkManager/dispatcher.d/99-hahan-sl04

for dev in $(ls /sys/class/net 2>/dev/null | grep -E '^(enx|usb)' || true); do
  nmcli device set "$dev" managed no 2>/dev/null || true
  ip link set "$dev" up 2>/dev/null || true
  ip addr add 2.0.0.1/24 dev "$dev" 2>/dev/null || true
  ip route replace 2.0.0.44/32 dev "$dev" src 2.0.0.1 metric 50 2>/dev/null || true
  ip route replace 2.0.0.0/24 dev "$dev" src 2.0.0.1 metric 50 2>/dev/null || true
done

# Desactivar servicios antiguos que puedan chocar en el puerto 3031 / 5175
systemctl stop planecreator.service 2>/dev/null || true
systemctl disable planecreator.service 2>/dev/null || true

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

# Crear acceso directo en el Escritorio para abrir la consola de Luces GrandDas SL04
for ddir in "$USER_HOME/Escritorio" "$USER_HOME/Desktop"; do
  if [ -d "$ddir" ]; then
    cat > "$ddir/GrandDas-Luces-SL04.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GrandDas Luces DMX + SL04
Comment=Consola de Iluminación DMX512 + Hahan SL04 4-XLR
Exec=xdg-open http://localhost:3031
Icon=utilities-terminal
Terminal=false
Categories=AudioVideo;
EOF
    chmod +x "$ddir/GrandDas-Luces-SL04.desktop"
    chown "$REAL_USER:$REAL_USER" "$ddir/GrandDas-Luces-SL04.desktop" 2>/dev/null || true
  fi
done

sleep 1
echo "Estado del servicio granddas-luces.service: $(systemctl is-active granddas-luces.service)"
echo "✅ ¡GrandDas DMX512 + SL04 listo en http://$(hostname -I | awk '{print $1}'):3031 y puerto 5175!"
