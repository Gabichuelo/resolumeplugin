import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  Zap,
  Play,
  Square,
  RotateCcw,
  Save,
  PlusCircle,
  Sliders,
  Radio,
} from 'lucide-react';
import type { FixtureProfile, GroupId } from '../types/dmx';

interface ChannelFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualDmxOverrides: Record<string, number>;
  onUpdateManualDmxOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isolateUniverse: number | null;
  onSetIsolateUniverse: (u: number | null) => void;
  onSaveDiscoveredProfile: (
    profile: FixtureProfile,
    patchOptions?: {
      quantity: number;
      universe: number;
      startAddress: number;
    }
  ) => void;
}

type ChannelRoleKey = keyof FixtureProfile['channels'] | 'none';

const ROLE_OPTIONS: { value: ChannelRoleKey; label: string; badgeColor: string }[] = [
  { value: 'none', label: '— Sin asignar —', badgeColor: 'text-slate-400 border-slate-700' },
  { value: 'dimmer', label: '🔆 Dimmer (Intensidad)', badgeColor: 'text-amber-300 border-amber-500/50 bg-amber-500/10' },
  { value: 'shutter', label: '🚪 Shutter (Obturador)', badgeColor: 'text-yellow-300 border-yellow-500/50 bg-yellow-500/10' },
  { value: 'strobe', label: '⚡ Strobe (Estrobo)', badgeColor: 'text-orange-300 border-orange-500/50 bg-orange-500/10' },
  { value: 'pan', label: '↔️ Pan (Giro Horizontal)', badgeColor: 'text-sky-300 border-sky-500/50 bg-sky-500/10' },
  { value: 'panFine', label: '↔️ Pan Fine (16-bit)', badgeColor: 'text-sky-400 border-sky-500/30' },
  { value: 'tilt', label: '↕️ Tilt (Cabeceo Vertical)', badgeColor: 'text-cyan-300 border-cyan-500/50 bg-cyan-500/10' },
  { value: 'tiltFine', label: '↕️ Tilt Fine (16-bit)', badgeColor: 'text-cyan-400 border-cyan-500/30' },
  { value: 'red', label: '🔴 Rojo (Red)', badgeColor: 'text-rose-400 border-rose-500/50 bg-rose-500/10' },
  { value: 'green', label: '🟢 Verde (Green)', badgeColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
  { value: 'blue', label: '🔵 Azul (Blue)', badgeColor: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
  { value: 'white', label: '⚪ Blanco (White)', badgeColor: 'text-slate-100 border-white/40 bg-white/10' },
  { value: 'colorWheel', label: '🎨 Rueda de Color', badgeColor: 'text-pink-300 border-pink-500/50 bg-pink-500/10' },
  { value: 'gobo', label: '🔮 Rueda de Gobos', badgeColor: 'text-purple-300 border-purple-500/50 bg-purple-500/10' },
  { value: 'prism', label: '💎 Prisma ON/OFF', badgeColor: 'text-indigo-300 border-indigo-500/50 bg-indigo-500/10' },
  { value: 'prismRot', label: '🌀 Rotación Prisma', badgeColor: 'text-indigo-400 border-indigo-500/30' },
  { value: 'zoom', label: '🔍 Zoom Motorizado', badgeColor: 'text-teal-300 border-teal-500/50 bg-teal-500/10' },
];

export const ChannelFinderModal: React.FC<ChannelFinderModalProps> = ({
  isOpen,
  onClose,
  manualDmxOverrides,
  onUpdateManualDmxOverrides,
  isolateUniverse,
  onSetIsolateUniverse,
  onSaveDiscoveredProfile,
}) => {
  const [universe, setUniverse] = useState<number>(1);
  const [startAddress, setStartAddress] = useState<number>(1);
  const [channelCount, setChannelCount] = useState<number>(16);
  const [assignedRoles, setAssignedRoles] = useState<Record<number, ChannelRoleKey>>({});
  const [autoSweepChannel, setAutoSweepChannel] = useState<number | null>(null);

  // Save & Patch form
  const [fixtureName, setFixtureName] = useState<string>('Foco Descubierto');
  const [targetGroup, setTargetGroup] = useState<GroupId>('spots');
  const [patchQuantity, setPatchQuantity] = useState<number>(4);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sequential Auto-Sweep timer
  useEffect(() => {
    if (!isOpen || autoSweepChannel === null) return;
    const timer = window.setInterval(() => {
      setAutoSweepChannel((prev) => {
        if (prev === null) return null;
        const next = prev >= channelCount ? 1 : prev + 1;
        return next;
      });
    }, 1400);
    return () => window.clearInterval(timer);
  }, [isOpen, autoSweepChannel, channelCount]);

  // Apply Auto-Sweep DMX value when autoSweepChannel changes
  useEffect(() => {
    if (!isOpen || autoSweepChannel === null) return;
    onUpdateManualDmxOverrides((prev) => {
      const next = { ...prev };
      for (let offset = 1; offset <= channelCount; offset++) {
        const dmxCh = startAddress + offset - 1;
        if (dmxCh > 512) continue;
        const role = assignedRoles[offset];
        // Keep Dimmer/Shutter open so user can see Color/Gobo/Pan/Tilt while sweeping!
        if (role === 'dimmer' || role === 'shutter') {
          next[`${universe}:${dmxCh}`] = 255;
        } else if (offset === autoSweepChannel) {
          next[`${universe}:${dmxCh}`] = 220;
        } else {
          next[`${universe}:${dmxCh}`] = 0;
        }
      }
      return next;
    });
  }, [isOpen, autoSweepChannel, channelCount, startAddress, universe, assignedRoles, onUpdateManualDmxOverrides]);

  if (!isOpen) return null;

  const setSingleChannelDmx = (offset1Based: number, val: number) => {
    const dmxCh = startAddress + offset1Based - 1;
    if (dmxCh < 1 || dmxCh > 512) return;
    onUpdateManualDmxOverrides((prev) => ({
      ...prev,
      [`${universe}:${dmxCh}`]: Math.max(0, Math.min(255, val)),
    }));
  };

  const getChannelDmx = (offset1Based: number): number => {
    const dmxCh = startAddress + offset1Based - 1;
    return manualDmxOverrides[`${universe}:${dmxCh}`] ?? 0;
  };

  const handleClearAllOverrides = () => {
    setAutoSweepChannel(null);
    onUpdateManualDmxOverrides({});
  };

  const handleOpenDimmerAndCenterPT = () => {
    onUpdateManualDmxOverrides((prev) => {
      const next = { ...prev };
      for (let offset = 1; offset <= channelCount; offset++) {
        const dmxCh = startAddress + offset - 1;
        const role = assignedRoles[offset];
        if (
          role === 'dimmer' ||
          role === 'shutter' ||
          role === 'red' ||
          role === 'green' ||
          role === 'blue' ||
          role === 'white'
        ) {
          next[`${universe}:${dmxCh}`] = 255;
        } else if (role === 'pan' || role === 'tilt') {
          next[`${universe}:${dmxCh}`] = 128;
        }
      }
      return next;
    });
  };

  const handleSaveProfile = () => {
    const channels: FixtureProfile['channels'] = {};
    Object.entries(assignedRoles).forEach(([offsetStr, role]) => {
      const offset = Number(offsetStr);
      if (role && role !== 'none' && offset >= 1 && offset <= channelCount) {
        channels[role] = offset;
      }
    });

    const newProfile: FixtureProfile = {
      id: `discovered-${Date.now()}`,
      name: `${fixtureName.trim() || 'Foco Personalizado'} (${channelCount}ch)`,
      manufacturer: 'Custom / Escaneado en Vivo',
      category: targetGroup,
      channelCount,
      sslLibraryKey: 'bsw400',
      description: `Perfil creado en directo con el Buscador de Canales (${channelCount}ch)`,
      channels,
      dmxRules: {
        shutterOpen: 255,
        shutterClosed: 0,
        strobeSlow: 60,
        strobeMed: 140,
        strobeFast: 230,
        prismOff: 0,
        prismOn: 128,
        prismRotCw: 190,
        colorWheelMap: {
          white: 0,
          red: 25,
          amber: 50,
          green: 75,
          cyan: 100,
          blue: 125,
          magenta: 150,
          uv: 175,
          warm_white: 200,
        },
        goboSlots: [0, 30, 60, 90, 120, 150],
      },
    };

    onSaveDiscoveredProfile(
      newProfile,
      patchQuantity > 0
        ? {
            quantity: patchQuantity,
            universe,
            startAddress,
          }
        : undefined
    );

    setSavedNotice(
      patchQuantity > 0
        ? `¡Perfil "${newProfile.name}" guardado y ${patchQuantity} unidad(es) parcheadas desde Dir. ${startAddress}!`
        : `¡Perfil "${newProfile.name}" guardado en tu librería!`
    );
    setTimeout(() => setSavedNotice(null), 4500);
  };

  const assignedCount = Object.values(assignedRoles).filter((v) => v && v !== 'none').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                🔍 Buscador / Escáner Rápido de Focos Reales en Vivo (Channel Finder)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SALIDA DIRECTA HAHAN DMX512
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sube cada canal de 0 a 255, mira qué hace el foco real en el escenario, etiquétalo y guarda su perfil en 1 clic sin buscar manuales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleClearAllOverrides();
                onSetIsolateUniverse(null);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cerrar y Liberar Canales
            </button>
          </div>
        </div>

        {/* Top Control Strip */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Universo:</span>
              {[1, 2, 3, 4].map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    setUniverse(u);
                    if (isolateUniverse !== null) onSetIsolateUniverse(u);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-black cursor-pointer ${
                    universe === u
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  U{u}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Dir. DMX Inicial:</span>
              <input
                type="number"
                min={1}
                max={512}
                value={startAddress}
                onChange={(e) =>
                  setStartAddress(Math.max(1, Math.min(512, parseInt(e.target.value, 10) || 1)))
                }
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-amber-300 text-center"
              />
              <span className="text-[10px] font-mono text-slate-500">
                (Canales {startAddress}..{Math.min(512, startAddress + channelCount - 1)})
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Nº Canales:</span>
              {[8, 12, 16, 20, 24].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setChannelCount(cnt)}
                  className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                    channelCount === cnt
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cnt}ch
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onSetIsolateUniverse(isolateUniverse === universe ? null : universe)
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                isolateUniverse === universe
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-950 border-slate-700 text-cyan-300 hover:border-cyan-500/50'
              }`}
              title="Apaga temporalmente el resto del universo para que solo responda el foco que estás escaneando"
            >
              <Radio className="w-3.5 h-3.5" />
              {isolateUniverse === universe ? '🔊 Universo Aislado (Solo Test)' : '🔇 Aislar Escenario'}
            </button>

            <button
              onClick={() =>
                setAutoSweepChannel((prev) => (prev === null ? 1 : null))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                autoSweepChannel !== null
                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                  : 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              {autoSweepChannel !== null ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  Parar Barrido (CH {autoSweepChannel})
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Auto-Barrido 1..{channelCount}
                </>
              )}
            </button>

            <button
              onClick={handleOpenDimmerAndCenterPT}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer"
              title="Sube automáticamente a 255 los canales que ya hayas marcado como Dimmer/Shutter/RGBW y centra Pan/Tilt a 128"
            >
              💡 Encender Dimmer/Color Asignados
            </button>

            <button
              onClick={handleClearAllOverrides}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Todo a 0
            </button>
          </div>
        </div>

        {/* Channel Faders Matrix */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {Array.from({ length: channelCount }, (_, idx) => {
              const offset = idx + 1;
              const dmxAddress = startAddress + idx;
              const dmxVal = getChannelDmx(offset);
              const role = assignedRoles[offset] || 'none';
              const roleInfo = ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[0];
              const isSweeping = autoSweepChannel === offset;

              return (
                <div
                  key={offset}
                  className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition ${
                    isSweeping
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50'
                      : role !== 'none'
                        ? 'bg-slate-900 border-emerald-500/50'
                        : dmxVal > 0
                          ? 'bg-slate-900/90 border-amber-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Channel Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">CH {offset}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                      Dir.{String(dmxAddress).padStart(3, '0')}
                    </span>
                  </div>

                  {/* DMX Value Display & Slider */}
                  <div className="flex flex-col items-center gap-1.5 my-1">
                    <div
                      className={`text-sm font-mono font-black px-2 py-0.5 rounded-lg border ${
                        dmxVal > 0
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      {dmxVal}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={dmxVal}
                      onChange={(e) => setSingleChannelDmx(offset, parseInt(e.target.value, 10))}
                      className="w-full h-2 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Quick Value Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => setSingleChannelDmx(offset, 0)}
                      className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      onClick={() => setSingleChannelDmx(offset, 128)}
                      className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-sky-300 cursor-pointer"
                    >
                      128
                    </button>
                    <button
                      onClick={() => setSingleChannelDmx(offset, 255)}
                      className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-amber-300 font-bold cursor-pointer"
                    >
                      255
                    </button>
                    <button
                      onMouseDown={() => setSingleChannelDmx(offset, 255)}
                      onMouseUp={() => setSingleChannelDmx(offset, 0)}
                      onMouseLeave={() => dmxVal === 255 && setSingleChannelDmx(offset, 0)}
                      className="py-1 rounded bg-amber-500/25 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-black flex items-center justify-center cursor-pointer"
                      title="Mantén pulsado para enviar 255 y suelta para volver a 0"
                    >
                      <Zap className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Role Assignment Select */}
                  <select
                    value={role}
                    onChange={(e) => {
                      const nextRole = e.target.value as ChannelRoleKey;
                      setAssignedRoles((prev) => ({
                        ...prev,
                        [offset]: nextRole,
                      }));
                    }}
                    className={`w-full mt-1 px-1.5 py-1 rounded-lg border text-[10px] font-bold bg-slate-950 cursor-pointer ${roleInfo.badgeColor}`}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-950 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Generator & Auto-Patch Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">
                Canales identificados:{' '}
                <strong className="text-emerald-400">{assignedCount}</strong> / {channelCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Nombre Foco:</span>
              <input
                type="text"
                value={fixtureName}
                onChange={(e) => setFixtureName(e.target.value)}
                placeholder="Ej: Spot 16ch Escenario"
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white w-44"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Grupo:</span>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as GroupId)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-300 cursor-pointer"
              >
                <option value="beams">1 · Beams</option>
                <option value="washes">2 · Washes</option>
                <option value="spots">3 · Spots / Híbridos</option>
                <option value="blinders">4 · Cegadoras</option>
                <option value="strobes">5 · Strobos</option>
                <option value="bars">6 · Barras LED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Parchear ahora:</span>
              <select
                value={patchQuantity}
                onChange={(e) => setPatchQuantity(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-emerald-300 cursor-pointer"
              >
                <option value={0}>Solo guardar perfil (0 uds)</option>
                <option value={1}>1 foco (desde Dir.{startAddress})</option>
                <option value={2}>2 focos seguidos</option>
                <option value={4}>4 focos seguidos</option>
                <option value={6}>6 focos seguidos</option>
                <option value={8}>8 focos seguidos</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                {savedNotice}
              </span>
            )}
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {patchQuantity > 0 ? <PlusCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {patchQuantity > 0
                ? `Guardar Perfil y Parchear ${patchQuantity}u`
                : 'Guardar Perfil en Librería'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
