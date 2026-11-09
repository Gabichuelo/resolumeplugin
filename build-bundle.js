/**
 * AETHER-VJ: Zero-Dependency ES Module Bundler
 * Compiles the modular /js source tree into standalone IIFE bundles
 * so index.html and projector.html run both via HTTP Server AND direct file:// double-click.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stripImportsExports(code) {
  return code
    .replace(/^\s*import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(async\s+function|const|let|var|function|class)\s+/gm, '$1 ');
}

const orderedFiles = [
  'js/palettes.js',
  'js/state.js',
  'js/shaders/common.glsl.js',
  'js/shaders/generators.glsl.js',
  'js/shaders/postfx.glsl.js',
  'js/engine/textLayer.js',
  'js/engine/outputMapping.js',
  'js/engine/webglRenderer.js',
  'js/engine/audioAnalyzer.js',
  'js/engine/autopilotBrain.js',
  'js/engine/presetManager.js',
  'js/engine/persistence.js',
  'js/engine/midiClock.js',
  'js/engine/mediaLayer.js',
  'js/engine/logoProcessor.js',
  'js/engine/syncBridge.js',
  'js/ui/consoleController.js'
];

let sharedCore = `/**
 * AETHER-VJ: Compiled Standalone Production Bundle (file:// & http:// compatible)
 * Generated from modular source files in /js
 */\n(function() {\n'use strict';\n\n`;

for (const rel of orderedFiles) {
  const full = path.join(__dirname, rel);
  const raw = fs.readFileSync(full, 'utf8');
  sharedCore += `// ==================== MODULE: ${rel} ====================\n`;
  sharedCore += stripImportsExports(raw) + '\n\n';
}

const mainRaw = fs.readFileSync(path.join(__dirname, 'js/main.js'), 'utf8');
const mainBundle = sharedCore + '// ==================== MODULE: js/main.js ====================\n' + stripImportsExports(mainRaw) + '\n})();\n';

const projectorBoot = `
// ==================== MODULE: projector-bootstrapper ====================
window.addEventListener('DOMContentLoaded', () => {
  const state = createInitialState();
  // Si se abre con ?alpha=1 en OBS Browser Source o Resolume, arranca en modo transparente real
  if (window.location.search.includes('alpha=1')) {
    state.bgMode = 'ALPHA';
  }
  const canvas = document.getElementById('projector-gl-canvas');
  const renderer = new WebGLRenderer(canvas);
  // The projector window usually runs unattended on a second screen: reload if the GPU is lost
  renderer.autoReloadOnContextLoss = true;
  const bridge = new SyncBridge(state, 'projector');
  // Vídeo / GIF / cámara también en la ventana de proyector
  const media = new MediaLayer(state);
  renderer.media = media;
  bridge.attachMedia(media);
  // projector.html?blend=left|right: esta ventana es el proyector izquierdo/derecho del edge blending
  const blendParam = new URLSearchParams(window.location.search).get('blend');
  if (blendParam === 'left') bridge.edgeModeOverride = 2;
  else if (blendParam === 'right') bridge.edgeModeOverride = 3;
  if (bridge.edgeModeOverride !== null) state.fx.edgeBlend.mode = bridge.edgeModeOverride;

  let lastTime = performance.now();
  function renderLoop(now) {
    const dt = Math.min(0.1, Math.max(0.0001, (now - lastTime) / 1000.0));
    lastTime = now;
    // Si la ventana principal está minimizada o cerrada, el proyector sigue avanzando autónomamente a 60 FPS
    if (!bridge.lastMasterSyncTime || (now - bridge.lastMasterSyncTime) > 60) {
      state.renderTime += dt;
      const spd = state.macros.speed ? state.macros.speed.modulated : 0.22;
      state.accumulatedPhase += dt * (0.12 + spd * spd * 2.8);
    }
    document.body.classList.toggle('bg-solid', state.bgMode !== 'ALPHA');
    renderer.renderFrame(state);
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  window.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
});
})();
`;

const projectorBundle = sharedCore + projectorBoot;

fs.writeFileSync(path.join(__dirname, 'js/aether-vj.bundle.js'), mainBundle, 'utf8');
fs.writeFileSync(path.join(__dirname, 'js/aether-projector.bundle.js'), projectorBundle, 'utf8');

console.log('[AETHER-VJ] Built js/aether-vj.bundle.js and js/aether-projector.bundle.js successfully.');

// En el Mini-PC Linux: al actualizar AETHER-VJ desde el botón del móvil/consola,
// actualizar también automáticamente la App de Luces (/opt/planecreator -> rama 'luces') sin tocar la terminal.
if (process.platform === 'linux' && process.env.SKIP_LUCES_SYNC !== '1') {
  const candidates = new Set(['/opt/planecreator']);
  try {
    const psOut = execSync('ps aux | grep "[s]erver-dmx.js" || true', { encoding: 'utf8' });
    for (const line of psOut.split('\n')) {
      const parts = line.trim().split(/\s+/);
      const last = parts[parts.length - 1];
      if (last && last.endsWith('server-dmx.js')) {
        candidates.add(path.dirname(last));
      }
    }
  } catch (_) {}

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    try {
      const repo = 'https://github.com/Gabichuelo/resolumeplugin.git';
      const safeGit = 'git -c safe.directory="*"';
      const syncCmd = fs.existsSync(path.join(dir, '.git'))
        ? `${safeGit} remote set-url origin "${repo}" && ${safeGit} fetch origin luces && ${safeGit} reset --hard origin/luces`
        : `${safeGit} init -b luces && ${safeGit} remote add origin "${repo}" && ${safeGit} fetch --depth=1 origin luces && ${safeGit} reset --hard origin/luces`;
      execSync(syncCmd, { cwd: dir, stdio: 'ignore', timeout: 90000 });
      console.log(`[AETHER-VJ] App de Luces actualizada automáticamente en ${dir} (rama luces).`);
    } catch (e) {
      console.warn(`[AETHER-VJ] Aviso al sincronizar luces en ${dir}:`, e.message);
    }
  }
  try {
    // systemd (Restart=always) vuelve a levantar server-dmx.js en 2 segundos con el código nuevo
    execSync('pkill -f server-dmx.js || true', { stdio: 'ignore' });
  } catch (_) {}
}
