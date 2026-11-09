import React, { useMemo, useState } from 'react';
import {
  X,
  Sliders,
  Table2,
  RotateCcw,
  Printer,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { FixtureProfile, PatchedFixture } from '../types/dmx';

interface DmxChannelTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  universes: Record<number, number[]>;
  fixtures: PatchedFixture[];
  profiles: FixtureProfile[];
  manualDmxOverrides: Record<string, number>;
  onSetChannelOverride: (universe: number, channel1Based: number, value: number | null) => void;
  onClearAllOverrides: () => void;
  hazePatch: { enabled: boolean; universe: number; fanChannel: number; pumpChannel: number };
}

interface ChannelMetadata {
  fixtureId: string;
  fixtureName: string;
  groupId: string;
  offset1Based: number;
  roleLabel: string;
  roleColor: string;
}

function computeDipSwitches(address: number): boolean[] {
  const addr = Math.max(1, Math.min(511, Math.floor(address)));
  const pins: boolean[] = [];
  for (let bit = 0; bit < 9; bit++) {
    pins.push(((addr >> bit) & 1) === 1);
  }
  pins.push(false); // Pin 10 (DMX mode)
  return pins;
}

export const DmxChannelTesterModal: React.FC<DmxChannelTesterModalProps> = ({
  isOpen,
  onClose,
  universes,
  fixtures,
  profiles,
  manualDmxOverrides,
  onSetChannelOverride,
  onClearAllOverrides,
  hazePatch,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix512' | 'patchSheet'>('matrix512');
  const [selectedUniverse, setSelectedUniverse] = useState<number>(1);
  const [selectedChannel, setSelectedChannel] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'patched' | 'active' | 'overridden'>('all');

  const profileMap = useMemo(() => {
    const map = new Map<string, FixtureProfile>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  // Map each channel 1..512 in selectedUniverse to its fixture & attribute role
  const channelMetaMap = useMemo(() => {
    const map = new Map<number, ChannelMetadata>();
    for (const fix of fixtures) {
      if (fix.universe !== selectedUniverse) continue;
      const prof = profileMap.get(fix.profileId);
      if (!prof) continue;

      const ch = prof.channels;
      for (let offset = 1; offset <= prof.channelCount; offset++) {
        const dmxCh = fix.address + offset - 1;
        if (dmxCh < 1 || dmxCh > 512) continue;

        let roleLabel = `Ch ${offset}`;
        let roleColor = 'text-slate-300 border-slate-700 bg-slate-800/70';

        if (ch.dimmer === offset) {
          roleLabel = 'DIM';
          roleColor = 'text-amber-300 border-amber-500/40 bg-amber-500/15';
        } else if (ch.shutter === offset || ch.strobe === offset) {
          roleLabel = ch.shutter === offset ? 'SHUT' : 'STRB';
          roleColor = 'text-yellow-300 border-yellow-500/40 bg-yellow-500/15';
        } else if (ch.pan === offset || ch.panFine === offset) {
          roleLabel = ch.pan === offset ? 'PAN' : 'PANf';
          roleColor = 'text-cyan-300 border-cyan-500/40 bg-cyan-500/15';
        } else if (ch.tilt === offset || ch.tiltFine === offset) {
          roleLabel = ch.tilt === offset ? 'TILT' : 'TILTf';
          roleColor = 'text-sky-300 border-sky-500/40 bg-sky-500/15';
        } else if (ch.red === offset) {
          roleLabel = 'RED';
          roleColor = 'text-rose-300 border-rose-500/40 bg-rose-500/15';
        } else if (ch.green === offset) {
          roleLabel = 'GRN';
          roleColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15';
        } else if (ch.blue === offset) {
          roleLabel = 'BLU';
          roleColor = 'text-blue-300 border-blue-500/40 bg-blue-500/15';
        } else if (ch.white === offset) {
          roleLabel = 'WHT';
          roleColor = 'text-slate-100 border-slate-400/40 bg-slate-400/15';
        } else if (ch.colorWheel === offset) {
          roleLabel = 'COL';
          roleColor = 'text-pink-300 border-pink-500/40 bg-pink-500/15';
        } else if (ch.gobo === offset) {
          roleLabel = 'GOBO';
          roleColor = 'text-purple-300 border-purple-500/40 bg-purple-500/15';
        } else if (ch.prism === offset || ch.prismRot === offset) {
          roleLabel = ch.prism === offset ? 'PRSM' : 'PROT';
          roleColor = 'text-indigo-300 border-indigo-500/40 bg-indigo-500/15';
        } else if (ch.zoom === offset) {
          roleLabel = 'ZOOM';
          roleColor = 'text-teal-300 border-teal-500/40 bg-teal-500/15';
        }

        map.set(dmxCh, {
          fixtureId: fix.id,
          fixtureName: fix.name,
          groupId: fix.groupId,
          offset1Based: offset,
          roleLabel,
          roleColor,
        });
      }
    }

    if (hazePatch.enabled && hazePatch.universe === selectedUniverse) {
      map.set(hazePatch.fanChannel, {
        fixtureId: 'hazer_dmx',
        fixtureName: 'Máquina Humo / Hazer',
        groupId: 'fx',
        offset1Based: 1,
        roleLabel: 'FAN',
        roleColor: 'text-teal-300 border-teal-500/40 bg-teal-500/20',
      });
      map.set(hazePatch.pumpChannel, {
        fixtureId: 'hazer_dmx',
        fixtureName: 'Máquina Humo / Hazer',
        groupId: 'fx',
        offset1Based: 2,
        roleLabel: 'PUMP',
        roleColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20',
      });
    }

    return map;
  }, [fixtures, profileMap, selectedUniverse, hazePatch]);

  if (!isOpen) return null;

  const uniValues = universes[selectedUniverse] || new Array(512).fill(0);
  const selectedKey = `${selectedUniverse}:${selectedChannel}`;
  const selectedOverride = manualDmxOverrides[selectedKey];
  const selectedLiveVal = uniValues[selectedChannel - 1] || 0;
  const selectedMeta = channelMetaMap.get(selectedChannel);
  const totalOverridesCount = Object.keys(manualDmxOverrides).length;

  const sortedFixtures = [...fixtures].sort((a, b) => {
    if (a.universe !== b.universe) return a.universe - b.universe;
    return a.address - b.address;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white uppercase">
                  Monitor & Tester DMX512 en Vivo + Hoja de Patch
                </h2>
                {totalOverridesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse">
                    {totalOverridesCount} CANAL(ES) FORZADOS EN TESTER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inspecciona los 512 canales enviados a tu nodo Hahan (2.0.0.44), fuerza cualquier canal manualmente o consulta los pines DIP-Switch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('matrix512')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'matrix512'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Matriz 512 Canales + Tester
              </button>
              <button
                onClick={() => setActiveTab('patchSheet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'patchSheet'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Hoja de Patch y Pines DIP ({fixtures.length} Focos)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'matrix512' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Tester Bar & Filters */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              {/* Universe selector + Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  {[1, 2, 3, 4].map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUniverse(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        selectedUniverse === u
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Universo {u}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-[11px]">
                  {[
                    { id: 'all', label: '512 Canales' },
                    { id: 'patched', label: 'Patcheados' },
                    { id: 'active', label: 'Con Señal (>0)' },
                    { id: 'overridden', label: 'Forzados' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterMode(f.id as typeof filterMode)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        filterMode === f.id
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Channel Direct Tester */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tester Canal U{selectedUniverse}.{String(selectedChannel).padStart(3, '0')}
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {selectedMeta ? (
                      <>
                        <span className="text-cyan-300">{selectedMeta.fixtureName}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-amber-300">{selectedMeta.roleLabel}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Canal Libre (Sin Aparato)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={selectedOverride ?? selectedLiveVal}
                    onChange={(e) =>
                      onSetChannelOverride(selectedUniverse, selectedChannel, Number(e.target.value))
                    }
                    className="w-28 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-black text-amber-300 w-9 text-right">
                    {selectedOverride ?? selectedLiveVal}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSetChannelOverride(selectedUniverse, selectedChannel, 0)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200"
                  >
                    0
                  </button>
                  <button
                    onClick={() => onSetChannelOverride(selectedUniverse, selectedChannel, 128)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => onSetChannelOverride(selectedUniverse, selectedChannel, 255)}
                    className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold text-amber-300"
                  >
                    255 FULL
                  </button>
                  {selectedOverride !== undefined && (
                    <button
                      onClick={() => onSetChannelOverride(selectedUniverse, selectedChannel, null)}
                      className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[10px] font-bold text-rose-300"
                    >
                      Soltar
                    </button>
                  )}
                </div>

                {totalOverridesCount > 0 && (
                  <button
                    onClick={onClearAllOverrides}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Liberar Todo ({totalOverridesCount})
                  </button>
                )}
              </div>
            </div>

            {/* 512 Channels Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5">
                {Array.from({ length: 512 }, (_, idx) => {
                  const ch1 = idx + 1;
                  const val = uniValues[idx] || 0;
                  const meta = channelMetaMap.get(ch1);
                  const isOverridden =
                    manualDmxOverrides[`${selectedUniverse}:${ch1}`] !== undefined;
                  const isSelected = selectedChannel === ch1;

                  if (filterMode === 'patched' && !meta) return null;
                  if (filterMode === 'active' && val === 0 && !isOverridden) return null;
                  if (filterMode === 'overridden' && !isOverridden) return null;

                  const pct = Math.round((val / 255) * 100);

                  return (
                    <button
                      key={ch1}
                      onClick={() => setSelectedChannel(ch1)}
                      title={
                        meta
                          ? `Canal ${ch1}: ${meta.fixtureName} (${meta.roleLabel}) = ${val}`
                          : `Canal ${ch1} (Libre) = ${val}`
                      }
                      className={`relative h-14 rounded-lg border p-1 flex flex-col justify-between text-left overflow-hidden transition ${
                        isSelected
                          ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-800'
                          : isOverridden
                            ? 'border-amber-500/80 bg-amber-950/40'
                            : meta
                              ? meta.roleColor
                              : 'border-slate-800/80 bg-slate-950/60 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {/* Fill level bar at bottom */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 transition-all pointer-events-none ${
                          isOverridden
                            ? 'bg-amber-400/35'
                            : val > 0
                              ? 'bg-cyan-400/25'
                              : 'bg-transparent'
                        }`}
                        style={{ height: `${pct}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="font-mono text-[9px] font-bold opacity-75">
                          {String(ch1).padStart(3, '0')}
                        </span>
                        {isOverridden && (
                          <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>

                      <div className="relative z-10 text-[9px] font-black truncate leading-tight">
                        {meta ? meta.roleLabel : '—'}
                      </div>

                      <div className="relative z-10 font-mono text-[10px] font-black text-right w-full leading-none">
                        {val}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: PATCH SHEET & DIP SWITCHES */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase">
                  Hoja Técnica de Patch DMX y Configuración de Pines Binarios (DIP-Switch 1-10)
                </h3>
                <p className="text-xs text-slate-400">
                  Configura cada foco físico en el escenario con la dirección DMX inicial o los interruptores DIP mostrados en verde (ON).
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Guardar PDF Hoja de Patch
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3 px-3">Aparato</th>
                    <th className="py-3 px-3">Modelo / Perfil</th>
                    <th className="py-3 px-3">Grupo</th>
                    <th className="py-3 px-3">Universo</th>
                    <th className="py-3 px-3">Dir. DMX (Inicio - Fin)</th>
                    <th className="py-3 px-3">Pines DIP-Switch (1 al 10)</th>
                    <th className="py-3 px-3 text-right">Acción Tester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {sortedFixtures.map((fix) => {
                    const prof = profileMap.get(fix.profileId);
                    const chCount = prof?.channelCount || 1;
                    const endAddr = fix.address + chCount - 1;
                    const dips = computeDipSwitches(fix.address);
                    const hasOverflow = endAddr > 512;

                    return (
                      <tr key={fix.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{fix.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {prof?.name || fix.profileId}{' '}
                          <span className="text-[10px] text-slate-500">({chCount} ch)</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                            {fix.groupId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          Univ {fix.universe}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-black text-white">
                            {String(fix.address).padStart(3, '0')}
                          </span>
                          <span className="text-slate-500"> – </span>
                          <span className="text-slate-300">
                            {String(endAddr).padStart(3, '0')}
                          </span>
                          {hasOverflow && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-rose-400">
                              <AlertTriangle className="w-3 h-3" /> &gt;512
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            {dips.map((isOn, pinIdx) => (
                              <div
                                key={pinIdx}
                                className={`w-5 h-6 rounded flex flex-col items-center justify-center border text-[9px] font-mono font-black ${
                                  isOn
                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-600'
                                }`}
                                title={`Pin ${pinIdx + 1} (${pinIdx < 9 ? Math.pow(2, pinIdx) : 'DMX'}): ${
                                  isOn ? 'ON (Arriba)' : 'OFF (Abajo)'
                                }`}
                              >
                                <span>{pinIdx + 1}</span>
                                <span className="text-[7px]">{isOn ? 'ON' : '·'}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedUniverse(fix.universe);
                              setSelectedChannel(fix.address);
                              setActiveTab('matrix512');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-bold text-[11px] transition"
                          >
                            Inspeccionar Ch {fix.address}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Todos los canales se transmiten en vivo por Art-Net hacia tu nodo Hahan Light Box y están sincronizados con el Visualizador 3D.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
