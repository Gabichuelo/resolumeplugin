import React, { useState } from 'react';
import { Layers, RotateCcw, PlusCircle, Sparkles } from 'lucide-react';
import { COLOR_PALETTE_RGB } from '../constants/defaultShowData';
import type {
  ColorPaletteId,
  FxWaveformId,
  GroupId,
  GroupProgrammerState,
  PositionPaletteId,
} from '../types/dmx';

interface GroupPresetPoolPanelProps {
  groupProgrammers: Record<GroupId, GroupProgrammerState>;
  onUpdateGroupProgrammer: (
    groupId: GroupId,
    updater: (prev: GroupProgrammerState) => GroupProgrammerState
  ) => void;
  onClearGroupProgrammer: (groupId: GroupId) => void;
  onClearAllProgrammers: () => void;
  onSaveProgrammerAsScene: (groupId: GroupId) => void;
}

const GROUPS: Array<{ id: GroupId; label: string; color: string }> = [
  { id: 'beams', label: 'G1 · BEAMS', color: '#f59e0b' },
  { id: 'washes', label: 'G2 · WASHES', color: '#0ea5e9' },
  { id: 'spots', label: 'G3 · SPOTS', color: '#a855f7' },
  { id: 'blinders', label: 'G4 · CEGAD.', color: '#f97316' },
  { id: 'strobes', label: 'G5 · STROBOS', color: '#eab308' },
  { id: 'bars', label: 'G6 · BARRAS', color: '#ec4899' },
];

const POSITIONS: Array<{ id: PositionPaletteId; label: string }> = [
  { id: 'transparent', label: 'Auto (Escena)' },
  { id: 'sky_fan', label: 'Abanico Cielo' },
  { id: 'downstage', label: 'Público' },
  { id: 'x_cross', label: 'Cruce en X' },
  { id: 'center_focus', label: 'Centro / DJ' },
  { id: 'floor_wash', label: 'Suelo' },
  { id: 'wide_roof', label: 'Techo Ancho' },
];

const FX_LIST: Array<{ id: FxWaveformId | 'transparent'; label: string }> = [
  { id: 'transparent', label: 'Auto (Escena)' },
  { id: 'none', label: 'Fijo (Parar FX)' },
  { id: 'circle_pt', label: 'Círculo P/T' },
  { id: 'tilt_wave', label: 'Ola Tilt' },
  { id: 'pan_sweep', label: 'Barrido Pan' },
  { id: 'ballyhoo', label: 'Ballyhoo 8' },
  { id: 'dimmer_chase', label: 'Chase Dimmer' },
  { id: 'rainbow', label: 'Arcoíris' },
  { id: 'vu_meter', label: '📊 Vúmetro EQ' },
  { id: 'fire_flicker', label: '🔥 Fuego Llamas' },
  { id: 'police_siren', label: '🚨 Sirena R/A' },
  { id: 'champagne_bubbles', label: '🥂 Burbujas' },
  { id: 'ping_pong', label: '🏓 Ping-Pong' },
];

export const GroupPresetPoolPanel: React.FC<GroupPresetPoolPanelProps> = ({
  groupProgrammers,
  onUpdateGroupProgrammer,
  onClearGroupProgrammer,
  onClearAllProgrammers,
  onSaveProgrammerAsScene,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupId>('beams');
  const prog = groupProgrammers[selectedGroup];

  const anyActive = Object.values(groupProgrammers).some((p) => p.active);

  return (
    <div className="h-full bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Preset Pool MA2 (Por Grupo Independiente)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {prog.active && (
            <button
              onClick={() => onSaveProgrammerAsScene(selectedGroup)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
              title="Guarda el ajuste actual de este grupo como un botón en la consola"
            >
              <PlusCircle className="w-3 h-3" />
              Guardar Botón
            </button>
          )}
          {anyActive && (
            <button
              onClick={onClearAllProgrammers}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase animate-pulse cursor-pointer"
              title="Libera el programador en vivo de todos los grupos (Tecla ESC)"
            >
              <RotateCcw className="w-3 h-3" />
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Group Selector Pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-2 bg-slate-900/50 border-b border-slate-800">
        {GROUPS.map((g) => {
          const isSelected = selectedGroup === g.id;
          const isGroupProgActive = groupProgrammers[g.id].active;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`relative py-1.5 px-2 rounded-lg text-[11px] font-black uppercase border transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border-amber-400 shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{g.label}</span>
              {isGroupProgActive && (
                <span className="ml-1 px-1 py-0.2 rounded bg-rose-600 text-white text-[8px] font-black">
                  PROG
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Preset Pools for the Selected Group */}
      <div className="p-3 overflow-y-auto space-y-2.5 text-xs flex-1">
        {/* 1. COLOR PALETTE POOL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              1. Color Primario ({selectedGroup.toUpperCase()})
            </span>
            {prog.active && (
              <button
                onClick={() => onClearGroupProgrammer(selectedGroup)}
                className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
              >
                Liberar {selectedGroup.toUpperCase()}
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() =>
                onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                  ...prev,
                  colorPrimary: 'transparent',
                  colorSecondary: 'transparent',
                }))
              }
              className={`py-1 px-1.5 rounded text-[10px] font-bold border truncate cursor-pointer ${
                prog.colorPrimary === 'transparent'
                  ? 'bg-slate-800 border-white text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Auto
            </button>
            {(Object.keys(COLOR_PALETTE_RGB) as Array<Exclude<ColorPaletteId, 'transparent'>>).map(
              (cId) => {
                const c = COLOR_PALETTE_RGB[cId];
                const active = prog.colorPrimary === cId;
                return (
                  <button
                    key={cId}
                    onClick={() =>
                      onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                        ...prev,
                        active: true,
                        colorPrimary: cId,
                      }))
                    }
                    className={`flex items-center gap-1 py-1 px-1.5 rounded text-[10px] font-bold border truncate cursor-pointer ${
                      active
                        ? 'bg-slate-800 border-white text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate">{c.label.split(' ')[0]}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 2. POSITION PALETTE POOL */}
        {(selectedGroup === 'beams' || selectedGroup === 'washes') && (
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
              2. Posición Calibrada ({selectedGroup.toUpperCase()})
            </span>
            <div className="grid grid-cols-4 gap-1">
              {POSITIONS.map((p) => {
                const active = prog.positionPalette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                        ...prev,
                        active: true,
                        positionPalette: p.id,
                      }))
                    }
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold border truncate cursor-pointer ${
                      active
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. PHASER / FX POOL PER GROUP */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              3. Efecto / Phaser en Vivo ({selectedGroup.toUpperCase()})
            </span>
            <div className="flex items-center gap-1">
              {([1, 2, 4] as const).map((w) => (
                <button
                  key={w}
                  onClick={() =>
                    onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                      ...prev,
                      active: true,
                      wings: w,
                    }))
                  }
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                    prog.wings === w
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {FX_LIST.map((fx) => {
              const active = prog.fxWaveform === fx.id;
              return (
                <button
                  key={fx.id}
                  onClick={() =>
                    onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                      ...prev,
                      active: true,
                      fxWaveform: fx.id,
                    }))
                  }
                  className={`py-1 px-1.5 rounded text-[10px] font-semibold border truncate cursor-pointer ${
                    active
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fx.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. BEAM / PRISM / GOBO / STROBE OVERRIDES */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
          <button
            onClick={() =>
              onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                ...prev,
                active: true,
                prismActive: prev.prismActive === true ? false : true,
              }))
            }
            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer ${
              prog.prismActive === true
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Prisma 8x: {prog.prismActive === true ? 'ON' : 'Auto'}
          </button>

          <select
            value={String(prog.goboSlot)}
            onChange={(e) => {
              const v = e.target.value;
              onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                ...prev,
                active: true,
                goboSlot: v === 'transparent' ? 'transparent' : parseInt(v, 10),
              }));
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200 font-semibold"
          >
            <option value="transparent">Gobo: Auto</option>
            <option value="0">Gobo: Abierto</option>
            <option value="1">Gobo 1 (Punto)</option>
            <option value="2">Gobo 2 (Rayos)</option>
            <option value="3">Gobo 3 (Anillo)</option>
            <option value="4">Gobo 4 (Estrella)</option>
          </select>

          <select
            value={prog.strobeMode}
            onChange={(e) =>
              onUpdateGroupProgrammer(selectedGroup, (prev) => ({
                ...prev,
                active: true,
                strobeMode: e.target.value as GroupProgrammerState['strobeMode'],
              }))
            }
            className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200 font-semibold"
          >
            <option value="transparent">Strobo: Auto</option>
            <option value="off">Shutter Abierto</option>
            <option value="slow">Strobo Lento</option>
            <option value="medium">Strobo Medio</option>
            <option value="fast">Strobo Rápido</option>
          </select>
        </div>
      </div>
    </div>
  );
};
