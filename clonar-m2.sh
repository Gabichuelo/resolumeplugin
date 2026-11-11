#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ + GRANDDAS: CLONADOR Y CREADOR DE PENDRIVE MAESTRO (1 CLIC)
# ==============================================================================
# Modos disponibles:
#   sudo bash clonar-m2.sh --list         # Ver Disco Maestro, otros M.2 y Pendrives USB
#   sudo bash clonar-m2.sh --usb-kit      # Guardar en Pendrive USB el Instalador 1-Clic + Tus Shows/Ajustes (tarda 5 seg)
#   sudo bash clonar-m2.sh --usb-backup   # Guardar en Pendrive USB (16GB+) un CLON COMPLETO EXACTO + RESTAURAR_AQUI.sh
#   sudo bash clonar-m2.sh --clone        # Clonar directo a otro M.2 si tienes adaptador USB-NVMe o 2ª ranura
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Ejecuta con sudo: sudo bash clonar-m2.sh --list"
  exit 1
fi

REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [ -z "$REAL_USER" ] || [ "$REAL_USER" = "root" ]; then
  REAL_USER="$(ls -1 /home 2>/dev/null | head -n 1)"
fi
REAL_USER="${REAL_USER:-aether}"
USER_HOME="$(eval echo "~$REAL_USER")"

# Detectar disco físico donde está montado el sistema actual (/)
ROOT_PART="$(findmnt -n -o SOURCE /)"
ROOT_DISK_NAME="$(lsblk -no PKNAME "$ROOT_PART" | head -n 1)"
if [ -z "$ROOT_DISK_NAME" ]; then
  echo "❌ No se pudo identificar el disco maestro del sistema ($ROOT_PART)."
  exit 1
fi
MASTER_DISK="/dev/$ROOT_DISK_NAME"

# Buscar discos externos / secundarios (excluyendo el disco maestro, loops y zram)
USB_PARTS=()
CLONE_DISKS=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  dname="$(echo "$line" | awk '{print $1}')"
  dtype="$(echo "$line" | awk '{print $2}')"
  [ "$dtype" != "disk" ] && continue
  [[ "$dname" == loop* ]] || [[ "$dname" == ram* ]] || [[ "$dname" == zram* ]] && continue
  [ "/dev/$dname" = "$MASTER_DISK" ] && continue

  size_bytes="$(lsblk -bno SIZE "/dev/$dname" 2>/dev/null | head -n 1)"
  if [ -n "$size_bytes" ] && [ "$size_bytes" -ge 28000000000 ]; then
    CLONE_DISKS+=("/dev/$dname")
  fi

  # Buscar la partición de datos más grande en este USB/disco externo para guardar archivos sin borrarlo
  best_part=""
  best_psize=0
  while IFS= read -r pline; do
    [ -z "$pline" ] && continue
    pname="$(echo "$pline" | awk '{print $1}')"
    ptype="$(echo "$pline" | awk '{print $2}')"
    psize="$(echo "$pline" | awk '{print $3}')"
    [ "$ptype" != "part" ] && continue
    if [ -n "$psize" ] && [ "$psize" -gt "$best_psize" ]; then
      best_psize="$psize"
      best_part="/dev/$pname"
    fi
  done < <(lsblk -bno NAME,TYPE,SIZE "/dev/$dname" 2>/dev/null)

  if [ -z "$best_part" ]; then
    disk_fstype="$(lsblk -dno FSTYPE "/dev/$dname" 2>/dev/null | tr -d ' ')"
    if [ -n "$disk_fstype" ]; then
      best_part="/dev/$dname"
    fi
  fi

  if [ -n "$best_part" ]; then
    USB_PARTS+=("$best_part")
  fi
done < <(lsblk -dn -o NAME,TYPE)

mount_first_usb() {
  if [ "${#USB_PARTS[@]}" -eq 0 ]; then
    echo ""
    return 1
  fi
  local part="${USB_PARTS[0]}"
  local mnt
  mnt="$(lsblk -no MOUNTPOINT "$part" 2>/dev/null | grep -v '^$' | head -n 1 || true)"
  if [ -z "$mnt" ]; then
    mnt="/mnt/aether_usb_drive"
    mkdir -p "$mnt"
    mount "$part" "$mnt"
  fi
  echo "$mnt"
}

print_disks_summary() {
  echo "===================================================================="
  echo "  💿 ESTADO DE DISCOS M.2 Y PENDRIVES USB EN EL MINI-PC"
  echo "===================================================================="
  local m_size m_model
  m_size="$(lsblk -dno SIZE "$MASTER_DISK" 2>/dev/null | tr -d ' ')"
  m_model="$(lsblk -dno MODEL "$MASTER_DISK" 2>/dev/null | sed 's/ *$//')"
  echo "  🔒 DISCO MAESTRO INTERNO (Protegido, no se borra):"
  echo "     👉 $MASTER_DISK  [${m_size:-?}]  ${m_model:-NVMe Interno}"
  echo "--------------------------------------------------------------------"
  if [ "${#USB_PARTS[@]}" -eq 0 ] && [ "${#CLONE_DISKS[@]}" -eq 0 ]; then
    echo "  ⚠️  NO HAY NINGÚN PENDRIVE USB NI DISCO EXTERNO ENCHUFADO."
    echo "     Enchufa cualquier Pendrive USB en este Mini-PC y vuelve a pulsar"
    echo "     este botón para verlo aquí."
  else
    for part in "${USB_PARTS[@]}"; do
      local p_size p_fstype p_label p_mnt free_h
      p_size="$(lsblk -dno SIZE "$part" 2>/dev/null | tr -d ' ')"
      p_fstype="$(lsblk -dno FSTYPE "$part" 2>/dev/null | tr -d ' ')"
      p_label="$(lsblk -dno LABEL "$part" 2>/dev/null | sed 's/ *$//')"
      p_mnt="$(lsblk -no MOUNTPOINT "$part" 2>/dev/null | grep -v '^$' | head -n 1 || true)"
      free_h=""
      if [ -n "$p_mnt" ]; then
        free_h=" · Libre: $(df --output=avail -h "$p_mnt" 2>/dev/null | tail -n 1 | tr -d ' ')"
      fi
      echo "  🔌 PENDRIVE / USB DETECTADO (Listo para guardar archivos sin borrarlo):"
      echo "     ✅ $part  [${p_size:-?} · ${p_fstype:-USB}${free_h}] ${p_label}"
    done
  fi
  echo "===================================================================="
}

MODE="${1:---list}"
TARGET_ARG="${2:-}"

if [ "$MODE" = "--list" ]; then
  print_disks_summary
  exit 0
fi

# ==============================================================================
# MODO 1: KIT INSTALADOR RÁPIDO EN PENDRIVE (TARDA 5 SEGUNDOS, CABE EN CUALQUIER USB)
# ==============================================================================
if [ "$MODE" = "--usb-kit" ]; then
  print_disks_summary
  USB_MNT="$(mount_first_usb || true)"
  if [ -z "$USB_MNT" ]; then
    echo "❌ Enchufa primero un Pendrive USB en el Mini-PC y vuelve a pulsar el botón."
    exit 1
  fi

  KIT_DIR="$USB_MNT/AETHER_KIT"
  mkdir -p "$KIT_DIR/backup_datos"

  echo "📦 Copiando tus configuraciones, shows DMX, patch y logos al Pendrive ($KIT_DIR)..."
  # Copiar ajustes de AETHER-VJ y logos/media subidos
  [ -f "$USER_HOME/resolumeplugin/aether-config.json" ] && cp -f "$USER_HOME/resolumeplugin/aether-config.json" "$KIT_DIR/backup_datos/" || true
  if [ -d "$USER_HOME/resolumeplugin/media" ]; then
    mkdir -p "$KIT_DIR/backup_datos/media"
    cp -rf "$USER_HOME/resolumeplugin/media/"* "$KIT_DIR/backup_datos/media/" 2>/dev/null || true
  fi
  if [ -d "/opt/planecreator/shows" ]; then
    mkdir -p "$KIT_DIR/backup_datos/shows"
    cp -rf /opt/planecreator/shows/* "$KIT_DIR/backup_datos/shows/" 2>/dev/null || true
  fi

  cat > "$KIT_DIR/INSTALAR_TODO_AQUI.sh" << 'EOF'
#!/usr/bin/env bash
set -e
if [ "$EUID" -ne 0 ]; then
  echo "Ejecutando con sudo..."
  exec sudo bash "$0" "$@"
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || ls -1 /home | head -n 1)}"
USER_HOME="$(eval echo "~$REAL_USER")"

echo "===================================================================="
echo "  🚀 INSTALANDO TODO EN ESTE MINI-PC NUEVO + COPIANDO TUS SHOWS"
echo "===================================================================="
curl -fsSL https://raw.githubusercontent.com/Gabichuelo/resolumeplugin/main/instalar-todo.sh | bash

# Restaurar tus ajustes exactos, logos, vídeos, patch DMX, direcciones y shows del Mini-PC Maestro
if [ -f "$SCRIPT_DIR/backup_datos/aether-config.json" ]; then
  cp -f "$SCRIPT_DIR/backup_datos/aether-config.json" "$USER_HOME/resolumeplugin/aether-config.json"
  chown "$REAL_USER:$REAL_USER" "$USER_HOME/resolumeplugin/aether-config.json" 2>/dev/null || true
fi
if [ -d "$SCRIPT_DIR/backup_datos/media" ]; then
  mkdir -p "$USER_HOME/resolumeplugin/media"
  cp -rf "$SCRIPT_DIR/backup_datos/media/"* "$USER_HOME/resolumeplugin/media/" 2>/dev/null || true
  chown -R "$REAL_USER:$REAL_USER" "$USER_HOME/resolumeplugin/media" 2>/dev/null || true
fi
systemctl restart aether-vj.service 2>/dev/null || true

if [ -d "$SCRIPT_DIR/backup_datos/shows" ] && [ -d "/opt/planecreator" ]; then
  mkdir -p /opt/planecreator/shows
  cp -rf "$SCRIPT_DIR/backup_datos/shows/"* /opt/planecreator/shows/ 2>/dev/null || true
  chown -R "$REAL_USER:$REAL_USER" /opt/planecreator/shows 2>/dev/null || true
  systemctl restart granddas-luces.service 2>/dev/null || true
fi

echo "===================================================================="
echo "  ✅ ¡MINI-PC NUEVO IDÉNTICO AL MAESTRO! Reiniciando en 5 segundos..."
echo "===================================================================="
sleep 5
reboot
EOF
  chmod +x "$KIT_DIR/INSTALAR_TODO_AQUI.sh" 2>/dev/null || true
  sync

  echo "===================================================================="
  echo "  ✅ ¡KIT CREADO EN TU PENDRIVE EN: $KIT_DIR!"
  echo "--------------------------------------------------------------------"
  echo "  CÓMO USARLO EN CADA MINI-PC NUEVO (con Xubuntu recién instalado"
  echo "  y cable de Internet conectado):"
  echo "    1) Enchufa este Pendrive y abre la carpeta AETHER_KIT"
  echo "    2) Abre Terminal ahí y escribe:"
  echo "       sudo bash INSTALAR_TODO_AQUI.sh"
  echo "    (Instalará AETHER-VJ + Luces SL04 + tus shows/patch/logos + sin claves"
  echo "     y se reiniciará solo ya terminado)."
  echo "===================================================================="
  exit 0
fi

# ==============================================================================
# MODO 2: ARCHIVO DE CLON COMPLETO OFFLINE EN PENDRIVE (16 GB+)
# ==============================================================================
if [ "$MODE" = "--usb-backup" ]; then
  print_disks_summary
  USB_MNT="$(mount_first_usb || true)"
  if [ -z "$USB_MNT" ]; then
    echo "❌ Enchufa primero un Pendrive USB (de 16 GB o más) en el Mini-PC."
    exit 1
  fi

  FREE_KB="$(df --output=avail -k "$USB_MNT" 2>/dev/null | tail -n 1 | tr -d ' ')"
  if [ -n "$FREE_KB" ] && [ "$FREE_KB" -lt 6000000 ]; then
    echo "❌ El Pendrive tiene menos de 6 GB libres. Usa un Pendrive de 16 GB o 32 GB."
    exit 1
  fi

  BKP_DIR="$USB_MNT/AETHER_CLON_COMPLETO"
  rm -rf "$BKP_DIR"
  mkdir -p "$BKP_DIR"

  echo "📦 Creando archivo de CLON COMPLETO en $BKP_DIR (tarda ~3-5 min)..."
  echo "   (Dividido automáticamente en trozos de 3.5 GB para funcionar incluso en USB FAT32)"

  OLD_ROOT_UUID="$(findmnt -n -o UUID /)"
  echo "$OLD_ROOT_UUID" > "$BKP_DIR/old_root_uuid.txt"

  # Guardar contenido de /boot/efi
  if mountpoint -q /boot/efi; then
    tar -czf "$BKP_DIR/efi.tar.gz" -C /boot/efi .
  fi

  # Guardar todo el sistema raíz comprimido (excluyendo virtuales, USB montados, cachés de apt y swap)
  sync
  tar --one-file-system --warning=no-file-changed \
    --exclude="./proc" \
    --exclude="./sys" \
    --exclude="./dev" \
    --exclude="./tmp" \
    --exclude="./run" \
    --exclude="./mnt" \
    --exclude="./media" \
    --exclude="./lost+found" \
    --exclude="./swapfile" \
    --exclude="./swap.img" \
    --exclude="./var/cache/apt/archives/*.deb" \
    -cpf - -C / . | gzip -1 | split -b 3500M - "$BKP_DIR/sistema.tar.gz.part." || [ "${PIPESTATUS[0]}" -le 1 ]

  # Crear el restaurador automático de 1 clic dentro del Pendrive
  cat > "$BKP_DIR/RESTAURAR_AQUI.sh" << 'EOF'
#!/usr/bin/env bash
set -e
if [ "$EUID" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Proteger el propio Pendrive USB desde el que estamos leyendo
SRC_DEV="$(df --output=source "$SCRIPT_DIR" | tail -n 1 | tr -d ' ')"
SRC_PK="$(lsblk -no PKNAME "$SRC_DEV" 2>/dev/null | head -n 1)"
SRC_DISK="${SRC_PK:+/dev/$SRC_PK}"
SRC_DISK="${SRC_DISK:-$SRC_DEV}"

# Buscar el M.2 NVMe o SSD SATA interno del Mini-PC nuevo
TARGET_DISK=""
if [ -b /dev/nvme0n1 ] && [ "/dev/nvme0n1" != "$SRC_DISK" ]; then
  TARGET_DISK="/dev/nvme0n1"
else
  while IFS= read -r dline; do
    dn="$(echo "$dline" | awk '{print $1}')"
    dt="$(echo "$dline" | awk '{print $2}')"
    tr="$(echo "$dline" | awk '{print $3}')"
    [ "$dt" != "disk" ] && continue
    [ "/dev/$dn" = "$SRC_DISK" ] && continue
    if [ "$tr" = "nvme" ] || [ "$tr" = "sata" ] || [ "$tr" = "ata" ]; then
      TARGET_DISK="/dev/$dn"
      break
    fi
  done < <(lsblk -dn -o NAME,TYPE,TRAN)
fi

if [ -z "$TARGET_DISK" ]; then
  echo "❌ No se detectó ningún M.2 NVMe ni SSD interno en este Mini-PC."
  lsblk
  exit 1
fi

if [ "$TARGET_DISK" = "$SRC_DISK" ] || [ "$TARGET_DISK" = "/dev/$(lsblk -no PKNAME "$(findmnt -n -o SOURCE /)" 2>/dev/null | head -n 1)" ]; then
  echo "❌ Estás ejecutando esto sobre el disco activo actual. Arranca primero con un USB Live ('Try Xubuntu')."
  exit 1
fi

echo "===================================================================="
echo "  🚀 VOLCANDO CLON COMPLETO AL DISCO INTERNO ($TARGET_DISK)"
echo "===================================================================="
for p in $(lsblk -ln -o NAME "$TARGET_DISK" | tail -n +2); do
  umount -f "/dev/$p" 2>/dev/null || true
  swapoff "/dev/$p" 2>/dev/null || true
done
wipefs -a "$TARGET_DISK" >/dev/null 2>&1 || true

parted -s "$TARGET_DISK" mklabel gpt
parted -s "$TARGET_DISK" mkpart ESP fat32 1MiB 513MiB
parted -s "$TARGET_DISK" set 1 esp on
parted -s "$TARGET_DISK" mkpart primary ext4 513MiB 100%
partprobe "$TARGET_DISK" 2>/dev/null || true
sleep 2

if [[ "$TARGET_DISK" == *"nvme"* ]] || [[ "$TARGET_DISK" == *"mmcblk"* ]]; then
  EFI_PART="${TARGET_DISK}p1"
  ROOT_NEW_PART="${TARGET_DISK}p2"
else
  EFI_PART="${TARGET_DISK}1"
  ROOT_NEW_PART="${TARGET_DISK}2"
fi
mkfs.vfat -F 32 -n "EFI" "$EFI_PART" >/dev/null
mkfs.ext4 -F -L "aether-root" "$ROOT_NEW_PART" >/dev/null

NEW_EFI_UUID="$(blkid -s UUID -o value "$EFI_PART")"
NEW_ROOT_UUID="$(blkid -s UUID -o value "$ROOT_NEW_PART")"
OLD_ROOT_UUID="$(cat "$SCRIPT_DIR/old_root_uuid.txt" 2>/dev/null || true)"

MNT_DIR="/mnt/aether_restore"
mkdir -p "$MNT_DIR"
mount "$ROOT_NEW_PART" "$MNT_DIR"
mkdir -p "$MNT_DIR/boot/efi"
mount "$EFI_PART" "$MNT_DIR/boot/efi"

echo "⏳ Descomprimiendo todo el sistema en $TARGET_DISK (tarda ~2 min)..."
cat "$SCRIPT_DIR"/sistema.tar.gz.part.* | tar -xzpf - -C "$MNT_DIR"
if [ -f "$SCRIPT_DIR/efi.tar.gz" ]; then
  tar -xzf "$SCRIPT_DIR/efi.tar.gz" -C "$MNT_DIR/boot/efi" --no-same-owner 2>/dev/null || true
fi

mkdir -p "$MNT_DIR"/{dev,proc,sys,tmp,run,mnt,media}
chmod 1777 "$MNT_DIR/tmp"

cat > "$MNT_DIR/etc/fstab" <<FSTAB
UUID=$NEW_ROOT_UUID /               ext4    errors=remount-ro 0       1
UUID=$NEW_EFI_UUID  /boot/efi       vfat    umask=0077        0       1
FSTAB

if [ -n "$OLD_ROOT_UUID" ]; then
  for gcfg in "$MNT_DIR/boot/grub/grub.cfg" "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"; do
    [ -f "$gcfg" ] && sed -i "s/$OLD_ROOT_UUID/$NEW_ROOT_UUID/g" "$gcfg"
  done
fi

if [ -d "$MNT_DIR/boot/efi/EFI/ubuntu" ]; then
  mkdir -p "$MNT_DIR/boot/efi/EFI/BOOT"
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/BOOTX64.EFI" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/grubx64.efi" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi" ]   && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi"   "$MNT_DIR/boot/efi/EFI/BOOT/mmx64.efi"   || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" ]    && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg"    "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"    || true
fi

rm -f "$MNT_DIR/etc/machine-id" "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true
systemd-machine-id-setup --root="$MNT_DIR" 2>/dev/null || true
ln -sf /etc/machine-id "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true

sync
umount "$MNT_DIR/boot/efi"
umount "$MNT_DIR"
sync

echo "===================================================================="
echo "  ✅ ¡CLONADO COMPLETADO AL 100%! Apaga, quita los USB y enciende."
echo "===================================================================="
EOF
  chmod +x "$BKP_DIR/RESTAURAR_AQUI.sh" 2>/dev/null || true
  sync

  USED_SIZE="$(du -sh "$BKP_DIR" 2>/dev/null | cut -f1)"
  echo "===================================================================="
  echo "  ✅ ¡CLON COMPLETO GUARDADO EN TU PENDRIVE ($BKP_DIR · ${USED_SIZE:-OK})!"
  echo "--------------------------------------------------------------------"
  echo "  CÓMO VOLCARLO EN CUALQUIER MINI-PC VIRGEN (SIN INTERNET):"
  echo "    1) Arranca el Mini-PC nuevo con tu USB de Xubuntu ('Try Xubuntu')"
  echo "    2) Enchufa este Pendrive, abre la carpeta AETHER_CLON_COMPLETO"
  echo "    3) Abre Terminal ahí y escribe:"
  echo "       sudo bash RESTAURAR_AQUI.sh"
  echo "    En 2 minutos el M.2 nuevo queda 100% clonado tal cual."
  echo "===================================================================="
  exit 0
fi

# ==============================================================================
# MODO 3: CLONADO DIRECTO DISCO A DISCO (SI HAY OTRO M.2 CONECTADO)
# ==============================================================================
if [ "$MODE" != "--clone" ]; then
  echo "Uso: sudo bash clonar-m2.sh [--list | --usb-kit | --usb-backup | --clone]"
  exit 1
fi

print_disks_summary

TARGET_DISK=""
if [ -n "$TARGET_ARG" ]; then
  TARGET_DISK="$TARGET_ARG"
elif [ "${#CLONE_DISKS[@]}" -eq 1 ]; then
  TARGET_DISK="${CLONE_DISKS[0]}"
elif [ "${#CLONE_DISKS[@]}" -eq 0 ]; then
  echo "❌ Conecta primero el disco M.2 destino (o usa '💾 Guardar Clon en Pendrive USB' si solo tienes un Pendrive)."
  exit 1
else
  echo "❌ Hay varios discos externos conectados (${CLONE_DISKS[*]}). Deja solo el disco destino."
  exit 1
fi

if [ "$TARGET_DISK" = "$MASTER_DISK" ]; then
  echo "❌ BLOQUEO DE SEGURIDAD: $TARGET_DISK es el disco maestro activo."
  exit 1
fi

echo ""
echo "🚀 INICIANDO CLONADO DIRECTO: $MASTER_DISK  ━━▶  $TARGET_DISK"
apt-get install -y rsync parted dosfstools e2fsprogs 2>/dev/null || true

for p in $(lsblk -ln -o NAME "$TARGET_DISK" | tail -n +2); do
  umount -f "/dev/$p" 2>/dev/null || true
  swapoff "/dev/$p" 2>/dev/null || true
done
wipefs -a "$TARGET_DISK" >/dev/null 2>&1 || true

parted -s "$TARGET_DISK" mklabel gpt
parted -s "$TARGET_DISK" mkpart ESP fat32 1MiB 513MiB
parted -s "$TARGET_DISK" set 1 esp on
parted -s "$TARGET_DISK" mkpart primary ext4 513MiB 100%
partprobe "$TARGET_DISK" 2>/dev/null || true
sleep 2

if [[ "$TARGET_DISK" == *"nvme"* ]] || [[ "$TARGET_DISK" == *"mmcblk"* ]]; then
  EFI_PART="${TARGET_DISK}p1"
  ROOT_NEW_PART="${TARGET_DISK}p2"
else
  EFI_PART="${TARGET_DISK}1"
  ROOT_NEW_PART="${TARGET_DISK}2"
fi

mkfs.vfat -F 32 -n "EFI" "$EFI_PART" >/dev/null
mkfs.ext4 -F -L "aether-root" "$ROOT_NEW_PART" >/dev/null

NEW_EFI_UUID="$(blkid -s UUID -o value "$EFI_PART")"
NEW_ROOT_UUID="$(blkid -s UUID -o value "$ROOT_NEW_PART")"
OLD_ROOT_UUID="$(findmnt -n -o UUID /)"

MNT_DIR="/mnt/aether_m2_clone"
mkdir -p "$MNT_DIR"
mount "$ROOT_NEW_PART" "$MNT_DIR"
mkdir -p "$MNT_DIR/boot/efi"
mount "$EFI_PART" "$MNT_DIR/boot/efi"

sync
rsync -aAXHx --numeric-ids \
  --exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found","/swapfile","/swap.img"} \
  / "$MNT_DIR/"

if mountpoint -q /boot/efi; then
  rsync -rt --inplace /boot/efi/ "$MNT_DIR/boot/efi/"
fi

mkdir -p "$MNT_DIR"/{dev,proc,sys,tmp,run,mnt,media}
chmod 1777 "$MNT_DIR/tmp"

cat > "$MNT_DIR/etc/fstab" <<EOF
UUID=$NEW_ROOT_UUID /               ext4    errors=remount-ro 0       1
UUID=$NEW_EFI_UUID  /boot/efi       vfat    umask=0077        0       1
EOF

if [ -n "$OLD_ROOT_UUID" ]; then
  for gcfg in "$MNT_DIR/boot/grub/grub.cfg" "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"; do
    [ -f "$gcfg" ] && sed -i "s/$OLD_ROOT_UUID/$NEW_ROOT_UUID/g" "$gcfg"
  done
fi

if [ -d "$MNT_DIR/boot/efi/EFI/ubuntu" ]; then
  mkdir -p "$MNT_DIR/boot/efi/EFI/BOOT"
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/BOOTX64.EFI" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/grubx64.efi" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi" ]   && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi"   "$MNT_DIR/boot/efi/EFI/BOOT/mmx64.efi"   || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" ]    && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg"    "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"    || true
fi

rm -f "$MNT_DIR/etc/machine-id" "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true
systemd-machine-id-setup --root="$MNT_DIR" 2>/dev/null || true
ln -sf /etc/machine-id "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true

sync
umount "$MNT_DIR/boot/efi"
umount "$MNT_DIR"
rmdir "$MNT_DIR" 2>/dev/null || true
sync

echo "✅ ¡CLONACIÓN COMPLETADA EN $TARGET_DISK!"
