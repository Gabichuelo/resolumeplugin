$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $Root
$Build = Join-Path $Root '.build'
$OutApk = Join-Path $RepoRoot 'AETHER-VJ-Manager.apk'

$Sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$PlatformJar = Join-Path $Sdk 'platforms\android-34\android.jar'
$BuildTools = Join-Path $Sdk 'build-tools\36.0.0'
$JbrRoot = 'C:\Program Files\Android\Android Studio\jbr'
$JbrBin = Join-Path $JbrRoot 'bin'
$env:JAVA_HOME = $JbrRoot
$env:PATH = "$JbrBin;$env:PATH"

$Aapt2 = Join-Path $BuildTools 'aapt2.exe'
$D8 = Join-Path $BuildTools 'd8.bat'
$ZipAlign = Join-Path $BuildTools 'zipalign.exe'
$ApkSigner = Join-Path $BuildTools 'apksigner.bat'
$Javac = Join-Path $JbrBin 'javac.exe'
$Keytool = Join-Path $JbrBin 'keytool.exe'

if (Test-Path $Build) {
  Get-ChildItem $Build -Exclude 'debug.keystore' | Remove-Item -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $Build, "$Build\res-compiled", "$Build\gen", "$Build\obj", "$Build\dex" | Out-Null

Write-Host '[1/5] Compiling Android resources with aapt2...'
& $Aapt2 compile --dir (Join-Path $Root 'res') -o "$Build\res-compiled\resources.zip"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '[2/5] Linking resources & generating R.java...'
& $Aapt2 link `
  -o "$Build\unaligned.apk" `
  -I $PlatformJar `
  --manifest (Join-Path $Root 'AndroidManifest.xml') `
  --java "$Build\gen" `
  --min-sdk-version 26 `
  --target-sdk-version 34 `
  --auto-add-overlay `
  -R "$Build\res-compiled\resources.zip"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '[3/5] Compiling Java sources...'
$JavaFiles = @(Get-ChildItem -Path (Join-Path $Root 'src'), "$Build\gen" -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName)
& $Javac --release 11 -classpath $PlatformJar -d "$Build\obj" @JavaFiles
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '[4/5] Converting bytecode to DEX with d8...'
$ClassFiles = @(Get-ChildItem -Path "$Build\obj" -Recurse -Filter '*.class' | Select-Object -ExpandProperty FullName)
& $D8 --lib $PlatformJar --min-api 26 --output "$Build\dex" @ClassFiles
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '[5/5] Packaging, zipaligning, and signing APK...'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Zip = [System.IO.Compression.ZipFile]::Open("$Build\unaligned.apk", [System.IO.Compression.ZipArchiveMode]::Update)
try {
  $DexPath = "$Build\dex\classes.dex"
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($Zip, $DexPath, 'classes.dex') | Out-Null
} finally {
  $Zip.Dispose()
}

& $ZipAlign -f -p 4 "$Build\unaligned.apk" "$Build\aligned.apk"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Keystore = Join-Path $Build 'debug.keystore'
if (-not (Test-Path $Keystore)) {
  & $Keytool -genkeypair -v `
    -keystore $Keystore `
    -storepass aetherdebug `
    -alias aetherdebug `
    -keypass aetherdebug `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -dname 'CN=AETHER-VJ, OU=Stage, O=AETHER, L=Teruel, S=AR, C=ES'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& $ApkSigner sign `
  --ks $Keystore `
  --ks-key-alias aetherdebug `
  --ks-pass pass:aetherdebug `
  --key-pass pass:aetherdebug `
  --out $OutApk `
  "$Build\aligned.apk"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $ApkSigner verify --print-certs $OutApk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Aapt2 dump badging $OutApk | Select-Object -First 8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ("`n✅ APK READY: " + $OutApk + " (" + [math]::Round((Get-Item $OutApk).Length / 1KB, 1) + " KB)")
