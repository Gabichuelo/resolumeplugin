#!/usr/bin/env bash
# ==============================================================================
# AETHER-VJ + GRANDDAS: CLONADOR INTELIGENTE DE M.2 NVMe EN CALIENTE (1 CLIC)
# ==============================================================================
# Clona este Mini-PC Maestro directamente a otro disco M.2 (conectado por
# carcasa USB-a-NVMe o en una 2ª ranura M.2 de la placa) en ~1-2 minutos:
#   • Funciona aunque el M.2 nuevo sea más pequeño (ej. 256GB -> 128GB) o más grande.
#   • Copia solo los ~8-10 GB usados reales (no los 240 GB vacíos) -> 5x más rápido.
#   • Crea sistema de archivos ext4 limpio (sin errores de clonado en caliente).
#   • Genera nuevos UUIDs y nuevo /etc/machine-id para que no choquen las IPs en el router.
#   • Instala arranque UEFI universal (/EFI/BOOT/BOOTX64.EFI) listo para cualquier Mini-PC.
#
# Modos de uso:
#   sudo bash clonar-m2.sh --list              # Ver disco maestro y discos destino detectados
#   sudo bash clonar-m2.sh --clone             # Clonar automáticamente si hay 1 único disco destino
#   sudo bash clonar-m2.sh --clone /dev/sda    # Clonar al disco indicado explícitamente
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Ejecuta con sudo: sudo bash clonar-m2.sh --list"
  exit 1
fi

# Detectar disco físico donde está montado el sistema actual (/)
ROOT_PART="$(findmnt -n -o SOURCE /)"
ROOT_DISK_NAME="$(lsblk -no PKNAME "$ROOT_PART" | head -n 1)"
if [ -z "$ROOT_DISK_NAME" ]; then
  echo "❌ No se pudo identificar el disco maestro del sistema ($ROOT_PART)."
  exit 1
fi
MASTER_DISK="/dev/$ROOT_DISK_NAME"

# Buscar discos físicos candidatos a destino (excluyendo el disco maestro, loops y zram)
CANDIDATES=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  dname="$(echo "$line" | awk '{print $1}')"
  dtype="$(echo "$line" | awk '{print $2}')"
  [ "$dtype" != "disk" ] && continue
  [[ "$dname" == loop* ]] || [[ "$dname" == ram* ]] || [[ "$dname" == zram* ]] && continue
  [ "/dev/$dname" = "$MASTER_DISK" ] && continue
  size_bytes="$(lsblk -bno SIZE "/dev/$dname" 2>/dev/null | head -n 1)"
  # Exigir al menos 28 GB para que quepa Ubuntu + AETHER + Luces holgadamente
  if [ -n "$size_bytes" ] && [ "$size_bytes" -ge 28000000000 ]; then
    CANDIDATES+=("/dev/$dname")
  fi
done < <(lsblk -dn -o NAME,TYPE)

print_disks_summary() {
  echo "===================================================================="
  echo "  💿 ESTADO DE DISCOS M.2 / USB DETECTADOS EN EL MINI-PC"
  echo "===================================================================="
  local m_size m_model
  m_size="$(lsblk -dno SIZE "$MASTER_DISK" 2>/dev/null | tr -d ' ')"
  m_model="$(lsblk -dno MODEL "$MASTER_DISK" 2>/dev/null | sed 's/ *$//')"
  echo "  🔒 DISCO MAESTRO (Sistema actual - PROTEGIDO, NO SE TOCA):"
  echo "     👉 $MASTER_DISK  [${m_size:-?}]  ${m_model:-NVMe Interno}"
  echo "--------------------------------------------------------------------"
  if [ "${#CANDIDATES[@]}" -eq 0 ]; then
    echo "  ⚠️  NO HAY NINGÚN OTRO DISCO M.2 / SSD CONECTADO AHORA MISMO."
    echo "     Conecta el M.2 nuevo mediante un adaptador USB-a-NVMe (o en la"
    echo "     2ª ranura M.2 de la placa) y vuelve a pulsar '💿 Ver Discos'."
  else
    echo "  🎯 DISCO(S) DESTINO LISTOS PARA CLONAR:"
    for dev in "${CANDIDATES[@]}"; do
      local d_size d_model d_tran
      d_size="$(lsblk -dno SIZE "$dev" 2>/dev/null | tr -d ' ')"
      d_model="$(lsblk -dno MODEL "$dev" 2>/dev/null | sed 's/ *$//')"
      d_tran="$(lsblk -dno TRAN "$dev" 2>/dev/null | tr -d ' ')"
      echo "     ✅ $dev  [${d_size:-?}]  (${d_tran:-disco})  ${d_model:-SSD/NVMe}"
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

if [ "$MODE" != "--clone" ]; then
  echo "Uso: sudo bash clonar-m2.sh [--list | --clone [/dev/sdX]]"
  exit 1
fi

print_disks_summary

TARGET_DISK=""
if [ -n "$TARGET_ARG" ]; then
  TARGET_DISK="$TARGET_ARG"
elif [ "${#CANDIDATES[@]}" -eq 1 ]; then
  TARGET_DISK="${CANDIDATES[0]}"
elif [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "❌ Error: Conecta primero el disco M.2 destino por adaptador USB-a-NVMe (o 2ª ranura M.2)."
  exit 1
else
  echo "❌ Hay varios discos externos conectados (${CANDIDATES[*]}). Desconecta los demás y deja solo el M.2 a clonar."
  exit 1
fi

if [ "$TARGET_DISK" = "$MASTER_DISK" ]; then
  echo "❌ BLOQUEO DE SEGURIDAD: $TARGET_DISK es el disco maestro activo."
  exit 1
fi

if [ ! -b "$TARGET_DISK" ]; then
  echo "❌ El dispositivo $TARGET_DISK no existe."
  exit 1
fi

echo ""
echo "🚀 INICIANDO CLONADO INTELIGENTE: $MASTER_DISK  ━━▶  $TARGET_DISK"
echo "⏳ Instalando utilidades si faltan (parted, rsync, dosfstools)..."
apt-get install -y rsync parted dosfstools e2fsprogs 2>/dev/null || true

# 1. Desmontar cualquier partición montada del disco destino
echo "[1/6] Preparando y limpiando particiones previas en $TARGET_DISK..."
for p in $(lsblk -ln -o NAME "$TARGET_DISK" | tail -n +2); do
  umount -f "/dev/$p" 2>/dev/null || true
  swapoff "/dev/$p" 2>/dev/null || true
done
wipefs -a "$TARGET_DISK" >/dev/null 2>&1 || true

# 2. Crear tabla GPT universal: Partición 1 = 512MB EFI (FAT32), Partición 2 = Resto del M.2 (ext4)
echo "[2/6] Creando particiones UEFI + Ubuntu en $TARGET_DISK (adaptado al 100% de su tamaño)..."
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

# 3. Formatear particiones limpias
echo "[3/6] Formateando EFI ($EFI_PART) y Sistema ($ROOT_NEW_PART)..."
mkfs.vfat -F 32 -n "EFI" "$EFI_PART" >/dev/null
mkfs.ext4 -F -L "aether-root" "$ROOT_NEW_PART" >/dev/null

NEW_EFI_UUID="$(blkid -s UUID -o value "$EFI_PART")"
NEW_ROOT_UUID="$(blkid -s UUID -o value "$ROOT_NEW_PART")"
OLD_ROOT_UUID="$(findmnt -n -o UUID /)"
OLD_EFI_UUID="$(findmnt -n -o UUID /boot/efi 2>/dev/null || true)"

MNT_DIR="/mnt/aether_m2_clone"
mkdir -p "$MNT_DIR"
mount "$ROOT_NEW_PART" "$MNT_DIR"
mkdir -p "$MNT_DIR/boot/efi"
mount "$EFI_PART" "$MNT_DIR/boot/efi"

# 4. Copiar todos los archivos del sistema en caliente con rsync (ultra rápido, salta espacio vacío)
echo "[4/6] Copiando sistema Ubuntu + AETHER-VJ + GrandDas SL04 (tarda ~1-2 min)..."
sync
rsync -aAXHx --numeric-ids \
  --exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found","/swapfile","/swap.img"} \
  / "$MNT_DIR/"

if mountpoint -q /boot/efi; then
  rsync -rt --inplace /boot/efi/ "$MNT_DIR/boot/efi/"
fi

mkdir -p "$MNT_DIR"/{dev,proc,sys,tmp,run,mnt,media}
chmod 1777 "$MNT_DIR/tmp"

# 5. Actualizar UUIDs en /etc/fstab y GRUB UEFI + generar identidad de red única (/etc/machine-id)
echo "[5/6] Configurando arranque UEFI universal e identidad única para el nuevo Mini-PC..."
cat > "$MNT_DIR/etc/fstab" <<EOF
# AETHER-VJ Cloned M.2 fstab
UUID=$NEW_ROOT_UUID /               ext4    errors=remount-ro 0       1
UUID=$NEW_EFI_UUID  /boot/efi       vfat    umask=0077        0       1
EOF

if [ -n "$OLD_ROOT_UUID" ]; then
  for gcfg in \
    "$MNT_DIR/boot/grub/grub.cfg" \
    "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" \
    "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"; do
    if [ -f "$gcfg" ]; then
      sed -i "s/$OLD_ROOT_UUID/$NEW_ROOT_UUID/g" "$gcfg"
    fi
  done
fi

# Asegurar cargador UEFI universal /EFI/BOOT/BOOTX64.EFI para que cualquier placa Lenovo/Intel arranque a la primera
if [ -d "$MNT_DIR/boot/efi/EFI/ubuntu" ]; then
  mkdir -p "$MNT_DIR/boot/efi/EFI/BOOT"
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/shimx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/BOOTX64.EFI" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" ] && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grubx64.efi" "$MNT_DIR/boot/efi/EFI/BOOT/grubx64.efi" || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi" ]   && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/mmx64.efi"   "$MNT_DIR/boot/efi/EFI/BOOT/mmx64.efi"   || true
  [ -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg" ]    && cp -f "$MNT_DIR/boot/efi/EFI/ubuntu/grub.cfg"    "$MNT_DIR/boot/efi/EFI/BOOT/grub.cfg"    || true
fi

# Nuevo machine-id para que el router nunca confunda 2 Mini-PCs clonados con la misma IP
rm -f "$MNT_DIR/etc/machine-id" "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true
systemd-machine-id-setup --root="$MNT_DIR" 2>/dev/null || dbus-uuidgen --ensure="$MNT_DIR/etc/machine-id" 2>/dev/null || true
ln -sf /etc/machine-id "$MNT_DIR/var/lib/dbus/machine-id" 2>/dev/null || true

# 6. Sincronizar y desmontar de forma segura
echo "[6/6] Cerrando y sincronizando el nuevo M.2..."
sync
umount "$MNT_DIR/boot/efi"
umount "$MNT_DIR"
rmdir "$MNT_DIR" 2>/dev/null || true
sync

echo "===================================================================="
echo "  ✅ ¡CLONACIÓN COMPLETADA CON ÉXITO EN $TARGET_DISK!"
echo "--------------------------------------------------------------------"
echo "  Ya puedes desconectar el M.2 clonado, pincharlo en el otro Mini-PC"
echo "  y encenderlo directamente: arrancará sin pedir claves, con red"
echo "  automática, AETHER-VJ y GrandDas Luces SL04 listos."
echo "===================================================================="
