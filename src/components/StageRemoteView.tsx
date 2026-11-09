import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  QrCode,
  Wifi,
  Sun,
  PowerOff,
  Zap,
  Snowflake,
  Wind,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Check,
  Copy,
  X,
  ExternalLink,
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { FIXTURE_PROFILES } from '../constants/defaultShowData';
import { generateQrMatrix } from '../utils/qrCodeGenerator';
import { getRemotePin, remoteFetch, saveRemotePin } from '../utils/remotePin';
import type {
  ColorPaletteId,
  FixtureProfile,
  GroupCalibration,
  GroupId,
  PatchedFixture,
  PositionPaletteId,
  StrobeOverrideMode,
} from '../types/dmx';

export interface LanIpEntry {
  ip: string;
  ifaceName: string;
  url: string;
}

export interface RemoteCommandPayload {
  type:
    | 'macro_look'
    | 'color'
    | 'position'
    | 'worklight'
    | 'blackout'
    | 'grand_master'
    | 'blinder'
    | 'strobe_mode'
    | 'freeze'
    | 'haze'
    | 'auto_show'
    | 'group_dimmer'
    | 'group_mute'
    | 'group_solo'
    | 'group_flash'
    | 'calibrate_group'
    | 'highlight_fixture'
    | 'update_fixture_patch'
    | 'batch_patch_group'
    | 'add_fixture'
    | 'delete_fixture';
  value?: any;
  groupId?: GroupId;
  field?: 'panLeftDmx' | 'panRightDmx' | 'tiltFloorDmx' | 'tiltSkyDmx';
  delta?: number;
  fixtureId?: string | null;
  patch?: Partial<PatchedFixture>;
  fixture?: PatchedFixture;
  universe?: number;
  startAddress?: number;
  profileId?: string;
}

interface StageRemoteViewProps {
  mode: 'modal' | 'fullscreen';
  onClose?: () => void;
  lanIps: LanIpEntry[];
  activeMacroLookId: string | null;
  activeColorId: Exclude<ColorPaletteId, 'transparent'> | null;
  activePosId: PositionPaletteId;
  globalMaster: number;
  globalBlackout: boolean;
  worklightActive: boolean;
  blinderOverride: boolean;
  strobeOverrideMode?: StrobeOverrideMode;
  freezeOverride: boolean;
  hazeBlastActive: boolean;
  autoShowRunning?: boolean;
  highlightedFixtureId: string | null;
  groupCalibrations: Record<GroupId, GroupCalibration>;
  fixtures: PatchedFixture[];
  profiles?: FixtureProfile[];
  onExecuteCommand: (cmd: RemoteCommandPayload) => void;
  onLanIpsChange?: (next: LanIpEntry[]) => void;
}

const MACRO_LOOKS = [
  { id: 'cue_intro', label: '🌅 1. Intro Atmosférica', color: '#38bdf8' },
  { id: 'cue_verse', label: '🎤 2. Verso / Vocal', color: '#06b6d4' },
  { id: 'cue_buildup', label: '🚀 3. Subida / Build-Up', color: '#a855f7' },
  { id: 'cue_drop', label: '🔥 4. DROP Festival', color: '#f59e0b' },
  { id: 'cue_techno', label: '⚡ 5. Techno / Rave UV', color: '#22c55e' },
  { id: 'cue_rainbow', label: '🌈 6. Fiesta / Arcoíris', color: '#ec4899' },
  { id: 'cue_warm_break', label: '🕯️ 7. Break Cálido 3200K', color: '#fde047' },
];

const QUICK_COLORS: { id: Exclude<ColorPaletteId, 'transparent'>; label: string; hex: string }[] = [
  { id: 'white', label: 'Blanco', hex: '#ffffff' },
  { id: 'warm_white', label: 'Cálido', hex: '#fde68a' },
  { id: 'red', label: 'Rojo', hex: '#ef4444' },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { id: 'green', label: 'Verde', hex: '#10b981' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'magenta', label: 'Magenta', hex: '#ec4899' },
  { id: 'uv', label: 'UV', hex: '#8b5cf6' },
];

const QUICK_POSITIONS: { id: PositionPaletteId; label: string }[] = [
  { id: 'transparent', label: '🔄 Auto Escena' },
  { id: 'downstage', label: '👥 Público' },
  { id: 'sky_fan', label: '🌌 Cielo' },
  { id: 'dj_booth', label: '🎧 Centro DJ' },
  { id: 'x_cross', label: '⚔️ Cruce X' },
  { id: 'wide_roof', label: '🦅 Abanico' },
  { id: 'floor_wash', label: '⬇️ Suelo' },
];

const STROBE_MODES: {
  id: Exclude<StrobeOverrideMode, 'off'>;
  label: string;
  shortLabel: string;
  desc: string;
  badge: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: 'slow',
    label: '⚡ 1. Estrobo Lento',
    shortLabel: '⚡ Lento 4Hz',
    desc: 'Golpe dramático lento (4 Hz) en cabezas y barras',
    badge: '4 Hz',
    activeClass: 'bg-amber-400 text-slate-950 border-white shadow-lg shadow-amber-400/40',
    idleClass: 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-slate-800',
  },
  {
    id: 'medium',
    label: '⚡⚡ 2. Estrobo Medio Club',
    shortLabel: '⚡⚡ Medio 9Hz',
    desc: 'Estrobo clásico de club a velocidad media (9 Hz)',
    badge: '9 Hz',
    activeClass: 'bg-orange-500 text-slate-950 border-white shadow-lg shadow-orange-500/40',
    idleClass: 'bg-slate-950 border-orange-500/40 text-orange-300 hover:bg-slate-800',
  },
  {
    id: 'fast',
    label: '🌩️ 3. Estrobo Rápido Drop',
    shortLabel: '🌩️ Rápido 16Hz',
    desc: 'Ráfaga blanca máxima 100% para el Drop (16 Hz)',
    badge: '16 Hz MAX',
    activeClass:
      'bg-yellow-300 text-slate-950 border-white shadow-xl shadow-yellow-300/50 animate-pulse',
    idleClass: 'bg-slate-950 border-yellow-400/50 text-yellow-200 hover:bg-slate-800',
  },
  {
    id: 'alternate',
    label: '🔀 4. Estrobo Alterno Impar/Par',
    shortLabel: '🔀 Impar / Par',
    desc: 'Rebota ráfagas entre focos Impares y Pares (Izq/Der)',
    badge: 'PING-PONG',
    activeClass: 'bg-cyan-400 text-slate-950 border-white shadow-lg shadow-cyan-400/40',
    idleClass: 'bg-slate-950 border-cyan-500/40 text-cyan-300 hover:bg-slate-800',
  },
  {
    id: 'random_sparkle',
    label: '✨ 5. Lluvia Random Flash',
    shortLabel: '✨ Lluvia Flash',
    desc: 'Destellos estroboscópicos aleatorios por todo el rig',
    badge: 'SPARKLE',
    activeClass: 'bg-emerald-400 text-slate-950 border-white shadow-lg shadow-emerald-400/40',
    idleClass: 'bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-slate-800',
  },
  {
    id: 'uv_rave',
    label: '💜 6. Estrobo Rave UV + Cian',
    shortLabel: '💜 Rave UV/Cian',
    desc: 'Estrobo bicolor alternando Violeta UV y Cian eléctrico',
    badge: 'UV RAVE',
    activeClass: 'bg-fuchsia-500 text-white border-white shadow-lg shadow-fuchsia-500/40',
    idleClass: 'bg-slate-950 border-fuchsia-500/40 text-fuchsia-300 hover:bg-slate-800',
  },
];

const GROUP_LABELS: Record<GroupId, string> = {
  beams: 'Cabezas Beam',
  washes: 'Cabezas Wash',
  spots: 'Cabezas Spot',
  bars: 'Barras LED',
  strobes: 'Strobos',
  blinders: 'Cegadoras',
};

export const StageRemoteView: React.FC<StageRemoteViewProps> = ({
  mode,
  onClose,
  lanIps,
  activeMacroLookId: propMacroLookId,
  activeColorId: propColorId,
  activePosId: propPosId,
  globalMaster: propGlobalMaster,
  globalBlackout: propBlackout,
  worklightActive: propWorklight,
  blinderOverride: propBlinder,
  strobeOverrideMode: propStrobeOverrideMode,
  freezeOverride: propFreeze,
  hazeBlastActive: propHaze,
  autoShowRunning: propAutoShowRunning,
  highlightedFixtureId: propHighlightedId,
  groupCalibrations: propGroupCals,
  fixtures: propFixtures,
  profiles: propProfiles,
  onExecuteCommand,
  onLanIpsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'qr' | 'simple4' | 'live' | 'groups' | 'calibrate' | 'tester' | 'patch'
  >(mode === 'modal' ? 'qr' : 'simple4');
  const [selectedLanIdx, setSelectedLanIdx] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Calibration state for mobile dancefloor calibration
  const [calGroup, setCalGroup] = useState<'beams' | 'washes' | 'spots'>('beams');

  // Patch & DMX Address Editor state
  const [patchFilterGroup, setPatchFilterGroup] = useState<GroupId | 'all'>('all');
  const [autoPatchGroup, setAutoPatchGroup] = useState<GroupId>('beams');
  const [autoPatchUni, setAutoPatchUni] = useState<number>(1);
  const [autoPatchStartAddr, setAutoPatchStartAddr] = useState<number>(1);
  const [autoPatchProfileId, setAutoPatchProfileId] = useState<string>('');
  const [newFixGroup, setNewFixGroup] = useState<GroupId>('beams');
  const [newFixProfileId, setNewFixProfileId] = useState<string>('beam-7r-16ch');
  const [newFixUni, setNewFixUni] = useState<number>(1);
  const [newFixAddr, setNewFixAddr] = useState<number>(1);
  const [newFixName, setNewFixName] = useState<string>('');
  const [patchToast, setPatchToast] = useState<string>('');
  const strobePressRef = React.useRef<{
    id: StrobeOverrideMode;
    startTime: number;
    wasActive: boolean;
  } | null>(null);

  // Remote synced state when running on a mobile phone (?remote=1)
  const [remoteState, setRemoteState] = useState<any>(null);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [updateMsg, setUpdateMsg] = useState<string>('');
  const [updatingNow, setUpdatingNow] = useState<boolean>(false);
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>(() => getRemotePin());
  const [pinError, setPinError] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string>('');

  const handleInternetUpdate = async () => {
    setUpdatingNow(true);
    setUpdateMsg('⏳ Descargando actualización de luces desde GitHub...');
    try {
      const res = await remoteFetch('/api/system-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: 'https://github.com/Gabichuelo/resolumeplugin.git',
          branch: 'luces',
        }),
      });
      const data = await res.json();
      setUpdatingNow(false);
      if (data.ok) {
        setUpdateMsg('✅ ' + (data.message || 'Actualizado. Recarga la página.'));
      } else {
        setUpdateMsg('❌ ' + (data.error || 'Error al actualizar'));
      }
    } catch {
      setUpdatingNow(false);
      setUpdateMsg('❌ Error de conexión con el servidor');
    }
  };

  useEffect(() => {
    if (mode !== 'fullscreen') return;
    let mounted = true;
    const pollState = async () => {
      try {
        const res = await remoteFetch('/api/remote/state');
        if (res.status === 401) {
          if (mounted) setPinRequired(true);
          return;
        }
        if (!res.ok) return;
        if (mounted) setPinRequired(false);
        const data = await res.json();
        if (mounted && data?.ok && data.state) {
          setRemoteState(data.state);
          if (data.system) setSysInfo(data.system);
        }
      } catch {}
    };
    pollState();
    const timer = window.setInterval(pollState, 350);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [mode]);

  const sendCommand = async (cmd: RemoteCommandPayload) => {
    // Always execute locally if callback is connected
    onExecuteCommand(cmd);
    // Optimistically update remoteState on mobile so UI responds in 0ms
    setRemoteState((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (cmd.type === 'strobe_mode') {
        next.strobeOverrideMode = cmd.value || 'off';
      } else if (cmd.type === 'update_fixture_patch' && cmd.fixtureId && cmd.patch && Array.isArray(next.fixtures)) {
        next.fixtures = next.fixtures.map((f: PatchedFixture) =>
          f.id === cmd.fixtureId ? { ...f, ...cmd.patch } : f
        );
      } else if (cmd.type === 'add_fixture' && cmd.fixture && Array.isArray(next.fixtures)) {
        next.fixtures = [...next.fixtures, cmd.fixture];
      } else if (cmd.type === 'delete_fixture' && cmd.fixtureId && Array.isArray(next.fixtures)) {
        next.fixtures = next.fixtures.filter((f: PatchedFixture) => f.id !== cmd.fixtureId);
      }
      return next;
    });
    // And send over HTTP to main PC console if we are on mobile fullscreen
    if (mode === 'fullscreen') {
      try {
        const res = await remoteFetch('/api/remote/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cmd),
        });
        if (res.status === 401) setPinRequired(true);
        else if (res.ok) {
          const data = await res.json();
          if (data?.state) setRemoteState(data.state);
        }
      } catch {}
    }
  };

  // Merge live props with remoteState if on mobile phone
  const activeMacroLookId = remoteState?.activeMacroLookId ?? propMacroLookId;
  const activeColorId = remoteState?.activeColorId ?? propColorId;
  const activePosId = remoteState?.activePosId ?? propPosId;
  const globalMaster = remoteState?.globalMaster ?? propGlobalMaster;
  const globalBlackout = remoteState?.globalBlackout ?? propBlackout;
  const worklightActive = remoteState?.worklightActive ?? propWorklight;
  const blinderOverride = remoteState?.blinderOverride ?? propBlinder;
  const strobeOverrideMode: StrobeOverrideMode =
    remoteState?.strobeOverrideMode ?? propStrobeOverrideMode ?? 'off';
  const freezeOverride = remoteState?.freezeOverride ?? propFreeze;
  const hazeBlastActive = remoteState?.hazeBlastActive ?? propHaze;
  const autoShowRunning = Boolean(remoteState?.autoShowRunning ?? propAutoShowRunning);
  const highlightedFixtureId = remoteState?.highlightedFixtureId ?? propHighlightedId;
  const groupCalibrations: Record<GroupId, GroupCalibration> =
    remoteState?.groupCalibrations && Object.keys(remoteState.groupCalibrations).length > 0
      ? remoteState.groupCalibrations
      : propGroupCals;
  const fixtures: PatchedFixture[] =
    remoteState?.fixtures && remoteState.fixtures.length > 0 ? remoteState.fixtures : propFixtures;
  const profiles: FixtureProfile[] =
    remoteState?.profiles && remoteState.profiles.length > 0
      ? remoteState.profiles
      : propProfiles && propProfiles.length > 0
        ? propProfiles
        : FIXTURE_PROFILES;

  const showPatchToast = (msg: string) => {
    setPatchToast(msg);
    window.setTimeout(() => setPatchToast(''), 2600);
  };

  const handleStrobePressStart = (modeId: Exclude<StrobeOverrideMode, 'off'>) => {
    const wasActive = strobeOverrideMode === modeId;
    strobePressRef.current = { id: modeId, startTime: Date.now(), wasActive };
    if (!wasActive) {
      sendCommand({ type: 'strobe_mode', value: modeId });
    }
  };

  const handleStrobePressEnd = (modeId: Exclude<StrobeOverrideMode, 'off'>) => {
    const press = strobePressRef.current;
    strobePressRef.current = null;
    if (!press || press.id !== modeId) return;
    const heldMs = Date.now() - press.startTime;
    if (press.wasActive || heldMs > 260) {
      sendCommand({ type: 'strobe_mode', value: 'off' });
    }
  };

  const renderStrobeDeckCard = () => (
    <div className="bg-slate-900 border border-yellow-500/35 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
            ⚡ Botonera de Estrobos (6 Modos: Toca = Fijar · Mantén = Ráfaga)
          </span>
        </div>
        {strobeOverrideMode !== 'off' && (
          <button
            onClick={() => sendCommand({ type: 'strobe_mode', value: 'off' })}
            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase shadow cursor-pointer animate-pulse"
          >
            🔴 Parar Estrobo (OFF)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STROBE_MODES.map((st) => {
          const isActive = strobeOverrideMode === st.id;
          return (
            <button
              key={st.id}
              onMouseDown={() => handleStrobePressStart(st.id)}
              onMouseUp={() => handleStrobePressEnd(st.id)}
              onMouseLeave={() => {
                if (strobePressRef.current?.id === st.id) {
                  handleStrobePressEnd(st.id);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleStrobePressStart(st.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleStrobePressEnd(st.id);
              }}
              className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between gap-1.5 transition active:scale-95 cursor-pointer select-none ${
                isActive ? st.activeClass : st.idleClass
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-black uppercase leading-tight">{st.shortLabel}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                    isActive ? 'bg-slate-950 text-yellow-300' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {isActive ? 'ON' : st.badge}
                </span>
              </div>
              <div
                className={`text-[10px] leading-snug ${
                  isActive ? 'font-bold opacity-95' : 'text-slate-400'
                }`}
              >
                {st.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const selectedLan = lanIps[selectedLanIdx] || {
    ip: window.location.hostname || '192.168.1.100',
    ifaceName: 'Wi-Fi Local',
    url: `http://${window.location.hostname || 'localhost'}:5175/?remote=1`,
  };

  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(selectedLan.url);
    } catch {
      return [];
    }
  }, [selectedLan.url]);

  const currentPin = useMemo(() => {
    try {
      return new URL(selectedLan.url).searchParams.get('pin') || '';
    } catch {
      return '';
    }
  }, [selectedLan.url]);

  const currentHighlightedIdx = fixtures.findIndex((f) => f.id === highlightedFixtureId);

  const handleStepFixture = (dir: -1 | 1) => {
    if (fixtures.length === 0) return;
    let nextIdx = currentHighlightedIdx + dir;
    if (nextIdx < 0) nextIdx = fixtures.length - 1;
    if (nextIdx >= fixtures.length) nextIdx = 0;
    sendCommand({ type: 'highlight_fixture', fixtureId: fixtures[nextIdx].id });
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
              📱 GrandDas Stage Remote
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                EN VIVO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Control de escenario, calibración 4 esquinas desde pista y test de focos
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Cerrar
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="px-3 py-2 bg-slate-900/70 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {mode === 'modal' && (
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Conectar Móvil (QR)
          </button>
        )}
        <button
          onClick={() => setActiveTab('simple4')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'simple4'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-950 text-emerald-300 hover:text-white border border-emerald-500/40'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          🎛️ 4 Botones (Mini PC)
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'live'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          1. Directo & Looks
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'groups'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          2. 6 Grupos
        </button>
        <button
          onClick={() => setActiveTab('calibrate')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'calibrate'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          3. Calibrar 4P (Pista)
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'tester'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          4. Test Foco a Foco
        </button>
        <button
          onClick={() => setActiveTab('patch')}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'patch'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25'
              : 'bg-slate-950 text-amber-300 hover:text-white border border-amber-500/40'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          🔧 5. Patch / Direcciones ({fixtures.length})
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB QR: CONNECT PHONE OVER WI-FI */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center max-w-4xl mx-auto py-2">
            {/* Offline QR Code Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-xl">
              <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                {qrMatrix.length > 0 ? (
                  <svg
                    viewBox={`0 0 ${qrMatrix.length + 8} ${qrMatrix.length + 8}`}
                    className="w-56 h-56"
                    shapeRendering="crispEdges"
                  >
                    <rect width="100%" height="100%" fill="#ffffff" />
                    {qrMatrix.map((row, rIdx) =>
                      row.map((dark, cIdx) =>
                        dark ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx + 4}
                            y={rIdx + 4}
                            width={1}
                            height={1}
                            fill="#000000"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-900 font-bold text-xs">
                    QR Lista
                  </div>
                )}
              </div>
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Escanea con la cámara de tu Móvil o Tablet
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                100% Offline · No necesita Internet, solo estar en la misma Wi-Fi o Punto de Acceso del portátil.
              </p>
              {/* Remote PIN (embedded in the QR, needed if someone types the address by hand) */}
              <div className="mt-3 w-full bg-slate-950 border border-emerald-500/40 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">🔒 PIN del Mando:</span>
                  <span className="font-mono font-black text-lg tracking-[0.3em] text-emerald-300">
                    {currentPin || '----'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 text-left leading-snug">
                  El QR ya lleva el PIN dentro. Si alguien abre la dirección sin el QR, tendrá que escribirlo.
                </p>
                <button
                  onClick={async () => {
                    const next = window.prompt('Nuevo PIN del mando (4 a 8 números):', currentPin);
                    if (!next) return;
                    try {
                      const res = await fetch('/api/remote/pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: next }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        if (Array.isArray(data.lanIps)) onLanIpsChange?.(data.lanIps);
                        setPinChangeMsg('✅ PIN cambiado. Vuelve a escanear el QR en el móvil.');
                      } else {
                        setPinChangeMsg(`⚠️ ${data.error || 'No se pudo cambiar'}`);
                      }
                    } catch {
                      setPinChangeMsg('⚠️ Servidor no disponible');
                    }
                    setTimeout(() => setPinChangeMsg(''), 4000);
                  }}
                  className="w-full py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                >
                  Cambiar PIN
                </button>
                {pinChangeMsg && <div className="text-[10px] text-amber-300">{pinChangeMsg}</div>}
              </div>
            </div>

            {/* Instructions & LAN IP Selector */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                  <Wifi className="w-4 h-4" />
                  Direcciones Wi-Fi / Red Local Detectadas
                </div>

                {lanIps.length > 0 ? (
                  <div className="space-y-1.5">
                    {lanIps.map((entry, idx) => (
                      <button
                        key={entry.ip}
                        onClick={() => setSelectedLanIdx(idx)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                          selectedLanIdx === idx
                            ? 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{entry.ifaceName}</div>
                          <div className="text-[11px] font-mono text-amber-300">{entry.url}</div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900">
                          {selectedLanIdx === idx ? 'Seleccionada' : 'Usar'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    Conecta el PC a una red Wi-Fi (o activa "Zona con cobertura inalámbrica móvil" en Windows) para ver la IP local aquí.
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedLan.url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                  </button>
                  <button
                    onClick={() => setActiveTab('simple4')}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir 4 Botones Aquí
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white">💡 Truco para Mini PC Linux o Portátil sin Wi-Fi en la nave:</div>
                <p className="text-slate-400 leading-relaxed">
                  En Mini PC Linux (red <strong>GRANDDAS_LUCES</strong>) o en Windows 10/11 (<strong>Zona con cobertura inalámbrica móvil</strong>), conecta tu móvil directamente al PC sin necesitar router ni Internet y usa el modo <strong>🎛️ 4 Botones</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0: 4 GIGANTIC BUTTONS FOR MINI PC + MOBILE PHONE */}
        {activeTab === 'simple4' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-3 min-h-[calc(100vh-150px)] justify-between">
            {/* Top Status & Auto-Show Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-black uppercase text-white">
                    Mando Directo 4 Botones · Hahan DMX512
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {globalBlackout
                      ? '🌑 APAGÓN GENERAL (BLACKOUT ACTIVO)'
                      : worklightActive
                        ? '💡 LUZ DE TRABAJO FIJA ACTIVA (85%)'
                        : autoShowRunning
                          ? '🤖 PILOTO AUTOMÁTICO (AUTO-SHOW EN MARCHA)'
                          : activeMacroLookId === 'cue_drop'
                            ? '🔥 BOTÓN 2 ACTIVO: MODO CAÑA / DROP'
                            : activeMacroLookId === 'cue_warm_break'
                              ? '🕯️ BOTÓN 3 ACTIVO: CALMA / AMBIENTE CÁLIDO'
                              : '🎉 BOTÓN 1 ACTIVO: FIESTA / CÍRCULO SIMÉTRICO'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => sendCommand({ type: 'auto_show', value: !autoShowRunning })}
                className={`px-3.5 py-2 rounded-xl border text-xs font-black uppercase transition cursor-pointer ${
                  autoShowRunning
                    ? 'bg-emerald-400 text-slate-950 border-white shadow-lg shadow-emerald-500/30 animate-pulse'
                    : 'bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-slate-800'
                }`}
              >
                {autoShowRunning ? '🤖 Auto-Show: ON' : '🤖 Activar Auto-Show'}
              </button>
            </div>

            {/* THE 4 GIGANTIC FULL-SCREEN BUTTONS (2x2 GRID) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
              {/* BUTTON 1: FIESTA / SYMMETRIC CIRCLE */}
              {(() => {
                const isBtn1 =
                  !globalBlackout &&
                  !worklightActive &&
                  (activeMacroLookId === 'cue_rainbow' ||
                    activeMacroLookId === 'cue_intro' ||
                    !activeMacroLookId);
                return (
                  <button
                    onClick={() => sendCommand({ type: 'macro_look', value: 'cue_rainbow' })}
                    className={`min-h-[135px] sm:min-h-[175px] p-5 rounded-3xl border-2 text-left flex flex-col justify-between transition active:scale-[0.98] cursor-pointer ${
                      isBtn1
                        ? 'bg-gradient-to-br from-pink-600 via-fuchsia-600 to-cyan-600 text-white border-white shadow-2xl shadow-pink-500/30'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-pink-500/40 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xl sm:text-4xl">🎉</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isBtn1
                            ? 'bg-slate-950/80 text-emerald-300 border border-emerald-400/50'
                            : 'bg-slate-950 text-pink-300'
                        }`}
                      >
                        {isBtn1 ? '● ACTIVO' : 'BOTÓN 1'}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="text-lg sm:text-xl font-black uppercase tracking-tight">
                        1. Fiesta / Círculo
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          isBtn1 ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        Beams + Barras al Público · Movimiento Círculo Simétrico + Colores Fiesta
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* BUTTON 2: MODO CAÑA / DROP FESTIVAL */}
              {(() => {
                const isBtn2 =
                  !globalBlackout && !worklightActive && activeMacroLookId === 'cue_drop';
                return (
                  <button
                    onClick={() => sendCommand({ type: 'macro_look', value: 'cue_drop' })}
                    className={`min-h-[135px] sm:min-h-[175px] p-5 rounded-3xl border-2 text-left flex flex-col justify-between transition active:scale-[0.98] cursor-pointer ${
                      isBtn2
                        ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-slate-950 border-white shadow-2xl shadow-amber-500/35'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-amber-500/40 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xl sm:text-4xl">🔥</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isBtn2
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-slate-950 text-amber-400'
                        }`}
                      >
                        {isBtn2 ? '● ACTIVO' : 'BOTÓN 2'}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="text-lg sm:text-xl font-black uppercase tracking-tight">
                        2. Modo Caña / Drop
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          isBtn2 ? 'text-slate-950/85 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Energía 100% · Movimiento Ballyhoo Rápido + Chase Rítmico
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* BUTTON 3: CALMA / AMBIENTE CÁLIDO */}
              {(() => {
                const isBtn3 =
                  !globalBlackout && !worklightActive && activeMacroLookId === 'cue_warm_break';
                return (
                  <button
                    onClick={() => sendCommand({ type: 'macro_look', value: 'cue_warm_break' })}
                    className={`min-h-[135px] sm:min-h-[175px] p-5 rounded-3xl border-2 text-left flex flex-col justify-between transition active:scale-[0.98] cursor-pointer ${
                      isBtn3
                        ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-sky-500 text-slate-950 border-white shadow-2xl shadow-yellow-400/30'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-yellow-400/40 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xl sm:text-4xl">🕯️</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isBtn3
                            ? 'bg-slate-950 text-yellow-300'
                            : 'bg-slate-950 text-yellow-300'
                        }`}
                      >
                        {isBtn3 ? '● ACTIVO' : 'BOTÓN 3'}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="text-lg sm:text-xl font-black uppercase tracking-tight">
                        3. Calma / Ambiente
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          isBtn3 ? 'text-slate-950/85 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Blanco Cálido 3200K + Ámbar · Barrido Suave y Elegante
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* BUTTON 4: LUZ DE SALA FIJA & BLACKOUT */}
              <div className="min-h-[135px] sm:min-h-[175px] grid grid-rows-2 gap-2.5">
                <button
                  onClick={() => sendCommand({ type: 'worklight', value: !worklightActive })}
                  className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition active:scale-[0.98] cursor-pointer ${
                    worklightActive
                      ? 'bg-amber-300 text-slate-950 border-white shadow-xl shadow-amber-300/30'
                      : 'bg-slate-900 hover:bg-slate-800 border-amber-400/40 text-amber-200'
                  }`}
                >
                  <div>
                    <div className="text-base sm:text-lg font-black uppercase flex items-center gap-2">
                      <span>💡 4A. Luz Fija Sala</span>
                    </div>
                    <div
                      className={`text-[11px] ${
                        worklightActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Blanco fijo al 85% sin movimiento
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      worklightActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {worklightActive ? 'ENCENDIDA' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => sendCommand({ type: 'blackout', value: !globalBlackout })}
                  className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition active:scale-[0.98] cursor-pointer ${
                    globalBlackout
                      ? 'bg-rose-600 text-white border-white shadow-xl shadow-rose-600/40 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div>
                    <div className="text-base sm:text-lg font-black uppercase flex items-center gap-2">
                      <span>🌑 4B. Apagar Todo</span>
                    </div>
                    <div
                      className={`text-[11px] ${
                        globalBlackout ? 'text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      Blackout general instantáneo
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      globalBlackout ? 'bg-slate-950 text-rose-300' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {globalBlackout ? 'APAGADO' : 'BLACKOUT'}
                  </span>
                </button>
              </div>
            </div>

            {/* 6-MODE STROBE DECK IN SIMPLE 4-BUTTON VIEW */}
            {renderStrobeDeckCard()}

            {/* Bottom Instant Flash + Grand Master Dimmer Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <button
                onMouseDown={() => sendCommand({ type: 'blinder', value: true })}
                onMouseUp={() => sendCommand({ type: 'blinder', value: false })}
                onTouchStart={() => sendCommand({ type: 'blinder', value: true })}
                onTouchEnd={() => sendCommand({ type: 'blinder', value: false })}
                className={`py-3.5 px-4 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
                  blinderOverride
                    ? 'bg-yellow-300 text-slate-950 border-white shadow-lg shadow-yellow-300/40 scale-[0.98]'
                    : 'bg-slate-950 border-yellow-500/50 text-yellow-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Mantener: Flash Cegadora</span>
              </button>

              <div className="sm:col-span-2 flex items-center gap-3 px-2">
                <span className="text-xs font-black uppercase text-amber-400 shrink-0">
                  🔆 Potencia: {Math.round(globalMaster * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(globalMaster * 100)}
                  onChange={(e) =>
                    sendCommand({
                      type: 'grand_master',
                      value: parseInt(e.target.value, 10) / 100,
                    })
                  }
                  className="flex-1 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Mini-PC Telemetry + 1-Click Internet Update Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-slate-300">
                {sysInfo ? (
                  <span>
                    {sysInfo.cpuPercent < 65 ? '🟢 Fluido' : sysInfo.cpuPercent < 85 ? '🟡 Normal' : '🔴 Carga Alta'} ·{' '}
                    <strong>CPU:</strong> {sysInfo.cpuPercent}% · <strong>RAM:</strong> {sysInfo.ramUsedMb}/{sysInfo.ramTotalMb} MB ({sysInfo.ramPercent}%) ·{' '}
                    <strong>Temp:</strong> {sysInfo.cpuTempC !== null ? `${sysInfo.cpuTempC} °C` : 'N/A'}
                  </span>
                ) : (
                  <span>💻 GrandDas DMX512 + Caja Hahan SL04 (4 XLR)</span>
                )}
                {updateMsg && <div className="text-cyan-300 font-sans font-bold mt-1">{updateMsg}</div>}
              </div>
              <button
                onClick={handleInternetUpdate}
                disabled={updatingNow}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black uppercase cursor-pointer"
              >
                {updatingNow ? '⏳ Actualizando...' : '🔄 Actualizar desde Internet'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: LIVE MACRO-LOOKS, WORKLIGHT & FLASH HITS */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Master Utility & Emergency Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                onClick={() => sendCommand({ type: 'worklight', value: !worklightActive })}
                className={`p-3.5 rounded-2xl border font-black text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  worklightActive
                    ? 'bg-amber-400 text-slate-950 border-white shadow-lg shadow-amber-400/30'
                    : 'bg-slate-900 border-amber-500/40 text-amber-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>💡 Luz Trabajo</span>
              </button>

              <button
                onClick={() => sendCommand({ type: 'blackout', value: !globalBlackout })}
                className={`p-3.5 rounded-2xl border font-black text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  globalBlackout
                    ? 'bg-rose-600 text-white border-white animate-pulse'
                    : 'bg-slate-900 border-rose-500/40 text-rose-300'
                }`}
              >
                <PowerOff className="w-5 h-5" />
                <span>{globalBlackout ? 'BLACKOUT ON' : 'Blackout'}</span>
              </button>

              <button
                onMouseDown={() => sendCommand({ type: 'blinder', value: true })}
                onMouseUp={() => sendCommand({ type: 'blinder', value: false })}
                onTouchStart={() => sendCommand({ type: 'blinder', value: true })}
                onTouchEnd={() => sendCommand({ type: 'blinder', value: false })}
                className={`p-3.5 rounded-2xl border font-black text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  blinderOverride
                    ? 'bg-yellow-400 text-slate-950 border-white'
                    : 'bg-slate-900 border-yellow-500/40 text-yellow-300'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>⚡ Blinder</span>
              </button>

              <button
                onClick={() => sendCommand({ type: 'freeze', value: !freezeOverride })}
                className={`p-3.5 rounded-2xl border font-black text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  freezeOverride
                    ? 'bg-cyan-400 text-slate-950 border-white'
                    : 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Snowflake className="w-5 h-5" />
                <span>❄️ Freeze</span>
              </button>

              <button
                onMouseDown={() => sendCommand({ type: 'haze', value: true })}
                onMouseUp={() => sendCommand({ type: 'haze', value: false })}
                onTouchStart={() => sendCommand({ type: 'haze', value: true })}
                onTouchEnd={() => sendCommand({ type: 'haze', value: false })}
                className={`p-3.5 rounded-2xl border font-black text-xs uppercase flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  hazeBlastActive
                    ? 'bg-teal-400 text-slate-950 border-white'
                    : 'bg-slate-900 border-teal-500/40 text-teal-300'
                }`}
              >
                <Wind className="w-5 h-5" />
                <span>🌫️ Humo</span>
              </button>
            </div>

            {/* 6-MODE STROBE DECK IN LIVE TAB */}
            {renderStrobeDeckCard()}

            {/* Grand Master Slider */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-4">
              <span className="text-xs font-black uppercase text-amber-400 shrink-0">
                Grand Master: {Math.round(globalMaster * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(globalMaster * 100)}
                onChange={(e) =>
                  sendCommand({
                    type: 'grand_master',
                    value: parseInt(e.target.value, 10) / 100,
                  })
                }
                className="flex-1 h-3 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* 7 Macro-Looks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="text-xs font-black uppercase text-slate-400">
                🎬 Macro-Looks de Concierto
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MACRO_LOOKS.map((m) => {
                  const active = activeMacroLookId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => sendCommand({ type: 'macro_look', value: m.id })}
                      className={`p-3 rounded-xl border text-xs font-black text-left transition cursor-pointer ${
                        active
                          ? 'bg-slate-800 text-white border-white shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600'
                      }`}
                      style={{ borderLeftWidth: '5px', borderLeftColor: m.color }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 10 Quick Colors & 6 Positions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">
                    🎨 Color Maestro
                  </span>
                  {activeColorId && (
                    <button
                      onClick={() => sendCommand({ type: 'color', value: null })}
                      className="text-[10px] font-bold text-amber-400 underline cursor-pointer"
                    >
                      Volver a Color de Escena
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        sendCommand({
                          type: 'color',
                          value: activeColorId === c.id ? null : c.id,
                        })
                      }
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer ${
                        activeColorId === c.id
                          ? 'bg-slate-800 border-white ring-2 ring-amber-400'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/40"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] font-bold text-slate-200">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <span className="text-xs font-black uppercase text-slate-400 block">
                  🎯 Posición Escenario (MA2)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => sendCommand({ type: 'position', value: p.id })}
                      className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        activePosId === p.id
                          ? 'bg-sky-500 text-slate-950 border-white font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 6 UNIVERSAL GROUP SUBMASTERS */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).map((gId) => {
              const cal = groupCalibrations[gId];
              if (!cal) return null;
              return (
                <div
                  key={gId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{ borderTopWidth: '4px', borderTopColor: cal.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase" style={{ color: cal.color }}>
                      {cal.name}
                    </span>
                    <span className="text-sm font-mono font-black text-white">
                      {Math.round(cal.masterDimmer * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(cal.masterDimmer * 100)}
                    onChange={(e) =>
                      sendCommand({
                        type: 'group_dimmer',
                        groupId: gId,
                        value: parseInt(e.target.value, 10) / 100,
                      })
                    }
                    className="w-full h-3 accent-amber-400 cursor-pointer"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onMouseDown={() =>
                        sendCommand({ type: 'group_flash', groupId: gId, value: true })
                      }
                      onMouseUp={() =>
                        sendCommand({ type: 'group_flash', groupId: gId, value: false })
                      }
                      onTouchStart={() =>
                        sendCommand({ type: 'group_flash', groupId: gId, value: true })
                      }
                      onTouchEnd={() =>
                        sendCommand({ type: 'group_flash', groupId: gId, value: false })
                      }
                      className={`py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer ${
                        cal.flashActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-amber-300'
                      }`}
                    >
                      FLASH
                    </button>
                    <button
                      onClick={() =>
                        sendCommand({
                          type: 'group_solo',
                          groupId: gId,
                          value: !cal.soloActive,
                        })
                      }
                      className={`py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer ${
                        cal.soloActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-950 border border-slate-800 text-cyan-300'
                      }`}
                    >
                      SOLO
                    </button>
                    <button
                      onClick={() =>
                        sendCommand({
                          type: 'group_mute',
                          groupId: gId,
                          value: !cal.blackout,
                        })
                      }
                      className={`py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer ${
                        cal.blackout
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {cal.blackout ? 'MUTED' : 'MUTE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: CALIBRATE 4 STAGE LIMITS FROM THE DANCEFLOOR */}
        {activeTab === 'calibrate' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black uppercase text-sky-400">
                🎯 Selecciona qué grupo de Cabezas Móviles estás calibrando desde la pista:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['beams', 'washes', 'spots'] as const).map((gId) => {
                  const cal = groupCalibrations[gId];
                  return (
                    <button
                      key={gId}
                      onClick={() => setCalGroup(gId)}
                      className={`py-3 px-3 rounded-xl border text-xs font-black uppercase cursor-pointer ${
                        calGroup === gId
                          ? 'bg-sky-500 text-slate-950 border-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {cal?.name.split('·')[1] || gId}
                    </button>
                  );
                })}
              </div>
            </div>

            {groupCalibrations[calGroup] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      field: 'panLeftDmx',
                      title: '⬅️ Límite Izquierdo Escenario (Pan Min)',
                      desc: 'Ajusta hasta que los focos no se salgan por la pared izquierda',
                    },
                    {
                      field: 'panRightDmx',
                      title: '➡️ Límite Derecho Escenario (Pan Max)',
                      desc: 'Ajusta hasta que los focos no se salgan por la pared derecha',
                    },
                    {
                      field: 'tiltFloorDmx',
                      title: '⬇️ Límite Suelo / Público (Tilt Floor)',
                      desc: 'Ajusta el punto más bajo sobre la pista o escenario',
                    },
                    {
                      field: 'tiltSkyDmx',
                      title: '⬆️ Límite Techo / Cielo (Tilt Sky)',
                      desc: 'Ajusta la altura máxima hacia el techo',
                    },
                  ] as const
                ).map((item) => {
                  const curVal = groupCalibrations[calGroup][item.field];
                  return (
                    <div
                      key={item.field}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{item.title}</span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs font-bold">
                          DMX {curVal}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[-10, -2, +2, +10].map((delta) => (
                          <button
                            key={delta}
                            onClick={() =>
                              sendCommand({
                                type: 'calibrate_group',
                                groupId: calGroup,
                                field: item.field,
                                delta,
                              })
                            }
                            className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-black text-sky-300 cursor-pointer"
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FIXTURE-BY-FIXTURE HIGHLIGHT TESTER */}
        {activeTab === 'tester' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase text-emerald-400">
                  🔦 Localizador Foco a Foco (Modo Escalera / Truss)
                </div>
                <p className="text-[11px] text-slate-400">
                  Enciende únicamente el foco seleccionado al 100% en Blanco Abierto para comprobar su dirección DMX y cableado.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleStepFixture(-1)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    sendCommand({
                      type: 'highlight_fixture',
                      fixtureId: highlightedFixtureId ? null : fixtures[0]?.id || null,
                    })
                  }
                  className={`px-4 py-3 rounded-xl text-xs font-black uppercase cursor-pointer ${
                    highlightedFixtureId
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {highlightedFixtureId ? 'Apagar Modo Test' : 'Iniciar Test Foco #1'}
                </button>
                <button
                  onClick={() => handleStepFixture(1)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {fixtures.map((fix, idx) => {
                const isSelected = fix.id === highlightedFixtureId;
                return (
                  <button
                    key={fix.id}
                    onClick={() =>
                      sendCommand({
                        type: 'highlight_fixture',
                        fixtureId: isSelected ? null : fix.id,
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-white shadow-lg shadow-emerald-500/25 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold">
                        #{idx + 1} · {fix.name}
                      </div>
                      <div
                        className={`text-[11px] font-mono ${
                          isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Uni {fix.universe} · Dir.{String(fix.address).padStart(3, '0')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isSelected ? 'bg-slate-950 text-emerald-400' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'ON 100%' : 'Test'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PATCH & DMX ADDRESS EDITOR FOR MOVING HEADS & LED BARS */}
        {activeTab === 'patch' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header & Toast Banner */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  🔧 Editor de Patch y Direcciones DMX512 (Cabezas Móviles, Barras, Strobos)
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cambia universo (Bocas XLR 1..4 del Hahan SL04), dirección DMX (1..512), modelo de perfil o inversión Pan/Tilt desde el móvil. Se guarda automáticamente.
                </p>
              </div>
              {patchToast && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow">
                  {patchToast}
                </span>
              )}
            </div>

            {/* 1-CLICK SERIAL AUTO-PATCH FOR AN ENTIRE GROUP + ADD NEW FIXTURE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Auto-Patch Group in Series */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-black uppercase text-sky-300">
                  ⚡ Auto-Direccionar Grupo en Serie (1 Clic)
                </div>
                <p className="text-[11px] text-slate-400">
                  Asigna direcciones DMX correlativas sin pisarse a todas las cabezas o barras de un grupo.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Grupo
                    </label>
                    <select
                      value={autoPatchGroup}
                      onChange={(e) => setAutoPatchGroup(e.target.value as GroupId)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                    >
                      {(Object.keys(GROUP_LABELS) as GroupId[]).map((g) => (
                        <option key={g} value={g}>
                          {GROUP_LABELS[g]} ({fixtures.filter((f) => f.groupId === g).length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Boca XLR / Universo
                    </label>
                    <select
                      value={autoPatchUni}
                      onChange={(e) => setAutoPatchUni(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300"
                    >
                      {[1, 2, 3, 4].map((u) => (
                        <option key={u} value={u}>
                          Universo {u} (XLR {u})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      1ª Dirección DMX
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={512}
                      value={autoPatchStartAddr}
                      onChange={(e) =>
                        setAutoPatchStartAddr(
                          Math.max(1, Math.min(512, parseInt(e.target.value || '1', 10)))
                        )
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-black text-emerald-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Cambiar Modelo / Perfil de todo el grupo (Opcional)
                  </label>
                  <select
                    value={autoPatchProfileId}
                    onChange={(e) => setAutoPatchProfileId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="">-- Mantener modelo actual de cada foco --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.channelCount} canales DMX)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    sendCommand({
                      type: 'batch_patch_group',
                      groupId: autoPatchGroup,
                      universe: autoPatchUni,
                      startAddress: autoPatchStartAddr,
                      profileId: autoPatchProfileId || undefined,
                    });
                    showPatchToast(
                      `✅ ${GROUP_LABELS[autoPatchGroup]} re-direccionado desde U${autoPatchUni}.${String(autoPatchStartAddr).padStart(3, '0')}`
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase cursor-pointer shadow"
                >
                  ⚡ Auto-Direccionar {GROUP_LABELS[autoPatchGroup]} en Serie
                </button>
              </div>

              {/* Add New Fixture / Moving Head / LED Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  ➕ Añadir Cabeza Móvil / Barra LED / Foco al Patch
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Grupo
                    </label>
                    <select
                      value={newFixGroup}
                      onChange={(e) => {
                        const g = e.target.value as GroupId;
                        setNewFixGroup(g);
                        const matchProf = profiles.find((p) => p.category === g);
                        if (matchProf) setNewFixProfileId(matchProf.id);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                    >
                      {(Object.keys(GROUP_LABELS) as GroupId[]).map((g) => (
                        <option key={g} value={g}>
                          {GROUP_LABELS[g]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Modelo / Perfil DMX
                    </label>
                    <select
                      value={newFixProfileId}
                      onChange={(e) => setNewFixProfileId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.channelCount}ch)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Universo (1..4)
                    </label>
                    <select
                      value={newFixUni}
                      onChange={(e) => setNewFixUni(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-sky-300"
                    >
                      {[1, 2, 3, 4].map((u) => (
                        <option key={u} value={u}>
                          U{u} (Boca XLR {u})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Dirección DMX (1..512)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={512}
                      value={newFixAddr}
                      onChange={(e) =>
                        setNewFixAddr(
                          Math.max(1, Math.min(512, parseInt(e.target.value || '1', 10)))
                        )
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-black text-emerald-300"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={newFixName}
                  onChange={(e) => setNewFixName(e.target.value)}
                  placeholder="Nombre opcional (ej: Barra LED #9 o Beam #9)"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <button
                  onClick={() => {
                    const prof = profiles.find((p) => p.id === newFixProfileId) || profiles[0];
                    const inGroupCount = fixtures.filter((f) => f.groupId === newFixGroup).length;
                    const created: PatchedFixture = {
                      id: `fix_${newFixGroup}_${Date.now().toString(36)}`,
                      name:
                        newFixName.trim() ||
                        `${GROUP_LABELS[newFixGroup]} #${inGroupCount + 1}`,
                      profileId: prof.id,
                      groupId: newFixGroup,
                      universe: newFixUni,
                      address: newFixAddr,
                      orderInGroup: inGroupCount,
                      stageX: 0,
                      stageY: 0.3,
                    };
                    sendCommand({ type: 'add_fixture', fixture: created });
                    setNewFixName('');
                    setNewFixAddr(Math.min(512, newFixAddr + (prof.channelCount || 16)));
                    showPatchToast(`✅ Añadido: ${created.name} en U${created.universe}.${String(created.address).padStart(3, '0')}`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase cursor-pointer shadow"
                >
                  ➕ Añadir al Patch Ahora
                </button>
              </div>
            </div>

            {/* Filter Pills by Group */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setPatchFilterGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase shrink-0 cursor-pointer ${
                  patchFilterGroup === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                Todos ({fixtures.length})
              </button>
              {(Object.keys(GROUP_LABELS) as GroupId[]).map((g) => {
                const count = fixtures.filter((f) => f.groupId === g).length;
                return (
                  <button
                    key={g}
                    onClick={() => setPatchFilterGroup(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase shrink-0 cursor-pointer ${
                      patchFilterGroup === g
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {GROUP_LABELS[g]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Individual Fixture Patch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fixtures
                .filter((f) => patchFilterGroup === 'all' || f.groupId === patchFilterGroup)
                .map((fix) => {
                  const prof = profiles.find((p) => p.id === fix.profileId) || profiles[0];
                  const chCount = prof?.channelCount || 16;
                  const endAddr = fix.address + chCount - 1;
                  const isHighlighted = fix.id === highlightedFixtureId;

                  // Check if this fixture overlaps DMX channels with another fixture in the same universe
                  const collisionFix = fixtures.find((other) => {
                    if (other.id === fix.id || other.universe !== fix.universe) return false;
                    const otherProf =
                      profiles.find((p) => p.id === other.profileId) || profiles[0];
                    const otherEnd = other.address + (otherProf?.channelCount || 16) - 1;
                    return fix.address <= otherEnd && endAddr >= other.address;
                  });

                  return (
                    <div
                      key={fix.id}
                      className={`bg-slate-900 border rounded-2xl p-3.5 space-y-2.5 transition ${
                        isHighlighted
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                          : collisionFix
                            ? 'border-rose-500/70'
                            : 'border-slate-800'
                      }`}
                    >
                      {/* Top Row: Name Input + Test 100% Button + Delete Button */}
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={fix.name}
                          onChange={(e) =>
                            sendCommand({
                              type: 'update_fixture_patch',
                              fixtureId: fix.id,
                              patch: { name: e.target.value },
                            })
                          }
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-white"
                        />
                        <button
                          onClick={() =>
                            sendCommand({
                              type: 'highlight_fixture',
                              fixtureId: isHighlighted ? null : fix.id,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase cursor-pointer shrink-0 ${
                            isHighlighted
                              ? 'bg-emerald-400 text-slate-950 shadow'
                              : 'bg-slate-950 border border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {isHighlighted ? '🔦 ON 100%' : '🔦 Test'}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar «${fix.name}» del patch?`)) {
                              sendCommand({ type: 'delete_fixture', fixtureId: fix.id });
                              showPatchToast(`🗑️ Eliminado: ${fix.name}`);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950 border border-slate-800 text-rose-400 cursor-pointer shrink-0"
                          title="Eliminar foco del patch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row 2: Universe Selector (U1..U4) + DMX Address Input & Quick Stepper */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center bg-slate-950 border border-slate-800/90 rounded-xl p-2.5">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Boca XLR / Universo
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[1, 2, 3, 4].map((u) => (
                              <button
                                key={u}
                                onClick={() =>
                                  sendCommand({
                                    type: 'update_fixture_patch',
                                    fixtureId: fix.id,
                                    patch: { universe: u },
                                  })
                                }
                                className={`py-1.5 rounded-lg text-xs font-mono font-black cursor-pointer ${
                                  fix.universe === u
                                    ? 'bg-amber-400 text-slate-950 shadow'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}
                              >
                                U{u}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                            <span>Dirección DMX</span>
                            <span className="font-mono text-emerald-300">
                              CH {String(fix.address).padStart(3, '0')}–
                              {String(Math.min(512, endAddr)).padStart(3, '0')} ({chCount}ch)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[-chCount, -1].map((step) => (
                              <button
                                key={step}
                                onClick={() =>
                                  sendCommand({
                                    type: 'update_fixture_patch',
                                    fixtureId: fix.id,
                                    patch: {
                                      address: Math.max(1, Math.min(512, fix.address + step)),
                                    },
                                  })
                                }
                                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-black text-sky-300 cursor-pointer"
                              >
                                {step}
                              </button>
                            ))}
                            <input
                              type="number"
                              min={1}
                              max={512}
                              value={fix.address}
                              onChange={(e) => {
                                const val = Math.max(
                                  1,
                                  Math.min(512, parseInt(e.target.value || '1', 10))
                                );
                                sendCommand({
                                  type: 'update_fixture_patch',
                                  fixtureId: fix.id,
                                  patch: { address: val },
                                });
                              }}
                              className="w-16 py-1.5 rounded-lg bg-slate-900 border border-amber-500/50 text-center text-xs font-mono font-black text-amber-300"
                            />
                            {[+1, +chCount].map((step) => (
                              <button
                                key={step}
                                onClick={() =>
                                  sendCommand({
                                    type: 'update_fixture_patch',
                                    fixtureId: fix.id,
                                    patch: {
                                      address: Math.max(1, Math.min(512, fix.address + step)),
                                    },
                                  })
                                }
                                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-black text-sky-300 cursor-pointer"
                              >
                                +{step}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {collisionFix && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>
                            Pisa canales con «{collisionFix.name}» (Dir. {collisionFix.address})
                          </span>
                        </div>
                      )}

                      {/* Row 3: Profile / Model Selector + Group Selector + Invert Pan/Tilt */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 items-center">
                        <select
                          value={fix.profileId}
                          onChange={(e) =>
                            sendCommand({
                              type: 'update_fixture_patch',
                              fixtureId: fix.id,
                              patch: { profileId: e.target.value },
                            })
                          }
                          className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 truncate"
                          title="Cambiar modelo o perfil DMX"
                        >
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.channelCount}ch)
                            </option>
                          ))}
                        </select>

                        <select
                          value={fix.groupId}
                          onChange={(e) =>
                            sendCommand({
                              type: 'update_fixture_patch',
                              fixtureId: fix.id,
                              patch: { groupId: e.target.value as GroupId },
                            })
                          }
                          className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-amber-300 truncate"
                          title="Cambiar grupo de este foco"
                        >
                          {(Object.keys(GROUP_LABELS) as GroupId[]).map((g) => (
                            <option key={g} value={g}>
                              {GROUP_LABELS[g]}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() =>
                            sendCommand({
                              type: 'update_fixture_patch',
                              fixtureId: fix.id,
                              patch: { invertPan: !fix.invertPan },
                            })
                          }
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-black uppercase cursor-pointer ${
                            fix.invertPan
                              ? 'bg-sky-500 text-slate-950 border-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          ⇄ Inv. Pan {fix.invertPan ? 'ON' : 'OFF'}
                        </button>

                        <button
                          onClick={() =>
                            sendCommand({
                              type: 'update_fixture_patch',
                              fixtureId: fix.id,
                              patch: { invertTilt: !fix.invertTilt },
                            })
                          }
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-black uppercase cursor-pointer ${
                            fix.invertTilt
                              ? 'bg-sky-500 text-slate-950 border-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          ⇅ Inv. Tilt {fix.invertTilt ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'fullscreen') {
    if (pinRequired) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-4 text-center shadow-2xl">
            <div className="text-4xl">🔒</div>
            <div>
              <h2 className="text-base font-black text-white uppercase">PIN del Mando</h2>
              <p className="text-xs text-slate-400 mt-1">
                Escribe el PIN que aparece en la consola, junto al código QR (menú 📱 Mando).
              </p>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="····"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-center text-2xl font-mono font-black tracking-[0.4em] text-emerald-300"
              autoFocus
            />
            {pinError && <div className="text-xs text-rose-400 font-bold">{pinError}</div>}
            <button
              onClick={async () => {
                saveRemotePin(pinInput);
                try {
                  const res = await remoteFetch('/api/remote/state');
                  if (res.status === 401) {
                    setPinError('PIN incorrecto');
                  } else {
                    setPinRequired(false);
                  }
                } catch {
                  setPinError('No se puede conectar con la consola');
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-sm cursor-pointer"
            >
              Entrar
            </button>
          </div>
        </div>
      );
    }
    return <div className="fixed inset-0 z-50 bg-slate-950">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[86vh] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        {content}
      </div>
    </div>
  );
};
