import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  FolderOpen,
  Layers,
  CheckCircle2,
  Cpu,
  Upload,
  Table,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Wand2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  FIXTURE_PROFILES,
  LOCATION_ZONE_LABELS,
  RIG_PRESETS,
  normalizeGroupOrders,
} from '../constants/defaultShowData';
import { importDaslight5DvcXml } from '../engine/daslightDvcCompiler';
import {
  parseManualTextToProfile,
  parseSslLibraryXmlToProfile,
} from '../engine/ssl2AndManualParser';
import type { FixtureProfile, GroupId, LocationZoneId, PatchedFixture } from '../types/dmx';

interface CloneRigModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixtures: PatchedFixture[];
  profiles: FixtureProfile[];
  onUpdateFixtures: (next: PatchedFixture[]) => void;
  onAddCustomProfile: (profile: FixtureProfile) => void;
  highlightFixtureId: string | null;
  onSetHighlightFixtureId: (id: string | null) => void;
}

const GROUP_LABELS: Record<GroupId, { title: string; badge: string; color: string }> = {
  beams: {
    title: 'GRUPO 1 · BEAMS MÓVILES',
    badge: 'Cabezas Móviles Haz Estrecho',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
  washes: {
    title: 'GRUPO 2 · WASHES MÓVILES',
    badge: 'Bañadores Móviles RGBW',
    color: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
  },
  spots: {
    title: 'GRUPO 3 · SPOTS / BSW GOBOS',
    badge: 'Cabezas Móviles Spot & Gobos',
    color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  },
  blinders: {
    title: 'GRUPO 4 · CEGADORAS (BLINDERS)',
    badge: 'Cegadoras Público COB / DWE',
    color: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  },
  strobes: {
    title: 'GRUPO 5 · STROBOS FLASH',
    badge: 'Estrobos de Impacto',
    color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  },
  bars: {
    title: 'GRUPO 6 · BARRAS DE LED / PAR',
    badge: 'Barras LED / Ciclorama',
    color: 'text-pink-400 border-pink-500/40 bg-pink-500/10',
  },
};

export const CloneRigModal: React.FC<CloneRigModalProps> = ({
  isOpen,
  onClose,
  fixtures,
  profiles,
  onUpdateFixtures,
  onAddCustomProfile,
  highlightFixtureId,
  onSetHighlightFixtureId,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'swap_groups'
    | 'patch_table'
    | 'custom_profile'
    | 'presets'
    | 'daslight_import'
    | 'dip_sheet'
  >('swap_groups');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [patchFilterGroup, setPatchFilterGroup] = useState<GroupId | 'all'>('all');

  // Per-group quick cloner state
  const [groupConfig, setGroupConfig] = useState<
    Record<GroupId, { profileId: string; count: number; universe: number; startAddress: number }>
  >({
    beams: { profileId: 'sharpy_7r_16ch', count: 14, universe: 1, startAddress: 1 },
    washes: { profileId: 'robin_300_15ch', count: 12, universe: 2, startAddress: 1 },
    spots: { profileId: 'bsw_400_26ch', count: 4, universe: 3, startAddress: 49 },
    blinders: { profileId: 'cob_blinder_4ch', count: 4, universe: 3, startAddress: 153 },
    strobes: { profileId: 'strobo_ip65_18ch', count: 8, universe: 2, startAddress: 181 },
    bars: { profileId: 'bar_rgbw_4ch', count: 12, universe: 3, startAddress: 1 },
  });

  // Custom Fixture Profile Builder State
  const [newProfName, setNewProfName] = useState<string>('Mi Cabezal Móvil Custom');
  const [newProfBrand, setNewProfBrand] = useState<string>('Custom DMX');
  const [newProfCategory, setNewProfCategory] = useState<GroupId>('beams');
  const [newProfChannels, setNewProfChannels] = useState<number>(16);
  const [newProfDimmer, setNewProfDimmer] = useState<number>(1);
  const [newProfShutter, setNewProfShutter] = useState<number>(2);
  const [newProfPan, setNewProfPan] = useState<number>(3);
  const [newProfTilt, setNewProfTilt] = useState<number>(5);
  const [newProfRed, setNewProfRed] = useState<number>(7);
  const [newProfGreen, setNewProfGreen] = useState<number>(8);
  const [newProfBlue, setNewProfBlue] = useState<number>(9);
  const [newProfWhite, setNewProfWhite] = useState<number>(10);
  const [newProfColorWheel, setNewProfColorWheel] = useState<number>(0);

  // Local Daslight 5 shows discovered by backend
  const [localDvcShows, setLocalDvcShows] = useState<
    Array<{ fileName: string; filePath: string; sizeBytes: number }>
  >([]);
  const [extractedSslLibs, setExtractedSslLibs] = useState<
    Array<{ sslName: string; sourceFile: string; sslXml: string }>
  >([]);
  const [manualTextInput, setManualTextInput] = useState<string>(
    'CH1 Pan\nCH2 Pan Fine\nCH3 Tilt\nCH4 Tilt Fine\nCH6 Dimmer\nCH7 Shutter Strobe\nCH8 Red\nCH9 Green\nCH10 Blue\nCH11 White\nCH12 Zoom'
  );

  useEffect(() => {
    if (!isOpen) {
      onSetHighlightFixtureId(null);
      return;
    }
    const nextCfg = { ...groupConfig };
    (['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).forEach((gId) => {
      const members = fixtures.filter((f) => f.groupId === gId);
      if (members.length > 0) {
        nextCfg[gId] = {
          profileId: members[0].profileId,
          count: members.length,
          universe: members[0].universe,
          startAddress: members[0].address,
        };
      } else {
        nextCfg[gId] = { ...nextCfg[gId], count: 0 };
      }
    });
    setGroupConfig(nextCfg);

    fetch('/api/daslight/shows')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.shows)) {
          setLocalDvcShows(data.shows);
        }
      })
      .catch(() => {});

    fetch('/api/daslight/extract-ssl-profiles')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.sslProfiles)) {
          setExtractedSslLibs(data.sslProfiles);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const profileMap = new Map<string, FixtureProfile>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  // Detect DMX address overlaps / collisions
  const collisionIds = new Set<string>();
  for (let i = 0; i < fixtures.length; i++) {
    const a = fixtures[i];
    const profA = profileMap.get(a.profileId) || profiles[0];
    const startA = a.address;
    const endA = a.address + profA.channelCount - 1;
    if (endA > 512) collisionIds.add(a.id);

    for (let j = i + 1; j < fixtures.length; j++) {
      const b = fixtures[j];
      if (a.universe !== b.universe) continue;
      const profB = profileMap.get(b.profileId) || profiles[0];
      const startB = b.address;
      const endB = b.address + profB.channelCount - 1;
      if (startA <= endB && startB <= endA) {
        collisionIds.add(a.id);
        collisionIds.add(b.id);
      }
    }
  }

  const handleAutoPatchAddresses = () => {
    let uni = 1;
    let addr = 1;
    const updated = fixtures.map((f) => {
      const prof = profileMap.get(f.profileId) || profiles[0];
      if (addr + prof.channelCount - 1 > 512) {
        uni++;
        addr = 1;
      }
      const next = { ...f, universe: uni, address: addr };
      addr += prof.channelCount;
      return next;
    });
    onUpdateFixtures(normalizeGroupOrders(updated));
    setStatusMessage('¡Auto-Patch completado! Todos los focos tienen direcciones DMX consecutivas sin solapamientos.');
  };

  const handleUpdateSingleFixture = (id: string, patch: Partial<PatchedFixture>) => {
    const next = fixtures.map((f) => (f.id === id ? { ...f, ...patch } : f));
    onUpdateFixtures(normalizeGroupOrders(next));
  };

  const handleMoveFixtureOrder = (id: string, direction: -1 | 1) => {
    const idx = fixtures.findIndex((f) => f.id === id);
    if (idx === -1) return;
    const targetGroup = fixtures[idx].groupId;
    // Find previous/next fixture in the same group
    let swapIdx = idx + direction;
    while (swapIdx >= 0 && swapIdx < fixtures.length && fixtures[swapIdx].groupId !== targetGroup) {
      swapIdx += direction;
    }
    if (swapIdx < 0 || swapIdx >= fixtures.length) return;
    const copy = [...fixtures];
    const temp = copy[idx];
    copy[idx] = copy[swapIdx];
    copy[swapIdx] = temp;
    onUpdateFixtures(normalizeGroupOrders(copy));
  };

  const handleDeleteSingleFixture = (id: string) => {
    onUpdateFixtures(normalizeGroupOrders(fixtures.filter((f) => f.id !== id)));
  };

  const handleAddSingleFixture = (gId: GroupId) => {
    const prof = profiles.find((p) => p.category === gId) || profiles[0];
    const next: PatchedFixture = {
      id: `fix_${Date.now().toString(36)}`,
      name: `${prof.name.split('(')[0].trim()} Nuevo`,
      profileId: prof.id,
      groupId: gId,
      universe: 1,
      address: 1,
      orderInGroup: 0,
      stageX: 0,
      stageY: 0.5,
    };
    onUpdateFixtures(normalizeGroupOrders([...fixtures, next]));
  };

  const handleCreateCustomProfile = () => {
    const id = `custom_${Date.now().toString(36)}`;
    const newProfile: FixtureProfile = {
      id,
      name: `${newProfName} (${newProfChannels}CH)`,
      manufacturer: newProfBrand,
      category: newProfCategory,
      channelCount: newProfChannels,
      sslLibraryKey:
        newProfCategory === 'washes'
          ? 'robin300'
          : newProfCategory === 'strobes'
            ? 'stroboIP65'
            : newProfCategory === 'bars'
              ? 'barRGBW'
              : 'sharpy7R',
      description: 'Perfil personalizado creado en GrandDas con traducción HAL automática.',
      channels: {
        dimmer: newProfDimmer > 0 ? newProfDimmer : undefined,
        shutter: newProfShutter > 0 ? newProfShutter : undefined,
        strobe: newProfShutter > 0 ? newProfShutter : undefined,
        pan: newProfPan > 0 ? newProfPan : undefined,
        tilt: newProfTilt > 0 ? newProfTilt : undefined,
        red: newProfRed > 0 ? newProfRed : undefined,
        green: newProfGreen > 0 ? newProfGreen : undefined,
        blue: newProfBlue > 0 ? newProfBlue : undefined,
        white: newProfWhite > 0 ? newProfWhite : undefined,
        colorWheel: newProfColorWheel > 0 ? newProfColorWheel : undefined,
      },
      dmxRules: {
        shutterOpen: 255,
        shutterClosed: 0,
        strobeSlow: 50,
        strobeMed: 140,
        strobeFast: 240,
        prismOn: 128,
        prismOff: 0,
        prismRotCw: 160,
        colorWheelMap: {
          white: 0,
          red: 15,
          amber: 30,
          green: 45,
          cyan: 60,
          blue: 75,
          magenta: 90,
          uv: 105,
        },
      },
    };
    onAddCustomProfile(newProfile);
    setStatusMessage(
      `¡Perfil "${newProfile.name}" creado! Ya puedes asignarlo a cualquier grupo o foco individual y el motor traducirá todos los efectos automáticamente.`
    );
    setActiveTab('swap_groups');
  };

  const handleApplyGroupClone = (gId: GroupId) => {
    const cfg = groupConfig[gId];
    const prof = profiles.find((p) => p.id === cfg.profileId) || FIXTURE_PROFILES[0];
    const otherFixtures = fixtures.filter((f) => f.groupId !== gId);

    const newGroupFixtures: PatchedFixture[] = [];
    let addr = cfg.startAddress;
    let uni = cfg.universe;

    for (let i = 0; i < cfg.count; i++) {
      if (addr + prof.channelCount - 1 > 512) {
        uni++;
        addr = 1;
      }
      newGroupFixtures.push({
        id: `${gId}_${prof.id}_${i + 1}_${Date.now().toString(36)}`,
        name: `${prof.name.split('(')[0].trim()} #${i + 1}`,
        profileId: prof.id,
        groupId: gId,
        universe: uni,
        address: addr,
        orderInGroup: i,
        stageX: 0,
        stageY: 0.5,
      });
      addr += prof.channelCount;
    }

    const combined = normalizeGroupOrders([...otherFixtures, ...newGroupFixtures]);
    onUpdateFixtures(combined);
    setStatusMessage(
      `¡Clonación MA2 completada! ${GROUP_LABELS[gId].title} ahora usa ${cfg.count}x ${prof.name}.`
    );
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = RIG_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const cloned = normalizeGroupOrders(
      preset.fixtures.map((f, idx) => ({
        ...f,
        id: `preset_${idx}_${Date.now().toString(36)}`,
        orderInGroup: idx,
        stageX: 0,
        stageY: 0.5,
      }))
    );
    onUpdateFixtures(cloned);
    setStatusMessage(`Montaje "${preset.name}" cargado (${cloned.length} focos).`);
  };

  const handleFileUploadDvc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedFixtures = importDaslight5DvcXml(text);
      onUpdateFixtures(importedFixtures);
      setStatusMessage(
        `Archivo "${file.name}" importado con éxito (${importedFixtures.length} focos).`
      );
    } catch (err: any) {
      setStatusMessage(`Error al leer .dvc: ${err.message}`);
    }
  };

  const handleImportServerDvc = async (fileName: string) => {
    try {
      const res = await fetch(`/api/daslight/parse-show?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (!data.ok || !data.show) {
        throw new Error(data.error || 'No se pudo parsear el archivo');
      }
      const mapped: PatchedFixture[] = data.show.fixtures.map((f: any, idx: number) => {
        const ssl = (f.sslName || '').toLowerCase();
        const ch = f.channelCount || 16;
        let profileId = 'sharpy_7r_16ch';
        let groupId: GroupId = 'beams';

        if (ssl.includes('robin') || ssl.includes('wash') || ch === 15) {
          profileId = 'robin_300_15ch';
          groupId = 'washes';
        } else if (ssl.includes('strob') || ch === 18) {
          profileId = 'strobo_ip65_18ch';
          groupId = 'strobes';
        } else if (ssl.includes('rgbw') || ssl.includes('bar') || ch === 4) {
          profileId = 'bar_rgbw_4ch';
          groupId = 'bars';
        } else if (ssl.includes('bsw') || ssl.includes('cmy') || ch === 26) {
          profileId = 'bsw_400_26ch';
          groupId = 'beams';
        }

        return {
          id: f.dasUid || `imp_${idx}`,
          name: f.name || `Foco ${idx + 1}`,
          profileId,
          groupId,
          universe: f.universe || 1,
          address: f.address || 1,
          orderInGroup: idx,
          stageX: 0,
          stageY: 0.5,
        };
      });

      const normalized = normalizeGroupOrders(mapped);
      onUpdateFixtures(normalized);
      setStatusMessage(`¡Show "${fileName}" importado (${normalized.length} focos)!`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const visiblePatchFixtures =
    patchFilterGroup === 'all'
      ? fixtures
      : fixtures.filter((f) => f.groupId === patchFilterGroup);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Clonador MA2, Tabla de Patch & Localizador de Focos (Highlight)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cambia modelos en 1 clic, corrige direcciones DMX o usa <strong>💡 Localizar</strong> para ordenar e invertir focos desde la mesa sin subirte al truss.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2.5 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('swap_groups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'swap_groups'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            1. Clonado Rápido por Grupo
          </button>
          <button
            onClick={() => setActiveTab('patch_table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'patch_table'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            2. Patch Individual, Orden & 💡 Localizar ({fixtures.length})
          </button>
          <button
            onClick={() => setActiveTab('custom_profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'custom_profile'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            3. Crear Foco Nuevo (15 seg)
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            4. Plantillas de Bolos
          </button>
          <button
            onClick={() => setActiveTab('daslight_import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'daslight_import'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            5. Importar .DVC Daslight
          </button>
          <button
            onClick={() => setActiveTab('dip_sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'dip_sheet'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            6. Hoja Montaje & Dip-Switches
          </button>
        </div>

        {/* Status Banner */}
        {statusMessage && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'swap_groups' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-400">¿Hace falta patchear?</strong> Solo necesitas decirle qué modelo de foco llevas en cada grupo y su dirección DMX inicial (o editarlas foco a foco en la Pestaña 2). <strong>Lo que nunca más tendrás que hacer es reprogramar escenas o efectos.</strong>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).map((gId) => {
                  const cfg = groupConfig[gId];
                  const info = GROUP_LABELS[gId];
                  const currentMembers = fixtures.filter((f) => f.groupId === gId);

                  return (
                    <div
                      key={gId}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${info.color}`}>
                            {info.title}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Actual: <strong>{currentMembers.length} uds</strong>
                          </span>
                        </div>

                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Modelo de Foco (Traductor HAL Automático):
                        </label>
                        <select
                          value={cfg.profileId}
                          onChange={(e) =>
                            setGroupConfig((prev) => ({
                              ...prev,
                              [gId]: { ...prev[gId], profileId: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                        >
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — [{p.manufacturer}]
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Cantidad (Unidades)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={32}
                              value={cfg.count}
                              onChange={(e) =>
                                setGroupConfig((prev) => ({
                                  ...prev,
                                  [gId]: {
                                    ...prev[gId],
                                    count: Math.max(0, parseInt(e.target.value) || 0),
                                  },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Universo (1-4)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={4}
                              value={cfg.universe}
                              onChange={(e) =>
                                setGroupConfig((prev) => ({
                                  ...prev,
                                  [gId]: {
                                    ...prev[gId],
                                    universe: Math.max(1, Math.min(4, parseInt(e.target.value) || 1)),
                                  },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Dir. DMX Inicial
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={512}
                              value={cfg.startAddress}
                              onChange={(e) =>
                                setGroupConfig((prev) => ({
                                  ...prev,
                                  [gId]: {
                                    ...prev[gId],
                                    startAddress: Math.max(1, Math.min(512, parseInt(e.target.value) || 1)),
                                  },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyGroupClone(gId)}
                        className="w-full mt-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Clonar y Auto-Patchear {info.title.split('·')[1]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'patch_table' && (
            <div className="space-y-3">
              {/* Top Controls for Patch Table */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setPatchFilterGroup(g)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        patchFilterGroup === g
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {g === 'all' ? 'Todos' : g.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {collisionIds.size > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {collisionIds.size} focos con canales DMX solapados
                    </span>
                  )}

                  {highlightFixtureId && (
                    <button
                      onClick={() => onSetHighlightFixtureId(null)}
                      className="px-3 py-1.5 rounded-lg bg-yellow-400 text-slate-950 text-xs font-black animate-pulse cursor-pointer"
                    >
                      💡 Apagar Modo Localizar (Highlight Activo)
                    </button>
                  )}

                  <button
                    onClick={handleAutoPatchAddresses}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Numerar DMX sin Solapamientos
                  </button>
                </div>
              </div>

              {/* Fixture Patch Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <th className="py-2 px-3">Orden Truss</th>
                      <th className="py-2 px-3">💡 Localizar</th>
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Grupo</th>
                      <th className="py-2 px-3">Ubicación Escenario</th>
                      <th className="py-2 px-3">Modelo / Perfil</th>
                      <th className="py-2 px-3">Univ.</th>
                      <th className="py-2 px-3">Dirección DMX</th>
                      <th className="py-2 px-3">Invertir (Si colgado al revés)</th>
                      <th className="py-2 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {visiblePatchFixtures.map((fix) => {
                      const prof = profileMap.get(fix.profileId) || profiles[0];
                      const endCh = fix.address + prof.channelCount - 1;
                      const hasCollision = collisionIds.has(fix.id);
                      const isHighlighted = highlightFixtureId === fix.id;

                      return (
                        <tr
                          key={fix.id}
                          className={`${
                            isHighlighted
                              ? 'bg-amber-500/20'
                              : hasCollision
                                ? 'bg-rose-500/10'
                                : 'hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Physical Order on Truss (Left -> Right) */}
                          <td className="py-1.5 px-3 font-mono">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-amber-400 w-6">
                                #{fix.orderInGroup + 1}
                              </span>
                              <button
                                onClick={() => handleMoveFixtureOrder(fix.id, -1)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                                title="Mover a la izquierda en el truss"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveFixtureOrder(fix.id, 1)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                                title="Mover a la derecha en el truss"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Highlight / Solo Button */}
                          <td className="py-1.5 px-3">
                            <button
                              onClick={() =>
                                onSetHighlightFixtureId(isHighlighted ? null : fix.id)
                              }
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                isHighlighted
                                  ? 'bg-yellow-400 text-slate-950 shadow shadow-yellow-400/50'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                              title="Enciende SOLO este foco al 100% Blanco en el centro para identificarlo en el escenario"
                            >
                              <Lightbulb className="w-3 h-3" />
                              {isHighlighted ? 'ENCENDIDO' : 'Probar'}
                            </button>
                          </td>

                          {/* Name */}
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={fix.name}
                              onChange={(e) =>
                                handleUpdateSingleFixture(fix.id, { name: e.target.value })
                              }
                              className="w-32 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                            />
                          </td>

                          {/* Group */}
                          <td className="py-1.5 px-3">
                            <select
                              value={fix.groupId}
                              onChange={(e) =>
                                handleUpdateSingleFixture(fix.id, {
                                  groupId: e.target.value as GroupId,
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                            >
                              <option value="beams">G1 · Beams</option>
                              <option value="washes">G2 · Washes</option>
                              <option value="spots">G3 · Spots</option>
                              <option value="blinders">G4 · Cegadoras</option>
                              <option value="strobes">G5 · Strobos</option>
                              <option value="bars">G6 · Barras LED</option>
                            </select>
                          </td>

                          {/* Physical Stage Location Zone */}
                          <td className="py-1.5 px-3">
                            <select
                              value={fix.locationZone || 'back_truss'}
                              onChange={(e) =>
                                handleUpdateSingleFixture(fix.id, {
                                  locationZone: e.target.value as LocationZoneId,
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sky-300 text-xs font-medium"
                            >
                              {(Object.keys(LOCATION_ZONE_LABELS) as LocationZoneId[]).map((z) => (
                                <option key={z} value={z}>
                                  {LOCATION_ZONE_LABELS[z].short}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Profile */}
                          <td className="py-1.5 px-3">
                            <select
                              value={fix.profileId}
                              onChange={(e) =>
                                handleUpdateSingleFixture(fix.id, { profileId: e.target.value })
                              }
                              className="w-44 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                            >
                              {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Universe */}
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min={1}
                              max={4}
                              value={fix.universe}
                              onChange={(e) =>
                                handleUpdateSingleFixture(fix.id, {
                                  universe: Math.max(1, Math.min(4, parseInt(e.target.value) || 1)),
                                })
                              }
                              className="w-12 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs text-center"
                            />
                          </td>

                          {/* DMX Address & Footprint */}
                          <td className="py-1.5 px-3 font-mono">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={512}
                                value={fix.address}
                                onChange={(e) =>
                                  handleUpdateSingleFixture(fix.id, {
                                    address: Math.max(1, Math.min(512, parseInt(e.target.value) || 1)),
                                  })
                                }
                                className={`w-16 px-2 py-1 rounded border text-xs font-bold ${
                                  hasCollision
                                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                                    : 'bg-slate-900 border-slate-700 text-amber-300'
                                }`}
                              />
                              <span className="text-[10px] text-slate-500">
                                → {String(endCh).padStart(3, '0')} ({prof.channelCount}ch)
                              </span>
                            </div>
                          </td>

                          {/* Individual Pan/Tilt Invert */}
                          <td className="py-1.5 px-3">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(fix.invertPan)}
                                  onChange={(e) =>
                                    handleUpdateSingleFixture(fix.id, { invertPan: e.target.checked })
                                  }
                                  className="accent-amber-500"
                                />
                                Inv Pan
                              </label>
                              <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(fix.invertTilt)}
                                  onChange={(e) =>
                                    handleUpdateSingleFixture(fix.id, { invertTilt: e.target.checked })
                                  }
                                  className="accent-amber-500"
                                />
                                Inv Tilt
                              </label>
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="py-1.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSingleFixture(fix.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                              title="Quitar foco"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'] as GroupId[]).map((gId) => (
                  <button
                    key={gId}
                    onClick={() => handleAddSingleFixture(gId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    Añadir 1 Foco a {gId.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom_profile' && (
            <div className="space-y-4">
              {/* 1. Auto-extract from Daslight 5 SSL2 definitions */}
              {extractedSslLibs.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      ⚡ Lector Automático de Librerías .SSL2 de Daslight 5 (Detectadas en tu PC)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Extrae Pan, Tilt, Dimmer, Shutter, RGBW, CMY y Ruedas de Color sin escribir canales
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {extractedSslLibs.map((item) => (
                      <div
                        key={item.sslName}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {item.sslName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Fuente: {item.sourceFile}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const parsedProf = parseSslLibraryXmlToProfile(item.sslXml);
                            onAddCustomProfile(parsedProf);
                            setStatusMessage(
                              `¡Librería SSL2 "${parsedProf.name}" analizada e importada al traductor HAL! Canales detectados automáticamente.`
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Auto-Extraer SSL2
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Smart DMX Manual Text Parser */}
              <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    📄 Pegar Tabla de Canales desde un Manual PDF / Word (Español, Inglés o Chino)
                  </h4>
                  <button
                    onClick={() => {
                      const parsed = parseManualTextToProfile(
                        manualTextInput,
                        newProfName,
                        newProfBrand,
                        newProfCategory
                      );
                      onAddCustomProfile(parsed);
                      setStatusMessage(
                        `¡Manual analizado con éxito! Creado "${parsed.name}" con mapeo automático HAL.`
                      );
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    Auto-Detectar Canales y Guardar Perfil
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={manualTextInput}
                  onChange={(e) => setManualTextInput(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
                  placeholder="Pega aquí las líneas del manual DMX (ej. CH1 Pan, CH2 Pan Fine, CH3 Tilt...)"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <strong className="text-amber-400">O configúralo manualmente por número de canal:</strong> Pon cuántos canales tiene el foco y en qué canal están sus funciones básicas (pon <code>0</code> si no tiene esa función).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre del Foco</label>
                  <input
                    type="text"
                    value={newProfName}
                    onChange={(e) => setNewProfName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Marca</label>
                  <input
                    type="text"
                    value={newProfBrand}
                    onChange={(e) => setNewProfBrand(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Grupo Principal</label>
                  <select
                    value={newProfCategory}
                    onChange={(e) => setNewProfCategory(e.target.value as GroupId)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="beams">Grupo 1 · Beams</option>
                    <option value="washes">Grupo 2 · Washes</option>
                    <option value="spots">Grupo 3 · Spots / Gobos</option>
                    <option value="blinders">Grupo 4 · Cegadoras (Blinders)</option>
                    <option value="strobes">Grupo 5 · Strobos</option>
                    <option value="bars">Grupo 6 · Barras de LED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Total Canales DMX</label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={newProfChannels}
                    onChange={(e) => setNewProfChannels(parseInt(e.target.value) || 16)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {[
                  { label: 'Canal Dimmer (0=Virtual)', val: newProfDimmer, set: setNewProfDimmer },
                  { label: 'Canal Shutter / Strobo', val: newProfShutter, set: setNewProfShutter },
                  { label: 'Canal Pan (Horizontal)', val: newProfPan, set: setNewProfPan },
                  { label: 'Canal Tilt (Vertical)', val: newProfTilt, set: setNewProfTilt },
                  { label: 'Canal Rueda Color (0=No)', val: newProfColorWheel, set: setNewProfColorWheel },
                  { label: 'Canal Rojo (Red)', val: newProfRed, set: setNewProfRed },
                  { label: 'Canal Verde (Green)', val: newProfGreen, set: setNewProfGreen },
                  { label: 'Canal Azul (Blue)', val: newProfBlue, set: setNewProfBlue },
                  { label: 'Canal Blanco (White)', val: newProfWhite, set: setNewProfWhite },
                ].map((item, i) => (
                  <div key={i}>
                    <label className="block text-[10px] text-slate-400 mb-1">{item.label}</label>
                    <input
                      type="number"
                      min={0}
                      max={64}
                      value={item.val}
                      onChange={(e) => item.set(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreateCustomProfile}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Guardar Nuevo Perfil en el Catálogo HAL
              </button>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              {RIG_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between gap-4 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{preset.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{preset.subtitle}</p>
                  </div>
                  <button
                    onClick={() => handleLoadPreset(preset.id)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition cursor-pointer"
                  >
                    Cargar Montaje
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'daslight_import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Subir cualquier archivo .dvc de Daslight 5</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Extrae el patch completo de focos, direcciones y universos y lo adapta a tus 4 Grupos Universales.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  Seleccionar .dvc
                  <input type="file" accept=".dvc" onChange={handleFileUploadDvc} className="hidden" />
                </label>
              </div>

              {localDvcShows.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Shows detectados en F:\APPS\Planecreator\PARA APP LUCES:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {localDvcShows.map((sh) => (
                      <div
                        key={sh.fileName}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-200 truncate">{sh.fileName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {(sh.sizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportServerDvc(sh.fileName)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold shrink-0 transition cursor-pointer"
                        >
                          Importar Patch
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dip_sheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    📋 Hoja Técnica de Montaje DMX & Calculadora Binaria Dip-Switches (1-10)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lista lista para técnicos de escenario con dirección digital de 3 dígitos (001..512) y posición exacta de pines Dip-Switch (ON arriba en ámbar).
                  </p>
                </div>
                <button
                  onClick={() => {
                    const lines = fixtures.map((f) => {
                      const prof = profileMap.get(f.profileId) || profiles[0];
                      const endCh = f.address + prof.channelCount - 1;
                      const activePins: number[] = [];
                      for (let bit = 0; bit < 9; bit++) {
                        if ((f.address & (1 << bit)) !== 0) activePins.push(bit + 1);
                      }
                      return `Uni ${f.universe} | Dir ${String(f.address).padStart(3, '0')}-${String(endCh).padStart(3, '0')} | ${f.name} (${prof.name}) | DIP ON: [${activePins.join(', ')}, 10]`;
                    });
                    navigator.clipboard.writeText(lines.join('\n'));
                    setStatusMessage('¡Hoja de Montaje DMX copiada al portapapeles lista para enviar por WhatsApp o imprimir!');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition"
                >
                  📋 Copiar Hoja para Técnicos
                </button>
              </div>

              {/* Universe Occupancy Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((u) => {
                  const uniFix = fixtures.filter((f) => f.universe === u);
                  let maxCh = 0;
                  uniFix.forEach((f) => {
                    const p = profileMap.get(f.profileId) || profiles[0];
                    maxCh = Math.max(maxCh, f.address + p.channelCount - 1);
                  });
                  const pct = Math.min(100, Math.round((maxCh / 512) * 100));
                  return (
                    <div
                      key={u}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Universo {u}</span>
                        <span className="font-mono text-amber-400">
                          {uniFix.length} focos ({maxCh}/512 ch)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dip-Switch Visual Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Foco / Grupo</th>
                      <th className="py-2.5 px-3">Zona Truss</th>
                      <th className="py-2.5 px-3">Universo</th>
                      <th className="py-2.5 px-3">Display 3 Dígitos</th>
                      <th className="py-2.5 px-3">Rango CH</th>
                      <th className="py-2.5 px-3">Dip-Switches Binarios (1..9 + 10 DMX)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {fixtures.map((fix) => {
                      const prof = profileMap.get(fix.profileId) || profiles[0];
                      const endCh = fix.address + prof.channelCount - 1;
                      const zoneLabel =
                        LOCATION_ZONE_LABELS[fix.locationZone || 'back_truss'].name;

                      return (
                        <tr key={fix.id} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3">
                            <div className="font-bold text-white">{fix.name}</div>
                            <div className="text-[10px] text-slate-400">{prof.name}</div>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-300">{zoneLabel}</td>
                          <td className="py-2 px-3 font-mono font-bold text-sky-400">
                            UNI {fix.universe}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2.5 py-1 rounded bg-slate-900 border border-amber-500/40 font-mono font-black text-amber-300 text-sm tracking-widest">
                              A{String(fix.address).padStart(3, '0')}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {fix.address} – {endCh} ({prof.channelCount}ch)
                          </td>
                          <td className="py-2 px-3">
                            <div className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pin) => {
                                const isOn =
                                  pin === 10
                                    ? true
                                    : (fix.address & (1 << (pin - 1))) !== 0;
                                return (
                                  <div
                                    key={pin}
                                    className="flex flex-col items-center w-5"
                                    title={
                                      pin === 10
                                        ? 'Pin 10: Modo DMX Activo'
                                        : `Pin ${pin} (+${1 << (pin - 1)}): ${isOn ? 'ON' : 'OFF'}`
                                    }
                                  >
                                    <div
                                      className={`w-4 h-5 rounded-sm border flex flex-col justify-between p-0.5 ${
                                        isOn
                                          ? 'bg-amber-500/20 border-amber-400'
                                          : 'bg-slate-950 border-slate-700'
                                      }`}
                                    >
                                      <div
                                        className={`w-full h-2 rounded-[1px] ${
                                          isOn ? 'bg-amber-400' : 'bg-transparent'
                                        }`}
                                      />
                                      <div
                                        className={`w-full h-2 rounded-[1px] ${
                                          !isOn ? 'bg-slate-600' : 'bg-transparent'
                                        }`}
                                      />
                                    </div>
                                    <span
                                      className={`text-[8px] font-mono mt-0.5 ${
                                        isOn ? 'text-amber-300 font-bold' : 'text-slate-500'
                                      }`}
                                    >
                                      {pin}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total en el Patch actual: <strong className="text-white">{fixtures.length} focos</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Cerrar y Volver al Directo
          </button>
        </div>
      </div>
    </div>
  );
};
