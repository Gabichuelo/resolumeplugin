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
} from 'lucide-react';
import { generateQrMatrix } from '../utils/qrCodeGenerator';
import { getRemotePin, remoteFetch, saveRemotePin } from '../utils/remotePin';
import type {
  ColorPaletteId,
  GroupCalibration,
  GroupId,
  PatchedFixture,
  PositionPaletteId,
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
    | 'freeze'
    | 'haze'
    | 'auto_show'
    | 'group_dimmer'
    | 'group_mute'
    | 'group_solo'
    | 'group_flash'
    | 'calibrate_group'
    | 'highlight_fixture';
  value?: any;
  groupId?: GroupId;
  field?: 'panLeftDmx' | 'panRightDmx' | 'tiltFloorDmx' | 'tiltSkyDmx';
  delta?: number;
  fixtureId?: string | null;
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
  freezeOverride: boolean;
  hazeBlastActive: boolean;
  autoShowRunning?: boolean;
  highlightedFixtureId: string | null;
  groupCalibrations: Record<GroupId, GroupCalibration>;
  fixtures: PatchedFixture[];
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
  freezeOverride: propFreeze,
  hazeBlastActive: propHaze,
  autoShowRunning: propAutoShowRunning,
  highlightedFixtureId: propHighlightedId,
  groupCalibrations: propGroupCals,
  fixtures: propFixtures,
  onExecuteCommand,
  onLanIpsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'qr' | 'simple4' | 'live' | 'groups' | 'calibrate' | 'tester'
  >(mode === 'modal' ? 'qr' : 'simple4');
  const [selectedLanIdx, setSelectedLanIdx] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Calibration state for mobile dancefloor calibration
  const [calGroup, setCalGroup] = useState<'beams' | 'washes' | 'spots'>('beams');

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
    // And send over HTTP to main PC console if we are on mobile fullscreen
    if (mode === 'fullscreen') {
      try {
        const res = await remoteFetch('/api/remote/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cmd),
        });
        if (res.status === 401) setPinRequired(true);
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
