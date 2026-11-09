import React from 'react';
import {
  Flame,
  Wind,
  Sparkles,
  PartyPopper,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Zap,
  OctagonX,
} from 'lucide-react';
import type { SpecialFxDeckState, SpecialFxWavePattern } from '../types/dmx';

interface SpecialFxDeckViewProps {
  sfxState: SpecialFxDeckState;
  onUpdateSfxState: React.Dispatch<React.SetStateAction<SpecialFxDeckState>>;
  liveSfxLevels: {
    sparkular: [number, number, number, number]; // 0..255
    co2: [number, number, number, number]; // 0..255
    flame: [number, number, number, number]; // 0..255
    confetti: [number, number]; // 0..255
  };
  bpm: number;
  hazeBlastActive: boolean;
  onSetHazeBlastActive: (active: boolean) => void;
  autoHazeEnabled: boolean;
  onToggleAutoHaze: () => void;
  onEmergencyStopAllSfx: () => void;
}

const WAVE_PATTERN_LABELS: Array<{
  id: SpecialFxWavePattern;
  label: string;
  badge: string;
}> = [
  { id: 'sine_wave', label: '🌊 Ola Sine Continua (L→R)', badge: 'SINE' },
  { id: 'sine_sym_wings', label: '🦋 Sine Simétrico (Centro↔Fuera)', badge: 'SINE 2W' },
  { id: 'pwm_chase_lr', label: '⚡ PWM Secuencia (Izq → Der)', badge: 'PWM L→R' },
  { id: 'pwm_center_out', label: '💥 PWM Centro → Extremos', badge: 'PWM 2W' },
  { id: 'pwm_odd_even', label: '⚔️ PWM Par / Impar (1-3 ↔ 2-4)', badge: 'PWM 1/2' },
  { id: 'pwm_random', label: '🎲 PWM Metralleta Random', badge: 'PWM RND' },
];

export const SpecialFxDeckView: React.FC<SpecialFxDeckViewProps> = ({
  sfxState,
  onUpdateSfxState,
  liveSfxLevels,
  bpm,
  hazeBlastActive,
  onSetHazeBlastActive,
  autoHazeEnabled,
  onToggleAutoHaze,
  onEmergencyStopAllSfx,
}) => {
  const togglePattern = (
    key: 'sparkularPattern' | 'co2Pattern' | 'flamePattern' | 'confettiPattern',
    pattern: SpecialFxWavePattern
  ) => {
    onUpdateSfxState((prev) => ({
      ...prev,
      armed: true,
      [key]: prev[key] === pattern ? 'off' : pattern,
    }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 px-3 pb-2 overflow-hidden select-none">
      {/* 1. TOP SAFETY & SINE / PWM OSCILLATOR MASTER BAR + LIVE STAGE SFX MONITOR */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 shrink-0">
        {/* Left: Safety Key & Pre-Heat */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              onUpdateSfxState((prev) => ({ ...prev, armed: !prev.armed }))
            }
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase border transition cursor-pointer ${
              sfxState.armed
                ? 'bg-emerald-500 text-slate-950 border-white shadow-lg shadow-emerald-500/30'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50 animate-pulse'
            }`}
          >
            {sfxState.armed ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            {sfxState.armed ? '🔑 FX ARMADOS (LISTO)' : '🔒 BLOQUEO SEGURO (PULSA PARA ARMAR)'}
          </button>

          <button
            onClick={() =>
              onUpdateSfxState((prev) => ({
                ...prev,
                sparkularPreheat: !prev.sparkularPreheat,
              }))
            }
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              sfxState.sparkularPreheat
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Activa el canal de calentamiento DMX de las máquinas Sparkular (800°C Ready)"
          >
            {sfxState.sparkularPreheat
              ? '🌡️ Pre-Heat Sparkular: 800°C READY'
              : '🌡️ Pre-Calentar Sparkular'}
          </button>

          <button
            onClick={onEmergencyStopAllSfx}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs border border-white/40 shadow-lg shadow-rose-600/30 cursor-pointer"
            title="Corta inmediatamente todos los canales DMX de Fuego, CO2, Sparkular y Confeti"
          >
            <OctagonX className="w-4 h-4" />
            STOP EMERGENCIA FX
          </button>
        </div>

        {/* Center: Sine / PWM Oscillator Parameters (Speed, PWM Duty Cycle, Phase Spread) */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-cyan-400 uppercase">
            <Sliders className="w-3.5 h-3.5" />
            Motor Sine / PWM:
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400">Velocidad:</span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={sfxState.sfxSpeedHz}
              onChange={(e) =>
                onUpdateSfxState((p) => ({
                  ...p,
                  sfxSpeedHz: parseFloat(e.target.value),
                }))
              }
              className="w-20 h-1.5 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-300 w-10">
              {sfxState.sfxSpeedHz.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400">Pulso PWM:</span>
            <input
              type="range"
              min={15}
              max={85}
              step={5}
              value={Math.round(sfxState.sfxPwmDuty * 100)}
              onChange={(e) =>
                onUpdateSfxState((p) => ({
                  ...p,
                  sfxPwmDuty: parseInt(e.target.value, 10) / 100,
                }))
              }
              className="w-20 h-1.5 accent-amber-400 cursor-pointer"
              title="Ancho del pulso PWM (Duty Cycle): 15% ráfaga corta · 85% ráfaga larga"
            />
            <span className="font-mono font-bold text-amber-300 w-9">
              {Math.round(sfxState.sfxPwmDuty * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400">Fase:</span>
            {[90, 180, 360].map((deg) => (
              <button
                key={deg}
                onClick={() =>
                  onUpdateSfxState((p) => ({ ...p, sfxPhaseSpread: deg }))
                }
                className={`px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer ${
                  sfxState.sfxPhaseSpread === deg
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Stage SFX Visual Bar Meter (4 Sparkulars, 4 CO2, 4 Flames, 2 Confetti) */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400">
            <div>Uni 1 DMX</div>
            <div className="text-amber-300 font-bold">
              CH {sfxState.startDmxChannel}..{sfxState.startDmxChannel + 15}
            </div>
          </div>

          {/* 4 Sparkular live bars */}
          <div className="flex items-end gap-1 h-8 px-1.5 border-l border-slate-800" title="Nivel en vivo 4 Sparkulars">
            {liveSfxLevels.sparkular.map((val, i) => (
              <div key={i} className="w-2.5 h-full bg-slate-900 rounded overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-yellow-200 transition-all duration-75"
                  style={{ height: `${Math.round((val / 255) * 100)}%` }}
                />
              </div>
            ))}
          </div>

          {/* 4 CO2 live bars */}
          <div className="flex items-end gap-1 h-8 px-1.5 border-l border-slate-800" title="Nivel en vivo 4 CO2 Jets">
            {liveSfxLevels.co2.map((val, i) => (
              <div key={i} className="w-2.5 h-full bg-slate-900 rounded overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-sky-500 to-white transition-all duration-75"
                  style={{ height: `${Math.round((val / 255) * 100)}%` }}
                />
              </div>
            ))}
          </div>

          {/* 4 Flame live bars */}
          <div className="flex items-end gap-1 h-8 px-1.5 border-l border-slate-800" title="Nivel en vivo 4 Lanzallamas">
            {liveSfxLevels.flame.map((val, i) => (
              <div key={i} className="w-2.5 h-full bg-slate-900 rounded overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-red-600 to-amber-400 transition-all duration-75"
                  style={{ height: `${Math.round((val / 255) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN 4-COLUMN SPECIAL FX CONSOLE: SPARKULAR | CO2 JETS | FUEGO / FLAMES | CONFETI & HAZER */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 overflow-hidden">
        {/* COLUMN 1: SPARKULAR (CHISPAS FRÍAS - 4 MÁQUINAS CON ALTURA PROPORCIONAL SINE / PWM) */}
        <div className="bg-slate-900/85 border border-amber-500/40 rounded-2xl p-3 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    1. Sparkular (Chispas)
                  </h3>
                  <p className="text-[10px] text-amber-300 font-mono">
                    4 Máquinas · CH {sfxState.startDmxChannel}..{sfxState.startDmxChannel + 3}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-black">
                {sfxState.sparkularMasterHeight}% Altura
              </span>
            </div>

            {/* Big Momentary & Latch Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onMouseDown={() =>
                  onUpdateSfxState((p) => ({
                    ...p,
                    armed: true,
                    sparkularPattern: 'all_blast',
                  }))
                }
                onMouseUp={() =>
                  onUpdateSfxState((p) => ({ ...p, sparkularPattern: 'off' }))
                }
                onMouseLeave={() =>
                  sfxState.sparkularPattern === 'all_blast' &&
                  onUpdateSfxState((p) => ({ ...p, sparkularPattern: 'off' }))
                }
                className={`py-4 px-3 rounded-2xl font-black text-xs uppercase border-2 transition cursor-pointer ${
                  sfxState.sparkularPattern === 'all_blast'
                    ? 'bg-amber-400 text-slate-950 border-white shadow-xl shadow-amber-400/40 scale-95'
                    : 'bg-gradient-to-br from-amber-500/30 to-yellow-500/10 hover:from-amber-500/40 text-amber-200 border-amber-400/60'
                }`}
              >
                ✨ RÁFAGA 4 CHISPAS (MANTENER)
              </button>

              <button
                onClick={() =>
                  onUpdateSfxState((p) => ({
                    ...p,
                    armed: true,
                    sparkularManualUnits:
                      p.sparkularManualUnits[0] > 0 ? [0, 0, 0, 0] : [100, 100, 100, 100],
                  }))
                }
                className={`py-4 px-3 rounded-2xl font-black text-xs uppercase border-2 transition cursor-pointer ${
                  sfxState.sparkularManualUnits.some((u) => u > 0)
                    ? 'bg-emerald-400 text-slate-950 border-white shadow-xl shadow-emerald-400/30'
                    : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-slate-700'
                }`}
              >
                {sfxState.sparkularManualUnits.some((u) => u > 0)
                  ? '🟢 CORTINA FIJA ACTIVA'
                  : '🔒 CORTINA FIJA (ON/OFF)'}
              </button>
            </div>

            {/* Height Master Slider */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-300">Altura Maestra de Chispas (1.5m ↔ 5m):</span>
                <span className="text-amber-400 font-mono">{sfxState.sparkularMasterHeight}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={sfxState.sparkularMasterHeight}
                onChange={(e) =>
                  onUpdateSfxState((p) => ({
                    ...p,
                    sparkularMasterHeight: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full h-2 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Sine & PWM Effects between the 4 Sparkulars */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                🌊 Efectos Sine & PWM entre las 4 Sparkulars:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {WAVE_PATTERN_LABELS.map((pat) => {
                  const active = sfxState.sparkularPattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => togglePattern('sparkularPattern', pat.id)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        active
                          ? 'bg-amber-400 text-slate-950 border-white shadow-lg'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                    >
                      <span>{pat.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black ${
                          active ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
                        }`}
                      >
                        {pat.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4 Individual Sparkular Unit Triggers + Live Bars */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 mb-1.5">
              Disparo Individual por Máquina (1..4):
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((idx) => {
                const liveDmx = liveSfxLevels.sparkular[idx];
                const pct = Math.round((liveDmx / 255) * 100);
                return (
                  <button
                    key={idx}
                    onMouseDown={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.sparkularManualUnits] as [
                          number,
                          number,
                          number,
                          number,
                        ];
                        next[idx] = 100;
                        return { ...p, armed: true, sparkularManualUnits: next };
                      })
                    }
                    onMouseUp={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.sparkularManualUnits] as [
                          number,
                          number,
                          number,
                          number,
                        ];
                        next[idx] = 0;
                        return { ...p, sparkularManualUnits: next };
                      })
                    }
                    className={`py-2.5 rounded-xl border text-center transition cursor-pointer ${
                      pct > 5
                        ? 'bg-amber-400 text-slate-950 border-white font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-[10px] font-black">SPK #{idx + 1}</div>
                    <div className="text-[9px] font-mono">{pct}%</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CO2 JETS / CRYO (4 TOBERAS CON PWM & SINE) */}
        <div className="bg-slate-900/85 border border-sky-500/40 rounded-2xl p-3 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    2. CO2 Cryo Jets
                  </h3>
                  <p className="text-[10px] text-sky-300 font-mono">
                    4 Toberas · CH {sfxState.startDmxChannel + 4}..{sfxState.startDmxChannel + 7}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono text-xs font-black">
                CRYO JET
              </span>
            </div>

            {/* Big CO2 Megablast Button */}
            <button
              onMouseDown={() =>
                onUpdateSfxState((p) => ({
                  ...p,
                  armed: true,
                  co2Pattern: 'all_blast',
                }))
              }
              onMouseUp={() =>
                onUpdateSfxState((p) => ({ ...p, co2Pattern: 'off' }))
              }
              onMouseLeave={() =>
                sfxState.co2Pattern === 'all_blast' &&
                onUpdateSfxState((p) => ({ ...p, co2Pattern: 'off' }))
              }
              className={`w-full py-5 px-4 rounded-2xl font-black text-sm uppercase border-2 transition cursor-pointer ${
                sfxState.co2Pattern === 'all_blast'
                  ? 'bg-sky-300 text-slate-950 border-white shadow-2xl shadow-sky-300/50 scale-95'
                  : 'bg-gradient-to-r from-sky-500/35 to-cyan-500/15 hover:from-sky-500/50 text-sky-100 border-sky-400/60'
              }`}
            >
              ❄️ MEGABLAST 4 CO2 JETS (MANTENER PULSADO)
            </button>

            {/* Sine & PWM Effects between the 4 CO2 Jets */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                ⚡ Efectos PWM & Sine entre las 4 Toberas CO2:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {WAVE_PATTERN_LABELS.map((pat) => {
                  const active = sfxState.co2Pattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => togglePattern('co2Pattern', pat.id)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        active
                          ? 'bg-sky-400 text-slate-950 border-white shadow-lg'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                    >
                      <span>{pat.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black ${
                          active ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-sky-400'
                        }`}
                      >
                        {pat.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4 Individual CO2 Jet Triggers */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 mb-1.5">
              Disparo Manual por Tobera (1..4):
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((idx) => {
                const liveDmx = liveSfxLevels.co2[idx];
                const isOn = liveDmx > 10;
                return (
                  <button
                    key={idx}
                    onMouseDown={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.co2ManualUnits] as [
                          boolean,
                          boolean,
                          boolean,
                          boolean,
                        ];
                        next[idx] = true;
                        return { ...p, armed: true, co2ManualUnits: next };
                      })
                    }
                    onMouseUp={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.co2ManualUnits] as [
                          boolean,
                          boolean,
                          boolean,
                          boolean,
                        ];
                        next[idx] = false;
                        return { ...p, co2ManualUnits: next };
                      })
                    }
                    className={`py-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isOn
                        ? 'bg-sky-400 text-slate-950 border-white font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-sky-400'
                    }`}
                  >
                    <div className="text-[10px] font-black">CO2 #{idx + 1}</div>
                    <div className="text-[9px] font-mono">{isOn ? 'BLAST!' : 'LISTO'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: FUEGO / LANZALLAMAS DMX (4 ANTORCHAS CON SINE & PWM) */}
        <div className="bg-slate-900/85 border border-rose-500/40 rounded-2xl p-3 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    3. Fuego / Lanzallamas
                  </h3>
                  <p className="text-[10px] text-rose-300 font-mono">
                    4 Antorchas · CH {sfxState.startDmxChannel + 8}..{sfxState.startDmxChannel + 11}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-black">
                FLAME DMX
              </span>
            </div>

            {/* Big Flame Blast Button */}
            <button
              onMouseDown={() =>
                onUpdateSfxState((p) => ({
                  ...p,
                  armed: true,
                  flamePattern: 'all_blast',
                }))
              }
              onMouseUp={() =>
                onUpdateSfxState((p) => ({ ...p, flamePattern: 'off' }))
              }
              onMouseLeave={() =>
                sfxState.flamePattern === 'all_blast' &&
                onUpdateSfxState((p) => ({ ...p, flamePattern: 'off' }))
              }
              className={`w-full py-5 px-4 rounded-2xl font-black text-sm uppercase border-2 transition cursor-pointer ${
                sfxState.flamePattern === 'all_blast'
                  ? 'bg-rose-500 text-white border-white shadow-2xl shadow-rose-500/60 scale-95'
                  : 'bg-gradient-to-r from-rose-600/40 to-orange-500/20 hover:from-rose-600/55 text-rose-100 border-rose-500/60'
              }`}
            >
              🔥 FUEGO TOTAL 4 LLAMAS (MANTENER PULSADO)
            </button>

            {/* Sine & PWM Effects between the 4 Flame Units */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                🔥 Secuencias Sine & PWM entre los 4 Lanzallamas:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {WAVE_PATTERN_LABELS.map((pat) => {
                  const active = sfxState.flamePattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => togglePattern('flamePattern', pat.id)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        active
                          ? 'bg-rose-500 text-white border-white shadow-lg'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                    >
                      <span>{pat.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black ${
                          active ? 'bg-slate-950 text-rose-300' : 'bg-slate-800 text-rose-400'
                        }`}
                      >
                        {pat.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4 Individual Flame Jet Triggers */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 mb-1.5">
              Disparo Individual por Antorcha (1..4):
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((idx) => {
                const liveDmx = liveSfxLevels.flame[idx];
                const isOn = liveDmx > 10;
                return (
                  <button
                    key={idx}
                    onMouseDown={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.flameManualUnits] as [
                          boolean,
                          boolean,
                          boolean,
                          boolean,
                        ];
                        next[idx] = true;
                        return { ...p, armed: true, flameManualUnits: next };
                      })
                    }
                    onMouseUp={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.flameManualUnits] as [
                          boolean,
                          boolean,
                          boolean,
                          boolean,
                        ];
                        next[idx] = false;
                        return { ...p, flameManualUnits: next };
                      })
                    }
                    className={`py-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isOn
                        ? 'bg-rose-500 text-white border-white font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-400'
                    }`}
                  >
                    <div className="text-[10px] font-black">FUEGO #{idx + 1}</div>
                    <div className="text-[9px] font-mono">{isOn ? '🔥 ON!' : 'LISTO'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 4: CONFETI, TURBINAS & GÉISER HUMO / HAZER */}
        <div className="bg-slate-900/85 border border-purple-500/40 rounded-2xl p-3 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    4. Confeti & Humo DMX
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono">
                    CH {sfxState.startDmxChannel + 12}..511
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-xs font-black">
                STADIUM
              </span>
            </div>

            {/* Big Confetti Shot Button */}
            <button
              onMouseDown={() =>
                onUpdateSfxState((p) => ({
                  ...p,
                  armed: true,
                  confettiPattern: 'all_blast',
                }))
              }
              onMouseUp={() =>
                onUpdateSfxState((p) => ({ ...p, confettiPattern: 'off' }))
              }
              onMouseLeave={() =>
                sfxState.confettiPattern === 'all_blast' &&
                onUpdateSfxState((p) => ({ ...p, confettiPattern: 'off' }))
              }
              className={`w-full py-5 px-4 rounded-2xl font-black text-sm uppercase border-2 transition cursor-pointer ${
                sfxState.confettiPattern === 'all_blast'
                  ? 'bg-purple-400 text-slate-950 border-white shadow-2xl shadow-purple-400/50 scale-95'
                  : 'bg-gradient-to-r from-purple-500/35 to-pink-500/20 hover:from-purple-500/50 text-purple-100 border-purple-400/60'
              }`}
            >
              🎉 DISPARO CONFETI / STADIUM SHOT (100%)
            </button>

            {/* Confetti Sine / PWM Buttons */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                🌪️ Efectos en Turbinas de Confeti (Izq / Der):
              </div>
              <button
                onClick={() => togglePattern('confettiPattern', 'sine_wave')}
                className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  sfxState.confettiPattern === 'sine_wave'
                    ? 'bg-purple-400 text-slate-950 border-white shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                }`}
              >
                <span>🌊 Ola Sine en Turbinas Confeti</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                  SINE
                </span>
              </button>

              <button
                onClick={() => togglePattern('confettiPattern', 'pwm_odd_even')}
                className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  sfxState.confettiPattern === 'pwm_odd_even'
                    ? 'bg-purple-400 text-slate-950 border-white shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                }`}
              >
                <span>⚡ PWM Alterno Turbinas (Izq ↔ Der)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                  PWM 1/2
                </span>
              </button>
            </div>

            {/* Smoke / Hazer Section */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-teal-400">
                💨 Máquina de Humo / Hazer DMX (CH 510-511):
              </div>
              <button
                onMouseDown={() => onSetHazeBlastActive(true)}
                onMouseUp={() => onSetHazeBlastActive(false)}
                onMouseLeave={() => hazeBlastActive && onSetHazeBlastActive(false)}
                className={`w-full py-3.5 px-3 rounded-xl font-black text-xs uppercase border transition cursor-pointer ${
                  hazeBlastActive
                    ? 'bg-teal-400 text-slate-950 border-white shadow-xl'
                    : 'bg-slate-950 hover:bg-slate-800 text-teal-300 border-teal-500/40'
                }`}
              >
                💨 RÁFAGA HUMO / GÉISER 100% [Tecla H]
              </button>

              <button
                onClick={onToggleAutoHaze}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  autoHazeEnabled
                    ? 'bg-teal-500/25 border-teal-400 text-teal-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {autoHazeEnabled
                  ? '🌫️ Auto-Haze Continuo ACTIVO (35%)'
                  : '🌫️ Activar Auto-Haze Continuo (35%)'}
              </button>
            </div>
          </div>

          {/* Confetti Individual Triggers + Start Address Config */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1].map((idx) => {
                const liveDmx = liveSfxLevels.confetti[idx];
                const isOn = liveDmx > 10;
                return (
                  <button
                    key={idx}
                    onMouseDown={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.confettiManualUnits] as [number, number];
                        next[idx] = 100;
                        return { ...p, armed: true, confettiManualUnits: next };
                      })
                    }
                    onMouseUp={() =>
                      onUpdateSfxState((p) => {
                        const next = [...p.confettiManualUnits] as [number, number];
                        next[idx] = 0;
                        return { ...p, confettiManualUnits: next };
                      })
                    }
                    className={`py-2 rounded-xl border text-center transition cursor-pointer ${
                      isOn
                        ? 'bg-purple-400 text-slate-950 border-white font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-[10px] font-black">
                      CONFETI {idx === 0 ? 'IZQ' : 'DER'}
                    </div>
                    <div className="text-[9px] font-mono">{isOn ? '🎉 100%' : 'LISTO'}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <span className="text-slate-400">Canal Inicio SFX (Uni 1):</span>
              <input
                type="number"
                min={1}
                max={495}
                value={sfxState.startDmxChannel}
                onChange={(e) =>
                  onUpdateSfxState((p) => ({
                    ...p,
                    startDmxChannel: Math.max(
                      1,
                      Math.min(495, parseInt(e.target.value || '490', 10))
                    ),
                  }))
                }
                className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs text-right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
