<#
  AETHER-VJ: enciende la "Zona con cobertura inalámbrica móvil" de Windows (Mobile Hotspot)
  con la red AETHER-VJ, para que los móviles se conecten directamente al PC sin router.

  Uso (normalmente con doble clic en INICIAR-HOTSPOT-WINDOWS.bat):
    powershell -ExecutionPolicy Bypass -File INICIAR-HOTSPOT-WINDOWS.ps1 [-Ssid AETHER-VJ] [-Pass aethervj2026] [-Off]
#>
param(
  [string]$Ssid = 'AETHER-VJ',
  [string]$Pass = 'aethervj2026',
  [switch]$Off
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$HotspotIp = '192.168.137.1'   # IP fija que usa Windows para su zona con cobertura
$ServerPort = 8080

function Write-Info($msg) { Write-Host "[AETHER-VJ] $msg" }

function Show-RenameTip {
  $name = $env:COMPUTERNAME
  Write-Host ''
  Write-Host '--------------------------------------------------------------------'
  if ($name -and $name.ToLower() -eq 'aether') {
    Write-Host '  ✅ Este PC ya se llama "aether": los móviles pueden abrir http://aether.local'
  } else {
    Write-Host "  💡 Este PC se llama ""$name"". Para que funcione http://aether.local :"
    Write-Host '     Configuración > Sistema > Información > "Cambiar el nombre de este PC" → aether'
    Write-Host '     (o en PowerShell como administrador:  Rename-Computer -NewName aether  y reiniciar)'
    Write-Host '     Mientras tanto usa la IP de abajo.'
  }
  Write-Host '--------------------------------------------------------------------'
}

function Show-Urls {
  Write-Host ''
  Write-Host '===================================================================='
  Write-Host '  ✅ WI-FI PROPIO ACTIVO'
  Write-Host '--------------------------------------------------------------------'
  Write-Host "  📡  Red Wi-Fi (SSID):   $Ssid"
  Write-Host "  🔒  Contraseña:         $Pass"
  Write-Host "  📱  En el móvil abre:   http://${HotspotIp}:${ServerPort}/remote.html"
  Write-Host "      (si el servidor tiene el puerto 80: http://$HotspotIp  o  http://aether.local)"
  Write-Host '  ▶   Ahora abre INICIAR-SERVIDOR-WIFI.bat si no lo has abierto ya.'
  Write-Host '      Si Windows pregunta por el Firewall, pulsa "Permitir" (redes privadas y públicas).'
  Write-Host '===================================================================='
}

function Show-ManualSteps($reason) {
  Write-Host ''
  Write-Host '===================================================================='
  Write-Host '  ⚠️  NO SE PUDO ENCENDER EL WI-FI PROPIO AUTOMÁTICAMENTE'
  if ($reason) { Write-Host "      Motivo: $reason" }
  Write-Host '--------------------------------------------------------------------'
  Write-Host '  Hazlo a mano (te abro la pantalla ahora mismo):'
  Write-Host '   1. Configuración > Red e Internet > Zona con cobertura inalámbrica móvil'
  Write-Host '   2. Pulsa "Editar" / "Propiedades" y pon:'
  Write-Host "        Nombre de red:  $Ssid"
  Write-Host "        Contraseña:     $Pass"
  Write-Host '   3. Activa el interruptor "Zona con cobertura inalámbrica móvil".'
  Write-Host '   Nota: en algunos Windows hace falta estar conectado a una red (cable o Wi-Fi)'
  Write-Host '         para poder activarla. Si no hay red, usa un router o el script de Linux.'
  Write-Host "  📱  Luego, en el móvil:  http://${HotspotIp}:${ServerPort}/remote.html"
  Write-Host '===================================================================='
  try { Start-Process 'ms-settings:network-mobilehotspot' } catch { }
}

# ---------------------------------------------------------------------------
# Ayudantes estándar para esperar operaciones asíncronas de WinRT desde PowerShell
# ---------------------------------------------------------------------------
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$script:AsTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
$script:AsTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction'
  })[0]

function Await($WinRtTask, $ResultType) {
  $asTask = $script:AsTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $null = $netTask.Wait(-1)
  $netTask.Result
}

function AwaitAction($WinRtAction) {
  $netTask = $script:AsTaskAction.Invoke($null, @($WinRtAction))
  $null = $netTask.Wait(-1)
}

# Tipos WinRT
$null = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]
$null = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]
$null = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]

function Get-TetheringManager {
  # 1º la conexión con Internet; si no hay, probar cualquier otra conexión del equipo
  $profiles = @()
  $inet = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
  if ($inet) { $profiles += $inet }
  try { $profiles += [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles() } catch { }
  foreach ($p in $profiles) {
    if (-not $p) { continue }
    try {
      $tm = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($p)
      if ($tm) { return $tm }
    } catch { }
  }
  return $null
}

try {
  $tm = Get-TetheringManager
  if (-not $tm) {
    Show-ManualSteps 'No hay ninguna conexión de red activa que Windows pueda compartir.'
    Show-RenameTip
    exit 1
  }

  if ($Off) {
    if ($tm.TetheringOperationalState -eq 'On') {
      $r = Await ($tm.StopTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
      Write-Info "Wi-Fi propio apagado ($($r.Status))."
    } else {
      Write-Info 'El Wi-Fi propio ya estaba apagado.'
    }
    exit 0
  }

  if ($Pass.Length -lt 8) { throw 'La contraseña debe tener al menos 8 caracteres.' }

  $cfg = $tm.GetCurrentAccessPointConfiguration()
  $needsConfig = ($cfg.Ssid -ne $Ssid) -or ($cfg.Passphrase -ne $Pass)

  if ($tm.TetheringOperationalState -eq 'On' -and -not $needsConfig) {
    Write-Info 'El Wi-Fi propio ya estaba encendido con la red correcta.'
    Show-Urls
    Show-RenameTip
    exit 0
  }

  if ($needsConfig) {
    if ($tm.TetheringOperationalState -eq 'On') {
      Write-Info 'Reiniciando la zona con cobertura para aplicar el nuevo nombre/contraseña...'
      $null = Await ($tm.StopTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
    }
    Write-Info "Configurando red '$Ssid'..."
    $cfg.Ssid = $Ssid
    $cfg.Passphrase = $Pass
    AwaitAction ($tm.ConfigureAccessPointAsync($cfg))
  }

  Write-Info 'Encendiendo la zona con cobertura inalámbrica móvil...'
  $result = Await ($tm.StartTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
  if ($result.Status -ne 'Success') {
    $msg = "$($result.Status)"
    if ($result.AdditionalErrorMessage) { $msg += " - $($result.AdditionalErrorMessage)" }
    Show-ManualSteps $msg
    Show-RenameTip
    exit 1
  }

  Show-Urls
  Show-RenameTip
  exit 0
} catch {
  Show-ManualSteps $_.Exception.Message
  Show-RenameTip
  exit 1
}
