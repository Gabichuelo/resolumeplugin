/**
 * AETHER-VJ: Zero-Dependency Wi-Fi Remote & Kiosk Server (Raspberry Pi / Mini-PC / Windows)
 *
 * Control de acceso por Contraseña / PIN con 2 roles:
 *   - PIN TÉCNICO (Control Total): por defecto "1234" (configurable con ADMIN_PIN o desde la consola)
 *   - PIN DJ INVITADO (Solo subir y animar su Logo PNG): por defecto "dj" (configurable con DJ_PIN)
 *
 * Seguridad:
 *   - Las rutas sensibles (/api/network-info, /api/master-status, /api/config, canal maestro de eventos)
 *     solo responden a la propia máquina (localhost). Ningún móvil puede leer ni cambiar los PIN.
 *   - Cambiar los PIN exige estar en la propia máquina o conocer el PIN de técnico actual.
 *   - Bloqueo temporal por IP tras varios intentos fallidos de contraseña (anti fuerza bruta).
 *
 * Persistencia:
 *   - aether-config.json guarda Mapping, Slices, Brillo, Presets, Memorias de Logos y PINs,
 *     para que la caja arranque calibrada aunque se vaya la luz.
 *
 * Vídeos / GIF del DJ:
 *   - POST /api/media-upload?name=<fichero>  (cuerpo binario crudo, cabecera X-Aether-Pin dj/admin o local)
 *   - GET  /api/media-list                   (cabecera X-Aether-Pin cualquier rol o local)
 *   - POST /api/media-delete  {pin, file}    (rol admin o local)
 *   - Estáticos /media/* con soporte HTTP Range (206) para <video loop>
 *
 * Red:
 *   - Escucha en PORT (8080 por defecto) y además en el puerto 80 si hay permisos → http://aether.local
 *   - GET / desde un móvil (IP no local) redirige a /remote.html
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const FRIENDLY_PORT = 80;
const CONFIG_FILE = path.join(__dirname, 'aether-config.json');
const CONFIG_TMP_FILE = CONFIG_FILE + '.tmp';
const MEDIA_DIR = path.join(__dirname, 'media');

const MAX_FAILED_ATTEMPTS = 6;
const LOCKOUT_MS = 60 * 1000;

// Límites de la carpeta de vídeos/GIF del DJ
const MEDIA_MAX_FILE_BYTES = 300 * 1024 * 1024;        // 300 MB por fichero
const MEDIA_MAX_TOTAL_BYTES = 4 * 1024 * 1024 * 1024;  // 4 GB en total dentro de media/

// Extensiones aceptadas y su tipo para el motor
const MEDIA_KINDS = {
  '.mp4': 'video',
  '.webm': 'video',
  '.mov': 'video',
  '.m4v': 'video',
  '.gif': 'gif',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image'
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
};

// Ficheros que nunca se sirven por HTTP (contienen PINs y logos privados)
const BLOCKED_STATIC_FILES = new Set(['aether-config.json', 'aether-config.json.tmp']);

// Acciones permitidas para el rol "dj" (su Logo, sus Textos y sus Vídeos/GIF)
const DJ_ALLOWED_ACTIONS = new Set([
  'UPLOAD_LOGO',
  'SELECT_LOGO_SLOT',
  'SET_LOGO_PROP',
  'PROCESS_LOGO',
  'SET_TEXT_PROP',
  'SET_MEDIA_PROP',
  'LOAD_MEDIA',
  'MEDIA_STOP'
]);

// Carpeta de vídeos del DJ: se crea al arrancar (y se limpian subidas a medias de una sesión anterior)
try {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  for (const f of fs.readdirSync(MEDIA_DIR)) {
    if (/^\.upload-.*\.part$/.test(f)) {
      try { fs.unlinkSync(path.join(MEDIA_DIR, f)); } catch (_) { /* ignorar */ }
    }
  }
} catch (err) {
  console.warn('[AETHER-VJ] No se pudo crear la carpeta media/:', err.message);
}

// ---------------------------------------------------------------------------
// Configuración persistente en disco
// ---------------------------------------------------------------------------
function loadConfigFromDisk() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('[AETHER-VJ] No se pudo leer aether-config.json, se usarán valores por defecto:', err.message);
  }
  return {};
}

let persistedConfig = loadConfigFromDisk();

let securityConfig = {
  adminPin: String(process.env.ADMIN_PIN || (persistedConfig.security && persistedConfig.security.adminPin) || '1234').trim(),
  djPin: String(process.env.DJ_PIN || (persistedConfig.security && persistedConfig.security.djPin) || 'dj').trim()
};

let saveTimer = null;
function scheduleConfigSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const toWrite = { ...persistedConfig, security: { ...securityConfig } };
    try {
      // Escritura atómica: primero a .tmp y luego renombrar, para no corromper el fichero si se va la luz
      fs.writeFileSync(CONFIG_TMP_FILE, JSON.stringify(toWrite), 'utf8');
      fs.renameSync(CONFIG_TMP_FILE, CONFIG_FILE);
    } catch (err) {
      console.warn('[AETHER-VJ] Error guardando aether-config.json:', err.message);
    }
  }, 400);
}

// ---------------------------------------------------------------------------
// Utilidades de red y seguridad
// ---------------------------------------------------------------------------
function isLocalRequest(req) {
  const addr = (req.socket && req.socket.remoteAddress) || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function clientIp(req) {
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

const failedAttempts = new Map(); // ip -> { count, lockedUntil }

function isLockedOut(ip) {
  const rec = failedAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    failedAttempts.delete(ip);
  }
  return false;
}

function registerFailedAttempt(ip) {
  const rec = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_FAILED_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_MS;
    rec.count = 0;
  }
  failedAttempts.set(ip, rec);
}

function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

function verifyPinRole(pinInput) {
  const clean = String(pinInput || '').trim().toLowerCase();
  if (!clean) return null;
  if (clean === securityConfig.adminPin.toLowerCase()) return 'admin';
  if (clean === securityConfig.djPin.toLowerCase()) return 'dj';
  return null;
}

function getLocalWiFiAddresses() {
  const nets = os.networkInterfaces();
  const list = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        list.push(net.address);
      }
    }
  }
  return list.length ? list : ['10.42.0.1', 'localhost'];
}

// ---------------------------------------------------------------------------
// Telemetría de recursos del Mini-PC (CPU %, RAM, Temperatura CPU °C)
// ---------------------------------------------------------------------------
let lastCpuTimes = null;
let currentCpuPercent = 0;

function sampleCpuPercent() {
  const cpus = os.cpus();
  if (!cpus || !cpus.length) return 0;
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times)) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  if (lastCpuTimes) {
    const idleDiff = idle - lastCpuTimes.idle;
    const totalDiff = total - lastCpuTimes.total;
    if (totalDiff > 0) {
      currentCpuPercent = Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
    }
  }
  lastCpuTimes = { idle, total };
  return currentCpuPercent;
}
sampleCpuPercent();
setInterval(sampleCpuPercent, 2000);

function readCpuTempC() {
  if (process.platform !== 'linux') return null;
  try {
    const zones = ['/sys/class/thermal/thermal_zone0/temp', '/sys/class/thermal/thermal_zone1/temp', '/sys/class/thermal/thermal_zone2/temp'];
    let maxC = null;
    for (const z of zones) {
      if (fs.existsSync(z)) {
        const raw = parseInt(fs.readFileSync(z, 'utf8').trim(), 10);
        if (Number.isFinite(raw) && raw > 0) {
          const c = raw > 1000 ? Math.round(raw / 1000) : raw;
          if (c > 10 && c < 115 && (maxC === null || c > maxC)) maxC = c;
        }
      }
    }
    return maxC;
  } catch (_) {
    return null;
  }
}

function getSystemStatsSnapshot() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = Math.max(0, totalMem - freeMem);
  const ramPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
  const cpus = os.cpus() || [];
  return {
    cpuPercent: currentCpuPercent,
    cpuCores: cpus.length,
    cpuModel: cpus[0] ? cpus[0].model.trim() : 'CPU',
    ramUsedMb: Math.round(usedMem / (1024 * 1024)),
    ramTotalMb: Math.round(totalMem / (1024 * 1024)),
    ramPercent,
    cpuTempC: readCpuTempC(),
    loadAvg1m: Math.round((os.loadavg()[0] || 0) * 100) / 100,
    uptimeSec: Math.round(os.uptime()),
    updateRepoUrl: persistedConfig.updateRepoUrl || 'https://github.com/Gabichuelo/resolumeplugin.git',
    lastUpdateAt: persistedConfig.lastUpdateAt || null
  };
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readJsonBody(req, maxBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let received = 0;
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Ficheros estáticos con soporte HTTP Range (206) — imprescindible para <video>
// ---------------------------------------------------------------------------
function parseRangeHeader(header, size) {
  // Devuelve null si la cabecera se ignora (mal formada o multi-rango), 'invalid' si no es satisfacible
  const m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(String(header || ''));
  if (!m) return null;
  if (m[1] === '' && m[2] === '') return null;
  let start;
  let end;
  if (m[1] === '') {
    const suffix = parseInt(m[2], 10);
    if (!suffix || size === 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) return 'invalid';
  return { start, end };
}

function serveFile(req, res, filePath, stats, cacheControl) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const size = stats.size;
  const baseHeaders = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'Accept-Ranges': 'bytes',
    'Last-Modified': stats.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff'
  };
  const isHead = req.method === 'HEAD';
  const range = req.headers.range ? parseRangeHeader(req.headers.range, size) : null;

  if (range === 'invalid') {
    res.writeHead(416, { ...baseHeaders, 'Content-Range': `bytes */${size}`, 'Content-Length': 0 });
    res.end();
    return;
  }

  let status = 200;
  let start = 0;
  let end = size - 1;
  const headers = { ...baseHeaders };
  if (range) {
    status = 206;
    start = range.start;
    end = range.end;
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = size === 0 ? 0 : end - start + 1;
  res.writeHead(status, headers);

  if (isHead || size === 0) {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath, { start, end });
  stream.on('error', () => {
    try { res.destroy(); } catch (_) { /* conexión ya cerrada */ }
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

function sendNotFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

// ---------------------------------------------------------------------------
// Vídeos / GIF / imágenes del DJ (carpeta media/)
// ---------------------------------------------------------------------------
let mediaReservedBytes = 0; // bytes de subidas en curso (para respetar el límite total)

function sanitizeMediaBaseName(rawName) {
  const base = path.basename(String(rawName || ''), path.extname(String(rawName || '')));
  const clean = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // quitar tildes
    .replace(/[^a-zA-Z0-9_-]+/g, '-')       // solo caracteres seguros
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 60);
  return clean || 'media';
}

// Nombre de fichero de media válido: sin rutas, sin ocultos y con extensión aceptada
function isSafeMediaFileName(file) {
  if (typeof file !== 'string' || !file || file.length > 200) return false;
  if (file !== path.basename(file) || file.includes('/') || file.includes('\\') || file.includes('..')) return false;
  if (file.startsWith('.')) return false;
  if (!/^[a-zA-Z0-9_.-]+$/.test(file)) return false;
  if (!MEDIA_KINDS[path.extname(file).toLowerCase()]) return false;
  const resolved = path.resolve(MEDIA_DIR, file);
  return path.dirname(resolved) === path.resolve(MEDIA_DIR);
}

function displayNameFromFile(file) {
  // "mi-video-1730830000000.mp4" → "mi-video.mp4"
  return file.replace(/-\d{10,}(\.[^.]+)$/, '$1');
}

function listMediaItems() {
  let entries = [];
  try {
    entries = fs.readdirSync(MEDIA_DIR, { withFileTypes: true });
  } catch (_) {
    return [];
  }
  const items = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isSafeMediaFileName(entry.name)) continue;
    try {
      const st = fs.statSync(path.join(MEDIA_DIR, entry.name));
      items.push({
        file: entry.name,
        name: displayNameFromFile(entry.name),
        url: `/media/${encodeURIComponent(entry.name)}`,
        kind: MEDIA_KINDS[path.extname(entry.name).toLowerCase()],
        size: st.size,
        mtime: st.mtimeMs
      });
    } catch (_) { /* fichero borrado mientras se listaba */ }
  }
  items.sort((a, b) => b.mtime - a.mtime);
  return items;
}

function getMediaDirUsage() {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(MEDIA_DIR, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      try {
        total += fs.statSync(path.join(MEDIA_DIR, entry.name)).size;
      } catch (_) { /* ignorar */ }
    }
  } catch (_) { /* carpeta inexistente */ }
  return total;
}

function rejectUpload(req, res, status, obj) {
  // Cerramos la conexión para no tener que recibir un cuerpo enorme que no vamos a guardar
  if (!res.headersSent) {
    res.setHeader('Connection', 'close');
    sendJson(res, status, obj);
  }
  req.resume();
}

function handleMediaUpload(req, res, parsedUrl, local, ip) {
  if (isLockedOut(ip)) {
    rejectUpload(req, res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
    return;
  }
  if (!local) {
    const role = verifyPinRole(req.headers['x-aether-pin']);
    if (role !== 'admin' && role !== 'dj') {
      registerFailedAttempt(ip);
      rejectUpload(req, res, 401, { ok: false, error: 'PIN no válido o sesión expirada' });
      return;
    }
  }

  const rawName = parsedUrl.searchParams.get('name') || '';
  const ext = path.extname(rawName).toLowerCase();
  const kind = MEDIA_KINDS[ext];
  if (!kind) {
    rejectUpload(req, res, 415, { ok: false, error: 'Formato no admitido. Usa MP4, WEBM, MOV, M4V, GIF, PNG, JPG o WEBP.' });
    return;
  }

  const declared = req.headers['content-length'] !== undefined ? parseInt(req.headers['content-length'], 10) : NaN;
  if (Number.isFinite(declared) && declared > MEDIA_MAX_FILE_BYTES) {
    rejectUpload(req, res, 413, { ok: false, error: 'El fichero supera el máximo de 300 MB' });
    return;
  }
  if (Number.isFinite(declared) && declared === 0) {
    rejectUpload(req, res, 400, { ok: false, error: 'El fichero está vacío' });
    return;
  }

  const usageAtStart = getMediaDirUsage() + mediaReservedBytes;
  if (usageAtStart + (Number.isFinite(declared) ? declared : 0) > MEDIA_MAX_TOTAL_BYTES) {
    rejectUpload(req, res, 507, { ok: false, error: 'La carpeta de vídeos está llena (máx. 4 GB). Borra alguno antes.' });
    return;
  }

  try {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  } catch (_) { /* se informará al escribir */ }

  const baseName = sanitizeMediaBaseName(rawName);
  const tmpPath = path.join(MEDIA_DIR, `.upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.part`);
  let reserved = Number.isFinite(declared) ? declared : 0;
  mediaReservedBytes += reserved;
  let received = 0;
  let finished = false;
  let failed = false;

  const release = () => {
    mediaReservedBytes -= reserved;
    reserved = 0;
  };

  const out = fs.createWriteStream(tmpPath, { flags: 'wx' });

  const fail = (status, obj) => {
    if (failed || finished) return;
    failed = true;
    release();
    out.destroy();
    out.once('close', () => fs.unlink(tmpPath, () => {}));
    fs.unlink(tmpPath, () => {});
    if (status) rejectUpload(req, res, status, obj);
  };

  req.on('data', (chunk) => {
    if (failed) return;
    received += chunk.length;
    if (received > MEDIA_MAX_FILE_BYTES) {
      fail(413, { ok: false, error: 'El fichero supera el máximo de 300 MB' });
      return;
    }
    if (!Number.isFinite(declared) && usageAtStart + received > MEDIA_MAX_TOTAL_BYTES) {
      fail(507, { ok: false, error: 'La carpeta de vídeos está llena (máx. 4 GB). Borra alguno antes.' });
      return;
    }
    if (!out.write(chunk)) req.pause();
  });
  out.on('drain', () => {
    if (!failed) req.resume();
  });
  req.on('end', () => {
    if (failed) return;
    out.end();
  });
  req.on('close', () => {
    // El móvil cortó la subida a medias
    if (!req.complete) fail(0);
  });
  req.on('error', () => fail(0));
  out.on('error', (err) => {
    fail(500, { ok: false, error: 'No se pudo guardar el fichero: ' + err.message });
  });
  out.on('finish', () => {
    if (failed) return;
    if (received === 0) {
      fail(400, { ok: false, error: 'El fichero está vacío' });
      return;
    }
    let finalName = `${baseName}-${Date.now()}${ext}`;
    let n = 1;
    while (fs.existsSync(path.join(MEDIA_DIR, finalName))) {
      finalName = `${baseName}-${Date.now()}${n++}${ext}`;
    }
    fs.rename(tmpPath, path.join(MEDIA_DIR, finalName), (err) => {
      if (err) {
        fail(500, { ok: false, error: 'No se pudo guardar el fichero: ' + err.message });
        return;
      }
      finished = true;
      release();
      sendJson(res, 200, {
        ok: true,
        url: `/media/${encodeURIComponent(finalName)}`,
        file: finalName,
        kind,
        name: `${baseName}${ext}`,
        size: received
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Canales de eventos en tiempo real (SSE)
//   - masterClients: la consola/kiosco local, recibe las ÓRDENES de los móviles
//   - remoteClients: los móviles, solo reciben el ESTADO (nunca órdenes ni logos ajenos)
// ---------------------------------------------------------------------------
const masterClients = new Set();
const remoteClients = new Set();

let latestMasterStatus = {
  activeGen: 18,
  activeBankTab: 'FLT',
  autopilotPool: 'FLT',
  autopilotEnabled: true,
  autopilotMode: 'HYPNOTIC_SLOW',
  shapeMode: 0,
  styleMode: 1,
  weightMode: 1,
  sweepMode: 0,
  effect3dMode: 0,
  effect3dAmount: 0.55,
  paletteTarget: 0,
  bpm: 126.0,
  bgMode: 'SOLID',
  fps: 60,
  logo: {
    enabled: false,
    fxMode: 1,
    scale: 0.44,
    opacity: 0.96,
    backdrop: 0.65,
    pos: 0,
    tint: false,
    activeSlot: 0,
    hasSlots: [false, false, false, false]
  },
  presets: [null, null, null, null, null, null, null, null]
};

function applyLinuxKioskKeyringFix() {
  if (process.platform !== 'linux') return;
  try {
    const homes = [os.homedir()];
    if (fs.existsSync('/home')) {
      for (const d of fs.readdirSync('/home')) {
        homes.push(path.join('/home', d));
      }
    }
    for (const h of [...new Set(homes)]) {
      const autostart = path.join(h, '.config', 'autostart', 'aether-kiosk.desktop');
      if (fs.existsSync(autostart)) {
        const content = fs.readFileSync(autostart, 'utf8');
        if (!content.includes('--password-store=basic')) {
          fs.writeFileSync(
            autostart,
            content.replace('--kiosk', '--kiosk --password-store=basic'),
            'utf8'
          );
        }
      }
      const keyringsDir = path.join(h, '.local', 'share', 'keyrings');
      const defFile = path.join(keyringsDir, 'default');
      const loginKeyring = path.join(keyringsDir, 'login.keyring');
      if (fs.existsSync(loginKeyring)) {
        try { fs.unlinkSync(loginKeyring); } catch (_) {}
      }
      if (!fs.existsSync(keyringsDir)) {
        try { fs.mkdirSync(keyringsDir, { recursive: true }); } catch (_) {}
      }
      if (fs.existsSync(keyringsDir)) {
        try {
          fs.writeFileSync(defFile, 'Default_keyring\n', 'utf8');
          fs.writeFileSync(
            path.join(keyringsDir, 'Default_keyring.keyring'),
            '[keyring]\ndisplay-name=Default keyring\nctime=0\nmtime=0\nlock-on-idle=false\nlock-after=false\n',
            'utf8'
          );
        } catch (_) {}
      }
    }
    exec('chmod +x quitar-claves.sh instalar-luces.sh 2>/dev/null; sudo -n bash quitar-claves.sh 2>/dev/null || true', { cwd: __dirname }, () => {});
  } catch (_) {}
}
applyLinuxKioskKeyringFix();

function writeSse(set, payloadObj) {
  const data = `data: ${JSON.stringify(payloadObj)}\n\n`;
  for (const res of set) {
    try {
      res.write(data);
    } catch (_) {
      set.delete(res);
    }
  }
}

// Mantener vivas las conexiones SSE detrás de routers/proxies que cortan conexiones inactivas
setInterval(() => {
  for (const set of [masterClients, remoteClients]) {
    for (const res of set) {
      try {
        res.write(': ping\n\n');
      } catch (_) {
        set.delete(res);
      }
    }
  }
}, 20000);

// ---------------------------------------------------------------------------
// Servidor HTTP
// ---------------------------------------------------------------------------
const requestHandler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Aether-Pin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, 'http://localhost');
  } catch (_) {
    sendJson(res, 400, { ok: false, error: 'URL no válida' });
    return;
  }
  const pathname = parsedUrl.pathname;
  const local = isLocalRequest(req);
  const ip = clientIp(req);

  // 0. Los móviles que abren la raíz (http://aether.local) van directos al mando
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/' && !local) {
    res.writeHead(302, { Location: '/remote.html', 'Cache-Control': 'no-cache' });
    res.end();
    return;
  }

  // 1. Canal de eventos en tiempo real (/api/events?role=master | remote)
  if (req.method === 'GET' && pathname === '/api/events') {
    const wantsMaster = parsedUrl.searchParams.get('role') === 'master';
    if (wantsMaster && !local) {
      sendJson(res, 403, { ok: false, error: 'El canal maestro solo está disponible en la propia máquina' });
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(`data: ${JSON.stringify({ type: 'MASTER_STATUS', status: latestMasterStatus })}\n\n`);
    const targetSet = wantsMaster ? masterClients : remoteClients;
    targetSet.add(res);
    req.on('close', () => {
      targetSet.delete(res);
    });
    return;
  }

  // 2. Información de red y PINs (solo la propia máquina)
  if (req.method === 'GET' && pathname === '/api/network-info') {
    if (!local) {
      sendJson(res, 403, { ok: false, error: 'Solo disponible en la propia máquina' });
      return;
    }
    const ips = getLocalWiFiAddresses();
    const hostname = os.hostname();
    const host = hostname.toLowerCase();
    const lanIps = ips.filter((addr) => addr !== 'localhost');
    const friendlyUrls = [];
    if (port80Listening) {
      friendlyUrls.push(`http://${host}.local`);
      for (const addr of lanIps) friendlyUrls.push(`http://${addr}`);
    }
    if (PORT !== FRIENDLY_PORT) {
      friendlyUrls.push(`http://${host}.local:${PORT}`);
      for (const addr of lanIps) friendlyUrls.push(`http://${addr}:${PORT}`);
    }
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      port80: port80Listening,
      hostname,
      ips,
      friendlyUrls: [...new Set(friendlyUrls)],
      remoteUrls: ips.map((addr) => `http://${addr}:${PORT}/remote.html`),
      adminPin: securityConfig.adminPin,
      djPin: securityConfig.djPin,
      system: getSystemStatsSnapshot()
    });
    return;
  }

  // 2a-bis. Estado de recursos del Mini-PC (CPU, RAM, Temperatura, IPs)
  if (req.method === 'GET' && pathname === '/api/system-stats') {
    const role = local ? 'admin' : verifyPinRole(req.headers['x-aether-pin']);
    if (!role) {
      sendJson(res, 401, { ok: false, error: 'PIN requerido' });
      return;
    }
    const ips = getLocalWiFiAddresses();
    const hostname = os.hostname();
    sendJson(res, 200, {
      ok: true,
      hostname,
      port: PORT,
      port80: port80Listening,
      ips,
      remoteUrls: ips.map((addr) => `http://${addr}:${PORT}/remote.html`),
      system: getSystemStatsSnapshot()
    });
    return;
  }

  // 2a-ter. Actualización por Internet en 1 clic (git pull / fetch + build-bundle.js)
  if (req.method === 'POST' && pathname === '/api/system-update') {
    try {
      const body = await readJsonBody(req, 8192);
      const authorized = local || verifyPinRole(body.pin) === 'admin';
      if (!authorized) {
        sendJson(res, 403, { ok: false, error: 'Solo el técnico o la consola local pueden actualizar el sistema' });
        return;
      }
      if (typeof body.repoUrl === 'string' && body.repoUrl.trim()) {
        persistedConfig.updateRepoUrl = body.repoUrl.trim();
        scheduleConfigSave();
      }
      const repoUrl = persistedConfig.updateRepoUrl || 'https://github.com/Gabichuelo/resolumeplugin.git';
      const hasGitDir = fs.existsSync(path.join(__dirname, '.git'));

      if (!hasGitDir && !repoUrl) {
        sendJson(res, 400, {
          ok: false,
          error: 'Introduce primero la dirección de tu repositorio Git/GitHub (ej. https://github.com/tu-usuario/resolumeplugin.git) para activar las actualizaciones por Internet.'
        });
        return;
      }

      // Validar que repoUrl sea una URL https:// o git@ segura
      if (repoUrl && !/^(https?:\/\/[a-zA-Z0-9._/-]+|git@[a-zA-Z0-9._:-]+)$/.test(repoUrl)) {
        sendJson(res, 400, { ok: false, error: 'URL de repositorio no válida. Usa https://github.com/usuario/repo.git' });
        return;
      }

      const safeGit = 'git -c safe.directory="*"';
      const postUpdateCmd = 'node build-bundle.js && (sudo -n bash quitar-claves.sh 2>/dev/null || true)';
      const cmd = hasGitDir
        ? (repoUrl
          ? `${safeGit} remote set-url origin "${repoUrl}" && ${safeGit} fetch origin main && ${safeGit} reset --hard origin/main && ${postUpdateCmd}`
          : `${safeGit} fetch origin main && ${safeGit} reset --hard origin/main && ${postUpdateCmd}`)
        : `${safeGit} init && ${safeGit} remote add origin "${repoUrl}" && ${safeGit} fetch --depth=1 origin main && ${safeGit} reset --hard origin/main && ${postUpdateCmd}`;

      exec(cmd, { cwd: __dirname, timeout: 120000 }, (err, stdout, stderr) => {
        if (err) {
          sendJson(res, 500, {
            ok: false,
            error: 'Error al actualizar: ' + (stderr || err.message || '').slice(0, 300),
            output: (stdout || '') + '\n' + (stderr || '')
          });
          return;
        }
        persistedConfig.lastUpdateAt = new Date().toISOString();
        scheduleConfigSave();
        applyLinuxKioskKeyringFix();
        // Avisar al kiosco y a los mandos para que recarguen el nuevo bundle automáticamente
        writeSse(masterClients, { type: 'REMOTE_COMMAND', action: 'RELOAD_ENGINE' });
        sendJson(res, 200, {
          ok: true,
          message: 'Actualizado correctamente. Recargando motor visual...',
          lastUpdateAt: persistedConfig.lastUpdateAt,
          output: (stdout || '').slice(-400)
        });
        if (process.platform === 'linux') {
          setTimeout(() => process.exit(0), 700);
        }
      });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 2a-quater. Terminal / Diagnóstico Remoto desde el móvil (sin escribir en el Mini-PC)
  if (req.method === 'POST' && pathname === '/api/system-terminal') {
    try {
      const body = await readJsonBody(req, 16384);
      const authorized = local || verifyPinRole(body.pin) === 'admin';
      if (!authorized) {
        sendJson(res, 403, { ok: false, error: 'PIN de técnico requerido (por defecto 1234)' });
        return;
      }

      const preset = String(body.preset || '').trim();
      const customCmd = String(body.customCmd || '').trim();
      const sudoPass = String(body.sudoPass || '').trim();

      let rawCmd = '';
      if (preset === 'quitar-claves' || preset === 'fix-ethernet') {
        rawCmd = 'sudo -S bash quitar-claves.sh ; echo "=== ESTADO ETHERNET (eno1) ===" ; nmcli device status 2>/dev/null || true ; nmcli connection show 2>/dev/null || true ; ip -br addr 2>/dev/null || true';
      } else if (preset === 'diag-login') {
        rawCmd = [
          'echo "=== RED ETHERNET (eno1) Y PERFILES NMCLI ==="',
          'nmcli device status 2>/dev/null || true',
          'nmcli connection show 2>/dev/null || true',
          'ip -br addr 2>/dev/null || true',
          'echo "=== USUARIO Y DISPLAY MANAGER ==="',
          'whoami; id',
          'cat /etc/X11/default-display-manager 2>/dev/null || true',
          'echo "=== SESIONES INSTALADAS ==="',
          'ls -1 /usr/share/xsessions /usr/share/wayland-sessions 2>/dev/null || true',
          'echo "=== LIGHTDM SHARE CONF ==="',
          'head -n 50 /usr/share/lightdm/lightdm.conf.d/*.conf 2>/dev/null || true',
          'echo "=== LIGHTDM ETC CONF ==="',
          'head -n 50 /etc/lightdm/lightdm.conf /etc/lightdm/lightdm.conf.d/*.conf 2>/dev/null || true',
          'echo "=== ACCOUNTS SERVICE & DMRC ==="',
          'cat ~/.dmrc 2>/dev/null || true',
          'sudo -S head -n 50 /var/lib/AccountsService/users/* 2>/dev/null || true',
          'echo "=== ULTIMAS LINEAS LIGHTDM.LOG ==="',
          'sudo -S tail -n 35 /var/log/lightdm/lightdm.log 2>/dev/null || true',
          'echo "=== SERVICIOS AETHER Y LUCES ==="',
          'systemctl is-active aether-vj.service granddas-luces.service 2>/dev/null || true'
        ].join(' ; ');
      } else if (preset === 'update-luces') {
        rawCmd = 'sudo -S bash instalar-luces-sl04.sh';
      } else if (preset === 'disk-list') {
        rawCmd = 'sudo -S bash clonar-m2.sh --list';
      } else if (preset === 'usb-kit') {
        rawCmd = 'sudo -S bash clonar-m2.sh --usb-kit';
      } else if (preset === 'usb-backup') {
        rawCmd = 'sudo -S bash clonar-m2.sh --usb-backup';
      } else if (preset === 'clone-m2') {
        rawCmd = 'sudo -S bash clonar-m2.sh --clone';
      } else if (preset === 'reboot') {
        rawCmd = 'sudo -S reboot';
      } else if (customCmd) {
        rawCmd = customCmd;
      } else {
        sendJson(res, 400, { ok: false, error: 'Selecciona un botón o escribe un comando' });
        return;
      }

      const cmdTimeoutMs = (preset === 'clone-m2' || preset === 'usb-backup') ? 1200000 : 120000;
      const child = exec(rawCmd, { cwd: __dirname, timeout: cmdTimeoutMs, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
        const combined = ((stdout || '') + (stderr ? '\n' + stderr : '')).trim();
        const outText = combined || (err ? err.message : '(Comando ejecutado sin texto de salida)');
        persistedConfig.sharedNotes = outText.slice(-12000);
        persistedConfig.sharedNotesAt = new Date().toISOString();
        scheduleConfigSave();
        writeSse(remoteClients, {
          type: 'SHARED_NOTES',
          notes: persistedConfig.sharedNotes,
          updatedAt: persistedConfig.sharedNotesAt
        });
        sendJson(res, 200, {
          ok: !err,
          exitCode: err ? (err.code || 1) : 0,
          output: outText
        });
      });

      if (sudoPass && child.stdin) {
        try {
          child.stdin.write(sudoPass + '\n');
          child.stdin.end();
        } catch (_) {}
      }
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 2a-quinquies. Buzón compartido de errores/notas Mini-PC <-> Móvil
  if (pathname === '/api/shared-notes') {
    if (req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        notes: persistedConfig.sharedNotes || '',
        updatedAt: persistedConfig.sharedNotesAt || null
      });
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await readJsonBody(req, 65536);
        persistedConfig.sharedNotes = String(body.notes || '').slice(0, 30000);
        persistedConfig.sharedNotesAt = new Date().toISOString();
        scheduleConfigSave();
        writeSse(remoteClients, {
          type: 'SHARED_NOTES',
          notes: persistedConfig.sharedNotes,
          updatedAt: persistedConfig.sharedNotesAt
        });
        sendJson(res, 200, {
          ok: true,
          notes: persistedConfig.sharedNotes,
          updatedAt: persistedConfig.sharedNotesAt
        });
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return;
    }
  }

  // 2b. Vídeos / GIF del DJ
  if (req.method === 'POST' && pathname === '/api/media-upload') {
    handleMediaUpload(req, res, parsedUrl, local, ip);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/media-list') {
    if (isLockedOut(ip)) {
      sendJson(res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
      return;
    }
    if (!local && !verifyPinRole(req.headers['x-aether-pin'])) {
      registerFailedAttempt(ip);
      sendJson(res, 401, { ok: false, error: 'PIN no válido o sesión expirada' });
      return;
    }
    const items = listMediaItems();
    sendJson(res, 200, {
      ok: true,
      items,
      totalBytes: items.reduce((acc, it) => acc + it.size, 0),
      maxTotalBytes: MEDIA_MAX_TOTAL_BYTES,
      maxFileBytes: MEDIA_MAX_FILE_BYTES
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/media-delete') {
    if (isLockedOut(ip)) {
      sendJson(res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
      return;
    }
    try {
      const body = await readJsonBody(req, 4096);
      if (!local) {
        const role = verifyPinRole(body.pin);
        if (!role) {
          registerFailedAttempt(ip);
          sendJson(res, 401, { ok: false, error: 'PIN no válido o sesión expirada' });
          return;
        }
        if (role !== 'admin') {
          sendJson(res, 403, { ok: false, error: 'Solo el técnico puede borrar vídeos' });
          return;
        }
      }
      const file = typeof body.file === 'string' ? body.file : '';
      if (!isSafeMediaFileName(file)) {
        sendJson(res, 400, { ok: false, error: 'Nombre de fichero no válido' });
        return;
      }
      const target = path.join(MEDIA_DIR, file);
      fs.unlink(target, (err) => {
        if (err) {
          sendJson(res, err.code === 'ENOENT' ? 404 : 500, { ok: false, error: err.code === 'ENOENT' ? 'El fichero no existe' : err.message });
          return;
        }
        sendJson(res, 200, { ok: true, file });
      });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 2c. Estáticos de media (/media/*) con soporte Range
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/media/')) {
    let file;
    try {
      file = decodeURIComponent(pathname.slice('/media/'.length));
    } catch (_) {
      sendNotFound(res);
      return;
    }
    if (!isSafeMediaFileName(file)) {
      sendNotFound(res);
      return;
    }
    const mediaPath = path.join(MEDIA_DIR, file);
    fs.stat(mediaPath, (err, stats) => {
      if (err || !stats.isFile()) {
        sendNotFound(res);
        return;
      }
      // Los nombres llevan marca de tiempo: nunca cambian, se pueden cachear
      serveFile(req, res, mediaPath, stats, 'public, max-age=86400');
    });
    return;
  }

  // 3. Login / verificación de PIN desde el móvil (/api/auth) con bloqueo anti fuerza bruta
  if (req.method === 'POST' && pathname === '/api/auth') {
    if (isLockedOut(ip)) {
      sendJson(res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
      return;
    }
    try {
      const body = await readJsonBody(req, 4096);
      const role = verifyPinRole(body.pin);
      if (!role) {
        registerFailedAttempt(ip);
        sendJson(res, 401, { ok: false, error: 'Contraseña incorrecta' });
        return;
      }
      clearFailedAttempts(ip);
      sendJson(res, 200, { ok: true, role });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 4. Cambiar PINs: solo desde la propia máquina o conociendo el PIN de técnico actual
  if (req.method === 'POST' && pathname === '/api/update-pins') {
    if (isLockedOut(ip)) {
      sendJson(res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
      return;
    }
    try {
      const body = await readJsonBody(req, 4096);
      const authorized = local || verifyPinRole(body.currentAdminPin) === 'admin';
      if (!authorized) {
        registerFailedAttempt(ip);
        sendJson(res, 403, { ok: false, error: 'Necesitas el PIN de técnico actual para cambiar las claves' });
        return;
      }
      const newAdmin = body.adminPin !== undefined ? String(body.adminPin).trim() : '';
      const newDj = body.djPin !== undefined ? String(body.djPin).trim() : '';
      if (newAdmin && newAdmin.length < 4) {
        sendJson(res, 400, { ok: false, error: 'El PIN de técnico debe tener al menos 4 caracteres' });
        return;
      }
      if (newAdmin && newDj && newAdmin.toLowerCase() === newDj.toLowerCase()) {
        sendJson(res, 400, { ok: false, error: 'El PIN de técnico y el de DJ no pueden ser iguales' });
        return;
      }
      if (newAdmin) securityConfig.adminPin = newAdmin;
      if (newDj) securityConfig.djPin = newDj;
      scheduleConfigSave();
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 5. Órdenes desde el móvil (/api/command) — protegidas por PIN y rol
  if (req.method === 'POST' && pathname === '/api/command') {
    if (isLockedOut(ip)) {
      sendJson(res, 429, { ok: false, error: 'Demasiados intentos. Espera 1 minuto.' });
      return;
    }
    try {
      const cmd = await readJsonBody(req);
      const role = verifyPinRole(cmd.pin);
      if (!role) {
        registerFailedAttempt(ip);
        sendJson(res, 401, { ok: false, error: 'PIN no válido o sesión expirada' });
        return;
      }
      if (role === 'dj' && !DJ_ALLOWED_ACTIONS.has(cmd.action)) {
        sendJson(res, 403, { ok: false, error: 'Modo DJ Invitado: solo se permite gestionar Logo, Textos y Vídeos' });
        return;
      }
      delete cmd.pin; // Nunca reenviar el PIN
      cmd.type = 'REMOTE_COMMAND';
      cmd.role = role;
      writeSse(masterClients, cmd);
      sendJson(res, 200, { ok: true, role, delivered: masterClients.size > 0 });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return;
  }

  // 6. Telemetría de la consola maestra (solo la propia máquina)
  if (req.method === 'POST' && pathname === '/api/master-status') {
    if (!local) {
      sendJson(res, 403, { ok: false });
      return;
    }
    try {
      const status = await readJsonBody(req, 256 * 1024);
      latestMasterStatus = { ...latestMasterStatus, ...status };
      writeSse(remoteClients, { type: 'MASTER_STATUS', status: latestMasterStatus });
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, 400, { ok: false });
    }
    return;
  }

  // 7. Configuración persistente (Mapping, Presets, Logos...) — solo la propia máquina
  if (pathname === '/api/config') {
    if (!local) {
      sendJson(res, 403, { ok: false, error: 'Solo disponible en la propia máquina' });
      return;
    }
    if (req.method === 'GET') {
      const { security, ...publicPart } = persistedConfig;
      sendJson(res, 200, { ok: true, config: publicPart });
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await readJsonBody(req, 24 * 1024 * 1024);
        if (body && typeof body.config === 'object' && body.config !== null) {
          const { security, ...incoming } = body.config;
          persistedConfig = { ...persistedConfig, ...incoming };
          scheduleConfigSave();
        }
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return;
    }
  }

  // 8. Servidor de ficheros estáticos (con soporte Range)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendNotFound(res);
    return;
  }
  let relPath;
  try {
    relPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  } catch (_) {
    sendNotFound(res);
    return;
  }
  relPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(__dirname, relPath);
  const relFromRoot = path.relative(__dirname, filePath);
  // Bloquear: fuera de la carpeta, ficheros con PINs y cualquier fichero/carpeta oculto (.git, .upload-*.part...)
  const hidden = relFromRoot.split(/[\\/]/).some((seg) => seg.startsWith('.'));

  if (!filePath.startsWith(__dirname + path.sep) || hidden || BLOCKED_STATIC_FILES.has(path.basename(filePath))) {
    sendNotFound(res);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      sendNotFound(res);
      return;
    }
    serveFile(req, res, filePath, stats, 'no-cache');
  });
};

// Nunca dejar que un error inesperado tumbe el servidor en mitad de un bolo
function safeHandler(req, res) {
  requestHandler(req, res).catch((err) => {
    console.warn('[AETHER-VJ] Error atendiendo ' + req.url + ':', err && err.message);
    try { if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'Error interno' }); else res.end(); } catch (_) { /* ignorar */ }
  });
}

// Servidor principal (PORT) + servidor amigable en el puerto 80 (http://aether.local sin :8080)
const server = http.createServer(safeHandler);
// Subidas de vídeo grandes por Wi-Fi lento: dar hasta 30 min para recibir la petición completa
server.requestTimeout = 30 * 60 * 1000;
let port80Listening = PORT === FRIENDLY_PORT;

function startFriendlyPort80(done) {
  if (PORT === FRIENDLY_PORT || process.env.NO_PORT80 === '1') {
    done();
    return;
  }
  const server80 = http.createServer(safeHandler);
  server80.requestTimeout = 30 * 60 * 1000;
  let settled = false;
  server80.on('error', (err) => {
    port80Listening = false;
    if (!settled) {
      settled = true;
      if (err.code === 'EACCES') {
        console.log('[AETHER-VJ] Puerto 80 sin permisos: se usará solo el puerto ' + PORT + ' (en Linux: sudo setcap cap_net_bind_service=+ep "$(readlink -f "$(which node)")").');
      } else if (err.code === 'EADDRINUSE') {
        console.log('[AETHER-VJ] Puerto 80 ocupado por otro programa: se usará solo el puerto ' + PORT + '.');
      } else {
        console.log('[AETHER-VJ] No se pudo abrir el puerto 80 (' + err.code + '): se usará solo el puerto ' + PORT + '.');
      }
      done();
    }
  });
  server80.listen(FRIENDLY_PORT, '0.0.0.0', () => {
    port80Listening = true;
    if (!settled) {
      settled = true;
      done();
    }
  });
}

function printBanner() {
  const ips = getLocalWiFiAddresses();
  const host = os.hostname().toLowerCase();
  const portSuffix = port80Listening ? '' : `:${PORT}`;
  console.log('====================================================================');
  console.log('  AETHER-VJ // SERVIDOR WI-FI + KIOSCO AUTÓNOMO ACTIVO');
  console.log('====================================================================');
  console.log(`  🖥  Consola Completa (PC):    http://localhost:${PORT}`);
  console.log(`  🎬  Modo Kiosco Limpio (Pi):  http://localhost:${PORT}/?kiosk=1`);
  console.log('--------------------------------------------------------------------');
  console.log('  📱  DIRECCIÓN PARA CUALQUIER MÓVIL CONECTADO AL WI-FI:');
  if (host === 'aether') {
    console.log(`      ⭐  http://aether.local${portSuffix}   (la más fácil de escribir)`);
  } else {
    console.log(`      ⭐  http://${host}.local${portSuffix}`);
    console.log('          (Consejo: llama a este equipo "aether" para usar http://aether.local)');
  }
  for (const addr of ips) {
    if (port80Listening && addr !== 'localhost') console.log(`      👉  http://${addr}`);
    console.log(`      👉  http://${addr}:${PORT}/remote.html`);
  }
  console.log('--------------------------------------------------------------------');
  console.log(`  🔑  CONTRASEÑA TÉCNICO (Control Total):  ${securityConfig.adminPin}`);
  console.log(`  🎧  CONTRASEÑA DJ INVITADO (Logo, Textos y Vídeos):  ${securityConfig.djPin}`);
  console.log(`  💾  Configuración guardada en:            ${CONFIG_FILE}`);
  console.log(`  🎞  Vídeos del DJ en:                     ${MEDIA_DIR}`);
  console.log('====================================================================');
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[AETHER-VJ] El puerto ${PORT} ya está en uso. ¿Hay otro servidor AETHER-VJ abierto? Ciérralo o usa otra variable PORT.`);
  } else if (err.code === 'EACCES') {
    console.error(`[AETHER-VJ] Sin permisos para abrir el puerto ${PORT}. Usa otro puerto (PORT=8080).`);
  } else {
    console.error('[AETHER-VJ] Error del servidor:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  startFriendlyPort80(printBanner);
});

// Watchdog de arranque en Linux (Mini-PC):
// 1) Si LightDM se queda en el botón azul "Iniciar sesión" (lightdm-gtk-greeter), pulsa Enter automáticamente.
// 2) Si eno1 tiene el cable conectado pero una regla vieja le puso 2.0.0.10/8 sin DHCP, limpia 2.0.0.10 y levanta Ethernet-Auto.
if (process.platform === 'linux') {
  // Si el M.2 fue clonado con clonadora física externa a otro Mini-PC, regenerar machine-id y expandir partición al arrancar
  exec('sudo -n /usr/local/bin/aether-clone-hwcheck.sh 2>/dev/null || true', { timeout: 20000 }, () => {});

  const runLinuxBootWatchdog = () => {
    const watchdogCmd = [
      'if pgrep -f lightdm-gtk-greeter >/dev/null 2>&1; then',
      '  sudo -n DISPLAY=:0 XAUTHORITY=/var/run/lightdm/root/:0 xdotool key Return 2>/dev/null || true;',
      '  sudo -n /usr/local/bin/aether-greeter-autoclick.sh 2>/dev/null || true;',
      'fi;',
      'if [ -d /sys/class/net/eno1 ]; then',
      '  if ip -4 addr show dev eno1 2>/dev/null | grep -q "2.0.0.10"; then',
      '    sudo -n ip addr del 2.0.0.10/8 dev eno1 2>/dev/null || true;',
      '  fi;',
      '  if [ "$(cat /sys/class/net/eno1/carrier 2>/dev/null)" = "1" ] && ! ip -4 addr show dev eno1 2>/dev/null | grep -qE "inet (192|10|172)\\."; then',
      '    sudo -n nmcli connection up "Ethernet-Auto" ifname eno1 2>/dev/null || sudo -n nmcli device connect eno1 2>/dev/null || true;',
      '  fi;',
      'fi'
    ].join(' ');
    exec(watchdogCmd, { timeout: 8000 }, () => {});
  };
  setTimeout(runLinuxBootWatchdog, 2000);
  setInterval(runLinuxBootWatchdog, 5000);
}
