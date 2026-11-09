import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Shuffle,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Camera,
  CheckCircle2,
  Sparkles,
  Timer,
  CalendarClock,
} from 'lucide-react';
import type { AutoShowStep, ClockScheduleEvent, RecipeScene, SceneBank } from '../types/dmx';

interface AutoShowSequencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AutoShowStep[];
  onUpdateSteps: (next: AutoShowStep[]) => void;
  isRunning: boolean;
  onToggleRunning: (next?: boolean) => void;
  currentStepIndex: number;
  elapsedInStepSec: number;
  onJumpToStep: (index: number) => void;
  loopInfinite: boolean;
  onToggleLoopInfinite: () => void;
  shuffleMode: boolean;
  onToggleShuffleMode: () => void;
  banks: SceneBank[];
  scenes: RecipeScene[];
  activeSceneIds: string[];
  clockSchedule: ClockScheduleEvent[];
  onUpdateClockSchedule: (next: ClockScheduleEvent[]) => void;
  onTriggerClockEventNow: (ev: ClockScheduleEvent) => void;
}

export function formatDurationMinSec(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

const QUICK_DURATION_PRESETS: Array<{ label: string; sec: number }> = [
  { label: '15s', sec: 15 },
  { label: '30s', sec: 30 },
  { label: '1 min', sec: 60 },
  { label: '2 min', sec: 120 },
  { label: '3 min', sec: 180 },
  { label: '5 min', sec: 300 },
  { label: '10 min', sec: 600 },
  { label: '15 min', sec: 900 },
];

export const AutoShowSequencerModal: React.FC<AutoShowSequencerModalProps> = ({
  isOpen,
  onClose,
  steps,
  onUpdateSteps,
  isRunning,
  onToggleRunning,
  currentStepIndex,
  elapsedInStepSec,
  onJumpToStep,
  loopInfinite,
  onToggleLoopInfinite,
  shuffleMode,
  onToggleShuffleMode,
  banks,
  scenes,
  activeSceneIds,
  clockSchedule,
  onUpdateClockSchedule,
  onTriggerClockEventNow,
}) => {
  const [modalTab, setModalTab] = useState<'playlist' | 'clock'>('playlist');
  const [selectedStepId, setSelectedStepId] = useState<string>(
    steps[currentStepIndex]?.id || steps[0]?.id || ''
  );
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedStep =
    steps.find((s) => s.id === selectedStepId) || steps[currentStepIndex] || steps[0] || null;

  const totalCycleSec = steps
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + s.durationSec, 0);

  const handleUpdateSingleStep = (
    stepId: string,
    updater: (prev: AutoShowStep) => AutoShowStep
  ) => {
    onUpdateSteps(steps.map((s) => (s.id === stepId ? updater(s) : s)));
  };

  const handleAddStep = () => {
    const num = steps.length + 1;
    const newStep: AutoShowStep = {
      id: `step_auto_${Date.now().toString(36)}`,
      name: `${num}. Nueva Cue Automática #${num}`,
      colorHex: '#f59e0b',
      enabled: true,
      durationSec: 120, // Default 2 minutes
      fadeSec: 2.0,
      sceneIds: [...activeSceneIds],
      moveSpeed: 1,
      chaseSpeed: 1,
      fanSpread: 0,
    };
    const next = [...steps, newStep];
    onUpdateSteps(next);
    setSelectedStepId(newStep.id);
    setNotice('Nueva Cue añadida con los ejecutores que tenías activos en consola.');
  };

  const handleDuplicateStep = (step: AutoShowStep) => {
    const copy: AutoShowStep = {
      ...step,
      id: `step_auto_${Date.now().toString(36)}`,
      name: `${step.name} (Copia)`,
      sceneIds: [...step.sceneIds],
    };
    const next = [...steps, copy];
    onUpdateSteps(next);
    setSelectedStepId(copy.id);
  };

  const handleDeleteStep = (stepId: string) => {
    if (steps.length <= 1) return;
    const next = steps.filter((s) => s.id !== stepId);
    onUpdateSteps(next);
    if (selectedStepId === stepId && next[0]) {
      setSelectedStepId(next[0].id);
    }
  };

  const handleMoveStep = (index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const copy = [...steps];
    const tmp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = tmp;
    onUpdateSteps(copy);
  };

  const handleToggleSceneInStep = (step: AutoShowStep, scene: RecipeScene) => {
    const bank = banks.find((b) => b.id === scene.bankId);
    handleUpdateSingleStep(step.id, (prev) => {
      const hasIt = prev.sceneIds.includes(scene.id);
      if (hasIt) {
        return { ...prev, sceneIds: prev.sceneIds.filter((id) => id !== scene.id) };
      }
      // If bank is exclusive (like Color or Position), replace other scenes from the same bank
      if (bank?.exclusive) {
        const otherIdsInBank = scenes
          .filter((s) => s.bankId === scene.bankId && s.id !== scene.id)
          .map((s) => s.id);
        return {
          ...prev,
          sceneIds: [
            ...prev.sceneIds.filter((id) => !otherIdsInBank.includes(id)),
            scene.id,
          ],
        };
      }
      return { ...prev, sceneIds: [...prev.sceneIds, scene.id] };
    });
  };

  const currentRunningStep = steps[currentStepIndex];
  const currentRemainingSec = currentRunningStep
    ? Math.max(0, currentRunningStep.durationSec - elapsedInStepSec)
    : 0;
  const currentProgressPct = currentRunningStep
    ? Math.min(100, (elapsedInStepSec / Math.max(1, currentRunningStep.durationSec)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Secuenciador Maestro de Show Automático (Playlist de Horas)
                </h2>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                  Duración Vuelta: {formatDurationMinSec(totalCycleSec)} min
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Programa una lista de Cues con sus minutos/segundos, tiempos de Fade y ejecutores activos. Al terminar la última Cue, vuelve a empezar en bucle infinito.
              </p>
            </div>
          </div>

          {/* Master Transport Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mr-1">
              <button
                onClick={() => setModalTab('playlist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  modalTab === 'playlist'
                    ? 'bg-purple-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                Playlist en Bucle ({steps.length})
              </button>
              <button
                onClick={() => setModalTab('clock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  modalTab === 'clock'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Agenda Reloj 24h ({clockSchedule.filter((c) => c.enabled).length} Activas)
              </button>
            </div>

            <button
              onClick={() => onToggleRunning()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  PAUSAR AUTO-SHOW
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  INICIAR AUTO-SHOW
                </>
              )}
            </button>

            <button
              onClick={() =>
                onJumpToStep((currentStepIndex + 1) % Math.max(1, steps.length))
              }
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
              title="Saltar inmediatamente a la siguiente Cue de la lista"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Siguiente Cue
            </button>

            <button
              onClick={onToggleLoopInfinite}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                loopInfinite
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Bucle Infinito: al acabar la última Cue vuelve automáticamente a la primera durante horas"
            >
              <Repeat className="w-3.5 h-3.5" />
              {loopInfinite ? 'Loop ∞ ON' : '1 Vuelta'}
            </button>

            <button
              onClick={onToggleShuffleMode}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                shuffleMode
                  ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Modo Aleatorio (Shuffle): elige la siguiente Cue al azar cuando acaba el tiempo"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Progress Bar */}
        {currentRunningStep && (
          <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isRunning
                      ? 'bg-emerald-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isRunning ? '● EN EJECUCIÓN' : 'PAUSADO'}
                </span>
                <span className="font-bold text-white">
                  Cue Actual ({currentStepIndex + 1}/{steps.length}): {currentRunningStep.name}
                </span>
              </div>
              <div className="font-mono text-xs text-amber-300 font-bold">
                Tiempo en Cue: {formatDurationMinSec(elapsedInStepSec)} /{' '}
                {formatDurationMinSec(currentRunningStep.durationSec)} (Quedan{' '}
                {formatDurationMinSec(currentRemainingSec)})
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${currentProgressPct}%` }}
              />
            </div>
          </div>
        )}

        {notice && (
          <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{notice}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-[11px] underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Main Workspace */}
        {modalTab === 'playlist' ? (
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-5 overflow-hidden">
            {/* LEFT: CUE STACK LIST */}
          <div className="col-span-5 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-3.5 overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-slate-200">
                Lista de Cues Programadas ({steps.length})
              </span>
              <button
                onClick={handleAddStep}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Cue
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {steps.map((step, idx) => {
                const isPlayingNow = idx === currentStepIndex;
                const isSelected = step.id === selectedStep?.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50'
                        : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                    } ${!step.enabled ? 'opacity-50' : ''}`}
                    style={{
                      borderLeftWidth: '5px',
                      borderLeftColor: step.colorHex,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          {isPlayingNow && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                              ACTIVA
                            </span>
                          )}
                          <span className="text-xs font-extrabold text-white truncate">
                            {step.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800 font-bold">
                            ⏱️ {formatDurationMinSec(step.durationSec)} min
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                            Fade {step.fadeSec.toFixed(1)}s
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-sky-300 border border-slate-800">
                            {step.sceneIds.length} ejecutores
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToStep(idx);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                          title="Disparar esta Cue ahora mismo"
                        >
                          GO
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(idx, -1);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Subir Cue"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(idx, 1);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Bajar Cue"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateStep(step);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Duplicar Cue"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {steps.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(step.id);
                            }}
                            className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                            title="Eliminar Cue"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED CUE EDITOR (DURATION, FADE, SPEED & EXECUTOR MATRIX) */}
          {selectedStep ? (
            <div className="col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4">
              {/* Name, Color & Enable */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="color"
                    value={selectedStep.colorHex}
                    onChange={(e) =>
                      handleUpdateSingleStep(selectedStep.id, (s) => ({
                        ...s,
                        colorHex: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedStep.name}
                    onChange={(e) =>
                      handleUpdateSingleStep(selectedStep.id, (s) => ({
                        ...s,
                        name: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleUpdateSingleStep(selectedStep.id, (s) => ({
                        ...s,
                        sceneIds: [...activeSceneIds],
                      }));
                      setNotice(
                        `Capturados los ${activeSceneIds.length} ejecutores activos de la consola en «${selectedStep.name}».`
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
                    title="Copia dentro de esta Cue los botones que tienes encendidos ahora mismo en la consola"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Capturar Look Actual
                  </button>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStep.enabled}
                      onChange={(e) =>
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          enabled: e.target.checked,
                        }))
                      }
                      className="accent-emerald-400"
                    />
                    Habilitada
                  </label>
                </div>
              </div>

              {/* Duration in Minutes & Seconds + Quick Presets */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Duración de esta Cue (Minutos y Segundos)
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    Total: {formatDurationMinSec(selectedStep.durationSec)} min
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Minutos (0..120)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={Math.floor(selectedStep.durationSec / 60)}
                      onChange={(e) => {
                        const mins = Math.max(0, parseInt(e.target.value, 10) || 0);
                        const secs = selectedStep.durationSec % 60;
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          durationSec: Math.max(5, mins * 60 + secs),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Segundos (0..59)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={selectedStep.durationSec % 60}
                      onChange={(e) => {
                        const mins = Math.floor(selectedStep.durationSec / 60);
                        const secs = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          durationSec: Math.max(5, mins * 60 + secs),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Fade Entrada ({selectedStep.fadeSec.toFixed(1)}s)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.2}
                      value={selectedStep.fadeSec}
                      onChange={(e) =>
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          fadeSec: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Abanico &lt;&gt; ({Math.round(selectedStep.fanSpread * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={10}
                      value={Math.round(selectedStep.fanSpread * 100)}
                      onChange={(e) =>
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          fanSpread: parseInt(e.target.value, 10) / 100,
                        }))
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Time Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Tiempos Rápidos:</span>
                  {QUICK_DURATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        handleUpdateSingleStep(selectedStep.id, (s) => ({
                          ...s,
                          durationSec: p.sec,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                        selectedStep.durationSec === p.sec
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Executor / Scene Selector for this Cue */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Ejecutores y Efectos que corren en esta Cue (Haz clic para activar/desactivar)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedStep.sceneIds.length} seleccionados
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {banks
                    .filter((b) => b.id !== 'bank_flash')
                    .map((bank) => {
                      const bankScenes = scenes.filter((s) => s.bankId === bank.id);
                      return (
                        <div
                          key={bank.id}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: bank.colorHex }}
                            />
                            {bank.name}
                          </div>
                          <div className="space-y-1">
                            {bankScenes.map((sc) => {
                              const isChecked = selectedStep.sceneIds.includes(sc.id);
                              return (
                                <button
                                  key={sc.id}
                                  onClick={() => handleToggleSceneInStep(selectedStep, sc)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                    isChecked
                                      ? 'bg-slate-800 border-emerald-400 text-white shadow'
                                      : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span className="truncate pr-2">{sc.name}</span>
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                      isChecked ? 'bg-emerald-400' : 'bg-slate-800'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : null}
          </div>
        ) : (
          /* TAB 2: 24-HOUR REAL-TIME EVENT CLOCK SCHEDULER */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  Agenda Automática del Evento por Hora Real del Reloj (24h)
                </h3>
                <p className="text-xs text-slate-400">
                  Programa cambios automáticos a horas exactas del día o de la noche (ej. 21:00 Cena, 23:30 Fiesta, 00:00 Especial Medianoche, 04:30 Cierre).
                </p>
              </div>

              <button
                onClick={() => {
                  const newEv: ClockScheduleEvent = {
                    id: `clk_${Date.now().toString(36)}`,
                    timeHHMM: '22:00',
                    name: 'Nuevo Hito Horario',
                    enabled: true,
                    actionType: 'start_autoshow_cue',
                    targetAutoShowStepId: steps[0]?.id,
                    fadeSec: 2.5,
                  };
                  onUpdateClockSchedule([...clockSchedule, newEv]);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Añadir Hito Horario
              </button>
            </div>

            <div className="space-y-2.5">
              {clockSchedule.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                    ev.enabled
                      ? 'bg-slate-950 border-amber-500/40 shadow'
                      : 'bg-slate-950/50 border-slate-800/80 opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <input
                      type="checkbox"
                      checked={ev.enabled}
                      onChange={(e) =>
                        onUpdateClockSchedule(
                          clockSchedule.map((item) =>
                            item.id === ev.id ? { ...item, enabled: e.target.checked } : item
                          )
                        )
                      }
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <input
                      type="time"
                      value={ev.timeHHMM}
                      onChange={(e) =>
                        onUpdateClockSchedule(
                          clockSchedule.map((item) =>
                            item.id === ev.id ? { ...item, timeHHMM: e.target.value } : item
                          )
                        )
                      }
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-sm font-black text-amber-300"
                    />
                    <input
                      type="text"
                      value={ev.name}
                      onChange={(e) =>
                        onUpdateClockSchedule(
                          clockSchedule.map((item) =>
                            item.id === ev.id ? { ...item, name: e.target.value } : item
                          )
                        )
                      }
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={ev.actionType}
                      onChange={(e) =>
                        onUpdateClockSchedule(
                          clockSchedule.map((item) =>
                            item.id === ev.id
                              ? {
                                  ...item,
                                  actionType: e.target.value as ClockScheduleEvent['actionType'],
                                }
                              : item
                          )
                        )
                      }
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200"
                    >
                      <option value="start_autoshow_cue">Ir a Cue de Auto-Show</option>
                      <option value="blackout_on">Activar Blackout General (Cierre)</option>
                    </select>

                    {ev.actionType === 'start_autoshow_cue' && (
                      <select
                        value={ev.targetAutoShowStepId || steps[0]?.id || ''}
                        onChange={(e) =>
                          onUpdateClockSchedule(
                            clockSchedule.map((item) =>
                              item.id === ev.id
                                ? { ...item, targetAutoShowStepId: e.target.value }
                                : item
                            )
                          )
                        }
                        className="bg-slate-900 border border-purple-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-200 max-w-[220px]"
                      >
                        {steps.map((st, idx) => (
                          <option key={st.id} value={st.id}>
                            Cue #{idx + 1}: {st.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px]">
                      <span className="text-slate-400">Fade:</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={ev.fadeSec}
                        onChange={(e) =>
                          onUpdateClockSchedule(
                            clockSchedule.map((item) =>
                              item.id === ev.id
                                ? { ...item, fadeSec: Math.max(0, Number(e.target.value)) }
                                : item
                            )
                          )
                        }
                        className="w-12 bg-transparent font-mono font-bold text-cyan-300 text-right"
                      />
                      <span className="text-slate-500">s</span>
                    </div>

                    <button
                      onClick={() => {
                        onTriggerClockEventNow(ev);
                        setNotice(`Hito "${ev.name}" disparado manualmente.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer"
                    >
                      Probar Ahora
                    </button>

                    <button
                      onClick={() =>
                        onUpdateClockSchedule(clockSchedule.filter((item) => item.id !== ev.id))
                      }
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
