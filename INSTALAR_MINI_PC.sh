#!/usr/bin/env bash
# ==============================================================================
# ARCHIVO DE 1 CLIC PARA COPIAR A CUALQUIER PENDRIVE USB DESDE WINDOWS
# ==============================================================================
# En cada Mini-PC con Xubuntu recién instalado y cable de Internet puesto:
#   1) Enchufa el Pendrive con este archivo (INSTALAR_MINI_PC.sh)
#   2) Clic derecho en el Pendrive -> "Abrir una terminal aquí"
#   3) Escribe:
#        bash INSTALAR_MINI_PC.sh
#
# Instala automáticamente:
#   ✅ AETHER-VJ (Visuales Kiosco GPU + Mando Móvil Wi-Fi puerto 80/8080)
#   ✅ GrandDas DMX512 Studio + Caja USB Hahan SL04 4-XLR (puerto 5175)
#   ✅ Quita TODAS las contraseñas, depósito de claves y botón azul de LightDM
#   ✅ Fija Ethernet automático (eno1) sin bloqueo MAC + apaga suspensión 24/7
#   ✅ Deja listo el Clonador de Pendrive / M.2 para los demás discos M.2
# ==============================================================================

set -e
export DEBIAN_FRONTEND=noninteractive

if [ "$EUID" -ne 0 ]; then
  echo "🔐 Solicitando permiso de administrador (escribe la clave por última vez)..."
  exec sudo DEBIAN_FRONTEND=noninteractive bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || ls -1 /home | head -n 1)}"
REAL_USER="${REAL_USER:-aether}"
USER_HOME="$(eval echo "~$REAL_USER")"

echo "===================================================================="
echo "  🚀 PREPARANDO MINI-PC COMPLETO DESDE CERO ($REAL_USER)"
echo "===================================================================="

if command -v wget >/dev/null 2>&1; then
  wget -qO- https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | bash
elif command -v curl >/dev/null 2>&1; then
  curl -fsSL https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | bash
else
  apt-get -o DPkg::Lock::Timeout=120 update -y
  apt-get -o DPkg::Lock::Timeout=120 install -y wget curl
  wget -qO- https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | bash
fi

# Si en este mismo Pendrive pusiste carpeta 'shows' o 'aether-config.json', los copia también
if [ -f "$SCRIPT_DIR/aether-config.json" ]; then
  cp -f "$SCRIPT_DIR/aether-config.json" "$USER_HOME/resolumeplugin/aether-config.json"
  chown "$REAL_USER:$REAL_USER" "$USER_HOME/resolumeplugin/aether-config.json" 2>/dev/null || true
  systemctl restart aether-vj.service 2>/dev/null || true
fi
if [ -d "$SCRIPT_DIR/shows" ] && [ -d "/opt/planecreator" ]; then
  mkdir -p /opt/planecreator/shows
  cp -rf "$SCRIPT_DIR/shows/"* /opt/planecreator/shows/ 2>/dev/null || true
  chown -R "$REAL_USER:$REAL_USER" /opt/planecreator/shows 2>/dev/null || true
  systemctl restart granddas-luces.service 2>/dev/null || true
fi

echo "===================================================================="
echo "  ✅ ¡MINI-PC 100% INSTALADO Y SIN CLAVES!"
echo "  🔄 Reiniciando automáticamente en 5 segundos para entrar en Kiosco..."
echo "===================================================================="
sleep 5
reboot
