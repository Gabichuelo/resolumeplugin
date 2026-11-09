#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ + GRANDDAS LUCES:
# 1) Quita TODAS las contraseñas (arranque de Ubuntu, llavero de Chrome/AETHER,
#    ventanas emergentes de red/sistema y sudo).
# 2) Deja el SSD listo como "Disco Maestro" para clonar a otros Mini-PCs.
#
# Uso (1 sola línea):
#   sudo bash ~/resolumeplugin/quitar-claves.sh
# ==============================================================================

set -e

REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [ -z "$REAL_USER" ] || [ "$REAL_USER" = "root" ]; then
  REAL_USER="$(ls -1 /home 2>/dev/null | head -n 1)"
fi
REAL_USER="${REAL_USER:-root}"
USER_HOME="$(eval echo "~$REAL_USER")"

echo "===================================================================="
echo "  🔓 QUITANDO CONTRASEÑAS Y PREPARANDO SSD MAESTRO PARA CLONAR"
echo "  👤 Usuario del Mini-PC: $REAL_USER ($USER_HOME)"
echo "===================================================================="

# 1. Sudo sin contraseña nunca más
echo "[1/6] Activando permisos sudo sin contraseña para $REAL_USER..."
mkdir -p /etc/sudoers.d
cat > /etc/sudoers.d/90-aether-nopasswd <<EOF
$REAL_USER ALL=(ALL) NOPASSWD: ALL
EOF
chmod 0440 /etc/sudoers.d/90-aether-nopasswd

# 2. Auto-Login en Ubuntu (GDM3 y LightDM) para que NO pida clave al encender
echo "[2/6] Configurando inicio de sesión automático en Ubuntu..."
groupadd -f nopasswdlogin 2>/dev/null || true
usermod -aG nopasswdlogin,adm,dialout,cdrom,sudo,audio,dip,video,plugdev,netdev "$REAL_USER" 2>/dev/null || true

# Ubuntu Desktop estándar (GDM3)
if [ -d /etc/gdm3 ]; then
  cat > /etc/gdm3/custom.conf <<EOF
# GDM configuration storage - AETHER-VJ Auto-Login
[daemon]
AutomaticLoginEnable=true
AutomaticLogin=$REAL_USER
WaylandEnable=false

[security]

[xdmcp]

[chooser]

[debug]
EOF
fi

# Si usa LightDM (Xubuntu / Ubuntu ligero)
if [ -d /etc/lightdm ]; then
  mkdir -p /etc/lightdm/lightdm.conf.d
  cat > /etc/lightdm/lightdm.conf.d/50-aether-autologin.conf <<EOF
[Seat:*]
autologin-user=$REAL_USER
autologin-user-timeout=0
user-session=ubuntu
EOF
fi

# 3. Quitar cartel de contraseña del "Depósito de claves" (Keyring) al abrir Chrome / AETHER-VJ
echo "[3/6] Eliminando bloqueo del depósito de claves (Keyring) en Chrome / AETHER-VJ..."
rm -rf "$USER_HOME/.local/share/keyrings"
mkdir -p "$USER_HOME/.local/share/keyrings"
# Crear llavero por defecto en blanco (sin contraseña)
cat > "$USER_HOME/.local/share/keyrings/default" <<EOF
Default_keyring
EOF
cat > "$USER_HOME/.local/share/keyrings/Default_keyring.keyring" <<EOF
[keyring]
display-name=Default keyring
ctime=0
mtime=0
lock-on-idle=false
lock-after=false
EOF
chown -R "$REAL_USER:$REAL_USER" "$USER_HOME/.local/share/keyrings" 2>/dev/null || true

# Asegurar que el autostart de Chrome lleve --password-store=basic
AUTOSTART_FILE="$USER_HOME/.config/autostart/aether-kiosk.desktop"
if [ -f "$AUTOSTART_FILE" ]; then
  if ! grep -q -- "--password-store=basic" "$AUTOSTART_FILE"; then
    sed -i 's/--kiosk/--kiosk --password-store=basic/g' "$AUTOSTART_FILE"
  fi
  chown "$REAL_USER:$REAL_USER" "$AUTOSTART_FILE" 2>/dev/null || true
fi

# Desactivar bloqueo de pantalla y protector de pantalla en la sesión del usuario
sudo -u "$REAL_USER" dbus-launch gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null || true
sudo -u "$REAL_USER" dbus-launch gsettings set org.gnome.desktop.screensaver lock-enabled false 2>/dev/null || true
sudo -u "$REAL_USER" dbus-launch gsettings set org.gnome.desktop.screensaver ubuntu-lock-on-suspend false 2>/dev/null || true
sudo -u "$REAL_USER" dbus-launch gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true

# 4. Quitar popups de contraseña del escritorio (Polkit: Red, Wi-Fi, USB, Energía)
echo "[4/6] Desactivando ventanas emergentes de contraseña del sistema (Polkit)..."
mkdir -p /etc/polkit-1/rules.d
cat > /etc/polkit-1/rules.d/99-aether-nopasswd.rules <<EOF
polkit.addRule(function(action, subject) {
    if (subject.user == "$REAL_USER" || subject.isInGroup("sudo")) {
        return polkit.Result.YES;
    }
});
EOF

mkdir -p /etc/polkit-1/localauthority/50-local.d
cat > /etc/polkit-1/localauthority/50-local.d/99-aether-nopasswd.pkla <<EOF
[Allow Everything for Aether User]
Identity=unix-user:$REAL_USER;unix-group:sudo
Action=*
ResultAny=yes
ResultInactive=yes
ResultActive=yes
EOF

# 5. Preparar Red y Arranque UEFI para que al CLONAR el SSD funcione en cualquier Mini-PC
echo "[5/6] Preparando red universal y arranque UEFI para clonación de SSD..."
# Limpiar direcciones MAC fijadas en NetworkManager para que en el nuevo Mini-PC detecte su propia tarjeta Ethernet/Wi-Fi
if command -v nmcli >/dev/null 2>&1; then
  for uuid in $(nmcli -g UUID connection show 2>/dev/null || true); do
    nmcli connection modify "$uuid" 802-3-ethernet.mac-address "" 2>/dev/null || true
    nmcli connection modify "$uuid" 802-11-wireless.mac-address "" 2>/dev/null || true
    nmcli connection modify "$uuid" connection.interface-name "" 2>/dev/null || true
  done
fi
rm -f /etc/udev/rules.d/70-persistent-net.rules 2>/dev/null || true

# Copiar cargador UEFI a la ruta universal /boot/efi/EFI/BOOT/BOOTX64.EFI
# (Imprescindible para que al meter el SSD clonado en otro Mini-PC arranque a la primera sin configurar BIOS)
if [ -d /boot/efi/EFI/ubuntu ]; then
  mkdir -p /boot/efi/EFI/BOOT
  if [ -f /boot/efi/EFI/ubuntu/shimx64.efi ]; then
    cp -f /boot/efi/EFI/ubuntu/shimx64.efi /boot/efi/EFI/BOOT/BOOTX64.EFI 2>/dev/null || true
  fi
  if [ -f /boot/efi/EFI/ubuntu/grubx64.efi ]; then
    cp -f /boot/efi/EFI/ubuntu/grubx64.efi /boot/efi/EFI/BOOT/grubx64.efi 2>/dev/null || true
  fi
  if [ -f /boot/efi/EFI/ubuntu/mmx64.efi ]; then
    cp -f /boot/efi/EFI/ubuntu/mmx64.efi /boot/efi/EFI/BOOT/mmx64.efi 2>/dev/null || true
  fi
  if [ -f /boot/efi/EFI/ubuntu/grub.cfg ]; then
    cp -f /boot/efi/EFI/ubuntu/grub.cfg /boot/efi/EFI/BOOT/grub.cfg 2>/dev/null || true
  fi
fi

# 6. Crear comando corto de 1 palabra 'quitar-claves'
echo "[6/6] Creando comando corto 'quitar-claves'..."
cat > /usr/local/bin/quitar-claves <<EOF
#!/usr/bin/env bash
sudo bash "$USER_HOME/resolumeplugin/quitar-claves.sh"
EOF
chmod +x /usr/local/bin/quitar-claves

sync
echo "===================================================================="
echo "  ✅ ¡LISTO! CONTRASEÑAS ELIMINADAS Y SSD PREPARADO PARA CLONAR"
echo "--------------------------------------------------------------------"
echo "  • Ubuntu entrará directo al escritorio sin pedir contraseña."
echo "  • Chrome / AETHER-VJ abrirá sin pedir clave del depósito."
echo "  • El SSD ya tiene arranque UEFI universal y red sin bloqueo MAC,"
echo "    listo para clonarse a todos los demás Mini-PCs."
echo "===================================================================="
