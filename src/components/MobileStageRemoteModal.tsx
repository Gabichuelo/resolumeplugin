import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Crosshair,
  Sliders,
  Lightbulb,
  Zap,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import type {
  GroupCalibration,
  GroupId,
  ManualXYOverride,
  PatchedFixture,
  ShowSnapshotCue,
} from '../types/dmx';

interface MobileStageRemoteModalProps {
  isOpen: boolean;
  isStandaloneWindow?: boolean;
  onClose?: () => void;
  fixtures: PatchedFixture[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  onUpdateCalibration: (groupId: GroupId, next: Partial<GroupCalibration>) => void;
  highlightedFixtureId: string | null;
  onSetHighlightedFixtureId: (id: string | null) => void;
  manualXY: ManualXYOverride;
  onUpdateManualXY: (next: ManualXYOverride) => void;
  macroCues: ShowSnapshotCue[];
  activeMacroId: string | null;
  onApplyMacroCue: (cue: ShowSnapshotCue) => void;
  blackout: boolean;
  onToggleBlackout: () => void;
}

export const MobileStageRemoteModal: React.FC<MobileStageRemoteModalProps> = ({
  isOpen,
  isStandaloneWindow = false,
  onClose,
  fixtures,
  groupCalibrations,
  onUpdateCalibration,
  highlightedFixtureId,
  onSetHighlightedFixtureId,
  manualXY,
  onUpdateManualXY,
  macroCues,
  activeMacroId,
  onApplyMacroCue,
  blackout,
  onToggleBlackout,
}) => {
  const [activeTab, setActiveTab] = useState<'calibrate' | 'locate' | 'xy' | 'macros'>('calibrate');
  const [selectedCalGroup, setSelectedCalGroup] = useState<GroupId>('beams');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen && !isStandaloneWindow) return null;

  const cal = groupCalibrations[selectedCalGroup];
  const remoteUrl = `${window.location.origin}/?window=remote`;

  const innerContent = (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        isStandaloneWindow
          ? 'w-full h-screen overflow-hidden'
          : 'w-full max-w-md h-[84vh] rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden'
      }`}
    >
      {/* Mobile Status Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              STAGE TECH REMOTE
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                LIVE SYNC
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Control de Escenario · Calibración 4 Puntos & Localizador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleBlackout}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
              blackout
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {blackout ? 'BO ON' : 'BO'}
          </button>
          {!isStandaloneWindow && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Wi-Fi URL Banner when opened inside PC console */}
      {!isStandaloneWindow && (
        <div className="px-3.5 py-2 bg-indigo-950/50 border-b border-indigo-500/30 flex items-center justify-between gap-2 text-[11px]">
          <div className="truncate text-indigo-200">
            📱 Abre en móvil/tablet o ventana aparte:{' '}
            <code className="text-amber-300 font-mono">{remoteUrl}</code>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(remoteUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold cursor-pointer"
            >
              {copiedUrl ? '¡Copiado!' : 'Copiar URL'}
            </button>
            <button
              onClick={() =>
                window.open('/?window=remote', 'GrandDasRemote', 'width=430,height=800')
              }
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="Abrir mando en ventana flotante"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900/70 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('calibrate')}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'calibrate'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Calibrar 4P
        </button>
        <button
          onClick={() => setActiveTab('locate')}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'locate'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Localizar ({fixtures.length})
        </button>
        <button
          onClick={() => setActiveTab('xy')}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'xy'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          Pad XY Vivo
        </button>
        <button
          onClick={() => setActiveTab('macros')}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'macros'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Macro-Looks
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'calibrate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['beams', 'washes'] as GroupId[]).map((gId) => (
                <button
                  key={gId}
                  onClick={() => setSelectedCalGroup(gId)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    selectedCalGroup === gId
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {groupCalibrations[gId].name}
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
              <div className="text-xs font-bold text-amber-300">
                Ajuste de Límites Físicos del Bolo ({cal.name})
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Pan Mínimo (Izquierda Escenario)</span>
                  <span className="font-mono font-bold text-amber-400">DMX {cal.panLeftDmx}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={cal.panLeftDmx}
                  onChange={(e) =>
                    onUpdateCalibration(selectedCalGroup, {
                      panLeftDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-2 accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Pan Máximo (Derecha Escenario)</span>
                  <span className="font-mono font-bold text-amber-400">DMX {cal.panRightDmx}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={cal.panRightDmx}
                  onChange={(e) =>
                    onUpdateCalibration(selectedCalGroup, {
                      panRightDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-2 accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tilt Suelo / Público (Downstage)</span>
                  <span className="font-mono font-bold text-sky-400">DMX {cal.tiltFloorDmx}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={cal.tiltFloorDmx}
                  onChange={(e) =>
                    onUpdateCalibration(selectedCalGroup, {
                      tiltFloorDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-2 accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tilt Cielo / Techo (Sky Fan)</span>
                  <span className="font-mono font-bold text-sky-400">DMX {cal.tiltSkyDmx}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={cal.tiltSkyDmx}
                  onChange={(e) =>
                    onUpdateCalibration(selectedCalGroup, {
                      tiltSkyDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-2 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Todas las escenas de posición y movimientos simétricos se re-escalan automáticamente dentro de este rectángulo.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'locate' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Toca un foco para encenderlo al 100% Blanco (Locate)
              </span>
              {highlightedFixtureId && (
                <button
                  onClick={() => onSetHighlightedFixtureId(null)}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold cursor-pointer"
                >
                  Apagar Locate
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {fixtures.map((fix) => {
                const isHi = highlightedFixtureId === fix.id;
                return (
                  <button
                    key={fix.id}
                    onClick={() => onSetHighlightedFixtureId(isHi ? null : fix.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isHi
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-lg shadow-amber-500/25'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{fix.name}</span>
                      <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-0.5 ${
                        isHi ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      Uni {fix.universe} · Dir {String(fix.address).padStart(3, '0')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'xy' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  onUpdateManualXY({ ...manualXY, enabled: !manualXY.enabled })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  manualXY.enabled
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {manualXY.enabled ? '🎯 Followspot XY ACTIVO' : 'Activar Followspot XY'}
              </button>

              <select
                value={manualXY.targetGroup}
                onChange={(e) =>
                  onUpdateManualXY({
                    ...manualXY,
                    targetGroup: e.target.value as GroupId | 'all',
                  })
                }
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="all">Beams + Washes</option>
                <option value="beams">Solo Beams</option>
                <option value="washes">Solo Washes</option>
              </select>
            </div>

            <div
              className="relative w-full aspect-square rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-hidden touch-none select-none cursor-crosshair"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2;
                onUpdateManualXY({
                  ...manualXY,
                  enabled: true,
                  panNorm: Math.max(-1, Math.min(1, nx)),
                  tiltNorm: Math.max(-1, Math.min(1, ny)),
                });
              }}
              onPointerMove={(e) => {
                if (e.buttons !== 1) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2;
                onUpdateManualXY({
                  ...manualXY,
                  enabled: true,
                  panNorm: Math.max(-1, Math.min(1, nx)),
                  tiltNorm: Math.max(-1, Math.min(1, ny)),
                });
              }}
            >
              {/* Crosshair grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-slate-800" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-full w-px bg-slate-800" />
              </div>

              {/* Target handle */}
              <div
                className="w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-emerald-400/30 border-2 border-emerald-400 absolute pointer-events-none flex items-center justify-center"
                style={{
                  left: `${((manualXY.panNorm + 1) / 2) * 100}%`,
                  top: `${((1 - manualXY.tiltNorm) / 2) * 100}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            <div className="text-center text-xs font-mono text-slate-400">
              Pan: {(manualXY.panNorm * 100).toFixed(0)}% · Tilt: {(manualXY.tiltNorm * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {activeTab === 'macros' && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-300 mb-2">
              Disparo de Macro-Looks Globales de Concierto
            </div>
            {macroCues.map((cue) => {
              const isActive = activeMacroId === cue.id;
              return (
                <button
                  key={cue.id}
                  onClick={() => onApplyMacroCue(cue)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-amber-400 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-slate-950"
                        style={{ backgroundColor: cue.colorHex }}
                      >
                        {cue.hotkey}
                      </span>
                      {cue.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {cue.sceneIds.length} recetas combinadas
                    </div>
                  </div>
                  <Zap
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? cue.colorHex : '#64748b' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isStandaloneWindow) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {innerContent}
    </div>
  );
};
