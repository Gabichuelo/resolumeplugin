import React from 'react';
import { Sliders, Wand2, Plus, Trash2 } from 'lucide-react';
import { COLOR_PALETTE_RGB, LOCATION_ZONE_LABELS } from '../constants/defaultShowData';
import type {
  ColorPaletteId,
  FxWaveformId,
  GroupId,
  LocationZoneId,
  PositionPaletteId,
  RecipeScene,
  WingDirectionMode,
} from '../types/dmx';

interface RecipeInspectorPanelProps {
  scene: RecipeScene | null;
  onUpdateScene: (sceneId: string, updater: (prev: RecipeScene) => RecipeScene) => void;
  onDuplicateScene: (scene: RecipeScene) => void;
  onDeleteScene: (sceneId: string) => void;
}

const GROUP_OPTIONS: Array<{ id: GroupId; label: string }> = [
  { id: 'beams', label: 'G1 · Beams' },
  { id: 'washes', label: 'G2 · Washes' },
  { id: 'spots', label: 'G3 · Spots' },
  { id: 'blinders', label: 'G4 · Cegadoras' },
  { id: 'strobes', label: 'G5 · Strobos' },
  { id: 'bars', label: 'G6 · Barras LED' },
];

export const RecipeInspectorPanel: React.FC<RecipeInspectorPanelProps> = ({
  scene,
  onUpdateScene,
  onDuplicateScene,
  onDeleteScene,
}) => {
  if (!scene) {
    return (
      <div className="h-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
        <Wand2 className="w-6 h-6 mb-2 text-slate-600" />
        Selecciona cualquier botón de escena para editar su <strong>Receta Elástica MA2</strong> (Grupos, Simetría/Wings, Bloques y Paletas).
      </div>
    );
  }

  const toggleGroup = (gId: GroupId) => {
    onUpdateScene(scene.id, (prev) => {
      const exists = prev.targetGroups.includes(gId);
      const nextGroups = exists
        ? prev.targetGroups.filter((g) => g !== gId)
        : [...prev.targetGroups, gId];
      return { ...prev, targetGroups: nextGroups };
    });
  };

  const toggleZone = (zId: LocationZoneId) => {
    onUpdateScene(scene.id, (prev) => {
      const cur = prev.targetZones || [];
      const exists = cur.includes(zId);
      const nextZones = exists ? cur.filter((z) => z !== zId) : [...cur, zId];
      return { ...prev, targetZones: nextZones };
    });
  };

  return (
    <div className="h-full bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
            Editor de Receta MA2 · {scene.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateScene(scene)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
            title="Clonar botón de escena"
          >
            <Plus className="w-3 h-3" />
            Clonar Botón
          </button>
          <button
            onClick={() => onDeleteScene(scene.id)}
            className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-400"
            title="Eliminar escena"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Controls */}
      <div className="p-3.5 overflow-y-auto space-y-3 text-xs flex-1">
        {/* Name & Target Groups */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nombre del Botón & Grupos Destino
          </label>
          <input
            type="text"
            value={scene.name}
            onChange={(e) =>
              onUpdateScene(scene.id, (prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold text-xs"
          />

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {GROUP_OPTIONS.map((g) => {
              const active = scene.targetGroups.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-400">
                Subgrupo por Ubicación (Opcional · vacío = Todos los Trusses):
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(LOCATION_ZONE_LABELS) as LocationZoneId[]).map((zId) => {
                const active = (scene.targetZones || []).includes(zId);
                return (
                  <button
                    key={zId}
                    onClick={() => toggleZone(zId)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold border truncate transition cursor-pointer ${
                      active
                        ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {LOCATION_ZONE_LABELS[zId].short}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Base Attributes: Dimmer, Position, Color 1 & Color 2 */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Dimmer Base
            </label>
            <select
              value={scene.dimmer === 'transparent' ? 'transparent' : String(scene.dimmer)}
              onChange={(e) => {
                const v = e.target.value;
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  dimmer: v === 'transparent' ? 'transparent' : parseFloat(v),
                }));
              }}
              className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="transparent">Transparente (No tocar)</option>
              <option value="1">100% Encendido</option>
              <option value="0.5">50% Medio</option>
              <option value="0">0% Blackout</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Posición Calibrada
            </label>
            <select
              value={scene.positionPalette}
              onChange={(e) =>
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  positionPalette: e.target.value as PositionPaletteId,
                }))
              }
              className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="transparent">Transparente (No tocar)</option>
              <option value="sky_fan">Abanico al Cielo (Auto-Fan)</option>
              <option value="downstage">Frente Público (Downstage)</option>
              <option value="x_cross">Cruce en X Simétrico</option>
              <option value="center_focus">Convergencia Centro / DJ</option>
              <option value="floor_wash">Baño de Suelo (Vertical)</option>
              <option value="wide_roof">Abanico Ancho Techo</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Color 1 (Auto-HAL)
            </label>
            <select
              value={scene.colorPrimary}
              onChange={(e) =>
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  colorPrimary: e.target.value as ColorPaletteId,
                }))
              }
              className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="transparent">Transparente (No tocar)</option>
              {Object.entries(COLOR_PALETTE_RGB).map(([k, val]) => (
                <option key={k} value={k}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Color 2 (Bicolor Par/Impar)
            </label>
            <select
              value={scene.colorSecondary}
              onChange={(e) =>
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  colorSecondary: e.target.value as ColorPaletteId,
                }))
              }
              className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="transparent">Sin 2º Color (Monocolor)</option>
              {Object.entries(COLOR_PALETTE_RGB).map(([k, val]) => (
                <option key={k} value={k}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Elastic Mathematical FX Generator (MA2 Style) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Motor FX Elástico & Simetrías (Auto-Escala a N Focos)
            </span>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              Generador de Onda / Phaser:
            </label>
            <select
              value={scene.fx.waveform}
              onChange={(e) =>
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  fx: { ...prev.fx, waveform: e.target.value as FxWaveformId },
                }))
              }
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-semibold text-xs"
            >
              <option value="none">Estático (Sin Movimiento/Chase)</option>
              <option value="dimmer_chase">Dimmer Chaser (Pasos Rítmicos)</option>
              <option value="sine_pulse">Ola Suave de Dimmer (Sine Wave)</option>
              <option value="circle_pt">Círculo Pan/Tilt Simétrico</option>
              <option value="tilt_wave">Ola Vertical de Tilt (Can-Can)</option>
              <option value="pan_sweep">Barrido Horizontal de Pan</option>
              <option value="ballyhoo">Ballyhoo / Ocho Aéreo Festival</option>
              <option value="rainbow">Arcoíris en Fase (RGB + Rueda)</option>
              <option value="strobe_sparkle">Sparkle / Estrobo Aleatorio</option>
              <option value="matrix_radial">🎯 Matriz 2D · Expansión Radial Concéntrica</option>
              <option value="matrix_sweep_y">🌊 Matriz 2D · Ola Profundidad (Truss Trasero → Suelo)</option>
              <option value="vu_meter">📊 Vúmetro Musical EQ (Suelo → Cielo al Graves)</option>
              <option value="fire_flicker">🔥 Fuego Orgánico / Llamas (Rojo + Ámbar Flicker)</option>
              <option value="police_siren">🚨 Sirena Policía (Giro Rojo / Azul Alterno)</option>
              <option value="champagne_bubbles">🥂 Burbujas Champagne (Destellos Cálidos Ascendentes)</option>
              <option value="ping_pong">🏓 Ping-Pong Rebote (Izquierda ↔ Derecha)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Wings (Simetría)
              </label>
              <select
                value={scene.fx.wings}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: { ...prev.fx, wings: parseInt(e.target.value, 10) as 1 | 2 | 4 },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value={1}>1 (Lineal Izq→Der)</option>
                <option value={2}>2 Wings (Espejo)</option>
                <option value={4}>4 Wings (Cuádruple)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Blocks (Parejas)
              </label>
              <select
                value={scene.fx.blocks}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: { ...prev.fx, blocks: parseInt(e.target.value, 10) as 1 | 2 | 4 },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value={1}>1 (Individual)</option>
                <option value={2}>Blocks de 2</option>
                <option value={4}>Blocks de 4</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Groups (Par/Impar)
              </label>
              <select
                value={scene.fx.interleave}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: { ...prev.fx, interleave: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value={1}>Corrido (Todos)</option>
                <option value={2}>Odd/Even (1-2)</option>
                <option value={3}>Grupos de 3</option>
                <option value={4}>Grupos de 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Dirección / Layout 2D
              </label>
              <select
                value={scene.fx.wingDirection}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: {
                      ...prev.fx,
                      wingDirection: e.target.value as WingDirectionMode,
                    },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value="outside_in">1D: Fuera → Centro</option>
                <option value="center_out">1D: Centro → Fuera</option>
                <option value="linear">1D: Lineal Izq → Der</option>
                <option value="back_to_front">2D: Fondo → Frente (Trusses)</option>
                <option value="front_to_back">2D: Frente → Fondo</option>
                <option value="radial_center">2D: Radial desde Centro</option>
                <option value="diagonal_2d">2D: Barrido Diagonal XY</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Desfase ($360^\circ / N$)
              </label>
              <select
                value={scene.fx.phaseSpread}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: { ...prev.fx, phaseSpread: parseInt(e.target.value, 10) as 0 | 90 | 180 | 360 },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value={0}>0° (En bloque)</option>
                <option value={90}>90° (Cuarto)</option>
                <option value={180}>180° (Media)</option>
                <option value={360}>360° (Onda 100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                División BPM
              </label>
              <select
                value={scene.fx.bpmDivision}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    fx: {
                      ...prev.fx,
                      bpmDivision: parseFloat(e.target.value) as 0.25 | 0.5 | 1 | 2 | 4,
                    },
                  }))
                }
                className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value={0.25}>/4 (Lento 1 Compás)</option>
                <option value={0.5}>/2 (Medio Tiempo)</option>
                <option value={1}>1x (Al Beat)</option>
                <option value={2}>2x (Doble Tiempo)</option>
                <option value={4}>4x (Rápido)</option>
              </select>
            </div>
          </div>

          {/* Beam / Prism / Strobe Toggles */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={scene.prismActive}
                onChange={(e) =>
                  onUpdateScene(scene.id, (prev) => ({
                    ...prev,
                    prismActive: e.target.checked,
                    prismRotate: e.target.checked,
                  }))
                }
                className="accent-amber-500"
              />
              Prisma Rotatorio
            </label>

            <select
              value={scene.strobeMode}
              onChange={(e) =>
                onUpdateScene(scene.id, (prev) => ({
                  ...prev,
                  strobeMode: e.target.value as RecipeScene['strobeMode'],
                }))
              }
              className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200 flex-1"
            >
              <option value="off">Strobo: Apagado (Shutter Abierto)</option>
              <option value="slow">Strobo: Lento</option>
              <option value="medium">Strobo: Medio</option>
              <option value="fast">Strobo: Rápido (Flash)</option>
              <option value="blinder">Modo Blinder (Cegadora)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
