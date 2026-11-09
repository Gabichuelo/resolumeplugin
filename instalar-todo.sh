#!/usr/bin/env bash
# ==============================================================================
# INSTALADOR COMPLETO 1-CLIC PARA CUALQUIER MINI-PC NUEVO CON UBUNTU:
# Instala de golpe:
#   1) AETHER-VJ (Visuales Kiosco + Mando Móvil puerto 3000/8080)
#   2) GrandDas DMX512 Studio + Hahan SL04 4-XLR (Luces puerto 5175/3031)
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
LUCES_DIR="$USER_HOME/granddas-luces"
REPO_URL="https://github.com/Gabichuelo/resolumeplugin.git"

echo "===================================================================="
echo "  🚀 INSTALANDO SISTEMA COMPLETO (AETHER-VJ + GRANDDAS SL04 + SIN CLAVES)"
echo "  👤 Usuario: $REAL_USER ($USER_HOME)"
echo "===================================================================="

apt-get update -y
apt-get install -y git curl wget nodejs network-manager unclutter x11-xserver-utils avahi-daemon libnss-mdns libcap2-bin dnsmasq-base

# 1. Descargar AETHER-VJ (rama main)
if [ ! -d "$AETHER_DIR/.git" ]; then
  rm -rf "$AETHER_DIR"
  sudo -u "$REAL_USER" git clone -b main "$REPO_URL" "$AETHER_DIR"
else
  cd "$AETHER_DIR"
  git -c safe.directory="*" fetch origin main
  git -c safe.directory="*" reset --hard origin/main
fi
chown -R "$REAL_USER:$REAL_USER" "$AETHER_DIR"

# 2. Ejecutar instalador de AETHER-VJ
cd "$AETHER_DIR"
sudo -u "$REAL_USER" bash "$AETHER_DIR/setup-linux-pi-kiosk.sh" --no-hotspot

# 3. Descargar e instalar GrandDas DMX512 + Hahan SL04 (rama luces)
if [ ! -d "$LUCES_DIR/.git" ]; then
  rm -rf "$LUCES_DIR"
  sudo -u "$REAL_USER" git clone -b luces --single-branch "$REPO_URL" "$LUCES_DIR"
else
  cd "$LUCES_DIR"
  git -c safe.directory="*" fetch origin luces
  git -c safe.directory="*" reset --hard origin/luces
fi
chown -R "$REAL_USER:$REAL_USER" "$LUCES_DIR"

# Regla automática USB para la caja Hahan SL04 (IP 2.0.0.1 -> 2.0.0.44)
mkdir -p /etc/NetworkManager/dispatcher.d
cat > /etc/NetworkManager/dispatcher.d/99-hahan-sl04 << 'EOF'
#!/usr/bin/env bash
IFACE="$1"
ACTION="$2"
if [[ "$IFACE" == enx* ]] || [[ "$IFACE" == usb* ]]; then
  if [ "$ACTION" = "up" ] || [ "$ACTION" = "dhcp4-change" ] || [ "$ACTION" = "connectivity-change" ]; then
    ip addr add 2.0.0.1/24 dev "$IFACE" 2>/dev/null || true
    ip route replace 2.0.0.0/8 dev "$IFACE" metric 2000 2>/dev/null || true
    ip link set "$IFACE" up 2>/dev/null || true
  fi
fi
EOF
chmod +x /etc/NetworkManager/dispatcher.d/99-hahan-sl04

for dev in $(ls /sys/class/net 2>/dev/null | grep -E '^(enx|usb)' || true); do
  ip addr add 2.0.0.1/24 dev "$dev" 2>/dev/null || true
  ip route replace 2.0.0.0/8 dev "$dev" metric 2000 2>/dev/null || true
  ip link set "$dev" up 2>/dev/null || true
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
ExecStart=$NODE_BIN $LUCES_DIR/server-dmx.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable granddas-luces.service
systemctl restart granddas-luces.service

# 4. Quitar todas las contraseñas y preparar UEFI/Red
bash "$AETHER_DIR/quitar-claves.sh"

echo "===================================================================="
echo "  ✅ ¡MINI-PC COMPLETO INSTALADO Y LISTO!"
echo "===================================================================="
