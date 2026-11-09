import React from 'react';
import { Crosshair, MoveHorizontal, PowerOff, Sliders, Timer } from 'lucide-react';
import type { GroupCalibration, GroupId, PatchedFixture } from '../types/dmx';

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface BottomFaderDockProps {
  fixtures: PatchedFixture[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  handleUpdateGroupCalibration: (gId: GroupId, patch: Partial<GroupCalibration>) => void;
  setCalibratingGroupId: (gId: GroupId | null) => void;
  showBottomFaderDock: boolean;
  setShowBottomFaderDock: Setter<boolean>;
  globalMaster: number;
  setGlobalMaster: Setter<number>;
  globalBlackout: boolean;
  setGlobalBlackout: Setter<boolean>;
  globalFanSpread: number;
  setGlobalFanSpread: Setter<number>;
  crossfadeSec: number;
  setCrossfadeSec: Setter<number>;
  moveFxSpeed: number;
  setMoveFxSpeed: Setter<number>;
  chaseFxSpeed: number;
  setChaseFxSpeed: Setter<number>;
  globalFxSize: number;
  setGlobalFxSize: Setter<number>;
}

/**
 * Bottom console fader wing: 6 group masters (Flash / Solo / Mute / 4P calibration),
 * live fanning, fade/inertia, P/T + chase speed masters, FX size and Grand Master + Blackout.
 * Extracted from App.tsx to keep the main console file manageable.
 */
export const BottomFaderDock: React.FC<BottomFaderDockProps> = ({
  fixtures,
  groupCalibrations,
  handleUpdateGroupCalibration,
  setCalibratingGroupId,
  showBottomFaderDock,
  setShowBottomFaderDock,
  globalMaster,
  setGlobalMaster,
  globalBlackout,
  setGlobalBlackout,
  globalFanSpread,
  setGlobalFanSpread,
  crossfadeSec,
  setCrossfadeSec,
  moveFxSpeed,
  setMoveFxSpeed,
  chaseFxSpeed,
  setChaseFxSpeed,
  globalFxSize,
  setGlobalFxSize,
}) => {
  return (
    <div className="px-3 pb-2 shrink-0">
      {!showBottomFaderDock ? (
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">Consola Master de Grupos (Plegada)</span>
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              {(['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).map((gId) => {
                const cal = groupCalibrations[gId];
                const shortLabel = cal.name.split('·')[1]?.trim() || cal.name;
                return (
                  <span
                    key={gId}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      cal.blackout
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : cal.soloActive
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    {shortLabel}: {cal.blackout ? 'MUTE' : `${Math.round(cal.masterDimmer * 100)}%`}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-amber-300 font-bold">
              GM: {Math.round(globalMaster * 100)}%
            </span>
            <button
              onClick={() => setGlobalBlackout((b) => !b)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                globalBlackout
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
              }`}
            >
              {globalBlackout ? 'BLACKOUT [B]' : 'Blackout [B]'}
            </button>
            <button
              onClick={() => setShowBottomFaderDock(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[10px] font-black uppercase cursor-pointer"
            >
              ▲ Mostrar Faders
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                🎚️ Submasters de los 6 Grupos & Controles Maestros en Vivo
              </span>
            </div>
            <button
              onClick={() => setShowBottomFaderDock(false)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
              title="Plegar barra inferior de faders para ganar aún más espacio vertical"
            >
              ▼ Plegar Barra Inferior
            </button>
          </div>

          <div className="flex flex-wrap xl:flex-nowrap items-stretch justify-between gap-2">
            {/* 6 Universal Group Masters (Beams, Washes, Spots, Blinders, Strobes, Bars) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 flex-1">
              {(['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).map((gId) => {
                const cal = groupCalibrations[gId];
                const count = fixtures.filter((f) => f.groupId === gId).length;
                const shortLabel = cal.name.split('·')[1]?.trim() || cal.name;

                return (
                  <div
                    key={gId}
                    className="bg-slate-950 border border-slate-800/90 rounded-xl px-2.5 py-1.5 flex flex-col justify-between gap-1"
                    style={{ borderTopWidth: '3px', borderTopColor: cal.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-black uppercase truncate"
                        style={{ color: cal.color }}
                      >
                        {shortLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {count}u ·{' '}
                        <strong className="text-white">{Math.round(cal.masterDimmer * 100)}%</strong>
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(cal.masterDimmer * 100)}
                      onChange={(e) =>
                        handleUpdateGroupCalibration(gId, {
                          masterDimmer: parseInt(e.target.value, 10) / 100,
                        })
                      }
                      className="w-full h-1.5 accent-amber-500 cursor-pointer"
                    />

                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        onMouseDown={() => handleUpdateGroupCalibration(gId, { flashActive: true })}
                        onMouseUp={() => handleUpdateGroupCalibration(gId, { flashActive: false })}
                        onMouseLeave={() =>
                          cal.flashActive && handleUpdateGroupCalibration(gId, { flashActive: false })
                        }
                        className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                          cal.flashActive
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                      >
                        FLASH
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateGroupCalibration(gId, { soloActive: !cal.soloActive })
                        }
                        className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                          cal.soloActive
                            ? 'bg-cyan-400 text-slate-950 shadow shadow-cyan-400/30'
                            : 'bg-slate-900 border border-slate-800 text-cyan-300 hover:bg-slate-800'
                        }`}
                        title="SOLO: aísla este grupo y silencia el resto de grupos"
                      >
                        SOLO
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateGroupCalibration(gId, { blackout: !cal.blackout })
                        }
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer ${
                          cal.blackout
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cal.blackout ? 'MUTED' : 'MUTE'}
                      </button>
                      {(gId === 'beams' || gId === 'washes' || gId === 'spots') && (
                        <button
                          onClick={() => setCalibratingGroupId(gId)}
                          className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] text-sky-400 flex items-center gap-0.5 cursor-pointer"
                          title="Calibrar los 4 límites de escenario (Pan/Tilt)"
                        >
                          <Crosshair className="w-2.5 h-2.5" />
                          4P
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Master Section: Fanning (<>) + Fade/Inertia + Dual Speed Masters + Grand Master */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full xl:w-auto">
              {/* 1. Live Symmetrical Fanning (MA2 Align <>) */}
              <div className="bg-slate-950 border border-sky-500/30 rounded-xl px-2.5 py-1.5 flex flex-col justify-between min-w-[146px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-sky-400 flex items-center gap-1">
                    <MoveHorizontal className="w-3 h-3" />
                    Abanico &lt;&gt;
                  </span>
                  <span className="text-[11px] font-mono font-bold text-sky-300">
                    {globalFanSpread > 0 ? `+${Math.round(globalFanSpread * 100)}%` : `${Math.round(globalFanSpread * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={Math.round(globalFanSpread * 100)}
                  onChange={(e) => setGlobalFanSpread(parseInt(e.target.value, 10) / 100)}
                  className="w-full h-1.5 accent-sky-400 cursor-pointer my-1"
                  title="Abanico Simétrico en vivo (Align <>): -100% Cruce X · 0% Paralelo · +100% Abanico Abierto"
                />
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Cross X', val: -0.6 },
                    { label: '0% Recto', val: 0 },
                    { label: 'Fan +', val: 0.6 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setGlobalFanSpread(p.val)}
                      className={`flex-1 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                        Math.abs(globalFanSpread - p.val) < 0.05
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Smooth Crossfade & Motor Inertia Fader */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex flex-col justify-between min-w-[146px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    Fade / Inercia
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-300">
                    {crossfadeSec.toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={crossfadeSec}
                  onChange={(e) => setCrossfadeSec(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-emerald-400 cursor-pointer my-1"
                />
                <div className="flex items-center gap-1">
                  {[0, 0.8, 2.0, 4.0].map((presetSec) => (
                    <button
                      key={presetSec}
                      onClick={() => setCrossfadeSec(presetSec)}
                      className={`flex-1 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                        Math.abs(crossfadeSec - presetSec) < 0.05
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {presetSec === 0 ? 'Snap' : `${presetSec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Independent Speed Masters (P/T Move Speed Centered at 0 = Normal 1/4x vs. Chaser Speed) */}
              <div className="bg-slate-950 border border-purple-500/30 rounded-xl px-2.5 py-1.5 flex flex-col justify-between min-w-[186px]">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black uppercase text-purple-400">Vel. Mov P/T:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setMoveFxSpeed((s) => Number(Math.max(0.06, s / 2).toFixed(2)))
                      }
                      className="px-1.5 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono cursor-pointer"
                      title="Dividir velocidad de movimiento a la mitad"
                    >
                      ÷2
                    </button>
                    <button
                      onClick={() => setMoveFxSpeed(1)}
                      className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold cursor-pointer"
                      title="Clic para volver al centro (0 = Velocidad Normal Suave)"
                    >
                      {Math.abs(moveFxSpeed - 1) < 0.05 ? '0 (Norm)' : `${moveFxSpeed}x`}
                    </button>
                    <button
                      onClick={() =>
                        setMoveFxSpeed((s) => Number(Math.min(4, s * 2).toFixed(2)))
                      }
                      className="px-1.5 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono cursor-pointer"
                      title="Duplicar velocidad de movimiento"
                    >
                      ×2
                    </button>
                  </div>
                </div>

                {/* Smooth P/T Speed Slider: Center (0) = 1.0x (1/4 beat rate), Left = down to 0.12x, Right = up to 4.0x */}
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={Math.round(Math.log2(Math.max(0.125, Math.min(4, moveFxSpeed))) * 50)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const nextMult = v === 0 ? 1 : Number(Math.pow(2, v / 50).toFixed(2));
                    setMoveFxSpeed(nextMult);
                  }}
                  className="w-full h-1.5 accent-purple-400 cursor-pointer my-0.5"
                  title="Velocidad Movimiento Pan/Tilt: Centro (0) = Normal suave · Izquierda = Muy Lento · Derecha = Rápido"
                />

                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black uppercase text-pink-400">Speed Chase:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setChaseFxSpeed((s) => Number(Math.max(0.12, s / 2).toFixed(2)))
                      }
                      className="px-1.5 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono cursor-pointer"
                    >
                      ÷2
                    </button>
                    <button
                      onClick={() => setChaseFxSpeed(1)}
                      className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-mono font-bold cursor-pointer"
                      title="Click para volver a 1x"
                    >
                      {chaseFxSpeed}x
                    </button>
                    <button
                      onClick={() =>
                        setChaseFxSpeed((s) => Number(Math.min(4, s * 2).toFixed(2)))
                      }
                      className="px-1.5 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono cursor-pointer"
                    >
                      ×2
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-slate-400">Size:</span>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    value={Math.round(globalFxSize * 100)}
                    onChange={(e) => setGlobalFxSize(parseInt(e.target.value, 10) / 100)}
                    className="flex-1 h-1.5 accent-purple-500 cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      setMoveFxSpeed(1);
                      setChaseFxSpeed(1);
                      setGlobalFxSize(1);
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-purple-500/20 text-[9px] font-mono text-purple-300 cursor-pointer"
                    title="Restaurar velocidades P/T, Chase y Size al 100% (1.0x)"
                  >
                    {Math.round(globalFxSize * 100)}% ↺
                  </button>
                </div>
              </div>

              {/* 4. Grand Master + Blackout */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-2.5 py-1.5 flex flex-col justify-between min-w-[152px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Grand Master
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300">
                    {Math.round(globalMaster * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(globalMaster * 100)}
                  onChange={(e) => setGlobalMaster(parseInt(e.target.value, 10) / 100)}
                  className="w-full h-1.5 accent-amber-400 cursor-pointer my-1"
                />
                <button
                  onClick={() => setGlobalBlackout((b) => !b)}
                  className={`w-full py-1 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition cursor-pointer ${
                    globalBlackout
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                  }`}
                >
                  <PowerOff className="w-3 h-3" />
                  {globalBlackout ? 'BLACKOUT [B]' : 'Blackout [B]'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
