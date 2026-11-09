import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Play, Pause, X, Plus, Trash2, Circle, SkipBack, FolderOpen } from 'lucide-react';
import type { ShowSnapshotCue } from '../types/dmx';

export interface SongTimelineMarker {
  id: string;
  timeSec: number;
  cueId: string;
}

export interface SongTimelineData {
  songName: string;
  markers: SongTimelineMarker[];
}

interface SongTimelineModalProps {
  open: boolean;
  onClose: () => void;
  timeline: SongTimelineData;
  onChangeTimeline: (next: SongTimelineData) => void;
  snapshotCues: ShowSnapshotCue[];
  activeSnapshotId: string | null;
  onTriggerCue: (cue: ShowSnapshotCue) => void;
}

const fmt = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return '00:00.0';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
};

/**
 * Song Timeline (sincronizar con la música):
 * - Load an MP3/WAV from the laptop, play it here
 * - Drop Macro-Look markers on the song (manually, or by recording what you press live)
 * - On playback, every marker fires its Macro-Look exactly at that second
 * The audio file itself is not saved in the show (only its name + markers); reload it before the gig.
 * This component stays mounted while closed so the song keeps playing in the background.
 */
export const SongTimelineModal: React.FC<SongTimelineModalProps> = ({
  open,
  onClose,
  timeline,
  onChangeTimeline,
  snapshotCues,
  activeSnapshotId,
  onTriggerCue,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadedFileName, setLoadedFileName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [cueToAdd, setCueToAdd] = useState<string>(snapshotCues[0]?.id || '');
  const lastCheckTimeRef = useRef<number>(0);
  const suppressRecordRef = useRef<boolean>(false);
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  const sortedMarkers = useMemo(
    () => [...timeline.markers].sort((a, b) => a.timeSec - b.timeSec),
    [timeline.markers]
  );

  // Playback engine: fire markers when the playhead crosses them (50 ms resolution)
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const now = audio.currentTime;
      const prev = lastCheckTimeRef.current;
      setCurrentTime(now);
      if (now < prev - 0.25) {
        // user seeked backwards
        lastCheckTimeRef.current = now;
        return;
      }
      const crossed = timelineRef.current.markers
        .filter((m) => m.timeSec > prev && m.timeSec <= now)
        .sort((a, b) => a.timeSec - b.timeSec);
      const last = crossed[crossed.length - 1];
      if (last) {
        const cue = snapshotCues.find((c) => c.id === last.cueId);
        if (cue) {
          suppressRecordRef.current = true;
          onTriggerCue(cue);
        }
      }
      lastCheckTimeRef.current = now;
    }, 50);
    return () => window.clearInterval(id);
  }, [isPlaying, snapshotCues, onTriggerCue]);

  // Live recording: every Macro-Look you press while the song plays becomes a marker
  useEffect(() => {
    if (!recording || !isPlaying || !activeSnapshotId) return;
    if (suppressRecordRef.current) {
      suppressRecordRef.current = false;
      return;
    }
    const t = audioRef.current?.currentTime ?? 0;
    onChangeTimeline({
      ...timelineRef.current,
      markers: [
        ...timelineRef.current.markers,
        { id: `mk_${Date.now().toString(36)}`, timeSec: Number(t.toFixed(2)), cueId: activeSnapshotId },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSnapshotId]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setLoadedFileName(file.name);
    setIsPlaying(false);
    setCurrentTime(0);
    lastCheckTimeRef.current = 0;
    if (timeline.songName !== file.name) {
      onChangeTimeline({ ...timeline, songName: file.name });
    }
    e.target.value = '';
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.paused) {
      lastCheckTimeRef.current = audio.currentTime;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {}
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration || 0, sec));
    lastCheckTimeRef.current = audio.currentTime;
    setCurrentTime(audio.currentTime);
  };

  const addMarkerHere = () => {
    if (!cueToAdd) return;
    const t = audioRef.current?.currentTime ?? currentTime;
    onChangeTimeline({
      ...timeline,
      markers: [
        ...timeline.markers,
        { id: `mk_${Date.now().toString(36)}`, timeSec: Number(t.toFixed(2)), cueId: cueToAdd },
      ],
    });
  };

  const cueById = (id: string) => snapshotCues.find((c) => c.id === id);
  const songMismatch =
    loadedFileName && timeline.songName && loadedFileName !== timeline.songName;

  return (
    <>
      {/* Hidden persistent audio element (keeps playing when the panel is closed) */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Mini floating player when the panel is closed but the song is playing */}
      {!open && isPlaying && (
        <div className="fixed bottom-24 left-5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-pink-500/50 shadow-xl text-xs">
          <Music className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="font-bold text-white max-w-[160px] truncate">{loadedFileName}</span>
          <span className="font-mono text-pink-300">{fmt(currentTime)}</span>
          <button
            onClick={togglePlay}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            <Pause className="w-3 h-3" />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-400" />
                <div>
                  <h2 className="text-sm font-black uppercase text-white">Timeline de Canción · Sincronizar con la Música</h2>
                  <p className="text-[11px] text-slate-400">
                    Carga la canción, marca en qué segundo entra cada Macro-Look y la consola lo dispara sola.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Cerrar (la canción sigue sonando)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              {/* File + transport */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <FolderOpen className="w-3.5 h-3.5 text-pink-300" />
                  {audioUrl ? 'Cambiar Canción' : 'Cargar Canción (MP3/WAV)'}
                  <input type="file" accept="audio/*" onChange={handleLoadFile} className="hidden" />
                </label>
                <button
                  onClick={() => seekTo(0)}
                  disabled={!audioUrl}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 cursor-pointer"
                  title="Volver al inicio"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!audioUrl}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-40 cursor-pointer ${
                    isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pausa' : 'Reproducir'}
                </button>
                <span className="font-mono text-sm text-pink-300 font-bold">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
                <button
                  onClick={() => setRecording((r) => !r)}
                  className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border cursor-pointer ${
                    recording
                      ? 'bg-rose-600 text-white border-rose-300 animate-pulse'
                      : 'bg-slate-950 text-rose-300 border-rose-500/40 hover:bg-rose-500/15'
                  }`}
                  title="Mientras suena la canción, cada Macro-Look que pulses en la consola se graba como marca"
                >
                  <Circle className="w-3 h-3 fill-current" />
                  {recording ? 'GRABANDO LOOKS EN VIVO' : 'Grabar Looks en Vivo'}
                </button>
              </div>

              {timeline.songName && !audioUrl && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-[11px] text-amber-200">
                  Este show tiene marcas para <strong>«{timeline.songName}»</strong>. Carga ese archivo para reproducirlas.
                </div>
              )}
              {songMismatch && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-[11px] text-rose-200">
                  Ojo: las marcas se hicieron con «{timeline.songName}» y has cargado «{loadedFileName}».
                </div>
              )}

              {/* Visual timeline bar */}
              <div
                className="relative h-14 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer overflow-hidden"
                onClick={(e) => {
                  if (!duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo(((e.clientX - rect.left) / rect.width) * duration);
                }}
              >
                {duration > 0 &&
                  sortedMarkers.map((m) => {
                    const cue = cueById(m.cueId);
                    return (
                      <div
                        key={m.id}
                        className="absolute top-0 bottom-0 w-1 -ml-0.5"
                        style={{
                          left: `${(m.timeSec / duration) * 100}%`,
                          backgroundColor: cue?.colorHex || '#94a3b8',
                        }}
                        title={`${fmt(m.timeSec)} · ${cue?.name || m.cueId}`}
                      />
                    );
                  })}
                {duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white]"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                )}
                {!duration && (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
                    Carga una canción para ver la línea de tiempo
                  </div>
                )}
              </div>

              {/* Add marker */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <span className="text-[11px] font-bold text-slate-300">Marcar en {fmt(currentTime)}:</span>
                <select
                  value={cueToAdd}
                  onChange={(e) => setCueToAdd(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {snapshotCues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addMarkerHere}
                  disabled={!audioUrl}
                  className="px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-400 text-slate-950 text-xs font-black flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Marca
                </button>
                {timeline.markers.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('¿Borrar todas las marcas de esta canción?')) {
                        onChangeTimeline({ ...timeline, markers: [] });
                      }
                    }}
                    className="ml-auto px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold cursor-pointer"
                  >
                    Borrar todas
                  </button>
                )}
              </div>

              {/* Marker list */}
              <div className="space-y-1">
                {sortedMarkers.length === 0 && (
                  <div className="p-3 text-center text-[11px] text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Sin marcas todavía. Pulsa «Añadir Marca» o activa «Grabar Looks en Vivo» y toca la canción.
                  </div>
                )}
                {sortedMarkers.map((m) => {
                  const cue = cueById(m.cueId);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      <button
                        onClick={() => seekTo(Math.max(0, m.timeSec - 2))}
                        className="font-mono text-xs text-pink-300 font-bold px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 cursor-pointer"
                        title="Ir 2 s antes de esta marca"
                      >
                        {fmt(m.timeSec)}
                      </button>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cue?.colorHex || '#64748b' }}
                      />
                      <select
                        value={m.cueId}
                        onChange={(e) =>
                          onChangeTimeline({
                            ...timeline,
                            markers: timeline.markers.map((x) =>
                              x.id === m.id ? { ...x, cueId: e.target.value } : x
                            ),
                          })
                        }
                        className="flex-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                      >
                        {snapshotCues.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        {!cue && <option value={m.cueId}>(Look borrado)</option>}
                      </select>
                      <button
                        onClick={() =>
                          onChangeTimeline({
                            ...timeline,
                            markers: timeline.markers.filter((x) => x.id !== m.id),
                          })
                        }
                        className="p-1 rounded bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
