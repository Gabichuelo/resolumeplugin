const http = require('http');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { exec } = require('child_process');

const PORT = 3031;
const ARTNET_PORT = 6454;
const SCAN_LIBRARY_PATH = 'C:\\Daslight 5\\ScanLibrary';
const USER_SHOWS_PATH = 'F:\\APPS\\Planecreator\\PARA APP LUCES';
const LOCAL_SHOWS_DIR = path.join(__dirname, '..', 'shows');
const AUTOSAVE_FILE_PATH = path.join(LOCAL_SHOWS_DIR, 'ultimo_show.granddas.json');
const EXTRA_SHOW_DIRS = [
  LOCAL_SHOWS_DIR,
  'F:\\APPS\\Planecreator\\PARA APP LUCES',
  'C:\\Users\\gabic\\Documents\\Daslight 5\\Projects',
  'C:\\Users\\gabic\\Downloads',
  'F:\\',
];

const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const interfaceSockets = new Map(); // localIp -> { socket, ifaceName, mac, isHahanUsb }
const discoveredNodes = new Map();

// Stage Remote Wi-Fi synchronization state
let latestConsoleState = {
  updatedAt: 0,
  activeMacroLookId: null,
  activeColorId: null,
  activePosId: null,
  globalMaster: 1,
  globalBlackout: false,
  worklightActive: false,
  blinderOverride: false,
  freezeOverride: false,
  hazeBlastActive: false,
  highlightedFixtureId: null,
  groupCalibrations: {},
  fixtures: [],
};
let remoteCommandQueue = [];

// ---------------------------------------------------------------------------
// REMOTE PIN SECURITY: phones/tablets on the Wi-Fi need a 4-digit PIN.
// The PIN is persisted in shows/remote_pin.txt so it survives restarts,
// and it is embedded in the QR URL so scanning the QR logs in automatically.
// Requests from the PC itself (127.0.0.1) never need the PIN.
// ---------------------------------------------------------------------------
const REMOTE_PIN_FILE = path.join(LOCAL_SHOWS_DIR, 'remote_pin.txt');
let REMOTE_PIN = '';
try {
  if (fs.existsSync(REMOTE_PIN_FILE)) {
    REMOTE_PIN = fs.readFileSync(REMOTE_PIN_FILE, 'utf8').trim();
  }
} catch {}
if (!/^\d{4,8}$/.test(REMOTE_PIN)) {
  REMOTE_PIN = '1234';
  try {
    if (!fs.existsSync(LOCAL_SHOWS_DIR)) fs.mkdirSync(LOCAL_SHOWS_DIR, { recursive: true });
    fs.writeFileSync(REMOTE_PIN_FILE, REMOTE_PIN, 'utf8');
  } catch {}
}

// Linux Hahan SL04 USB Auto-IP (2.0.0.10/8) + Mini-PC Telemetry
let lastCpuTimes = null;
let currentCpuPercent = 0;
let updateRepoUrl = 'https://github.com/Gabichuelo/resolumeplugin.git';
let updateBranch = 'luces';
let lastUpdateAt = null;

function sampleCpuPercent() {
  const cpus = os.cpus();
  if (!cpus || !cpus.length) return 0;
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times)) total += cpu.times[type];
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
  } catch {
    return null;
  }
}

function getSystemStatsSnapshot() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = Math.max(0, totalMem - freeMem);
  const cpus = os.cpus() || [];
  return {
    cpuPercent: currentCpuPercent,
    cpuCores: cpus.length,
    ramUsedMb: Math.round(usedMem / (1024 * 1024)),
    ramTotalMb: Math.round(totalMem / (1024 * 1024)),
    ramPercent: totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0,
    cpuTempC: readCpuTempC(),
    updateRepoUrl,
    updateBranch,
    lastUpdateAt,
  };
}

if (process.platform === 'linux') {
  const ensureSl04UsbIp = () => {
    exec('sudo -n /usr/local/bin/sl04-usb-net.sh 2>/dev/null || sudo -n /usr/local/bin/granddas-hahan-ip.sh 2>/dev/null || true', () => {
      refreshNetworkInterfaceSockets();
    });
  };
  ensureSl04UsbIp();
  setInterval(ensureSl04UsbIp, 10000);
}

function isLocalRequest(req) {
  const a = (req.socket && req.socket.remoteAddress) || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

function hasValidRemotePin(req, parsedUrl) {
  if (isLocalRequest(req)) return true;
  const fromHeader = req.headers['x-granddas-pin'];
  const fromQuery = parsedUrl.searchParams.get('pin');
  return fromHeader === REMOTE_PIN || fromQuery === REMOTE_PIN;
}

// ---------------------------------------------------------------------------
// ROTATING SHOW BACKUPS: shows/backups/show_YYYY-MM-DD_HH-MM-SS.granddas.json
// A snapshot is taken at most every 2 minutes while editing (keeps last 30),
// plus on demand before risky actions (change rig, factory reset, restore).
// ---------------------------------------------------------------------------
const BACKUP_DIR = path.join(LOCAL_SHOWS_DIR, 'backups');
const MAX_BACKUPS = 30;
const BACKUP_INTERVAL_MS = 2 * 60 * 1000;
let lastBackupAt = 0;

function writeShowBackup(showObj, reason) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    const safeReason = String(reason || 'auto').replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'auto';
    const fileName = `show_${stamp}_${safeReason}.granddas.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, fileName), JSON.stringify(showObj), 'utf8');
    lastBackupAt = Date.now();

    // Prune oldest backups beyond MAX_BACKUPS
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.granddas.json'))
      .sort();
    while (files.length > MAX_BACKUPS) {
      const oldest = files.shift();
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, oldest));
      } catch {}
    }
    return fileName;
  } catch {
    return null;
  }
}

function getLanAddresses() {
  const lanIps = [];
  try {
    const nets = os.networkInterfaces();
    for (const [ifaceName, addrs] of Object.entries(nets)) {
      if (!Array.isArray(addrs)) continue;
      for (const addr of addrs) {
        if (addr.family !== 'IPv4' || addr.internal) continue;
        // Exclude Hahan 2.x.x.x and APIPA 169.254.x.x so only real Wi-Fi / LAN IPs are shown for mobile QR
        if (addr.address.startsWith('2.') || addr.address.startsWith('169.254.')) continue;
        lanIps.push({
          ip: addr.address,
          ifaceName,
          url: `http://${addr.address}:5175/?remote=1&pin=${REMOTE_PIN}`,
        });
      }
    }
  } catch {}
  return lanIps;
}

function handleIncomingArtNetMessage(msg, rinfo, viaIface) {
  try {
    if (msg.length >= 10 && msg.toString('ascii', 0, 7) === 'Art-Net') {
      const opCode = msg.readUInt16LE(8);
      // OpPollReply = 0x2100
      if (opCode === 0x2100 && msg.length >= 100) {
        const shortName = msg.toString('ascii', 26, 44).replace(/\0.*$/g, '').trim();
        const longName = msg.toString('ascii', 44, 108).replace(/\0.*$/g, '').trim();
        const swOut = msg.length >= 194 ? [msg[190], msg[191], msg[192], msg[193]] : [0, 1, 2, 3];
        const prev = discoveredNodes.get(rinfo.address);
        const universes = prev?.universes ? new Set(prev.universes) : new Set();
        universes.add(swOut[0]);
        discoveredNodes.set(rinfo.address, {
          ip: rinfo.address,
          shortName: shortName || 'Hahan Light Box',
          longName: longName || "Hahan's Super Lighting SL04 Box",
          viaInterface: viaIface || prev?.viaInterface || 'USB RNDIS',
          universes: Array.from(universes).sort(),
          lastSeen: new Date().toISOString(),
        });
      }
    }
  } catch {}
}

udpSocket.on('message', (msg, rinfo) => handleIncomingArtNetMessage(msg, rinfo, 'default'));

udpSocket.bind(() => {
  try {
    udpSocket.setBroadcast(true);
  } catch (err) {
    // ignore broadcast error if interface doesn't support it yet
  }
});

let artnetConfig = {
  enabled: true,
  targetIp: '2.0.0.44', // Detected from user's Hahan Light Box in Daslight 5
  broadcastIp: '255.255.255.255',
  useBroadcast: true,
  universeOffset: 0, // 0 = Uni 1->SubUni 0 (Standard Art-Net / Hahan), 1 = Uni 1->SubUni 1
  port: ARTNET_PORT,
  packetsSent: 0,
  hahanUsbAdapter: null,
  lastError: null,
};

/**
 * Automatically binds a UDP socket on port 6454 to every active IPv4 adapter
 * (especially the Hahan USB RNDIS adapter 00:13:26 / 169.254.x.x / 2.x.x.x)
 * so Windows routes Art-Net packets directly into the Hahan USB wire!
 */
function refreshNetworkInterfaceSockets() {
  try {
    const nets = os.networkInterfaces();
    for (const [ifaceName, addrs] of Object.entries(nets)) {
      if (!Array.isArray(addrs)) continue;
      for (const addr of addrs) {
        if (addr.family !== 'IPv4' || addr.internal) continue;
        const mac = (addr.mac || '').toLowerCase();
        const lowerIface = ifaceName.toLowerCase();
        const isHahanUsb =
          mac.startsWith('00:13:26') ||
          addr.address.startsWith('2.') ||
          lowerIface.includes('ethernet 2') ||
          lowerIface.startsWith('usb') ||
          lowerIface.startsWith('enx001326') ||
          lowerIface.includes('rndis');

        if (isHahanUsb) {
          artnetConfig.hahanUsbAdapter = `${ifaceName} (${addr.address} · MAC ${mac})`;
        }

        if (!interfaceSockets.has(addr.address)) {
          try {
            const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            sock.on('error', () => {});
            sock.on('message', (msg, rinfo) =>
              handleIncomingArtNetMessage(msg, rinfo, `${ifaceName} (${addr.address})`)
            );
            sock.bind(ARTNET_PORT, addr.address, () => {
              try {
                sock.setBroadcast(true);
              } catch {}
            });
            interfaceSockets.set(addr.address, {
              socket: sock,
              ifaceName,
              localIp: addr.address,
              mac,
              isHahanUsb,
            });
          } catch {}
        } else {
          const entry = interfaceSockets.get(addr.address);
          entry.isHahanUsb = isHahanUsb;
        }
      }
    }
  } catch {}
}

refreshNetworkInterfaceSockets();
setInterval(refreshNetworkInterfaceSockets, 4000);

function sendArtPollPacket() {
  refreshNetworkInterfaceSockets();
  // 14-byte ArtPoll packet (OpPoll = 0x2000)
  const buf = Buffer.alloc(14);
  buf.write('Art-Net\0', 0, 8, 'ascii');
  buf[8] = 0x00;
  buf[9] = 0x20; // OpPoll 0x2000 LE
  buf[10] = 0x00;
  buf[11] = 14;  // ProtVer 14
  buf[12] = 0x02; // TalkToMe
  buf[13] = 0x00;

  // Send over every bound interface socket (especially Hahan USB RNDIS!)
  for (const entry of interfaceSockets.values()) {
    try {
      entry.socket.send(buf, 0, buf.length, ARTNET_PORT, '255.255.255.255');
      if (entry.localIp.startsWith('2.')) {
        entry.socket.send(buf, 0, buf.length, ARTNET_PORT, '2.255.255.255');
        entry.socket.send(buf, 0, buf.length, ARTNET_PORT, artnetConfig.targetIp);
      }
    } catch {}
  }

  const targets = [artnetConfig.targetIp, '2.255.255.255', '255.255.255.255'];
  targets.forEach((ip) => {
    try {
      udpSocket.send(buf, 0, buf.length, ARTNET_PORT, ip);
    } catch {}
  });
}

setTimeout(sendArtPollPacket, 300);
setInterval(sendArtPollPacket, 5000);

let sequenceCounter = 1;

/**
 * Builds an authentic Art-Net ArtDmx (OpOutput 0x5000) packet for a 512-channel universe
 */
function buildArtDmxPacket(universeIndex0Based, dmx512Array) {
  const buf = Buffer.alloc(18 + 512);
  // 0..7: "Art-Net\0"
  buf.write('Art-Net\0', 0, 8, 'ascii');
  // 8..9: OpCode 0x5000 (Little-Endian: 0x00, 0x50)
  buf[8] = 0x00;
  buf[9] = 0x50;
  // 10..11: ProtVer 14 (Big-Endian: 0x00, 0x0e)
  buf[10] = 0x00;
  buf[11] = 14;
  // 12: Sequence (1..255)
  buf[12] = sequenceCounter;
  sequenceCounter = (sequenceCounter % 255) + 1;
  // 13: Physical port
  buf[13] = 0;
  // 14..15: SubUni (low byte) & Net (high byte)
  buf[14] = universeIndex0Based & 0xff;
  buf[15] = (universeIndex0Based >> 8) & 0x7f;
  // 16..17: Length 512 (Big-Endian: 0x02, 0x00)
  buf[16] = 0x02;
  buf[17] = 0x00;

  for (let i = 0; i < 512; i++) {
    const val = dmx512Array[i] || 0;
    buf[18 + i] = Math.max(0, Math.min(255, val | 0));
  }
  return buf;
}

/**
 * Sends a set of 1-based universes { "1": [512], "2": [512], ... } to the Hahan box / Art-Net network.
 */
function sendUniversesToArtnet(universes) {
  if (!artnetConfig.enabled || !universes) return;
  const destIp = artnetConfig.useBroadcast ? artnetConfig.broadcastIp : artnetConfig.targetIp;
  const offset = Number(artnetConfig.universeOffset) || 0;

  // Find Hahan USB RNDIS interface sockets so packets never get misrouted to Internet router
  const hahanSockets = Array.from(interfaceSockets.values()).filter((e) => e.isHahanUsb);

  Object.keys(universes).forEach((uniKey) => {
    const uni1Based = parseInt(uniKey, 10) || 1;
    const dmxArr = universes[uniKey];
    if (!Array.isArray(dmxArr)) return;
    const subUni = Math.max(0, uni1Based - 1 + offset);
    const packet = buildArtDmxPacket(subUni, dmxArr);
    const onSent = (err) => {
      if (err) {
        artnetConfig.lastError = err.message;
      } else {
        artnetConfig.packetsSent++;
        artnetConfig.lastError = null;
      }
    };

    if (hahanSockets.length > 0) {
      hahanSockets.forEach((entry) => {
        // Send broadcast on the dedicated Hahan USB wire (works even when Windows gives it 169.254.x.x!)
        entry.socket.send(packet, 0, packet.length, artnetConfig.port, '255.255.255.255', onSent);
        if (entry.localIp.startsWith('169.254.')) {
          entry.socket.send(packet, 0, packet.length, artnetConfig.port, '169.254.255.255');
        }
        if (entry.localIp.startsWith('2.')) {
          entry.socket.send(packet, 0, packet.length, artnetConfig.port, '2.255.255.255');
          entry.socket.send(packet, 0, packet.length, artnetConfig.port, artnetConfig.targetIp);
        }
        for (const node of discoveredNodes.values()) {
          if (node && node.ip) {
            entry.socket.send(packet, 0, packet.length, artnetConfig.port, node.ip);
          }
        }
      });
    } else {
      udpSocket.send(packet, 0, packet.length, artnetConfig.port, destIp, onSent);
    }
    try {
      udpSocket.send(packet, 0, packet.length, artnetConfig.port, artnetConfig.targetIp);
    } catch {}
  });
}

// DMX CONTINUOUS HEARTBEAT, KEEP-ALIVE & HEADLESS MINI PC AUTONOMOUS ENGINE:
// Starts transmitting Art-Net DMX512 frames immediately on server boot (so the physical green LED
// on the Hahan SL04 Box lights up right away!). When no browser is actively streaming frames
// (e.g. headless Linux Mini PC with the user's phone screen locked in their pocket), it evaluates
// the active 4-Button mode directly against the saved show (ultimo_show.granddas.json) at 30 Hz!
let lastUniversesFrame = {
  1: new Array(512).fill(0),
  2: new Array(512).fill(0),
  3: new Array(512).fill(0),
  4: new Array(512).fill(0),
};
let lastFrameReceivedAt = 0;
let lastConsoleFrameAt = 0;
let cachedShowData = null;
let cachedShowMtime = 0;

function getCachedShowData() {
  try {
    if (!fs.existsSync(AUTOSAVE_FILE_PATH)) return null;
    const st = fs.statSync(AUTOSAVE_FILE_PATH);
    if (!cachedShowData || st.mtimeMs !== cachedShowMtime) {
      cachedShowData = JSON.parse(fs.readFileSync(AUTOSAVE_FILE_PATH, 'utf8'));
      cachedShowMtime = st.mtimeMs;
    }
    return cachedShowData;
  } catch {
    return cachedShowData;
  }
}

function evaluateAutonomousHeadlessDmx() {
  const show = getCachedShowData();
  if (!show || !Array.isArray(show.fixtures) || !Array.isArray(show.profiles)) {
    return lastUniversesFrame;
  }

  const uniMap = {
    1: new Array(512).fill(0),
    2: new Array(512).fill(0),
    3: new Array(512).fill(0),
    4: new Array(512).fill(0),
  };
  const hasFixInUni = { 1: false, 2: false, 3: false, 4: false };
  const t = Date.now() / 1000;
  const master = latestConsoleState.globalBlackout
    ? 0
    : latestConsoleState.blinderOverride
      ? 1
      : typeof latestConsoleState.globalMaster === 'number'
        ? latestConsoleState.globalMaster
        : 1;

  // If Auto-Show is active in headless mode, cycle look every 24 seconds
  const autoLooks = ['cue_rainbow', 'cue_drop', 'cue_warm_break'];
  const lookId = latestConsoleState.autoShowRunning
    ? autoLooks[Math.floor(t / 24) % autoLooks.length]
    : latestConsoleState.activeMacroLookId || 'cue_rainbow';

  const totalFix = Math.max(1, show.fixtures.length);
  show.fixtures.forEach((fix, idx) => {
    const prof = show.profiles.find((p) => p.id === fix.profileId);
    if (!prof || !Array.isArray(prof.channels)) return;
    const uNum = Math.max(1, Math.min(4, fix.universe || 1));
    hasFixInUni[uNum] = true;
    const targetUni = uniMap[uNum];
    const baseAddr = Math.max(1, Math.min(512, fix.address || 1)) - 1;
    const symIdx = Math.abs(idx - (totalFix - 1) / 2);
    const phase = symIdx * 0.85;

    // Base position pointing forward toward audience (Pan 128, Tilt 172)
    let pan = 128;
    let tilt = 172;
    let r = 0,
      g = 220,
      b = 255,
      w = 0,
      dim = 255;

    if (latestConsoleState.worklightActive) {
      // Button 4A: Steady Warm White Worklight (85%, no movement)
      r = 255;
      g = 210;
      b = 145;
      w = 255;
      dim = 218;
    } else if (lookId === 'cue_drop') {
      // Button 2: Modo Caña / Drop (Fast Ballyhoo + Rythmic Chase)
      pan = 128 + Math.sin(t * 2.1 + phase) * 48 * (idx % 2 === 0 ? 1 : -1);
      tilt = 165 + Math.cos(t * 4.2 + phase) * 38;
      const pulse = (Math.sin(t * 8 + idx * 1.4) + 1) / 2;
      dim = Math.round(140 + pulse * 115);
      if (idx % 2 === 0) {
        r = 255;
        g = 90;
        b = 0;
        w = 40;
      } else {
        r = 255;
        g = 0;
        b = 110;
        w = 80;
      }
    } else if (lookId === 'cue_warm_break') {
      // Button 3: Calma / Ambiente Cálido (Slow smooth sweep + Warm 3200K)
      pan = 128 + Math.sin(t * 0.45 + phase) * 32 * (idx % 2 === 0 ? 1 : -1);
      tilt = 172 + Math.cos(t * 0.45 + phase) * 14;
      r = 255;
      g = 195;
      b = 110;
      w = 210;
      dim = 215;
    } else {
      // Button 1 (Default): Fiesta / Círculo Simétrico + Rainbow/Party colors
      pan = 128 + Math.sin(t * 0.95 + phase) * 42 * (idx % 2 === 0 ? 1 : -1);
      tilt = 168 + Math.cos(t * 0.95 + phase) * 30;
      const hue = (t * 35 + idx * 45) % 360;
      const hRad = (hue * Math.PI) / 180;
      r = Math.round(((Math.sin(hRad) + 1) / 2) * 255);
      g = Math.round(((Math.sin(hRad + 2.094) + 1) / 2) * 255);
      b = Math.round(((Math.sin(hRad + 4.188) + 1) / 2) * 255);
      w = 30;
      dim = 255;
    }

    if (latestConsoleState.blinderOverride) {
      r = 255;
      g = 255;
      b = 255;
      w = 255;
      dim = 255;
    }

    // Apply physical mounting offsets & inversions
    pan += ((fix.panOffsetDegrees || 0) / 540) * 255;
    tilt += ((fix.tiltOffsetDegrees || 0) / 270) * 255;
    if (fix.panInvert) pan = 255 - pan;
    if (fix.tiltInvert) tilt = 255 - tilt;
    pan = Math.max(0, Math.min(255, Math.round(pan)));
    tilt = Math.max(0, Math.min(255, Math.round(tilt)));
    const finalDim = Math.max(0, Math.min(255, Math.round(dim * master)));

    prof.channels.forEach((ch) => {
      const chIdx = baseAddr + (ch.index || 0);
      if (chIdx < 0 || chIdx >= 512) return;
      const role = ch.role || '';
      if (role === 'pan') targetUni[chIdx] = pan;
      else if (role === 'tilt') targetUni[chIdx] = tilt;
      else if (role === 'dimmer') targetUni[chIdx] = finalDim;
      else if (role === 'shutter')
        targetUni[chIdx] = latestConsoleState.globalBlackout
          ? 0
          : latestConsoleState.blinderOverride
            ? 240
            : ch.defaultValue || 255;
      else if (role === 'red') targetUni[chIdx] = latestConsoleState.globalBlackout ? 0 : r;
      else if (role === 'green') targetUni[chIdx] = latestConsoleState.globalBlackout ? 0 : g;
      else if (role === 'blue') targetUni[chIdx] = latestConsoleState.globalBlackout ? 0 : b;
      else if (role === 'white') targetUni[chIdx] = latestConsoleState.globalBlackout ? 0 : w;
      else if (role === 'color_wheel' && !latestConsoleState.globalBlackout) {
        targetUni[chIdx] =
          latestConsoleState.worklightActive || latestConsoleState.blinderOverride
            ? 0
            : lookId === 'cue_warm_break'
              ? 25
              : lookId === 'cue_drop'
                ? idx % 2 === 0
                  ? 18
                  : 52
                : ((idx * 22 + Math.floor(t * 2) * 18) % 110) + 12;
      } else {
        targetUni[chIdx] = ch.defaultValue || 0;
      }
    });
  });

  // Mirror Universe 1 to any unused universes on the 4-port Hahan SL04 box
  if (!hasFixInUni[2]) uniMap[2] = [...uniMap[1]];
  if (!hasFixInUni[3]) uniMap[3] = [...uniMap[1]];
  if (!hasFixInUni[4]) uniMap[4] = [...uniMap[1]];

  lastUniversesFrame = uniMap;
  return lastUniversesFrame;
}

setInterval(() => {
  const now = Date.now();
  if (now - lastFrameReceivedAt < 100) return; // console or mobile browser is actively streaming at 35-40Hz
  if (now - lastFrameReceivedAt > 1200) {
    // Headless Mini PC mode (no open browser / phone screen locked): run autonomous 30Hz DMX generator!
    evaluateAutonomousHeadlessDmx();
  }
  if (lastUniversesFrame) {
    sendUniversesToArtnet(lastUniversesFrame);
  }
}, 33);

let lastConsoleActivityAt = Date.now();

/**
 * Parses a Daslight 5 .dvc XML file and decompresses its <PATCHS DATA="..."> zlib block
 */
function parseDvcFile(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf8');
  const match = xmlContent.match(/<PATCHS\s+DATA="([^"]+)"/);
  let patchXml = '';
  const fixtures = [];

  if (match && match[1]) {
    const rawBuf = Buffer.from(match[1], 'base64');
    // Skip 4-byte Big-Endian uncompressed length header used by Qt qCompress
    const inflated = zlib.inflateSync(rawBuf.subarray(4));
    patchXml = inflated.toString('utf8');

    // Parse each <FIXTURES> block which contains <SSLLIBRARY ...> and <FIXTURE ...>
    const fixturesBlocks = patchXml.split('</FIXTURES>');
    for (const block of fixturesBlocks) {
      const sslNameMatch = block.match(/SSLNAME="([^"]+)"/);
      const sslName = sslNameMatch ? sslNameMatch[1] : 'Generic/Fixture.ssl2';
      const nbChannelMatch = block.match(/SSLNBCHANNEL="(\d+)"/);
      const channelCount = nbChannelMatch ? parseInt(nbChannelMatch[1], 10) : 16;

      const fixtureRegex = /<FIXTURE\s+([^>]+)>/g;
      let fMatch;
      while ((fMatch = fixtureRegex.exec(block)) !== null) {
        const attrs = fMatch[1];
        const getAttr = (name) => {
          const m = attrs.match(new RegExp(`${name}="([^"]*)"`));
          return m ? m[1] : '';
        };
        const dasUid = getAttr('DASUID');
        if (!dasUid) continue;
        fixtures.push({
          dasUid,
          name: getAttr('NAME') || 'Fixture',
          index: parseInt(getAttr('INDEX') || '1', 10),
          address: parseInt(getAttr('ADDRESS') || '1', 10),
          universe: parseInt(getAttr('UNIVERS') || '0', 10) + 1, // Convert 0-based to 1-based UI
          posX: parseInt(getAttr('POSX') || '300', 10),
          posY: parseInt(getAttr('POSY') || '300', 10),
          sslName,
          channelCount,
        });
      }
    }
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    fixtureCount: fixtures.length,
    fixtures,
  };
}

const requestHandler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GrandDas-Pin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (isLocalRequest(req) && parsedUrl.pathname.startsWith('/api/')) {
    lastConsoleActivityAt = Math.max(lastConsoleActivityAt, Date.now());
  }

  // SECURITY GATE: every /api/* call coming from another device on the Wi-Fi needs the remote PIN.
  // The web UI files themselves are served freely (the phone then shows a PIN screen).
  if (parsedUrl.pathname.startsWith('/api/') && !hasValidRemotePin(req, parsedUrl)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, pinRequired: true, error: 'PIN de mando requerido' }));
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/status') {
    let brandCount = 0;
    try {
      if (fs.existsSync(SCAN_LIBRARY_PATH)) {
        brandCount = fs.readdirSync(SCAN_LIBRARY_PATH, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
      }
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        artnet: artnetConfig,
        nodes: Array.from(discoveredNodes.values()),
        lanIps: getLanAddresses(),
        remotePin: isLocalRequest(req) ? REMOTE_PIN : undefined,
        daslightInstalled: fs.existsSync(SCAN_LIBRARY_PATH),
        scanLibraryBrandCount: brandCount,
        system: getSystemStatsSnapshot(),
      })
    );
    return;
  }

  // 1-Click Internet Update (from GitHub branch 'luces')
  if (req.method === 'POST' && parsedUrl.pathname === '/api/system-update') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (typeof payload.repoUrl === 'string' && payload.repoUrl.trim()) {
          updateRepoUrl = payload.repoUrl.trim();
        }
        if (typeof payload.branch === 'string' && payload.branch.trim()) {
          updateBranch = payload.branch.trim();
        }
        const rootDir = path.join(__dirname, '..');
        const hasGitDir = fs.existsSync(path.join(rootDir, '.git'));
        const safeBranch = /^[a-zA-Z0-9._/-]+$/.test(updateBranch) ? updateBranch : 'luces';
        const safeGit = 'git -c safe.directory="*"';
        const cmd = hasGitDir
          ? `${safeGit} remote set-url origin "${updateRepoUrl}" && ${safeGit} fetch origin ${safeBranch} && ${safeGit} reset --hard origin/${safeBranch}`
          : `${safeGit} init -b ${safeBranch} && ${safeGit} remote add origin "${updateRepoUrl}" && ${safeGit} fetch --depth=1 origin ${safeBranch} && ${safeGit} reset --hard origin/${safeBranch}`;

        exec(cmd, { cwd: rootDir, timeout: 120000 }, (err, stdout, stderr) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                ok: false,
                error: 'Error al actualizar: ' + (stderr || err.message || '').slice(0, 300),
              })
            );
            return;
          }
          lastUpdateAt = new Date().toISOString();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              message: 'GrandDas DMX512 actualizado desde GitHub. Recarga la página.',
              lastUpdateAt,
              output: (stdout || '').slice(-300),
            })
          );
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Change the remote PIN (only from the PC itself)
  if (req.method === 'POST' && parsedUrl.pathname === '/api/remote/pin') {
    if (!isLocalRequest(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Solo desde el PC de la consola' }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const next = String(JSON.parse(body).pin || '').trim();
        if (!/^\d{4,8}$/.test(next)) throw new Error('El PIN debe tener 4 a 8 números');
        REMOTE_PIN = next;
        if (!fs.existsSync(LOCAL_SHOWS_DIR)) fs.mkdirSync(LOCAL_SHOWS_DIR, { recursive: true });
        fs.writeFileSync(REMOTE_PIN_FILE, REMOTE_PIN, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, remotePin: REMOTE_PIN, lanIps: getLanAddresses() }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/remote/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        state: latestConsoleState,
        lanIps: getLanAddresses(),
        system: getSystemStatsSnapshot(),
      })
    );
    return;
  }

  // List rotating show backups (newest first)
  if (req.method === 'GET' && parsedUrl.pathname === '/api/show/backups') {
    try {
      const list = fs.existsSync(BACKUP_DIR)
        ? fs
            .readdirSync(BACKUP_DIR)
            .filter((f) => f.endsWith('.granddas.json'))
            .sort()
            .reverse()
            .map((f) => {
              const st = fs.statSync(path.join(BACKUP_DIR, f));
              let fixtureCount = null;
              try {
                const parsed = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, f), 'utf8'));
                fixtureCount = Array.isArray(parsed.fixtures) ? parsed.fixtures.length : null;
              } catch {}
              return {
                file: f,
                savedAt: st.mtime.toISOString(),
                sizeKb: Math.round(st.size / 1024),
                fixtureCount,
              };
            })
        : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, backups: list, dir: BACKUP_DIR }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // Load one backup
  if (req.method === 'GET' && parsedUrl.pathname === '/api/show/backup') {
    try {
      const safe = path.basename(parsedUrl.searchParams.get('file') || '');
      const full = path.join(BACKUP_DIR, safe);
      if (!safe || !fs.existsSync(full)) throw new Error('Copia no encontrada');
      const show = JSON.parse(fs.readFileSync(full, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, show, file: safe }));
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // Force an immediate backup of the current on-disk show (before risky actions)
  if (req.method === 'POST' && parsedUrl.pathname === '/api/show/backup-now') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const reason = (() => {
          try {
            return JSON.parse(body || '{}').reason;
          } catch {
            return 'manual';
          }
        })();
        if (!fs.existsSync(AUTOSAVE_FILE_PATH)) throw new Error('Aún no hay show guardado');
        const show = JSON.parse(fs.readFileSync(AUTOSAVE_FILE_PATH, 'utf8'));
        const file = writeShowBackup(show, reason || 'manual');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: Boolean(file), file }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/show/autosave') {
    try {
      if (fs.existsSync(AUTOSAVE_FILE_PATH)) {
        const raw = fs.readFileSync(AUTOSAVE_FILE_PATH, 'utf8');
        const show = JSON.parse(raw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, show, filePath: AUTOSAVE_FILE_PATH }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, notFound: true }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/show/autosave') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!fs.existsSync(LOCAL_SHOWS_DIR)) {
          fs.mkdirSync(LOCAL_SHOWS_DIR, { recursive: true });
        }
        fs.writeFileSync(AUTOSAVE_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
        let backupFile = null;
        if (Date.now() - lastBackupAt >= BACKUP_INTERVAL_MS) {
          backupFile = writeShowBackup(parsed, 'auto');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filePath: AUTOSAVE_FILE_PATH, backupFile }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/remote/command') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const cmd = JSON.parse(body);
        if (cmd && cmd.type) {
          remoteCommandQueue.push({
            ...cmd,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ts: Date.now(),
          });
          if (remoteCommandQueue.length > 50) {
            remoteCommandQueue = remoteCommandQueue.slice(-50);
          }

          // Also update latestConsoleState immediately on the server so headless Mini PC mode
          // (without any desktop browser open) responds instantaneously to mobile button presses!
          if (cmd.type === 'macro_look') {
            latestConsoleState.activeMacroLookId = cmd.value;
            latestConsoleState.worklightActive = false;
            latestConsoleState.globalBlackout = false;
            latestConsoleState.autoShowRunning = false;
          } else if (cmd.type === 'worklight') {
            latestConsoleState.worklightActive = Boolean(cmd.value);
            if (latestConsoleState.worklightActive) {
              latestConsoleState.globalBlackout = false;
              latestConsoleState.autoShowRunning = false;
            }
          } else if (cmd.type === 'blackout') {
            latestConsoleState.globalBlackout = Boolean(cmd.value);
            if (latestConsoleState.globalBlackout) {
              latestConsoleState.worklightActive = false;
              latestConsoleState.autoShowRunning = false;
            }
          } else if (cmd.type === 'auto_show') {
            latestConsoleState.autoShowRunning = Boolean(cmd.value);
            if (latestConsoleState.autoShowRunning) {
              latestConsoleState.worklightActive = false;
              latestConsoleState.globalBlackout = false;
            }
          } else if (cmd.type === 'grand_master' && typeof cmd.value === 'number') {
            latestConsoleState.globalMaster = cmd.value;
          } else if (cmd.type === 'blinder') {
            latestConsoleState.blinderOverride = Boolean(cmd.value);
          } else if (cmd.type === 'strobe_mode') {
            latestConsoleState.strobeOverrideMode = cmd.value || 'off';
          } else if (cmd.type === 'freeze') {
            latestConsoleState.freezeOverride = Boolean(cmd.value);
          } else if (cmd.type === 'haze') {
            latestConsoleState.hazeBlastActive = Boolean(cmd.value);
          } else if (cmd.type === 'color') {
            latestConsoleState.activeColorId = cmd.value ?? null;
          } else if (cmd.type === 'position') {
            latestConsoleState.activePosId = cmd.value;
          } else if (cmd.type === 'highlight_fixture') {
            latestConsoleState.highlightedFixtureId = cmd.fixtureId ?? null;
          } else if (
            cmd.type === 'update_fixture_patch' ||
            cmd.type === 'batch_patch_group' ||
            cmd.type === 'add_fixture' ||
            cmd.type === 'delete_fixture'
          ) {
            const diskShow = getCachedShowData();
            let curFixtures = Array.isArray(latestConsoleState.fixtures) && latestConsoleState.fixtures.length > 0
              ? [...latestConsoleState.fixtures]
              : Array.isArray(diskShow?.fixtures)
                ? [...diskShow.fixtures]
                : [];
            const curProfiles = Array.isArray(latestConsoleState.profiles) && latestConsoleState.profiles.length > 0
              ? latestConsoleState.profiles
              : Array.isArray(diskShow?.profiles)
                ? diskShow.profiles
                : [];

            if (cmd.type === 'update_fixture_patch' && cmd.fixtureId && cmd.patch) {
              curFixtures = curFixtures.map((f) =>
                f.id === cmd.fixtureId ? { ...f, ...cmd.patch } : f
              );
            } else if (
              cmd.type === 'batch_patch_group' &&
              cmd.groupId &&
              typeof cmd.universe === 'number' &&
              typeof cmd.startAddress === 'number'
            ) {
              const targetUni = Math.max(1, Math.min(4, Math.round(cmd.universe)));
              let nextAddr = Math.max(1, Math.min(512, Math.round(cmd.startAddress)));
              curFixtures = curFixtures.map((f) => {
                if (f.groupId !== cmd.groupId) return f;
                const nextProfId = cmd.profileId || f.profileId;
                const prof = curProfiles.find((p) => p.id === nextProfId);
                const chCount = prof && prof.channelCount ? prof.channelCount : 16;
                const assignedAddr = Math.min(512, nextAddr);
                nextAddr = Math.min(512, assignedAddr + chCount);
                return {
                  ...f,
                  profileId: nextProfId,
                  universe: targetUni,
                  address: assignedAddr,
                };
              });
            } else if (cmd.type === 'add_fixture' && cmd.fixture) {
              curFixtures.push(cmd.fixture);
            } else if (cmd.type === 'delete_fixture' && cmd.fixtureId) {
              curFixtures = curFixtures.filter((f) => f.id !== cmd.fixtureId);
            }

            const counts = {};
            curFixtures = curFixtures.map((f) => {
              const idx = counts[f.groupId] || 0;
              counts[f.groupId] = idx + 1;
              return { ...f, orderInGroup: idx };
            });

            latestConsoleState.fixtures = curFixtures;
            if (diskShow && typeof diskShow === 'object') {
              diskShow.fixtures = curFixtures;
              diskShow.savedAt = Date.now();
              try {
                fs.writeFileSync(AUTOSAVE_FILE_PATH, JSON.stringify(diskShow, null, 2), 'utf8');
                cachedShowData = diskShow;
              } catch {}
            }
          }
          latestConsoleState.updatedAt = Date.now();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, queued: remoteCommandQueue.length, state: latestConsoleState }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/artnet/config') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const next = JSON.parse(body);
        artnetConfig = { ...artnetConfig, ...next };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, artnet: artnetConfig }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/artnet/poll') {
    sendArtPollPacket();
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          nodes: Array.from(discoveredNodes.values()),
          artnet: artnetConfig,
        })
      );
    }, 350);
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/artnet/frame') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const now = Date.now();
        const isRemoteSource = payload.source === 'remote';
        const desktopConsoleIsActive = now - lastConsoleFrameAt < 1200;

        // If a desktop console is actively running, ignore frames sent from mobile 'remote'
        // so they don't fight; if NO desktop console is open (headless Mini PC), mobile 'remote' drives the lights!
        if (isRemoteSource && desktopConsoleIsActive) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              skippedByActiveConsole: true,
              packetsSent: artnetConfig.packetsSent,
            })
          );
          return;
        }

        if (!isRemoteSource) {
          lastConsoleFrameAt = now;
        }

        if (payload.remoteState) {
          latestConsoleState = {
            ...latestConsoleState,
            ...payload.remoteState,
            updatedAt: now,
          };
        }
        const commandsToFlush =
          !isRemoteSource && remoteCommandQueue.length > 0
            ? remoteCommandQueue.splice(0, remoteCommandQueue.length)
            : [];

        if (!artnetConfig.enabled) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              skipped: true,
              remoteCommands: commandsToFlush,
              lanIps: getLanAddresses(),
            })
          );
          return;
        }
        const universes = payload.universes || {};
        lastUniversesFrame = universes;
        lastFrameReceivedAt = now;
        sendUniversesToArtnet(universes);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            packetsSent: artnetConfig.packetsSent,
            hahanUsbAdapter: artnetConfig.hahanUsbAdapter,
            nodes: Array.from(discoveredNodes.values()),
            remoteCommands: commandsToFlush,
            lanIps: getLanAddresses(),
          })
        );
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/daslight/brands') {
    try {
      const dirs = fs.existsSync(SCAN_LIBRARY_PATH)
        ? fs
            .readdirSync(SCAN_LIBRARY_PATH, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
        : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, brands: dirs }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/daslight/fixtures') {
    const brand = parsedUrl.searchParams.get('brand') || '_Generic';
    try {
      const safeBrand = path.basename(brand);
      const brandDir = path.join(SCAN_LIBRARY_PATH, safeBrand);
      const files = fs.existsSync(brandDir)
        ? fs
            .readdirSync(brandDir)
            .filter((f) => f.toLowerCase().endsWith('.ssl2'))
            .map((f) => ({
              name: f.replace(/\.ssl2$/i, ''),
              fileName: f,
              sslPath: `${safeBrand}/${f}`,
            }))
        : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, brand: safeBrand, fixtures: files }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/daslight/shows') {
    try {
      const seenPaths = new Set();
      const files = [];
      for (const dir of EXTRA_SHOW_DIRS) {
        if (!fs.existsSync(dir)) continue;
        try {
          const entries = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.dvc'));
          for (const f of entries) {
            const full = path.join(dir, f);
            if (seenPaths.has(full.toLowerCase())) continue;
            seenPaths.add(full.toLowerCase());
            const stat = fs.statSync(full);
            files.push({
              fileName: f,
              filePath: full,
              sizeBytes: stat.size,
              modifiedAt: stat.mtime,
            });
          }
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, shows: files }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/daslight/extract-ssl-profiles') {
    try {
      const foundProfiles = new Map();
      for (const dir of EXTRA_SHOW_DIRS) {
        if (!fs.existsSync(dir)) continue;
        try {
          const dvcFiles = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.dvc'));
          for (const f of dvcFiles) {
            try {
              const xmlContent = fs.readFileSync(path.join(dir, f), 'utf8');
              const m = xmlContent.match(/<PATCHS\s+DATA="([^"]+)"/);
              if (m && m[1]) {
                const rawBuf = Buffer.from(m[1], 'base64');
                const patchXml = zlib.inflateSync(rawBuf.subarray(4)).toString('utf8');
                const sslRegex = /<SSLLIBRARY\s+[\s\S]*?<\/SSLLIBRARY>/g;
                let sm;
                while ((sm = sslRegex.exec(patchXml)) !== null) {
                  const sslXml = sm[0];
                  const nameMatch = sslXml.match(/SSLNAME="([^"]+)"/);
                  const sslName = nameMatch ? nameMatch[1] : 'Custom.ssl2';
                  if (!foundProfiles.has(sslName)) {
                    foundProfiles.set(sslName, {
                      sslName,
                      sourceFile: f,
                      sslXml,
                    });
                  }
                }
              }
            } catch {}
          }
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, sslProfiles: Array.from(foundProfiles.values()) }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/daslight/parse-show') {
    const fileParam = parsedUrl.searchParams.get('file') || '';
    try {
      let fullPath = fileParam;
      if (!fs.existsSync(fullPath)) {
        const safeFile = path.basename(fileParam);
        for (const dir of EXTRA_SHOW_DIRS) {
          const candidate = path.join(dir, safeFile);
          if (fs.existsSync(candidate)) {
            fullPath = candidate;
            break;
          }
        }
      }
      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Archivo .dvc no encontrado' }));
        return;
      }
      const parsed = parseDvcFile(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, show: parsed }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // Serve compiled production frontend from dist/ (so http://localhost:5175 works 24/7 in a single unified server!)
  const distDir = path.join(__dirname, '..', 'dist');
  if (req.method === 'GET' && fs.existsSync(distDir)) {
    let relPath = parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname.replace(/^\/+/, '');
    let candidate = path.join(distDir, relPath);
    if (!fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
      candidate = path.join(distDir, 'index.html');
    }
    if (fs.existsSync(candidate)) {
      const ext = path.extname(candidate).toLowerCase();
      const mimeMap = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
      };
      res.writeHead(200, {
        'Content-Type': mimeMap[ext] || 'application/octet-stream',
        // index.html must never be cached (otherwise an old page could point to deleted assets after
        // an update); hashed assets in /assets can be cached forever.
        'Cache-Control':
          ext === '.html' || ext === '.webmanifest'
            ? 'no-cache, no-store, must-revalidate'
            : candidate.includes(`${path.sep}assets${path.sep}`)
              ? 'public, max-age=31536000, immutable'
              : 'no-cache',
      });
      res.end(fs.readFileSync(candidate));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
};

const server3000 = http.createServer(requestHandler);
const server3031 = http.createServer(requestHandler);
const server5175 = http.createServer(requestHandler);

server3000.on('error', () => {});
server3000.listen(3000, '0.0.0.0', () => {
  console.log(`[GrandDas Production Console] Ready 24/7 on http://localhost:3000`);
});

server3031.on('error', () => {});
server3031.listen(PORT, '0.0.0.0', () => {
  console.log(`[GrandDas Art-Net & Daslight Bridge] API + UI on http://127.0.0.1:${PORT}`);
});

server5175.on('error', () => {});
server5175.listen(5175, '0.0.0.0', () => {
  console.log(`[GrandDas Production Console] Ready 24/7 on http://localhost:5175`);
  console.log(`[Art-Net UDP] Ready to transmit DMX512 to ${artnetConfig.targetIp}:${artnetConfig.port}`);
});
