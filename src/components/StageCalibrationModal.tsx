import React from 'react';
import { X, Crosshair, RotateCcw } from 'lucide-react';
import { DEFAULT_GROUP_CALIBRATIONS } from '../constants/defaultShowData';
import type { GroupCalibration, GroupId } from '../types/dmx';

interface StageCalibrationModalProps {
  groupId: GroupId | null;
  onClose: () => void;
  calibrations: Record<GroupId, GroupCalibration>;
  onUpdateCalibration: (groupId: GroupId, next: Partial<GroupCalibration>) => void;
}

export const StageCalibrationModal: React.FC<StageCalibrationModalProps> = ({
  groupId,
  onClose,
  calibrations,
  onUpdateCalibration,
}) => {
  if (!groupId) return null;
  const cal = calibrations[groupId];

  const handleReset = () => {
    onUpdateCalibration(groupId, DEFAULT_GROUP_CALIBRATIONS[groupId]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Calibración Rápida de Escenario (4 Puntos)
              </h3>
              <p className="text-[11px] text-amber-400 font-semibold">{cal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            Al llegar a un bolo nuevo, ajusta estos <strong>4 límites DMX (0..255)</strong> para enmarcar el escenario. Todas las escenas de posición (<em>Abanico, Cruce en X, Público, Centro</em>) y los efectos circulares se reescalarán automáticamente dentro de esta caja.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Límite Pan Izquierda</span>
                <span className="font-mono font-bold text-amber-400">{cal.panLeftDmx} DMX</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={cal.panLeftDmx}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { panLeftDmx: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Límite Pan Derecha</span>
                <span className="font-mono font-bold text-amber-400">{cal.panRightDmx} DMX</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={cal.panRightDmx}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { panRightDmx: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Tilt Suelo / Público</span>
                <span className="font-mono font-bold text-sky-400">{cal.tiltFloorDmx} DMX</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={cal.tiltFloorDmx}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { tiltFloorDmx: parseInt(e.target.value, 10) })
                }
                className="w-full accent-sky-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Tilt Cielo / Techo</span>
                <span className="font-mono font-bold text-sky-400">{cal.tiltSkyDmx} DMX</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={cal.tiltSkyDmx}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { tiltSkyDmx: parseInt(e.target.value, 10) })
                }
                className="w-full accent-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={cal.invertPanGroup}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { invertPanGroup: e.target.checked })
                }
                className="accent-amber-500"
              />
              Invertir Pan del Grupo
            </label>

            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={cal.invertTiltGroup}
                onChange={(e) =>
                  onUpdateCalibration(groupId, { invertTiltGroup: e.target.checked })
                }
                className="accent-amber-500"
              />
              Invertir Tilt (Colgado vs Suelo)
            </label>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Valores Base
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
