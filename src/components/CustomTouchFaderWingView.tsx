import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Zap,
  Crosshair,
  Check,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import type {
  CustomButtonControl,
  CustomButtonTargetType,
  CustomFaderControl,
  CustomFaderTargetType,
  CustomRgbwOverride,
  CustomTouchPage,
  GroupCalibration,
  GroupId,
  ManualXYOverride,
  PositionPaletteCalibration,
  PositionPaletteId,
  RecipeScene,
  ShowSnapshotCue,
} from '../types/dmx';

interface CustomTouchFaderWingViewProps {
  touchPages: CustomTouchPage[];
  onUpdateTouchPages: React.Dispatch<React.SetStateAction<CustomTouchPage[]>>;
  scenes: RecipeScene[];
  activeSceneIds: string[];
  onToggleScene: (scene: RecipeScene) => void;
  onFlashDown: (scene: RecipeScene) => void;
  onFlashUp: (scene: RecipeScene) => void;
  sceneSubmasterLevels: Record<string, number>;
  onChangeSceneSubmaster: (sceneId: string, level0to1: number) => void;
  groupCalibrations: Record<GroupId, GroupCalibration>;
  onUpdateGroupCalibration: (groupId: GroupId, patch: Partial<GroupCalibration>) => void;
  globalMaster: number;
  onChangeGlobalMaster: (val0to1: number) => void;
  moveFxSpeed: number;
  onChangeMoveFxSpeed: (val: number) => void;
  chaseFxSpeed: number;
  onChangeChaseFxSpeed: (val: number) => void;
  globalFxSize: number;
  onChangeGlobalFxSize: (val: number) => void;
  globalFanSpread: number;
  onChangeGlobalFanSpread: (val: number) => void;
  crossfadeSec: number;
  onChangeCrossfadeSec: (val: number) => void;
  bpm: number;
  onChangeBpm: (val: number) => void;
  manualDmxOverrides: Record<string, number>;
  onSetDmxOverride: (uni: number, ch1Based: number, val0to255: number | null) => void;
  snapshotCues: ShowSnapshotCue[];
  activeSnapshotId: string | null;
  onTriggerSnapshot: (cue: ShowSnapshotCue) => void;
  globalPositionOverride: PositionPaletteId;
  onChangeGlobalPositionOverride: (pos: PositionPaletteId) => void;
  positionCalibrations: Record<
    Exclude<PositionPaletteId, 'transparent'>,
    PositionPaletteCalibration
  >;
  activeColorThemeId: string;
  onChangeColorThemeId: (themeId: string) => void;
  colorThemes: Array<{ id: string; label: string; hexA: string; hexB: string }>;
  // Special live actions
  buildUpActive: boolean;
  buildUpProgress: number;
  dropImpactActive: boolean;
  onStartBuildUp: () => void;
  onTriggerDropImpact: () => void;
  hazeBlastActive: boolean;
  onSetHazeBlastActive: (active: boolean) => void;
  worklightActive: boolean;
  onToggleWorklight: () => void;
  freezeDmx: boolean;
  onToggleFreezeDmx: () => void;
  stompMovement: boolean;
  onToggleStompMovement: () => void;
  onResyncBeat: () => void;
  globalBlackout: boolean;
  onToggleBlackout: () => void;
  // XY Pad
  manualXY: ManualXYOverride;
  onUpdateManualXY: React.Dispatch<React.SetStateAction<ManualXYOverride>>;
  followspotWhiteActive: boolean;
  onToggleFollowspotWhite: () => void;
  // Custom RGBW + Kelvin & DJ Crossfader
  customRgbwOverride?: CustomRgbwOverride;
  onUpdateCustomRgbwOverride?: React.Dispatch<React.SetStateAction<CustomRgbwOverride>>;
  djLookA?: string;
  djLookB?: string;
  djCrossfaderPos?: number; // 0..100
  onChangeDjCrossfader?: (lookA: string, lookB: string, pos0to100: number) => void;
  isStandaloneTouchWindow?: boolean;
}

const PRESET_SWATCH_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#14b8a6',
];

export const CustomTouchFaderWingView: React.FC<CustomTouchFaderWingViewProps> = ({
  touchPages,
  onUpdateTouchPages,
  scenes,
  activeSceneIds,
  onToggleScene,
  onFlashDown,
  onFlashUp,
  sceneSubmasterLevels,
  onChangeSceneSubmaster,
  groupCalibrations,
  onUpdateGroupCalibration,
  globalMaster,
  onChangeGlobalMaster,
  moveFxSpeed,
  onChangeMoveFxSpeed,
  chaseFxSpeed,
  onChangeChaseFxSpeed,
  globalFxSize,
  onChangeGlobalFxSize,
  globalFanSpread,
  onChangeGlobalFanSpread,
  crossfadeSec,
  onChangeCrossfadeSec,
  bpm,
  onChangeBpm,
  manualDmxOverrides,
  onSetDmxOverride,
  snapshotCues,
  activeSnapshotId,
  onTriggerSnapshot,
  globalPositionOverride,
  onChangeGlobalPositionOverride,
  positionCalibrations,
  activeColorThemeId,
  onChangeColorThemeId,
  colorThemes,
  buildUpActive,
  buildUpProgress,
  dropImpactActive,
  onStartBuildUp,
  onTriggerDropImpact,
  hazeBlastActive,
  onSetHazeBlastActive,
  worklightActive,
  onToggleWorklight,
  freezeDmx,
  onToggleFreezeDmx,
  stompMovement,
  onToggleStompMovement,
  onResyncBeat,
  globalBlackout,
  onToggleBlackout,
  manualXY,
  onUpdateManualXY,
  followspotWhiteActive,
  onToggleFollowspotWhite,
  customRgbwOverride,
  onUpdateCustomRgbwOverride,
  djLookA = 'sc_all_on',
  djLookB = 'fx_ballyhoo',
  djCrossfaderPos = 0,
  onChangeDjCrossfader,
  isStandaloneTouchWindow = false,
}) => {
  const [activePageId, setActivePageId] = useState<string>(
    touchPages[0]?.id || 'page_fader_wing_main'
  );
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedWidget, setSelectedWidget] = useState<{
    kind: 'fader' | 'button';
    id: string;
  } | null>(null);

  const currentPage =
    touchPages.find((p) => p.id === activePageId) || touchPages[0] || null;

  if (!currentPage) return null;

  const updateCurrentPage = (updater: (page: CustomTouchPage) => CustomTouchPage) => {
    onUpdateTouchPages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? updater(p) : p))
    );
  };

  // ============================================================================
  // FADER VALUE RESOLUTION (0..100%) & LIVE MUTATION
  // ============================================================================
  const getFaderPercent = (fader: CustomFaderControl): number => {
    if (fader.targetType === 'group_dimmer') {
      const gId = fader.targetId as GroupId;
      return Math.round((groupCalibrations[gId]?.masterDimmer ?? 1) * 100);
    }
    if (fader.targetType === 'scene_level') {
      const isSceneActive = activeSceneIds.includes(fader.targetId);
      if (!isSceneActive) return 0;
      const lvl = sceneSubmasterLevels[fader.targetId] ?? 1;
      return Math.round(lvl * 100);
    }
    if (fader.targetType === 'console_param') {
      switch (fader.targetId) {
        case 'global_master':
          return Math.round(globalMaster * 100);
        case 'move_speed':
          return Math.round((moveFxSpeed / 4) * 100);
        case 'chase_speed':
          return Math.round((chaseFxSpeed / 4) * 100);
        case 'fx_size':
          return Math.round((globalFxSize / 1.5) * 100);
        case 'fan_spread':
          return Math.round(((globalFanSpread + 1) / 2) * 100);
        case 'crossfade_sec':
          return Math.round((crossfadeSec / 5) * 100);
        case 'bpm':
          return Math.round(((bpm - 60) / 120) * 100);
        default:
          return 50;
      }
    }
    if (fader.targetType === 'dmx_channel') {
      const val = manualDmxOverrides[fader.targetId] ?? 0;
      return Math.round((val / 255) * 100);
    }
    return 0;
  };

  const getFaderDisplayValue = (fader: CustomFaderControl, pct: number): string => {
    if (fader.targetType === 'console_param') {
      switch (fader.targetId) {
        case 'move_speed':
          return `${moveFxSpeed.toFixed(2)}x`;
        case 'chase_speed':
          return `${chaseFxSpeed.toFixed(2)}x`;
        case 'fan_spread':
          return `${globalFanSpread > 0 ? '+' : ''}${Math.round(globalFanSpread * 100)}%`;
        case 'crossfade_sec':
          return `${crossfadeSec.toFixed(1)}s`;
        case 'bpm':
          return `${bpm} BPM`;
        default:
          return `${pct}%`;
      }
    }
    if (fader.targetType === 'dmx_channel') {
      const val = manualDmxOverrides[fader.targetId] ?? 0;
      return `DMX ${val}`;
    }
    return `${pct}%`;
  };

  const handleSetFaderPercent = (fader: CustomFaderControl, pct0to100: number) => {
    const clamped = Math.max(0, Math.min(100, pct0to100));
    const norm = clamped / 100;

    if (fader.targetType === 'group_dimmer') {
      const gId = fader.targetId as GroupId;
      if (groupCalibrations[gId]) {
        onUpdateGroupCalibration(gId, { masterDimmer: norm });
      }
      return;
    }

    if (fader.targetType === 'scene_level') {
      onChangeSceneSubmaster(fader.targetId, norm);
      const sc = scenes.find((s) => s.id === fader.targetId);
      if (sc) {
        const isCurrentlyActive = activeSceneIds.includes(sc.id);
        if (clamped > 2 && !isCurrentlyActive) {
          onToggleScene(sc);
        } else if (clamped <= 2 && isCurrentlyActive) {
          onToggleScene(sc);
        }
      }
      return;
    }

    if (fader.targetType === 'console_param') {
      switch (fader.targetId) {
        case 'global_master':
          onChangeGlobalMaster(norm);
          break;
        case 'move_speed':
          onChangeMoveFxSpeed(Number(Math.max(0.1, norm * 4).toFixed(2)));
          break;
        case 'chase_speed':
          onChangeChaseFxSpeed(Number(Math.max(0.1, norm * 4).toFixed(2)));
          break;
        case 'fx_size':
          onChangeGlobalFxSize(Number((norm * 1.5).toFixed(2)));
          break;
        case 'fan_spread':
          onChangeGlobalFanSpread(Number((norm * 2 - 1).toFixed(2)));
          break;
        case 'crossfade_sec':
          onChangeCrossfadeSec(Number((norm * 5).toFixed(1)));
          break;
        case 'bpm':
          onChangeBpm(Math.round(60 + norm * 120));
          break;
      }
      return;
    }

    if (fader.targetType === 'dmx_channel') {
      const [uStr, chStr] = fader.targetId.split(':');
      const u = parseInt(uStr || '1', 10);
      const ch = parseInt(chStr || '1', 10);
      const dmxVal = Math.round(norm * 255);
      onSetDmxOverride(u, ch, dmxVal > 0 ? dmxVal : null);
    }
  };

  // ============================================================================
  // TOUCH BUTTON ACTIVE STATE & TRIGGER LOGIC
  // ============================================================================
  const isButtonActive = (btn: CustomButtonControl): boolean => {
    switch (btn.targetType) {
      case 'scene_toggle':
      case 'scene_flash':
        return activeSceneIds.includes(btn.targetId);
      case 'macro_look':
        return activeSnapshotId === btn.targetId;
      case 'position_preset':
        return globalPositionOverride === btn.targetId;
      case 'color_theme':
        return activeColorThemeId === btn.targetId;
      case 'special_action':
        if (btn.targetId === 'buildup_drop') return buildUpActive || dropImpactActive;
        if (btn.targetId === 'haze_blast') return hazeBlastActive;
        if (btn.targetId === 'worklight') return worklightActive;
        if (btn.targetId === 'freeze_dmx') return freezeDmx;
        if (btn.targetId === 'stomp_pt') return stompMovement;
        if (btn.targetId === 'blackout') return globalBlackout;
        return false;
      default:
        return false;
    }
  };

  const handleButtonClick = (btn: CustomButtonControl) => {
    if (editMode) {
      setSelectedWidget({ kind: 'button', id: btn.id });
      return;
    }

    switch (btn.targetType) {
      case 'scene_toggle': {
        const sc = scenes.find((s) => s.id === btn.targetId);
        if (sc) onToggleScene(sc);
        break;
      }
      case 'macro_look': {
        const cue = snapshotCues.find((c) => c.id === btn.targetId);
        if (cue) onTriggerSnapshot(cue);
        break;
      }
      case 'position_preset': {
        const nextPos =
          globalPositionOverride === btn.targetId
            ? 'transparent'
            : (btn.targetId as PositionPaletteId);
        onChangeGlobalPositionOverride(nextPos);
        break;
      }
      case 'color_theme': {
        const nextTheme = activeColorThemeId === btn.targetId ? 'auto' : btn.targetId;
        onChangeColorThemeId(nextTheme);
        break;
      }
      case 'special_action': {
        if (btn.targetId === 'worklight') onToggleWorklight();
        else if (btn.targetId === 'freeze_dmx') onToggleFreezeDmx();
        else if (btn.targetId === 'stomp_pt') onToggleStompMovement();
        else if (btn.targetId === 'resync_beat') onResyncBeat();
        else if (btn.targetId === 'blackout') onToggleBlackout();
        break;
      }
    }
  };

  const handleButtonMouseDown = (btn: CustomButtonControl) => {
    if (editMode) return;
    if (btn.targetType === 'scene_flash') {
      const sc = scenes.find((s) => s.id === btn.targetId);
      if (sc) onFlashDown(sc);
    } else if (btn.targetType === 'special_action') {
      if (btn.targetId === 'buildup_drop') onStartBuildUp();
      else if (btn.targetId === 'haze_blast') onSetHazeBlastActive(true);
    }
  };

  const handleButtonMouseUp = (btn: CustomButtonControl) => {
    if (editMode) return;
    if (btn.targetType === 'scene_flash') {
      const sc = scenes.find((s) => s.id === btn.targetId);
      if (sc) onFlashUp(sc);
    } else if (btn.targetType === 'special_action') {
      if (btn.targetId === 'buildup_drop' && buildUpActive) onTriggerDropImpact();
      else if (btn.targetId === 'haze_blast') onSetHazeBlastActive(false);
    }
  };

  // ============================================================================
  // ADD / EDIT / DELETE WIDGET HANDLERS
  // ============================================================================
  const handleAddFader = () => {
    const newFader: CustomFaderControl = {
      id: `cf_${Date.now()}`,
      label: `Fader ${currentPage.faders.length + 1}`,
      colorHex: PRESET_SWATCH_COLORS[currentPage.faders.length % PRESET_SWATCH_COLORS.length],
      targetType: 'scene_level',
      targetId: scenes[0]?.id || 'sc_all_on',
    };
    updateCurrentPage((p) => ({ ...p, faders: [...p.faders, newFader] }));
    setSelectedWidget({ kind: 'fader', id: newFader.id });
    setEditMode(true);
  };

  const handleAddButton = () => {
    const newBtn: CustomButtonControl = {
      id: `cb_${Date.now()}`,
      label: `Botón Touch ${currentPage.buttons.length + 1}`,
      subtitle: 'Escena / Acción',
      colorHex: PRESET_SWATCH_COLORS[currentPage.buttons.length % PRESET_SWATCH_COLORS.length],
      size: 'normal',
      targetType: 'scene_toggle',
      targetId: scenes[0]?.id || 'sc_all_on',
    };
    updateCurrentPage((p) => ({ ...p, buttons: [...p.buttons, newBtn] }));
    setSelectedWidget({ kind: 'button', id: newBtn.id });
    setEditMode(true);
  };

  const handleAddNewPage = () => {
    const newPage: CustomTouchPage = {
      id: `page_touch_${Date.now()}`,
      name: `🎛️ Página Touch ${touchPages.length + 1}`,
      showXYPad: true,
      faders: [
        {
          id: `cf_${Date.now()}_1`,
          label: 'Grand Master',
          colorHex: '#f59e0b',
          targetType: 'console_param',
          targetId: 'global_master',
        },
        {
          id: `cf_${Date.now()}_2`,
          label: 'Beams Master',
          colorHex: '#06b6d4',
          targetType: 'group_dimmer',
          targetId: 'beams',
        },
      ],
      buttons: [
        {
          id: `cb_${Date.now()}_1`,
          label: '🚀 SUBIDA -> 💥 DROP',
          subtitle: 'Mantén pulsado para Riser',
          colorHex: '#f59e0b',
          size: 'wide',
          targetType: 'special_action',
          targetId: 'buildup_drop',
        },
      ],
    };
    onUpdateTouchPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setEditMode(true);
  };

  const selectedFaderObj =
    selectedWidget?.kind === 'fader'
      ? currentPage.faders.find((f) => f.id === selectedWidget.id) || null
      : null;

  const selectedButtonObj =
    selectedWidget?.kind === 'button'
      ? currentPage.buttons.find((b) => b.id === selectedWidget.id) || null
      : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 px-3 pb-2 overflow-hidden">
      {/* TOP SUB-BAR: TOUCH PAGE TABS + ADD FADER / ADD BUTTON / EDIT MODE */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 mr-1">
            <Sliders className="w-3.5 h-3.5" />
            Páginas Touch:
          </span>
          {touchPages.map((page) => {
            const isCurrent = page.id === currentPage.id;
            return (
              <button
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
                  setSelectedWidget(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 border-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                }`}
              >
                {page.name}
              </button>
            );
          })}
          <button
            onClick={handleAddNewPage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
            title="Crear una nueva página de Faders y Botones Touch desde cero"
          >
            <Plus className="w-3.5 h-3.5" />
            +Página
          </button>
        </div>

        {/* Right: Quick Add Fader, Add Button, Toggle XY Pad & Edit Mode */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddFader}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            +Añadir Fader
          </button>
          <button
            onClick={handleAddButton}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            +Añadir Botón Touch
          </button>
          <button
            onClick={() => updateCurrentPage((p) => ({ ...p, showXYPad: !p.showXYPad }))}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
              currentPage.showXYPad
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎯 Pad XY {currentPage.showXYPad ? 'ON' : 'OFF'}
          </button>
          {!isStandaloneTouchWindow && (
            <button
              onClick={() =>
                window.open(
                  `${window.location.origin}${window.location.pathname}?window=touch`,
                  'GrandDasTouchWing',
                  'width=1280,height=820'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer"
              title="Abre esta Fader Wing + Touch en una ventana independiente (o en tu iPad/Tablet por Wi-Fi con ?window=touch)"
            >
              📱 Abrir Touch en 2ª Pantalla / Tablet
            </button>
          )}
          <button
            onClick={() => {
              setEditMode((e) => !e);
              if (editMode) setSelectedWidget(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
              editMode
                ? 'bg-amber-400 text-slate-950 border-white shadow-lg shadow-amber-400/25'
                : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400'
            }`}
          >
            {editMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {editMode ? 'Listo (Salir Edición)' : 'Personalizar Controles'}
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE: LEFT FADER WING + RIGHT DASLIGHT TOUCH MATRIX + OPTIONAL EDITOR DRAWER */}
      <div className="flex-1 min-h-0 flex gap-2.5 overflow-hidden">
        {/* 1. LEFT SECTION: MOTORIZED-STYLE CUSTOM FADER WING */}
        <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden shrink-0 max-w-full">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Fader Wing ({currentPage.faders.length} Faders)
            </span>
            {editMode && (
              <span className="text-[10px] text-amber-300 font-bold">
                Haz clic en cualquier Fader para asignarle su función
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 flex items-stretch gap-2.5 overflow-x-auto pb-1">
            {currentPage.faders.map((fader, idx) => {
              const pct = getFaderPercent(fader);
              const displayVal = getFaderDisplayValue(fader, pct);
              const isSelected =
                editMode && selectedWidget?.kind === 'fader' && selectedWidget.id === fader.id;
              const linkedScene =
                fader.targetType === 'scene_level'
                  ? scenes.find((s) => s.id === fader.targetId)
                  : null;
              const isSceneActive =
                fader.targetType === 'scene_level' && activeSceneIds.includes(fader.targetId);

              return (
                <div
                  key={fader.id}
                  onClick={() => {
                    if (editMode) setSelectedWidget({ kind: 'fader', id: fader.id });
                  }}
                  className={`w-[88px] shrink-0 bg-slate-950 border rounded-2xl p-2 flex flex-col items-center justify-between select-none transition ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ borderTopWidth: '4px', borderTopColor: fader.colorHex }}
                >
                  {/* Top Fader Header & Label */}
                  <div className="w-full text-center">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                      <span>#{idx + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMode(true);
                          setSelectedWidget({ kind: 'fader', id: fader.id });
                        }}
                        className="hover:text-amber-300 cursor-pointer"
                        title="Configurar qué controla este Fader"
                      >
                        ⚙️
                      </button>
                    </div>
                    <div
                      className="text-[11px] font-black text-white leading-tight truncate"
                      title={fader.label}
                    >
                      {fader.label}
                    </div>
                    <div
                      className="text-[10px] font-mono font-bold mt-0.5"
                      style={{ color: fader.colorHex }}
                    >
                      {displayVal}
                    </div>
                  </div>

                  {/* Interactive Vertical Touch Fader Track */}
                  <div
                    onMouseDown={(e) => {
                      if (editMode) {
                        setSelectedWidget({ kind: 'fader', id: fader.id });
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const updateFromY = (clientY: number) => {
                        const rel = 1 - (clientY - rect.top) / rect.height;
                        handleSetFaderPercent(fader, Math.round(rel * 100));
                      };
                      updateFromY(e.clientY);
                      const onMove = (ev: MouseEvent) => updateFromY(ev.clientY);
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                    className="relative flex-1 w-11 my-2 rounded-xl bg-slate-900 border border-slate-800 cursor-ns-resize overflow-hidden flex flex-col justify-end"
                  >
                    {/* Scale Ticks */}
                    <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-25">
                      {[100, 75, 50, 25, 0].map((mark) => (
                        <div key={mark} className="w-full h-px bg-slate-400" />
                      ))}
                    </div>

                    {/* Glowing Fill Bar */}
                    <div
                      className="w-full transition-all duration-75 rounded-b-lg"
                      style={{
                        height: `${pct}%`,
                        background: `linear-gradient(to top, ${fader.colorHex}44, ${fader.colorHex})`,
                        boxShadow: pct > 5 ? `0 0 16px ${fader.colorHex}66` : undefined,
                      }}
                    />

                    {/* Fader Cap Handle */}
                    <div
                      className="absolute inset-x-1 h-4 -mb-2 rounded-md bg-white border-2 border-slate-950 shadow-lg pointer-events-none flex items-center justify-center"
                      style={{ bottom: `calc(${pct}% )` }}
                    >
                      <div className="w-5 h-0.5 bg-slate-900 rounded" />
                    </div>
                  </div>

                  {/* Bottom Fader Wing Buttons: GO/ON + FLASH 100% */}
                  <div className="w-full space-y-1">
                    {linkedScene ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editMode) {
                              setSelectedWidget({ kind: 'fader', id: fader.id });
                              return;
                            }
                            onToggleScene(linkedScene);
                            if (!isSceneActive && (sceneSubmasterLevels[linkedScene.id] ?? 1) < 0.1) {
                              onChangeSceneSubmaster(linkedScene.id, 1);
                            }
                          }}
                          className={`w-full py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                            isSceneActive
                              ? 'bg-emerald-400 text-slate-950 shadow'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSceneActive ? 'ON / ACTIVO' : 'GO / ON'}
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (editMode) return;
                            onChangeSceneSubmaster(linkedScene.id, 1);
                            onFlashDown(linkedScene);
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            if (editMode) return;
                            onFlashUp(linkedScene);
                          }}
                          className="w-full py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 active:bg-amber-400 active:text-slate-950 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase transition cursor-pointer"
                        >
                          FLASH
                        </button>
                      </>
                    ) : fader.targetType === 'group_dimmer' ? (
                      <>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!editMode)
                              onUpdateGroupCalibration(fader.targetId as GroupId, {
                                flashActive: true,
                              });
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            if (!editMode)
                              onUpdateGroupCalibration(fader.targetId as GroupId, {
                                flashActive: false,
                              });
                          }}
                          className="w-full py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 active:bg-amber-400 active:text-slate-950 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase transition cursor-pointer"
                        >
                          FLASH
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!editMode) {
                              const gId = fader.targetId as GroupId;
                              onUpdateGroupCalibration(gId, {
                                blackout: !groupCalibrations[gId]?.blackout,
                              });
                            }
                          }}
                          className={`w-full py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                            groupCalibrations[fader.targetId as GroupId]?.blackout
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {groupCalibrations[fader.targetId as GroupId]?.blackout
                            ? 'MUTED'
                            : 'MUTE'}
                        </button>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!editMode) handleSetFaderPercent(fader, 100);
                          }}
                          className="py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[9px] font-bold cursor-pointer"
                        >
                          100%
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!editMode)
                              handleSetFaderPercent(
                                fader,
                                fader.targetId === 'fan_spread' ? 50 : 0
                              );
                          }}
                          className="py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[9px] font-bold cursor-pointer"
                        >
                          {fader.targetId === 'fan_spread' ? '0%' : ' Min '}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. CENTER SECTION: DASLIGHT TOUCH CUSTOM BUTTON MATRIX + XY PAD */}
        <div className="flex-1 min-w-0 bg-slate-900/85 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Panel Touch Personalizable ({currentPage.buttons.length} Botones)
            </span>
            <span className="text-[10px] text-slate-400">
              {editMode
                ? 'Modo Diseño: Toca cualquier botón para cambiar su función, color o tamaño'
                : 'Estilo Daslight Touch · Respuesta instantánea hacia Hahan SL04 Box'}
            </span>
          </div>

          <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
            {/* Touch Pad Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 content-start pr-1">
              {currentPage.buttons.map((btn) => {
                const active = isButtonActive(btn);
                const isSelected =
                  editMode && selectedWidget?.kind === 'button' && selectedWidget.id === btn.id;
                const isBuildUpBtn =
                  btn.targetType === 'special_action' && btn.targetId === 'buildup_drop';

                return (
                  <div
                    key={btn.id}
                    onClick={() => handleButtonClick(btn)}
                    onMouseDown={() => handleButtonMouseDown(btn)}
                    onMouseUp={() => handleButtonMouseUp(btn)}
                    onMouseLeave={() => active && handleButtonMouseUp(btn)}
                    className={`relative overflow-hidden rounded-2xl p-3.5 border flex flex-col justify-between min-h-[96px] select-none transition-all cursor-pointer ${
                      btn.size === 'wide' ? 'col-span-2' : 'col-span-1'
                    } ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-800'
                        : active
                          ? 'bg-slate-800 border-white shadow-xl scale-[1.01]'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                    style={{
                      borderBottomWidth: '5px',
                      borderBottomColor: btn.colorHex,
                      boxShadow: active ? `0 0 24px -4px ${btn.colorHex}88` : undefined,
                    }}
                  >
                    {isBuildUpBtn && buildUpActive && (
                      <div
                        className="absolute inset-y-0 left-0 bg-amber-400/30 transition-all duration-75 pointer-events-none"
                        style={{ width: `${buildUpProgress}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs sm:text-sm font-black text-white leading-snug">
                          {isBuildUpBtn && dropImpactActive
                            ? '💥 ¡DROP IMPACT!'
                            : isBuildUpBtn && buildUpActive
                              ? `🚀 SUBIDA ${Math.round(buildUpProgress)}%`
                              : btn.label}
                        </div>
                        {btn.subtitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{btn.subtitle}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`w-3 h-3 rounded-full transition ${
                            active
                              ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditMode(true);
                            setSelectedWidget({ kind: 'button', id: btn.id });
                          }}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-300 text-[10px] cursor-pointer"
                          title="Configurar este botón Touch"
                        >
                          ⚙️
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] font-mono text-slate-400">
                      <span className="uppercase">{btn.targetType.replace('_', ' ')}</span>
                      <span
                        className="px-1.5 py-0.5 rounded font-bold text-slate-950"
                        style={{ backgroundColor: btn.colorHex }}
                      >
                        {active ? 'ACTIVO' : 'TOUCH'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Embedded 2D Touch XY Pad on the right of the Touch Matrix */}
            {currentPage.showXYPad && (
              <div className="w-64 shrink-0 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5" />
                    Pad XY Táctil
                  </span>
                  <button
                    onClick={() =>
                      onUpdateManualXY((prev) => ({ ...prev, enabled: !prev.enabled }))
                    }
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer ${
                      manualXY.enabled
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {manualXY.enabled ? 'XY ACTIVO' : 'XY OFF'}
                  </button>
                </div>

                <div
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const updatePos = (clientX: number, clientY: number) => {
                      const nx = Math.max(
                        -1,
                        Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1)
                      );
                      const ny = Math.max(
                        -1,
                        Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1)
                      );
                      onUpdateManualXY((prev) => ({
                        ...prev,
                        enabled: true,
                        panNorm: Number(nx.toFixed(2)),
                        tiltNorm: Number(ny.toFixed(2)),
                      }));
                    };
                    updatePos(e.clientX, e.clientY);
                    const onMove = (ev: MouseEvent) => updatePos(ev.clientX, ev.clientY);
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  className="relative flex-1 my-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-crosshair overflow-hidden"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(251,191,36,0.14) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800" />
                  <div
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/60 pointer-events-none"
                    style={{
                      left: `${((manualXY.panNorm + 1) / 2) * 100}%`,
                      top: `${((manualXY.tiltNorm + 1) / 2) * 100}%`,
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: 'all', label: 'Todos' },
                        { id: 'beams', label: 'Beams' },
                        { id: 'washes', label: 'Washes' },
                        { id: 'spots', label: 'Spots' },
                      ] as const
                    ).map((g) => (
                      <button
                        key={g.id}
                        onClick={() =>
                          onUpdateManualXY((prev) => ({
                            ...prev,
                            enabled: true,
                            targetGroup: g.id,
                          }))
                        }
                        className={`py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          manualXY.targetGroup === g.id
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={onToggleFollowspotWhite}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                        followspotWhiteActive
                          ? 'bg-white text-slate-950 border-white'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {followspotWhiteActive ? '💡 Cañón Blanco' : 'Color Show'}
                    </button>
                    <button
                      onClick={() =>
                        onUpdateManualXY((prev) => ({
                          ...prev,
                          enabled: false,
                          panNorm: 0,
                          tiltNorm: 0,
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer"
                    >
                      Soltar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM DOCK IN TOUCH VIEW: #5 DJ CROSSFADER (A <-> B) + #3 CUSTOM RGBW & KELVIN TEMPERATURE */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-1 xl:grid-cols-2 gap-2.5 shrink-0">
            {/* DJ Crossfader A <-> B */}
            {onChangeDjCrossfader && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black uppercase tracking-wider text-amber-400">
                    🎚️ Crossfader DJ Manual (Escena A ⟷ Escena B)
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    A: {100 - djCrossfaderPos}% · B: {djCrossfaderPos}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={djLookA}
                    onChange={(e) => onChangeDjCrossfader(e.target.value, djLookB, djCrossfaderPos)}
                    className="w-36 px-2 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 truncate"
                  >
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        A: {s.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={djCrossfaderPos}
                    onChange={(e) =>
                      onChangeDjCrossfader(djLookA, djLookB, parseInt(e.target.value, 10))
                    }
                    className="flex-1 accent-amber-400 cursor-pointer h-2"
                    title="Desliza para mezclar suavemente entre Escena A y Escena B"
                  />

                  <select
                    value={djLookB}
                    onChange={(e) => onChangeDjCrossfader(djLookA, e.target.value, djCrossfaderPos)}
                    className="w-36 px-2 py-1 rounded-lg bg-slate-900 border border-pink-500/40 text-[11px] font-bold text-pink-300 truncate"
                  >
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        B: {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Free RGBW Color Picker + White Kelvin Temperature (2700K - 8000K) */}
            {customRgbwOverride && onUpdateCustomRgbwOverride && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black uppercase tracking-wider text-pink-400">
                    🎨 Selector Libre RGBW + Blanco Kelvin ({customRgbwOverride.kelvin}K)
                  </span>
                  <button
                    onClick={() =>
                      onUpdateCustomRgbwOverride((prev) => ({
                        ...prev,
                        enabled: !prev.enabled,
                      }))
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      customRgbwOverride.enabled
                        ? 'bg-pink-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {customRgbwOverride.enabled ? 'OVERRIDE ACTIVO' : 'USAR COLOR ESCENA'}
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={`#${customRgbwOverride.r.toString(16).padStart(2, '0')}${customRgbwOverride.g
                      .toString(16)
                      .padStart(2, '0')}${customRgbwOverride.b.toString(16).padStart(2, '0')}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      const r = parseInt(hex.slice(0, 2), 16) || 0;
                      const g = parseInt(hex.slice(2, 4), 16) || 0;
                      const b = parseInt(hex.slice(4, 6), 16) || 0;
                      onUpdateCustomRgbwOverride((prev) => ({
                        ...prev,
                        enabled: true,
                        r,
                        g,
                        b,
                      }));
                    }}
                    className="w-8 h-7 rounded cursor-pointer bg-transparent border border-slate-700 shrink-0"
                    title="Elige cualquier color RGB libre"
                  />

                  <div className="flex-1 flex items-center gap-1.5 text-[10px]">
                    <span className="text-amber-200 font-bold shrink-0">2700K</span>
                    <input
                      type="range"
                      min={2700}
                      max={8000}
                      step={100}
                      value={customRgbwOverride.kelvin}
                      onChange={(e) => {
                        const k = parseInt(e.target.value, 10);
                        // Map Kelvin (2700K warm tungsteno -> 5600K pure -> 8000K cool ice)
                        const norm = (k - 2700) / (8000 - 2700);
                        const r = norm < 0.5 ? 255 : Math.round(255 - (norm - 0.5) * 110);
                        const g = norm < 0.5 ? Math.round(180 + norm * 150) : Math.round(255 - (norm - 0.5) * 30);
                        const b = norm < 0.5 ? Math.round(90 + norm * 330) : 255;
                        const w = Math.round(180 + (1 - Math.abs(norm - 0.5) * 2) * 75);
                        onUpdateCustomRgbwOverride((prev) => ({
                          ...prev,
                          enabled: true,
                          kelvin: k,
                          r,
                          g,
                          b,
                          w,
                        }));
                      }}
                      className="flex-1 accent-amber-300 cursor-pointer"
                      title="Temperatura de Blanco: 2700K (Tungsteno Cálido) a 8000K (Blanco Hielo)"
                    />
                    <span className="text-sky-300 font-bold shrink-0">8000K</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] w-28 shrink-0">
                    <span className="text-slate-400 font-bold">W:</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={customRgbwOverride.w}
                      onChange={(e) =>
                        onUpdateCustomRgbwOverride((prev) => ({
                          ...prev,
                          enabled: true,
                          w: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-white cursor-pointer"
                      title="Canal Blanco Puro (W) para Washes y Barras RGBW"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT INSPECTOR DRAWER WHEN EDITING A FADER OR BUTTON */}
        {editMode && (selectedFaderObj || selectedButtonObj) && (
          <div className="w-80 shrink-0 bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            {selectedFaderObj && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-amber-400">
                    ⚙️ Configurar Fader
                  </span>
                  <button
                    onClick={() => setSelectedWidget(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Nombre del Fader
                  </label>
                  <input
                    type="text"
                    value={selectedFaderObj.label}
                    onChange={(e) =>
                      updateCurrentPage((p) => ({
                        ...p,
                        faders: p.faders.map((f) =>
                          f.id === selectedFaderObj.id ? { ...f, label: e.target.value } : f
                        ),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    ¿Qué función controla este Fader?
                  </label>
                  <select
                    value={selectedFaderObj.targetType}
                    onChange={(e) => {
                      const nextType = e.target.value as CustomFaderTargetType;
                      const defaultId =
                        nextType === 'group_dimmer'
                          ? 'beams'
                          : nextType === 'scene_level'
                            ? scenes[0]?.id || 'sc_all_on'
                            : nextType === 'console_param'
                              ? 'move_speed'
                              : '1:1';
                      updateCurrentPage((p) => ({
                        ...p,
                        faders: p.faders.map((f) =>
                          f.id === selectedFaderObj.id
                            ? { ...f, targetType: nextType, targetId: defaultId }
                            : f
                        ),
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-300 font-bold"
                  >
                    <option value="scene_level">🎬 Nivel / Tamaño de Escena o Efecto</option>
                    <option value="group_dimmer">💡 Dimmer Maestro de Grupo</option>
                    <option value="console_param">⚙️ Velocidad / Tamaño / Fan / Fade / BPM</option>
                    <option value="dmx_channel">🔌 Canal DMX Directo (1..512)</option>
                  </select>
                </div>

                {selectedFaderObj.targetType === 'scene_level' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Escena o Efecto
                    </label>
                    <select
                      value={selectedFaderObj.targetId}
                      onChange={(e) => {
                        const sc = scenes.find((s) => s.id === e.target.value);
                        updateCurrentPage((p) => ({
                          ...p,
                          faders: p.faders.map((f) =>
                            f.id === selectedFaderObj.id
                              ? {
                                  ...f,
                                  targetId: e.target.value,
                                  label: sc ? sc.name.slice(0, 18) : f.label,
                                  colorHex: sc?.colorHex || f.colorHex,
                                }
                              : f
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {scenes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedFaderObj.targetType === 'group_dimmer' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Grupo de Focos
                    </label>
                    <select
                      value={selectedFaderObj.targetId}
                      onChange={(e) =>
                        updateCurrentPage((p) => ({
                          ...p,
                          faders: p.faders.map((f) =>
                            f.id === selectedFaderObj.id ? { ...f, targetId: e.target.value } : f
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="beams">Grupo 1 · Moving Beams</option>
                      <option value="washes">Grupo 2 · Moving Washes</option>
                      <option value="spots">Grupo 3 · Moving Spots / Gobos</option>
                      <option value="blinders">Grupo 4 · Cegadoras (Blinders)</option>
                      <option value="strobes">Grupo 5 · Strobos Flash</option>
                      <option value="bars">Grupo 6 · Barras de LED</option>
                    </select>
                  </div>
                )}

                {selectedFaderObj.targetType === 'console_param' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Parámetro Maestro
                    </label>
                    <select
                      value={selectedFaderObj.targetId}
                      onChange={(e) =>
                        updateCurrentPage((p) => ({
                          ...p,
                          faders: p.faders.map((f) =>
                            f.id === selectedFaderObj.id ? { ...f, targetId: e.target.value } : f
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="global_master">Grand Master General (0-100%)</option>
                      <option value="move_speed">Velocidad Movimiento Pan/Tilt</option>
                      <option value="chase_speed">Velocidad Chasers / Dimmer</option>
                      <option value="fx_size">Tamaño Global de Efectos (Size)</option>
                      <option value="fan_spread">Abanico Simétrico &lt;&gt; (-100% a +100%)</option>
                      <option value="crossfade_sec">Tiempo de Crossfade / Inercia (0-5s)</option>
                      <option value="bpm">Tempo Musical (60-180 BPM)</option>
                    </select>
                  </div>
                )}

                {selectedFaderObj.targetType === 'dmx_channel' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Universo (1-4)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={parseInt(selectedFaderObj.targetId.split(':')[0] || '1', 10)}
                        onChange={(e) => {
                          const ch = selectedFaderObj.targetId.split(':')[1] || '1';
                          updateCurrentPage((p) => ({
                            ...p,
                            faders: p.faders.map((f) =>
                              f.id === selectedFaderObj.id
                                ? { ...f, targetId: `${e.target.value}:${ch}` }
                                : f
                            ),
                          }));
                        }}
                        className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Canal DMX (1-512)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={512}
                        value={parseInt(selectedFaderObj.targetId.split(':')[1] || '1', 10)}
                        onChange={(e) => {
                          const u = selectedFaderObj.targetId.split(':')[0] || '1';
                          updateCurrentPage((p) => ({
                            ...p,
                            faders: p.faders.map((f) =>
                              f.id === selectedFaderObj.id
                                ? { ...f, targetId: `${u}:${e.target.value}` }
                                : f
                            ),
                          }));
                        }}
                        className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Color del Fader
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SWATCH_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() =>
                          updateCurrentPage((p) => ({
                            ...p,
                            faders: p.faders.map((f) =>
                              f.id === selectedFaderObj.id ? { ...f, colorHex: hex } : f
                            ),
                          }))
                        }
                        className={`w-6 h-6 rounded-lg border cursor-pointer ${
                          selectedFaderObj.colorHex === hex
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const idx = currentPage.faders.findIndex((f) => f.id === selectedFaderObj.id);
                      if (idx > 0) {
                        updateCurrentPage((p) => {
                          const copy = [...p.faders];
                          const [item] = copy.splice(idx, 1);
                          copy.splice(idx - 1, 0, item);
                          return { ...p, faders: copy };
                        });
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Mover
                  </button>
                  <button
                    onClick={() => {
                      const idx = currentPage.faders.findIndex((f) => f.id === selectedFaderObj.id);
                      if (idx >= 0 && idx < currentPage.faders.length - 1) {
                        updateCurrentPage((p) => {
                          const copy = [...p.faders];
                          const [item] = copy.splice(idx, 1);
                          copy.splice(idx + 1, 0, item);
                          return { ...p, faders: copy };
                        });
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Mover <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      updateCurrentPage((p) => ({
                        ...p,
                        faders: p.faders.filter((f) => f.id !== selectedFaderObj.id),
                      }));
                      setSelectedWidget(null);
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                    title="Eliminar este Fader"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {selectedButtonObj && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-purple-400">
                    ⚙️ Configurar Botón Touch
                  </span>
                  <button
                    onClick={() => setSelectedWidget(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Título del Botón
                  </label>
                  <input
                    type="text"
                    value={selectedButtonObj.label}
                    onChange={(e) =>
                      updateCurrentPage((p) => ({
                        ...p,
                        buttons: p.buttons.map((b) =>
                          b.id === selectedButtonObj.id ? { ...b, label: e.target.value } : b
                        ),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Subtítulo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={selectedButtonObj.subtitle || ''}
                    onChange={(e) =>
                      updateCurrentPage((p) => ({
                        ...p,
                        buttons: p.buttons.map((b) =>
                          b.id === selectedButtonObj.id ? { ...b, subtitle: e.target.value } : b
                        ),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    ¿Qué hace este Botón Touch?
                  </label>
                  <select
                    value={selectedButtonObj.targetType}
                    onChange={(e) => {
                      const nextType = e.target.value as CustomButtonTargetType;
                      const defaultId =
                        nextType === 'scene_toggle' || nextType === 'scene_flash'
                          ? scenes[0]?.id || 'sc_all_on'
                          : nextType === 'macro_look'
                            ? snapshotCues[0]?.id || 'cue_drop'
                            : nextType === 'position_preset'
                              ? 'dj_booth'
                              : nextType === 'color_theme'
                                ? 'gold'
                                : 'buildup_drop';
                      updateCurrentPage((p) => ({
                        ...p,
                        buttons: p.buttons.map((b) =>
                          b.id === selectedButtonObj.id
                            ? { ...b, targetType: nextType, targetId: defaultId }
                            : b
                        ),
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-purple-300 font-bold"
                  >
                    <option value="scene_toggle">🎛️ Activar / Desactivar Escena o Efecto</option>
                    <option value="scene_flash">⚡ Flash Momentáneo (Mientras pulsas)</option>
                    <option value="macro_look">✨ Disparar Macro-Look Completo</option>
                    <option value="position_preset">🎯 Cambiar Posición MA2 en Vivo</option>
                    <option value="color_theme">🎨 Cambiar Tema de Color Global</option>
                    <option value="special_action">🚀 Acción Especial (Subida/Drop, Humo...)</option>
                  </select>
                </div>

                {(selectedButtonObj.targetType === 'scene_toggle' ||
                  selectedButtonObj.targetType === 'scene_flash') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Escena o Efecto
                    </label>
                    <select
                      value={selectedButtonObj.targetId}
                      onChange={(e) => {
                        const sc = scenes.find((s) => s.id === e.target.value);
                        updateCurrentPage((p) => ({
                          ...p,
                          buttons: p.buttons.map((b) =>
                            b.id === selectedButtonObj.id
                              ? {
                                  ...b,
                                  targetId: e.target.value,
                                  label: sc ? sc.name : b.label,
                                  colorHex: sc?.colorHex || b.colorHex,
                                }
                              : b
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {scenes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedButtonObj.targetType === 'macro_look' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Macro-Look
                    </label>
                    <select
                      value={selectedButtonObj.targetId}
                      onChange={(e) => {
                        const cue = snapshotCues.find((c) => c.id === e.target.value);
                        updateCurrentPage((p) => ({
                          ...p,
                          buttons: p.buttons.map((b) =>
                            b.id === selectedButtonObj.id
                              ? {
                                  ...b,
                                  targetId: e.target.value,
                                  label: cue ? cue.name : b.label,
                                  colorHex: cue?.colorHex || b.colorHex,
                                }
                              : b
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {snapshotCues.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedButtonObj.targetType === 'position_preset' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Posición MA2
                    </label>
                    <select
                      value={selectedButtonObj.targetId}
                      onChange={(e) =>
                        updateCurrentPage((p) => ({
                          ...p,
                          buttons: p.buttons.map((b) =>
                            b.id === selectedButtonObj.id ? { ...b, targetId: e.target.value } : b
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {Object.values(positionCalibrations).map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.shortLabel} — {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedButtonObj.targetType === 'color_theme' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Tema de Color Global
                    </label>
                    <select
                      value={selectedButtonObj.targetId}
                      onChange={(e) =>
                        updateCurrentPage((p) => ({
                          ...p,
                          buttons: p.buttons.map((b) =>
                            b.id === selectedButtonObj.id ? { ...b, targetId: e.target.value } : b
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {colorThemes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedButtonObj.targetType === 'special_action' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Elegir Acción Especial
                    </label>
                    <select
                      value={selectedButtonObj.targetId}
                      onChange={(e) =>
                        updateCurrentPage((p) => ({
                          ...p,
                          buttons: p.buttons.map((b) =>
                            b.id === selectedButtonObj.id ? { ...b, targetId: e.target.value } : b
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="buildup_drop">🚀 SUBIDA DJ -&gt; 💥 DROP (Riser)</option>
                      <option value="haze_blast">💨 Ráfaga Humo / Hazer 100%</option>
                      <option value="worklight">💡 Luz Sala / Cortesía Blanco Cálido</option>
                      <option value="freeze_dmx">❄️ Freeze DMX (Congelar Foto)</option>
                      <option value="stomp_pt">🛑 Stomp Pan/Tilt (Parar Movimiento)</option>
                      <option value="resync_beat">🔄 Resync Beat 1 (Clavar Compás)</option>
                      <option value="blackout">🌑 Blackout General</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Tamaño del Botón:
                  </span>
                  <div className="flex gap-1">
                    {(['normal', 'wide'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() =>
                          updateCurrentPage((p) => ({
                            ...p,
                            buttons: p.buttons.map((b) =>
                              b.id === selectedButtonObj.id ? { ...b, size: sz } : b
                            ),
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          (selectedButtonObj.size || 'normal') === sz
                            ? 'bg-purple-500 text-slate-950 border-white'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {sz === 'wide' ? 'Doble Ancho' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Color del Botón
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SWATCH_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() =>
                          updateCurrentPage((p) => ({
                            ...p,
                            buttons: p.buttons.map((b) =>
                              b.id === selectedButtonObj.id ? { ...b, colorHex: hex } : b
                            ),
                          }))
                        }
                        className={`w-6 h-6 rounded-lg border cursor-pointer ${
                          selectedButtonObj.colorHex === hex
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const idx = currentPage.buttons.findIndex(
                        (b) => b.id === selectedButtonObj.id
                      );
                      if (idx > 0) {
                        updateCurrentPage((p) => {
                          const copy = [...p.buttons];
                          const [item] = copy.splice(idx, 1);
                          copy.splice(idx - 1, 0, item);
                          return { ...p, buttons: copy };
                        });
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Mover
                  </button>
                  <button
                    onClick={() => {
                      const idx = currentPage.buttons.findIndex(
                        (b) => b.id === selectedButtonObj.id
                      );
                      if (idx >= 0 && idx < currentPage.buttons.length - 1) {
                        updateCurrentPage((p) => {
                          const copy = [...p.buttons];
                          const [item] = copy.splice(idx, 1);
                          copy.splice(idx + 1, 0, item);
                          return { ...p, buttons: copy };
                        });
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Mover <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      updateCurrentPage((p) => ({
                        ...p,
                        buttons: p.buttons.filter((b) => b.id !== selectedButtonObj.id),
                      }));
                      setSelectedWidget(null);
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                    title="Eliminar este Botón Touch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
