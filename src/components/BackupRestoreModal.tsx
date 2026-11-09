import React, { useEffect, useState } from 'react';
import { History, RotateCcw, X, RefreshCw, ShieldCheck } from 'lucide-react';

interface BackupEntry {
  file: string;
  savedAt: string;
  sizeKb: number;
  fixtureCount: number | null;
}

interface BackupRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onRestore: (show: any, file: string) => void;
}

const REASON_LABELS: Record<string, string> = {
  auto: 'Automática',
  manual: 'Manual',
  antes_reset_fabrica: 'Antes de Restaurar Fábrica',
  antes_cambiar_montaje: 'Antes de Cambiar Montaje',
  antes_restaurar: 'Antes de Restaurar Copia',
};

function describeBackup(file: string): string {
  const m = file.match(/_\d{2}-\d{2}-\d{2}_(.+)\.granddas\.json$/);
  const reason = m ? m[1] : 'auto';
  return REASON_LABELS[reason] || reason;
}

function timeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `hace ${diffSec} s`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

/**
 * Lists the rotating backups saved by the server in shows/backups/ and lets the user go back in time.
 * Before restoring, the current show is backed up too, so a restore can always be undone.
 */
export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ open, onClose, onRestore }) => {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmFile, setConfirmFile] = useState<string | null>(null);

  const loadList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/show/backups');
      const data = await res.json();
      if (data.ok) setBackups(data.backups || []);
      else setError(data.error || 'No se pudo leer la lista de copias');
    } catch {
      setError('El motor (servidor) no responde. ¿Está abierta la consola con el .exe?');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      setConfirmFile(null);
      setMessage('');
      loadList();
    }
  }, [open]);

  if (!open) return null;

  const handleBackupNow = async () => {
    try {
      const res = await fetch('/api/show/backup-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual' }),
      });
      const data = await res.json();
      setMessage(data.ok ? '✅ Copia manual creada' : `⚠️ ${data.error || 'No se pudo crear la copia'}`);
      loadList();
    } catch {
      setMessage('⚠️ Servidor no disponible');
    }
  };

  const handleRestore = async (file: string) => {
    try {
      // Safety net: back up what we have right now, so this restore can be undone
      await fetch('/api/show/backup-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'antes_restaurar' }),
      }).catch(() => {});
      const res = await fetch(`/api/show/backup?file=${encodeURIComponent(file)}`);
      const data = await res.json();
      if (!data.ok || !data.show) throw new Error(data.error || 'Copia dañada');
      onRestore(data.show, file);
      setMessage('✅ Show restaurado. Si no era esta, puedes volver: se guardó una copia justo antes.');
      setConfirmFile(null);
      loadList();
    } catch (e: any) {
      setMessage(`⚠️ ${e?.message || 'Error al restaurar'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-black uppercase text-white">Copias de Seguridad del Show</h2>
              <p className="text-[11px] text-slate-400">
                Se guarda una copia cada 2 minutos mientras trabajas y antes de cada acción peligrosa (últimas 30).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={handleBackupNow}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Crear Copia Ahora
          </button>
          <button
            onClick={loadList}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {message && <span className="text-[11px] text-amber-300 ml-1">{message}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}
          {!error && backups.length === 0 && !loading && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
              Todavía no hay copias. Se creará la primera en cuanto hagas cambios en el show.
            </div>
          )}
          {backups.map((b, idx) => {
            const d = new Date(b.savedAt);
            const isConfirm = confirmFile === b.file;
            return (
              <div
                key={b.file}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                  idx === 0 ? 'bg-slate-950 border-amber-500/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {d.toLocaleDateString('es-ES')} ·{' '}
                    {d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <span className="text-[10px] font-normal text-slate-400">({timeAgo(b.savedAt)})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{describeBackup(b.file)}</span>
                    {b.fixtureCount !== null && <span>{b.fixtureCount} focos</span>}
                    <span>{b.sizeKb} KB</span>
                  </div>
                </div>
                {isConfirm ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRestore(b.file)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer"
                    >
                      Sí, restaurar
                    </button>
                    <button
                      onClick={() => setConfirmFile(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmFile(b.file)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Volver a esta versión
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
