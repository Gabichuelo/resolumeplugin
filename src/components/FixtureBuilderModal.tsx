import React, { useState } from 'react';
import {
  X,
  Wrench,
  Plus,
  Copy,
  Trash2,
  Download,
  CheckCircle2,
  Palette,
  Sliders,
  Sparkles,
  Move,
  Wand2,
} from 'lucide-react';
import { COLOR_PALETTE_RGB, LOCATION_ZONE_LABELS } from '../constants/defaultShowData';
import { parseManualTextToProfile } from '../engine/ssl2AndManualParser';
import type {
  ColorPaletteId,
  FixtureProfile,
  GroupId,
  LocationZoneId,
  PatchedFixture,
} from '../types/dmx';

type FixtureChannelKey = keyof FixtureProfile['channels'];

interface FixtureBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: FixtureProfile[];
  onSaveProfile: (profile: FixtureProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  fixtures: PatchedFixture[];
  onUpdateFixtures: (next: PatchedFixture[]) => void;
}

const CHANNEL_FUNCTION_OPTIONS: Array<{
  key: FixtureChannelKey | 'unused';
  label: string;
  badgeColor: string;
}> = [
  { key: 'unused', label: '— Sin uso / Macro interna —', badgeColor: 'bg-slate-800 text-slate-400' },
  { key: 'pan', label: '↔️ Pan (Giro Horizontal 8-bit)', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { key: 'panFine', label: '↔️ Pan Fine (16-bit LSB)', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { key: 'tilt', label: '↕️ Tilt (Cabeceo Vertical 8-bit)', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { key: 'tiltFine', label: '↕️ Tilt Fine (16-bit LSB)', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { key: 'dimmer', label: '🔆 Dimmer (Intensidad General)', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { key: 'shutter', label: '⚡ Shutter / Obturador', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { key: 'strobe', label: '⚡ Strobe (Canal Estrobo Dedicado)', badgeColor: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30' },
  { key: 'colorWheel', label: '🎨 Rueda de Color Física', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  { key: 'red', label: '🔴 Rojo (Red LED)', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { key: 'green', label: '🟢 Verde (Green LED)', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'blue', label: '🔵 Azul (Blue LED)', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { key: 'white', label: '⚪ Blanco (White LED)', badgeColor: 'bg-slate-200/20 text-white border-slate-400/40' },
  { key: 'cyan', label: '🩵 Cyan (CMY)', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { key: 'magenta', label: '🩷 Magenta (CMY)', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' },
  { key: 'yellow', label: '💛 Yellow (CMY)', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { key: 'gobo', label: '🕸️ Rueda de Gobos', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { key: 'prism', label: '💎 Prisma (Inserción)', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { key: 'prismRot', label: '🔄 Rotación de Prisma', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { key: 'zoom', label: '🔍 Zoom (Ángulo Haz)', badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/40' },
  { key: 'focus', label: '🎯 Focus (Enfoque Lente)', badgeColor: 'bg-lime-500/10 text-lime-400 border-lime-500/30' },
  { key: 'whiteTubeDimmer', label: '⚡ Tubo Blanco Dimmer (Strobo Híbrido)', badgeColor: 'bg-slate-700 text-slate-200' },
  { key: 'whiteTubeStrobe', label: '⚡ Tubo Blanco Strobe (Strobo Híbrido)', badgeColor: 'bg-slate-700 text-slate-200' },
];

const COLOR_WHEEL_SLOTS: Array<Exclude<ColorPaletteId, 'transparent'>> = [
  'white',
  'red',
  'amber',
  'green',
  'cyan',
  'blue',
  'uv',
  'magenta',
];

export const FixtureBuilderModal: React.FC<FixtureBuilderModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onSaveProfile,
  onDeleteProfile,
  fixtures,
  onUpdateFixtures,
}) => {
  const [modeTab, setModeTab] = useState<'fixture_editor' | 'stage_layout_2d'>('fixture_editor');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profiles[0]?.id || 'sharpy_7r_16ch'
  );
  const [draft, setDraft] = useState<FixtureProfile>(() =>
     structuredClone(profiles[0] || ({} as FixtureProfile))
  );
  const [manualText, setManualText] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [draggingFixtureId, setDraggingFixtureId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectProfile = (prof: FixtureProfile) => {
    setSelectedProfileId(prof.id);
    setDraft(structuredClone(prof));
    setSavedNotice(null);
  };

  const handleCreateNewBlankProfile = () => {
    const id = `custom_${Date.now().toString(36)}`;
    const newProf: FixtureProfile = {
      id,
      name: 'Mi Cabeza Móvil Custom (16CH)',
      manufacturer: 'Custom Brand',
      category: 'beams',
      channelCount: 16,
      sslLibraryKey: 'sharpy7R',
      description: 'Perfil personalizado creado con el Editor Visual de Fixtures de GrandDas.',
      channels: {
        pan: 1,
        panFine: 2,
        tilt: 3,
        tiltFine: 4,
        dimmer: 6,
        shutter: 7,
        colorWheel: 8,
        gobo: 9,
        prism: 10,
        prismRot: 11,
        focus: 12,
      },
      dmxRules: {
        shutterOpen: 255,
        shutterClosed: 0,
        strobeSlow: 16,
        strobeMed: 72,
        strobeFast: 131,
        prismOn: 128,
        prismOff: 0,
        prismRotCw: 190,
        colorWheelMap: {
          white: 0,
          red: 18,
          amber: 36,
          green: 54,
          cyan: 72,
          blue: 90,
          uv: 108,
          magenta: 126,
        },
        goboSlots: [0, 20, 40, 60, 80, 100],
      },
    };
    onSaveProfile(newProf);
    handleSelectProfile(newProf);
    setSavedNotice('Nuevo perfil creado. Ajusta sus canales y pulsa «Guardar Cambios en Perfil».');
  };

  const handleDuplicateCurrentProfile = () => {
    const id = `${draft.id}_copy_${Date.now().toString(36).slice(-3)}`;
    const copy: FixtureProfile = {
      ...structuredClone(draft),
      id,
      name: `${draft.name} (Modificado)`,
    };
    onSaveProfile(copy);
    handleSelectProfile(copy);
    setSavedNotice('Perfil duplicado correctamente.');
  };

  // Find which function is assigned to 1-based channel `chNum`
  const getFunctionForChannel = (chNum: number): FixtureChannelKey | 'unused' => {
    for (const [k, v] of Object.entries(draft.channels)) {
      if (v === chNum) return k as FixtureChannelKey;
    }
    return 'unused';
  };

  // Assign a function to 1-based channel `chNum`
  const setFunctionForChannel = (
    chNum: number,
    funcKey: FixtureChannelKey | 'unused'
  ) => {
    setDraft((prev) => {
      const nextChannels: FixtureProfile['channels'] = { ...prev.channels };
      // Remove any existing function that pointed to chNum
      for (const k of Object.keys(nextChannels) as FixtureChannelKey[]) {
        if (nextChannels[k] === chNum) {
          delete nextChannels[k];
        }
      }
      if (funcKey !== 'unused') {
        nextChannels[funcKey] = chNum;
      }
      return { ...prev, channels: nextChannels };
    });
  };

  const handleSaveChanges = () => {
    onSaveProfile(draft);
    setSavedNotice(
      `¡Perfil «${draft.name}» guardado! Todos los focos patcheados con este modelo se han actualizado en vivo.`
    );
  };

  // Export profile as a native Nicolaudie / Daslight 5 .ssl2 XML file
  const handleExportSsl2Xml = () => {
    const chLines: string[] = [];
    for (let ch = 1; ch <= draft.channelCount; ch++) {
      const fn = getFunctionForChannel(ch);
      chLines.push(
        `    <CHANNEL INDEX="${ch - 1}" NAME="${fn === 'unused' ? `Channel ${ch}` : fn.toUpperCase()}" TYPE="${fn}" DEFAULT="0" />`
      );
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<SSLLIBRARY SSLNAME="${draft.manufacturer}/${draft.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.ssl2" SSLNBCHANNEL="${draft.channelCount}" MANUFACTURER="${draft.manufacturer}" MODEL="${draft.name}">\n  <CHANNELS>\n${chLines.join('\n')}\n  </CHANNELS>\n</SSLLIBRARY>\n`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.ssl2`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Apply geometric 2D Stage Layout Presets (Arc, V-Chevron, Circle, Matrix Grid)
  const handleApply2DLayoutPreset = (preset: 'truss_rows' | 'v_chevron' | 'circle_arena' | 'side_totems') => {
    const total = Math.max(1, fixtures.length);
    const updated = fixtures.map((f, idx) => {
      if (preset === 'truss_rows') {
        const yMap: Record<GroupId, number> = {
          beams: 0.08,
          spots: 0.22,
          washes: 0.38,
          blinders: 0.56,
          strobes: 0.74,
          bars: 0.92,
        };
        return { ...f, stageY: yMap[f.groupId] };
      }
      if (preset === 'v_chevron') {
        // V-shape chevron: center fixtures are downstage (front), outer fixtures are upstage (back)
        const absX = Math.abs(f.stageX);
        return { ...f, stageY: Math.max(0.05, Math.min(0.95, 0.85 - absX * 0.75)) };
      }
      if (preset === 'circle_arena') {
        const angle = (idx / total) * Math.PI * 2;
        return {
          ...f,
          stageX: Number((Math.cos(angle) * 0.85).toFixed(3)),
          stageY: Number((0.5 + Math.sin(angle) * 0.42).toFixed(3)),
        };
      }
      // side_totems
      const isLeft = idx % 2 === 0;
      const row = Math.floor(idx / 2) / Math.max(1, Math.ceil(total / 2) - 1);
      return {
        ...f,
        stageX: isLeft ? -0.82 : 0.82,
        stageY: Number(Math.max(0.08, Math.min(0.92, row)).toFixed(3)),
      };
    });
    onUpdateFixtures(updated);
    setSavedNotice('¡Geometría 2D aplicada! El Visualizador 3D y las Matrices 2D ya usan la nueva disposición.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                Estudio Visual de Fixtures & Layout 2D (Estilo ScanLibrary + MA2)
              </h2>
              <p className="text-xs text-slate-400">
                Edita cualquier foco canal por canal, calibra su Rueda de Color/Gobos, exporta archivos .SSL2 o diseña el plano 2D del escenario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setModeTab('fixture_editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modeTab === 'fixture_editor'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🔧 1. Editor de Perfiles DMX (.SSL2)
              </button>
              <button
                onClick={() => setModeTab('stage_layout_2d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modeTab === 'stage_layout_2d'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📐 2. Plano 2D Escenario (Drag & Drop)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{savedNotice}</span>
            </div>
            <button
              onClick={() => setSavedNotice(null)}
              className="text-[11px] underline text-emerald-200 cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        )}

        {/* TAB 1: VISUAL FIXTURE BUILDER */}
        {modeTab === 'fixture_editor' ? (
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-5 overflow-hidden">
            {/* Left Sidebar: Profile Library List */}
            <div className="col-span-3 flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-slate-300">
                  Librería ({profiles.length} Modelos)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreateNewBlankProfile}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer"
                    title="Crear un nuevo perfil de foco desde cero"
                  >
                    <Plus className="w-3 h-3" />
                    Nuevo
                  </button>
                  <button
                    onClick={handleDuplicateCurrentProfile}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Duplicar el perfil seleccionado"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {profiles.map((p) => {
                  const isSel = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSel
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{p.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] shrink-0">
                          {p.channelCount}CH
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{p.manufacturer}</span>
                        <span className="uppercase font-mono text-[9px] text-sky-400">
                          {p.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Manual Text Auto-Importer */}
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  Auto-Leer Manual PDF:
                </span>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={2}
                  placeholder="Pega tabla: CH1 Pan, CH2 Tilt, CH3 Dimmer..."
                  className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-200 font-mono"
                />
                <button
                  onClick={() => {
                    if (!manualText.trim()) return;
                    const parsed = parseManualTextToProfile(
                      manualText,
                      draft.name,
                      draft.manufacturer,
                      draft.category
                    );
                    setDraft((prev) => ({
                      ...prev,
                      channelCount: parsed.channelCount,
                      channels: parsed.channels,
                    }));
                    setSavedNotice(
                      `Detectados ${parsed.channelCount} canales automáticamente desde el texto del manual.`
                    );
                  }}
                  className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer"
                >
                  Mapear Canales desde Texto
                </button>
              </div>
            </div>

            {/* Center: Visual Channel-by-Channel Slot Editor */}
            <div className="col-span-5 flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-hidden">
              {/* Basic Metadata Row */}
              <div className="grid grid-cols-12 gap-2 pb-3 mb-3 border-b border-slate-800">
                <div className="col-span-5">
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Nombre del Modelo
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Marca</label>
                  <input
                    type="text"
                    value={draft.manufacturer}
                    onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Grupo HAL</label>
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value as GroupId })
                    }
                    className="w-full px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold"
                  >
                    <option value="beams">Beams</option>
                    <option value="washes">Washes</option>
                    <option value="spots">Spots</option>
                    <option value="blinders">Cegadoras</option>
                    <option value="strobes">Strobos</option>
                    <option value="bars">Barras LED</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Nº Canales</label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={draft.channelCount}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        channelCount: Math.max(1, Math.min(64, parseInt(e.target.value, 10) || 1)),
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-slate-300">
                  Asignación Canal por Canal (CH 01 .. CH {String(draft.channelCount).padStart(2, '0')})
                </span>
                <span className="text-[10px] text-slate-400">
                  Traductor Universal HAL → DMX
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {Array.from({ length: draft.channelCount }).map((_, idx) => {
                  const chNum = idx + 1;
                  const currentFunc = getFunctionForChannel(chNum);
                  const optMeta =
                    CHANNEL_FUNCTION_OPTIONS.find((o) => o.key === currentFunc) ||
                    CHANNEL_FUNCTION_OPTIONS[0];

                  return (
                    <div
                      key={chNum}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90"
                    >
                      <span className="w-14 px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono font-black text-xs text-amber-400 text-center shrink-0">
                        CH {String(chNum).padStart(2, '0')}
                      </span>

                      <select
                        value={currentFunc}
                        onChange={(e) =>
                          setFunctionForChannel(
                            chNum,
                            e.target.value as FixtureChannelKey | 'unused'
                          )
                        }
                        className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${optMeta.badgeColor}`}
                      >
                        {CHANNEL_FUNCTION_OPTIONS.map((opt) => (
                          <option
                            key={opt.key}
                            value={opt.key}
                            className="bg-slate-900 text-white"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Color Wheel Values, Shutter/Strobe/Prism DMX Rules & Actions */}
            <div className="col-span-4 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/*Shutter, Strobe & Prism DMX Values */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Rangos DMX de Shutter, Estrobo y Prisma (0..255)
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Shutter Abierto (ON)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.shutterOpen}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              shutterOpen: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Shutter Cerrado (Blackout)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.shutterClosed}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              shutterClosed: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Inicio Estrobo Lento
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.strobeSlow}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              strobeSlow: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Fin Estrobo Rápido
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.strobeFast}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              strobeFast: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Prisma Insertado (ON)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.prismOn}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              prismOn: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Rotación Prisma DMX
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={draft.dmxRules.prismRotCw}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dmxRules: {
                              ...draft.dmxRules,
                              prismRotCw: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Wheel Slot Calibration */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black uppercase text-pink-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Valores DMX de Rueda de Color Física (Si usa Rueda)
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Si el foco no es RGB sino de Rueda de Color (ej. Beam 7R), indica en qué valor DMX (0..255) cae cada color en ese aparato:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_WHEEL_SLOTS.map((colKey) => {
                      const colMeta = COLOR_PALETTE_RGB[colKey];
                      const dmxVal = draft.dmxRules.colorWheelMap?.[colKey] ?? 0;
                      return (
                        <div
                          key={colKey}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                              style={{ backgroundColor: colMeta.hex }}
                            />
                            <span className="text-[11px] font-semibold text-slate-200 truncate">
                              {colMeta.label.split(' ')[0]}
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={dmxVal}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                dmxRules: {
                                  ...draft.dmxRules,
                                  colorWheelMap: {
                                    ...draft.dmxRules.colorWheelMap,
                                    [colKey]: Math.max(
                                      0,
                                      Math.min(255, parseInt(e.target.value, 10) || 0)
                                    ),
                                  },
                                },
                              })
                            }
                            className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-amber-300 text-right"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save & Export Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleSaveChanges}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Guardar Cambios en Perfil «{draft.name}»
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportSsl2Xml}
                    className="py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar .SSL2 Daslight
                  </button>

                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        onDeleteProfile(draft.id);
                        const remaining = profiles.filter((p) => p.id !== draft.id);
                        if (remaining[0]) handleSelectProfile(remaining[0]);
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Perfil
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: INTERACTIVE 2D STAGE LAYOUT DRAG & DROP EDITOR */
          <div className="flex-1 min-h-0 flex flex-col p-5 gap-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Move className="w-4 h-4 text-amber-400" />
                  Diseñador Geométrico 2D del Escenario (Arrastra cualquier Foco con el Ratón)
                </h3>
                <p className="text-xs text-slate-400">
                  La posición física (X, Y) que coloques aquí se refleja al instante en el Visualizador 3D y en los Efectos de Matriz 2D (Radial, Barrido Fondo→Frente y Diagonal).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Formas Rápidas:</span>
                <button
                  onClick={() => handleApply2DLayoutPreset('truss_rows')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  4 Trusses Rectos
                </button>
                <button
                  onClick={() => handleApply2DLayoutPreset('v_chevron')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Truss en V (Chevron Festival)
                </button>
                <button
                  onClick={() => handleApply2DLayoutPreset('circle_arena')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Anillo Circular 360°
                </button>
                <button
                  onClick={() => handleApply2DLayoutPreset('side_totems')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Pasillo / Tótems Laterales
                </button>
              </div>
            </div>

            {/* Interactive 2D Stage Canvas */}
            <div
              className="relative flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden select-none"
              onPointerMove={(e) => {
                if (!draggingFixtureId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const normX = Math.max(
                  -0.95,
                  Math.min(0.95, ((e.clientX - rect.left) / rect.width) * 2 - 1)
                );
                const normY = Math.max(
                  0.05,
                  Math.min(0.95, (e.clientY - rect.top) / rect.height)
                );
                const zone: LocationZoneId =
                  normY < 0.28
                    ? 'back_truss'
                    : normY < 0.55
                      ? 'mid_truss'
                      : normY < 0.8
                        ? 'front_truss'
                        : 'floor_totems';

                onUpdateFixtures(
                  fixtures.map((f) =>
                    f.id === draggingFixtureId
                      ? {
                          ...f,
                          stageX: Number(normX.toFixed(3)),
                          stageY: Number(normY.toFixed(3)),
                          locationZone: zone,
                        }
                      : f
                  )
                );
              }}
              onPointerUp={() => setDraggingFixtureId(null)}
              onPointerLeave={() => setDraggingFixtureId(null)}
            >
              {/* Zone Reference Guides */}
              <div className="absolute inset-x-0 top-[14%] border-b border-dashed border-amber-500/20 px-4 text-[10px] font-bold text-amber-400/60 pointer-events-none">
                FONDO ESCENARIO · BACK TRUSS (Y = 0.0)
              </div>
              <div className="absolute inset-x-0 top-[42%] border-b border-dashed border-sky-500/20 px-4 text-[10px] font-bold text-sky-400/60 pointer-events-none">
                CENTRO ESCENARIO · MID TRUSS (Y = 0.4)
              </div>
              <div className="absolute inset-x-0 top-[70%] border-b border-dashed border-emerald-500/20 px-4 text-[10px] font-bold text-emerald-400/60 pointer-events-none">
                FRENTE PÚBLICO · FRONT TRUSS (Y = 0.7)
              </div>
              <div className="absolute inset-x-0 bottom-3 text-center text-xs font-black tracking-widest uppercase text-slate-600 pointer-events-none">
                ⬇️ PÚBLICO / PISTA DE BAILE (DOWNSTAGE) ⬇️
              </div>

              {/* Draggable Fixture Nodes */}
              {fixtures.map((fix) => {
                const leftPct = ((fix.stageX + 1) / 2) * 100;
                const topPct = fix.stageY * 100;
                const colorMap: Record<GroupId, string> = {
                  beams: 'bg-amber-500 border-amber-200 text-slate-950',
                  washes: 'bg-sky-500 border-sky-200 text-slate-950',
                  spots: 'bg-purple-500 border-purple-200 text-white',
                  blinders: 'bg-orange-500 border-orange-200 text-slate-950',
                  strobes: 'bg-yellow-400 border-white text-slate-950',
                  bars: 'bg-pink-500 border-pink-200 text-white',
                };

                return (
                  <div
                    key={fix.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingFixtureId(fix.id);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg border-2 font-mono text-[10px] font-black shadow-lg cursor-grab active:cursor-grabbing transition-transform ${
                      colorMap[fix.groupId]
                    } ${draggingFixtureId === fix.id ? 'scale-125 z-30 ring-4 ring-white/40' : 'hover:scale-110 z-10'}`}
                    title={`${fix.name} — Arrastra para mover por el escenario`}
                  >
                    {fix.groupId.slice(0, 1).toUpperCase()}#{fix.orderInGroup + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
