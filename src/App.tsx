import React, { useEffect, useRef, useState } from 'react';
import {
  Zap,
  RefreshCw,
  Download,
  Upload,
  Save,
  Radio,
  Music,
  Sliders,
  PowerOff,
  Edit3,
  Plus,
  Crosshair,
  Sparkles,
  Play,
  BookmarkPlus,
  ExternalLink,
  Smartphone,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  Timer,
  PauseOctagon,
  RotateCcw,
  Keyboard,
  MoveHorizontal,
  Wrench,
  Wind,
  SkipForward,
  SkipBack,
  Clock,
  Pause,
  ChevronDown,
  FolderOpen,
  Lock,
  Unlock,
  Lightbulb,
  Snowflake,
  Settings,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  DEFAULT_AUTO_SHOW_STEPS,
  DEFAULT_BANKS,
  DEFAULT_CLOCK_SCHEDULE,
  DEFAULT_GROUP_CALIBRATIONS,
  DEFAULT_GROUP_PROGRAMMERS,
  DEFAULT_POSITION_CALIBRATIONS,
  DEFAULT_RECIPE_SCENES,
  DEFAULT_SNAPSHOT_CUES,
  DEFAULT_TOUCH_PAGES,
  FIXTURE_PROFILES,
  RIG_PRESETS,
  DEFAULT_RIG_PRESET,
} from './constants/defaultShowData';
import { evaluateDmxEngine } from './engine/dmxEngine';
import { compileRecipesToDaslight5Dvc } from './engine/daslightDvcCompiler';
import { StageVisualizer } from './components/StageVisualizer';
import { RecipeInspectorPanel } from './components/RecipeInspectorPanel';
import { GroupPresetPoolPanel } from './components/GroupPresetPoolPanel';
import { CloneRigModal } from './components/CloneRigModal';
import { StageCalibrationModal } from './components/StageCalibrationModal';
import { FixtureBuilderModal } from './components/FixtureBuilderModal';
import {
  AutoShowSequencerModal,
  formatDurationMinSec,
} from './components/AutoShowSequencerModal';
import { DmxChannelTesterModal } from './components/DmxChannelTesterModal';
import { CustomTouchFaderWingView } from './components/CustomTouchFaderWingView';
import { SpecialFxDeckView } from './components/SpecialFxDeckView';
import { ChannelFinderModal } from './components/ChannelFinderModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { BottomFaderDock } from './components/BottomFaderDock';
import { SongTimelineModal, type SongTimelineData } from './components/SongTimelineModal';
import {
  StageRemoteView,
  type LanIpEntry,
  type RemoteCommandPayload,
} from './components/StageRemoteView';
import type {
  AutoShowStep,
  ClockScheduleEvent,
  ColorPaletteId,
  ComputedFixtureFrame,
  ControlBinding,
  CustomRgbwOverride,
  CustomTouchPage,
  FixtureProfile,
  GrandDasShowFile,
  GroupCalibration,
  GroupId,
  GroupProgrammerState,
  ManualXYOverride,
  PatchedFixture,
  PositionPaletteCalibration,
  PositionPaletteId,
  RecipeScene,
  RigPresetTemplate,
  SceneBank,
  ShowSnapshotCue,
  SpecialFxDeckState,
  SpecialFxMachineType,
  SpecialFxWavePattern,
} from './types/dmx';

const SYNC_CHANNEL_NAME = 'granddas_live_sync_v1';
const AUTOSAVE_STORAGE_KEY = 'granddas_autosave_show_v2';

/**
 * La velocidad de movimiento P/T 1.0 ya es la velocidad 'normal suave' (el motor aplica x0.25 internamente).
 * Los pasos del Auto-Show nunca bajan de la mitad de la normal para que no parezcan parados.
 */
const clampStepMoveSpeed = (s: number | undefined): number =>
  Math.max(0.5, Math.min(4, typeof s === 'number' && s > 0 ? s : 1));

/** Identifies a rig by its patch (model + universe + address of every fixture), not just by fixture count */
const rigSignature = (list: PatchedFixture[]): string =>
  list.map((f) => `${f.profileId}@${f.universe}.${f.address}`).join('|');

const GLOBAL_COLOR_THEMES: Array<{
  id: string;
  label: string;
  primary: Exclude<ColorPaletteId, 'transparent'>;
  secondary: Exclude<ColorPaletteId, 'transparent'>;
  hexA: string;
  hexB: string;
}> = [
  { id: 'fire', label: '🔥 Fuego', primary: 'red', secondary: 'amber', hexA: '#ef4444', hexB: '#f59e0b' },
  { id: 'cyber', label: '⚡ Cyberpunk', primary: 'cyan', secondary: 'magenta', hexA: '#06b6d4', hexB: '#d946ef' },
  { id: 'gold', label: '👑 Boda Oro', primary: 'amber', secondary: 'warm_white', hexA: '#f59e0b', hexB: '#fde68a' },
  { id: 'ice', label: '❄️ Hielo', primary: 'blue', secondary: 'white', hexA: '#3b82f6', hexB: '#ffffff' },
  { id: 'emerald', label: '🌿 Esmeralda', primary: 'green', secondary: 'cyan', hexA: '#10b981', hexB: '#06b6d4' },
  { id: 'uv', label: '💜 UV / Rosa', primary: 'uv', secondary: 'magenta', hexA: '#8b5cf6', hexB: '#ec4899' },
  { id: 'white', label: '🤍 Blanco Puro', primary: 'white', secondary: 'warm_white', hexA: '#ffffff', hexB: '#fde68a' },
];

const TEMP_COLOR_BUMPS: Array<{
  palette: Exclude<ColorPaletteId, 'transparent'>;
  label: string;
  hotkey: string;
  code: string;
  hex: string;
}> = [
  { palette: 'white', label: 'BLANCO', hotkey: 'Q', code: 'KeyQ', hex: '#ffffff' },
  { palette: 'red', label: 'ROJO', hotkey: 'W', code: 'KeyW', hex: '#ef4444' },
  { palette: 'amber', label: 'ÁMBAR', hotkey: 'E', code: 'KeyE', hex: '#f59e0b' },
  { palette: 'cyan', label: 'HIELO/UV', hotkey: 'R', code: 'KeyR', hex: '#06b6d4' },
];

export function App() {
  // Detect if this window is the popped-out 3D Visualizer or Mobile Stage Remote
  const windowMode = React.useMemo<'console' | 'visualizer' | 'remote'>(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('window');
    if (w === 'visualizer') return 'visualizer';
    if (w === 'remote' || params.get('remote') === '1') return 'remote';
    return 'console';
  }, []);

  // 1. Patched Rig & Profiles State
  const [profiles, setProfiles] = useState<FixtureProfile[]>(FIXTURE_PROFILES);
  const [fixtures, setFixtures] = useState<PatchedFixture[]>(DEFAULT_RIG_PRESET.fixtures);
  const [groupCalibrations, setGroupCalibrations] = useState<Record<GroupId, GroupCalibration>>(
    DEFAULT_GROUP_CALIBRATIONS
  );
  const [groupProgrammers, setGroupProgrammers] = useState<Record<GroupId, GroupProgrammerState>>(
    DEFAULT_GROUP_PROGRAMMERS
  );

  // Clean Executor UI state: Right Drawer (MA2 Preset Pool / Recipe Inspector) & optional Mini-Preview
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(false);
  const [rightPanelMode, setRightPanelMode] = useState<'preset_pool' | 'recipe_editor'>(
    'preset_pool'
  );
  const [showInlineMiniVisualizer, setShowInlineMiniVisualizer] = useState<boolean>(false);

  // 2. Banks, Recipe Scenes & Macro Snapshot Cues
  const [banks] = useState<SceneBank[]>(DEFAULT_BANKS);
  const [scenes, setScenes] = useState<RecipeScene[]>(DEFAULT_RECIPE_SCENES);
  const [snapshotCues, setSnapshotCues] = useState<ShowSnapshotCue[]>(DEFAULT_SNAPSHOT_CUES);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);

  // Default active scenes on boot: Full Rig On + Cyan/Magenta + Sky Fan + Symmetric Circle
  const [activeSceneIds, setActiveSceneIds] = useState<string[]>([
    'sc_all_on',
    'col_cyan_magenta',
    'pos_sky_fan',
    'fx_sym_circle',
  ]);
  const [selectedSceneIdForEdit, setSelectedSceneIdForEdit] = useState<string>('fx_sym_circle');

  // 3. Global Console Masters, Smooth Crossfade, Speed Masters, Fanning, Temp Bumps & Overrides
  const [bpm, setBpm] = useState<number>(128);
  const [globalMaster, setGlobalMaster] = useState<number>(1);
  const [globalFxSize, setGlobalFxSize] = useState<number>(1);
  const [moveFxSpeed, setMoveFxSpeed] = useState<number>(1); // Independent Pan/Tilt Speed Master
  const [chaseFxSpeed, setChaseFxSpeed] = useState<number>(1); // Independent Dimmer/Color Speed Master
  const [globalFanSpread, setGlobalFanSpread] = useState<number>(0); // -1.0 (Cross X) .. 0 .. +1.0 (Wide Fan)
  const [crossfadeSec, setCrossfadeSec] = useState<number>(0.8); // Smooth Crossfade & Motor Inertia (0s..5s)
  const [tempColorBump, setTempColorBump] = useState<Exclude<ColorPaletteId, 'transparent'> | null>(
    null
  );
  const [stompMovement, setStompMovement] = useState<boolean>(false);
  const [globalBlackout, setGlobalBlackout] = useState<boolean>(false);
  const [autopilotBeats, setAutopilotBeats] = useState<0 | 8 | 16>(0);
  const [highlightFixtureId, setHighlightFixtureId] = useState<string | null>(null);
  const [manualXY, setManualXY] = useState<ManualXYOverride>({
    enabled: false,
    targetGroup: 'all',
    panNorm: 0,
    tiltNorm: 0,
  });

  // 4. MIDI / Key Learn State
  const [learnModeActive, setLearnModeActive] = useState<boolean>(false);
  const [learningTarget, setLearningTarget] = useState<{
    targetType: 'scene' | 'macro';
    targetId: string;
    label: string;
  } | null>(null);
  const [controlBindings, setControlBindings] = useState<Record<string, ControlBinding>>({});

  // 5. Modals, Top Dropdown Menu, Freeze, Worklight, Console Lock & Art-Net Bridge State
  const [openTopMenu, setOpenTopMenu] = useState<'file' | 'patch' | 'tools' | 'windows' | null>(
    null
  );
  const [freezeDmx, setFreezeDmx] = useState<boolean>(false);
  const [worklightActive, setWorklightActive] = useState<boolean>(false);
  const [consoleLocked, setConsoleLocked] = useState<boolean>(false);
  const [activeColorThemeId, setActiveColorThemeId] = useState<string>('auto');
  const [followspotOpen, setFollowspotOpen] = useState<boolean>(false);
  const [followspotWhiteActive, setFollowspotWhiteActive] = useState<boolean>(true);
  const [buildUpActive, setBuildUpActive] = useState<boolean>(false);
  const [buildUpProgress, setBuildUpProgress] = useState<number>(0);
  const [dropImpactActive, setDropImpactActive] = useState<boolean>(false);
  const [hahanSplitterMode, setHahanSplitterMode] = useState<boolean>(true);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [mainWorkspaceView, setMainWorkspaceView] = useState<
    'executors' | 'touch_wing' | 'sfx_deck'
  >(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('window') === 'touch') return 'touch_wing';
    if (params.get('window') === 'sfx') return 'sfx_deck';
    return 'executors';
  });
  const [touchPages, setTouchPages] = useState<CustomTouchPage[]>(DEFAULT_TOUCH_PAGES);
  const [sceneSubmasterLevels, setSceneSubmasterLevels] = useState<Record<string, number>>({});
  const [customRgbwOverride, setCustomRgbwOverride] = useState<CustomRgbwOverride>({
    enabled: false,
    r: 255,
    g: 195,
    b: 120,
    w: 200,
    kelvin: 3200,
    hex: '#ffc378',
  });
  const [djLookA, setDjLookA] = useState<string>('fx_sym_circle');
  const [djLookB, setDjLookB] = useState<string>('fx_ballyhoo');
  const [djCrossfaderPos, setDjCrossfaderPos] = useState<number>(0);
  const [activeTopTab, setActiveTopTab] = useState<'looks' | 'colors' | 'positions' | 'optics'>(
    'looks'
  );
  const [zenCleanMode, setZenCleanMode] = useState<boolean>(false);
  const [showBottomFaderDock, setShowBottomFaderDock] = useState<boolean>(true);
  const [globalOptics, setGlobalOptics] = useState<{
    goboSlot: number | 'auto';
    prismActive: boolean | 'auto';
    zoomValue: number | 'auto';
  }>({
    goboSlot: 'auto',
    prismActive: 'auto',
    zoomValue: 'auto',
  });
  const [sfxState, setSfxState] = useState<SpecialFxDeckState>({
    armed: false,
    sparkularPreheat: false,
    startDmxChannel: 490,
    sparkularPattern: 'off',
    sparkularMasterHeight: 85,
    sparkularManualUnits: [0, 0, 0, 0],
    co2Pattern: 'off',
    co2ManualUnits: [false, false, false, false],
    flamePattern: 'off',
    flameManualUnits: [false, false, false, false],
    confettiPattern: 'off',
    confettiManualUnits: [0, 0],
    sfxSpeedHz: 1.5,
    sfxPwmDuty: 0.45,
    sfxPhaseSpread: 360,
  });
  const [liveSfxLevels, setLiveSfxLevels] = useState<{
    sparkular: [number, number, number, number];
    co2: [number, number, number, number];
    flame: [number, number, number, number];
    confetti: [number, number];
  }>({
    sparkular: [0, 0, 0, 0],
    co2: [0, 0, 0, 0],
    flame: [0, 0, 0, 0],
    confetti: [0, 0],
  });
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [isFixtureBuilderOpen, setIsFixtureBuilderOpen] = useState<boolean>(false);
  const [isAutoShowModalOpen, setIsAutoShowModalOpen] = useState<boolean>(false);
  const [isDmxTesterOpen, setIsDmxTesterOpen] = useState<boolean>(false);
  const [isChannelFinderOpen, setIsChannelFinderOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isSongTimelineOpen, setIsSongTimelineOpen] = useState<boolean>(false);
  const [customRigs, setCustomRigs] = useState<RigPresetTemplate[]>([]);
  const [songTimeline, setSongTimeline] = useState<SongTimelineData>({
    songName: '',
    markers: [],
  });
  const [isolateDmxUniverse, setIsolateDmxUniverse] = useState<number | null>(null);
  const [isMobileRemoteModalOpen, setIsMobileRemoteModalOpen] = useState<boolean>(false);
  const [lanIps, setLanIps] = useState<LanIpEntry[]>([]);
  const [kioskSafeMode, setKioskSafeMode] = useState<boolean>(false);
  const [kioskUnlockModalOpen, setKioskUnlockModalOpen] = useState<boolean>(false);
  const [kioskPinInput, setKioskPinInput] = useState<string>('');
  const [calibratingGroupId, setCalibratingGroupId] = useState<GroupId | null>(null);

  // MA2 Position Presets Override + Venue Calibration + Manual 512 DMX Tester Overrides
  const [globalPositionOverride, setGlobalPositionOverride] =
    useState<PositionPaletteId>('transparent');
  const [positionCalibrations, setPositionCalibrations] = useState<
    Record<Exclude<PositionPaletteId, 'transparent'>, PositionPaletteCalibration>
  >(DEFAULT_POSITION_CALIBRATIONS);
  const [isCalibratingPosPreset, setIsCalibratingPosPreset] = useState<boolean>(false);
  const [manualDmxOverrides, setManualDmxOverrides] = useState<Record<string, number>>({});

  // Auto-Show Multi-Hour Playlist + 24h Real-Time Clock Schedule State
  const [autoShowSteps, setAutoShowSteps] = useState<AutoShowStep[]>(DEFAULT_AUTO_SHOW_STEPS);
  const [autoShowRunning, setAutoShowRunning] = useState<boolean>(false);
  const [autoShowStepIndex, setAutoShowStepIndex] = useState<number>(0);
  const [autoShowElapsedSec, setAutoShowElapsedSec] = useState<number>(0);
  const [autoShowLoop, setAutoShowLoop] = useState<boolean>(true);
  const [autoShowShuffle, setAutoShowShuffle] = useState<boolean>(false);
  const [clockSchedule, setClockSchedule] = useState<ClockScheduleEvent[]>(DEFAULT_CLOCK_SCHEDULE);
  const lastTriggeredClockKeyRef = useRef<string>('');
  const [hazeBlastActive, setHazeBlastActive] = useState<boolean>(false);
  const [autoHazeEnabled, setAutoHazeEnabled] = useState<boolean>(false);
  const [hazeDmxChannel] = useState<number>(510); // Universe 1 CH 510 (Pump) & CH 511 (Fan)
  const [artnetIp, setArtnetIp] = useState<string>('2.0.0.44');
  const [artnetUseBroadcast, setArtnetUseBroadcast] = useState<boolean>(false);
  const [artnetUniOffset, setArtnetUniOffset] = useState<0 | 1>(0);
  const [artnetConnected, setArtnetConnected] = useState<boolean>(false);
  const [artnetPackets, setArtnetPackets] = useState<number>(0);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);

  // 6. Real-time DMX evaluation output + Previous Frame Ref for Smooth Crossfade / Inertia
  const [fixtureFrames, setFixtureFrames] = useState<Record<string, ComputedFixtureFrame>>({});
  const prevFramesRef = useRef<Record<string, ComputedFixtureFrame>>({});
  const lastFrameTimeMsRef = useRef<number>(performance.now());
  const [universes, setUniverses] = useState<Record<number, number[]>>({
    1: new Array(512).fill(0),
    2: new Array(512).fill(0),
    3: new Array(512).fill(0),
    4: new Array(512).fill(0),
  });

  // Multi-Window BroadcastChannel ref
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const lastBroadcastReceivedRef = useRef<number>(0);

  // Tap Tempo & Phase Resync history
  const tapTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(performance.now());
  const lastArtnetPostRef = useRef<number>(0);
  const lastUiCommitRef = useRef<number>(0);

  // Audio-to-Light Real FFT Spectrum (Bass / Mid / High) + Kick Beat Trigger + Auto-Drop Mode
  const [audioListening, setAudioListening] = useState<boolean>(false);
  const [audioDemoSim, setAudioDemoSim] = useState<boolean>(false);
  const [audioAutoDrop, setAudioAutoDrop] = useState<boolean>(true);
  const [audioBands, setAudioBands] = useState<{
    bass: number;
    mid: number;
    high: number;
    kickFlash: boolean;
  }>({ bass: 0, mid: 0, high: 0, kickFlash: false });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleUpdateSingleFixture = React.useCallback(
    (fixtureId: string, patch: Partial<PatchedFixture>) => {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, ...patch } : f))
      );
    },
    []
  );

  const currentRigSignature = React.useMemo(() => rigSignature(fixtures), [fixtures]);

  // Setup BroadcastChannel for instant 2nd-Screen 3D Visualizer & Mobile Remote synchronization
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
    syncChannelRef.current = ch;

    ch.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;

      if (windowMode !== 'console' && msg.type === 'STATE_FRAME') {
        lastBroadcastReceivedRef.current = performance.now();
        setFixtures(msg.fixtures);
        setProfiles(msg.profiles);
        setGroupCalibrations(msg.groupCalibrations);
        setFixtureFrames(msg.fixtureFrames);
        setUniverses(msg.universes);
        setManualXY(msg.manualXY);
        setHighlightFixtureId(msg.highlightFixtureId);
        setSnapshotCues(msg.snapshotCues);
        setActiveSnapshotId(msg.activeSnapshotId);
        setGlobalBlackout(msg.globalBlackout);
        if (msg.liveSfxLevels) setLiveSfxLevels(msg.liveSfxLevels);
      } else if (windowMode === 'console') {
        if (msg.type === 'ACTION_MANUAL_XY') {
          setManualXY(msg.manualXY);
        } else if (msg.type === 'ACTION_CALIBRATE') {
          setGroupCalibrations((prev) => ({
            ...prev,
            [msg.groupId]: { ...prev[msg.groupId as GroupId], ...msg.patch },
          }));
        } else if (msg.type === 'ACTION_HIGHLIGHT') {
          setHighlightFixtureId(msg.fixtureId);
        } else if (msg.type === 'ACTION_UPDATE_FIXTURE') {
          handleUpdateSingleFixture(msg.fixtureId, msg.patch);
        } else if (msg.type === 'ACTION_MACRO') {
          setActiveSnapshotId(msg.cue.id);
          setActiveSceneIds(msg.cue.sceneIds);
        } else if (msg.type === 'ACTION_BLACKOUT') {
          setGlobalBlackout((b) => !b);
        }
      }
    };

    return () => {
      ch.close();
      syncChannelRef.current = null;
    };
  }, [windowMode, handleUpdateSingleFixture]);

  // Check local Art-Net bridge status. Re-checks every 2.5 s so the console
  // reconnects by itself if the engine starts late or is restarted, and the Hahan LED stays green.
  useEffect(() => {
    const check = () =>
      fetch('/api/status')
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setArtnetConnected(true);
            if (data.artnet?.targetIp) setArtnetIp(data.artnet.targetIp);
            if (typeof data.artnet?.packetsSent === 'number') {
              setArtnetPackets(data.artnet.packetsSent);
            }
            if (Array.isArray(data.lanIps)) setLanIps(data.lanIps);
          }
        })
        .catch(() => setArtnetConnected(false));
    check();
    const id = window.setInterval(check, 2500);
    return () => window.clearInterval(id);
  }, [windowMode]);

  const handleExecuteRemoteCommand = (cmd: RemoteCommandPayload) => {
    switch (cmd.type) {
      case 'macro_look': {
        const cue = snapshotCues.find((c) => c.id === cmd.value);
        if (cue) {
          setActiveSnapshotId(cue.id);
          setActiveSceneIds(cue.sceneIds);
          setWorklightActive(false);
          setGlobalBlackout(false);
          setAutoShowRunning(false);
        }
        break;
      }
      case 'color': {
        setTempColorBump(cmd.value ?? null);
        break;
      }
      case 'position': {
        if (cmd.value) setGlobalPositionOverride(cmd.value);
        break;
      }
      case 'worklight': {
        const nextWl = Boolean(cmd.value);
        setWorklightActive(nextWl);
        if (nextWl) {
          setGlobalBlackout(false);
          setAutoShowRunning(false);
        }
        break;
      }
      case 'blackout': {
        const nextBo = Boolean(cmd.value);
        setGlobalBlackout(nextBo);
        if (nextBo) {
          setWorklightActive(false);
          setAutoShowRunning(false);
        }
        break;
      }
      case 'auto_show': {
        const nextAuto = Boolean(cmd.value);
        setAutoShowRunning(nextAuto);
        if (nextAuto) {
          setWorklightActive(false);
          setGlobalBlackout(false);
          if (autoShowSteps.length > 0) {
            const safeIdx = autoShowStepIndex < autoShowSteps.length ? autoShowStepIndex : 0;
            handleJumpToAutoShowStep(safeIdx);
          }
        }
        break;
      }
      case 'grand_master': {
        if (typeof cmd.value === 'number') setGlobalMaster(cmd.value);
        break;
      }
      case 'blinder': {
        setDropImpactActive(Boolean(cmd.value));
        break;
      }
      case 'freeze': {
        setFreezeDmx(Boolean(cmd.value));
        break;
      }
      case 'haze': {
        setHazeBlastActive(Boolean(cmd.value));
        break;
      }
      case 'group_dimmer': {
        if (cmd.groupId && typeof cmd.value === 'number') {
          setGroupCalibrations((prev) => ({
            ...prev,
            [cmd.groupId!]: { ...prev[cmd.groupId!], masterDimmer: cmd.value },
          }));
        }
        break;
      }
      case 'group_mute': {
        if (cmd.groupId) {
          setGroupCalibrations((prev) => ({
            ...prev,
            [cmd.groupId!]: { ...prev[cmd.groupId!], blackout: Boolean(cmd.value) },
          }));
        }
        break;
      }
      case 'group_solo': {
        if (cmd.groupId) {
          setGroupCalibrations((prev) => ({
            ...prev,
            [cmd.groupId!]: { ...prev[cmd.groupId!], soloActive: Boolean(cmd.value) },
          }));
        }
        break;
      }
      case 'group_flash': {
        if (cmd.groupId) {
          setGroupCalibrations((prev) => ({
            ...prev,
            [cmd.groupId!]: { ...prev[cmd.groupId!], flashActive: Boolean(cmd.value) },
          }));
        }
        break;
      }
      case 'calibrate_group': {
        if (cmd.groupId && cmd.field && typeof cmd.delta === 'number') {
          setGroupCalibrations((prev) => {
            const cur = prev[cmd.groupId!];
            if (!cur) return prev;
            const nextVal = Math.max(0, Math.min(255, (cur[cmd.field!] || 0) + cmd.delta!));
            return {
              ...prev,
              [cmd.groupId!]: { ...cur, [cmd.field!]: nextVal },
            };
          });
        }
        break;
      }
      case 'highlight_fixture': {
        setHighlightFixtureId(cmd.fixtureId ?? null);
        break;
      }
    }
  };
  const executeRemoteCommandRef = useRef(handleExecuteRemoteCommand);
  executeRemoteCommandRef.current = handleExecuteRemoteCommand;

  // Applies a saved show object (from localStorage, disk autosave or a backup) to the console state,
  // upgrading older formats on the fly (missing profiles / groups / scenes).
  const applySavedShowPayload = (saved: any) => {
    if (!saved || typeof saved !== 'object') return;
    if (Array.isArray(saved.profiles) && saved.profiles.length > 0) {
      const existingIds = new Set(saved.profiles.map((p: FixtureProfile) => p.id));
      const missingDefaults = FIXTURE_PROFILES.filter((p) => !existingIds.has(p.id));
      setProfiles([...saved.profiles, ...missingDefaults]);
    }
    if (Array.isArray(saved.fixtures) && saved.fixtures.length > 0) {
      const hasSpots = saved.fixtures.some((f: PatchedFixture) => f.groupId === 'spots');
      const hasBlinders = saved.fixtures.some((f: PatchedFixture) => f.groupId === 'blinders');
      if (!saved.schemaVersion && !hasSpots && !hasBlinders && saved.fixtures.length > 12) {
        const defaultSpotsAndBlinders = DEFAULT_RIG_PRESET.fixtures.filter(
          (f) => f.groupId === 'spots' || f.groupId === 'blinders'
        );
        setFixtures([...saved.fixtures, ...defaultSpotsAndBlinders]);
      } else {
        setFixtures(saved.fixtures);
      }
    }
    if (saved.groupCalibrations) {
      const mergedCals = { ...DEFAULT_GROUP_CALIBRATIONS };
      (Object.keys(DEFAULT_GROUP_CALIBRATIONS) as GroupId[]).forEach((gId) => {
        if (saved.groupCalibrations[gId]) {
          mergedCals[gId] = {
            ...DEFAULT_GROUP_CALIBRATIONS[gId],
            ...saved.groupCalibrations[gId],
          };
        }
      });
      setGroupCalibrations(mergedCals);
    }
    if (saved.positionCalibrations) setPositionCalibrations(saved.positionCalibrations);
    if (Array.isArray(saved.scenes) && saved.scenes.length > 0) {
      const defaultMap = new Map(DEFAULT_RECIPE_SCENES.map((s) => [s.id, s]));
      const upgradedSavedScenes = saved.scenes.map((s: RecipeScene) => {
        const def = defaultMap.get(s.id);
        if (def && Array.isArray(s.targetGroups)) {
          const mergedTargets = Array.from(new Set([...s.targetGroups, ...def.targetGroups]));
          return { ...s, targetGroups: mergedTargets };
        }
        return s;
      });
      const existingSceneIds = new Set(upgradedSavedScenes.map((s: RecipeScene) => s.id));
      const missingScenes = DEFAULT_RECIPE_SCENES.filter((s) => !existingSceneIds.has(s.id));
      setScenes([...upgradedSavedScenes, ...missingScenes]);
    }
    if (Array.isArray(saved.snapshotCues) && saved.snapshotCues.length > 0) {
      const defCueMap = new Map(DEFAULT_SNAPSHOT_CUES.map((c) => [c.id, c]));
      setSnapshotCues(
        saved.snapshotCues.map((c: ShowSnapshotCue) => {
          const def = defCueMap.get(c.id);
          if (def && (c.id === 'cue_intro' || c.id === 'cue_verse' || c.id === 'cue_warm_break')) {
            return { ...c, sceneIds: def.sceneIds };
          }
          return c;
        })
      );
    }
    if (Array.isArray(saved.autoShowSteps) && saved.autoShowSteps.length > 0) {
      const defStepMap = new Map(DEFAULT_AUTO_SHOW_STEPS.map((s) => [s.id, s]));
      setAutoShowSteps(
        saved.autoShowSteps.map((s: AutoShowStep) => {
          const def = defStepMap.get(s.id);
          if (def && (s.id === 'step_auto_1' || s.id === 'step_auto_6')) {
            return { ...s, name: def.name, sceneIds: def.sceneIds };
          }
          return s;
        })
      );
    }
    if (Array.isArray(saved.clockSchedule)) setClockSchedule(saved.clockSchedule);
    if (Array.isArray(saved.touchPages) && saved.touchPages.length > 0)
      setTouchPages(saved.touchPages);
    if (saved.controlBindings) setControlBindings(saved.controlBindings);
    if (typeof saved.bpm === 'number') setBpm(saved.bpm);
    if (typeof saved.hahanSplitterMode === 'boolean')
      setHahanSplitterMode(saved.hahanSplitterMode);
    if (Array.isArray(saved.customRigs)) setCustomRigs(saved.customRigs);
    if (saved.songTimeline && Array.isArray(saved.songTimeline.markers))
      setSongTimeline(saved.songTimeline);
  };

  // Ask the server to snapshot the current on-disk show before a risky action (change rig, reset, restore)
  const requestSafetyBackup = (reason: string) => {
    fetch('/api/show/backup-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).catch(() => {});
  };

  // Load the most recent saved show on mount: compares the browser copy (localStorage) with the
  // hard-drive copy (shows/ultimo_show.granddas.json) and keeps the NEWER one. This way switching
  // browser / browser profile / laptop never brings back an old version of the show.
  const autoSaveLoadedRef = useRef<boolean>(false);
  useEffect(() => {
    let localShow: any = null;
    try {
      const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (raw) localShow = JSON.parse(raw);
    } catch {}

    const pickAndApply = (diskShow: any) => {
      const localTs = Number(localShow?.savedAt) || 0;
      const diskTs = Number(diskShow?.savedAt) || 0;
      const chosen =
        localShow && diskShow ? (diskTs > localTs ? diskShow : localShow) : localShow || diskShow;
      if (chosen) applySavedShowPayload(chosen);
      autoSaveLoadedRef.current = true;
    };

    fetch('/api/show/autosave')
      .then((r) => r.json())
      .then((data) => pickAndApply(data?.ok && data.show ? data.show : null))
      .catch(() => pickAndApply(null));
  }, [windowMode]);

  // Persistent Real-Time Auto-Save to LocalStorage + Physical Hard Drive (shows/ultimo_show.granddas.json)
  useEffect(() => {
    if (windowMode !== 'console' || !autoSaveLoadedRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        const payload = {
          schemaVersion: 2,
          savedAt: Date.now(),
          profiles,
          fixtures,
          groupCalibrations,
          positionCalibrations,
          scenes,
          snapshotCues,
          autoShowSteps,
          clockSchedule,
          touchPages,
          controlBindings,
          bpm,
          hahanSplitterMode,
          customRigs,
          songTimeline,
        };
        const jsonStr = JSON.stringify(payload);
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, jsonStr);
        fetch('/api/show/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
        }).catch(() => {});
        const now = new Date();
        setLastAutoSaveTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        );
      } catch {}
    }, 650);
    return () => window.clearTimeout(timer);
  }, [
    windowMode,
    profiles,
    fixtures,
    groupCalibrations,
    positionCalibrations,
    scenes,
    snapshotCues,
    autoShowSteps,
    clockSchedule,
    touchPages,
    controlBindings,
    bpm,
    hahanSplitterMode,
    customRigs,
    songTimeline,
  ]);

  const handleResetFactoryShow = () => {
    requestSafetyBackup('antes_reset_fabrica');
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    setProfiles(FIXTURE_PROFILES);
    setFixtures(DEFAULT_RIG_PRESET.fixtures);
    setGroupCalibrations(DEFAULT_GROUP_CALIBRATIONS);
    setPositionCalibrations(DEFAULT_POSITION_CALIBRATIONS);
    setScenes(DEFAULT_RECIPE_SCENES);
    setSnapshotCues(DEFAULT_SNAPSHOT_CUES);
    setAutoShowSteps(DEFAULT_AUTO_SHOW_STEPS);
    setClockSchedule(DEFAULT_CLOCK_SCHEDULE);
    setTouchPages(DEFAULT_TOUCH_PAGES);
    setSceneSubmasterLevels({});
    setControlBindings({});
    setActiveColorThemeId('auto');
    setGlobalPositionOverride('transparent');
  };

  // DJ Build-Up Riser -> Drop Impact Generator
  const triggerDropImpact = React.useCallback(() => {
    setBuildUpActive(false);
    setBuildUpProgress(0);
    setDropImpactActive(true);
    startTimeRef.current = performance.now(); // Resync Beat 1 on Drop!
    window.setTimeout(() => {
      setDropImpactActive(false);
    }, 650);
  }, []);

  useEffect(() => {
    if (!buildUpActive) return;
    const id = window.setInterval(() => {
      setBuildUpProgress((prev) => {
        const next = prev + 3.2; // ~3.1s full riser ramp
        if (next >= 100) {
          triggerDropImpact();
          return 0;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [buildUpActive, triggerDropImpact]);

  // WebMIDI Live Controller + MIDI Learn Support
  useEffect(() => {
    if (windowMode !== 'console' || !('requestMIDIAccess' in navigator)) return;
    (navigator as any)
      .requestMIDIAccess()
      .then((midiAccess: any) => {
        const bindInputs = () => {
          const inputs = Array.from(midiAccess.inputs.values()) as any[];
          if (inputs.length > 0) {
            setMidiDeviceName(inputs[0].name || 'Controlador MIDI USB');
          }
          inputs.forEach((input) => {
            input.onmidimessage = (msg: any) => {
              const [status, data1, data2] = msg.data;
              const cmd = status & 0xf0;

              // Check if MIDI Learn is waiting for a Note
              if (cmd === 0x90 && data2 > 0 && learnModeActive && learningTarget) {
                setControlBindings((prev) => ({
                  ...prev,
                  [learningTarget.targetId]: {
                    ...prev[learningTarget.targetId],
                    targetType: learningTarget.targetType,
                    targetId: learningTarget.targetId,
                    midiNote: data1,
                  },
                }));
                setLearningTarget(null);
                return;
              }

              // Check custom MIDI bindings first
              const boundEntry = Object.values(controlBindings).find(
                (b) => b.midiNote === data1
              );
              if (boundEntry) {
                if (boundEntry.targetType === 'scene') {
                  const sc = scenes.find((s) => s.id === boundEntry.targetId);
                  if (sc) {
                    if (cmd === 0x90 && data2 > 0) {
                      if (sc.isFlashButton) handleFlashDown(sc);
                      else handleToggleScene(sc);
                    } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
                      if (sc.isFlashButton) handleFlashUp(sc);
                    }
                  }
                } else if (boundEntry.targetType === 'macro' && cmd === 0x90 && data2 > 0) {
                  const cue = snapshotCues.find((c) => c.id === boundEntry.targetId);
                  if (cue) handleTriggerSnapshot(cue);
                }
                return;
              }

              // Default MIDI Note fallback
              if (cmd === 0x90 && data2 > 0) {
                const idx = data1 % scenes.length;
                const sc = scenes[idx];
                if (sc) {
                  if (sc.isFlashButton) handleFlashDown(sc);
                  else handleToggleScene(sc);
                }
              } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
                const idx = data1 % scenes.length;
                const sc = scenes[idx];
                if (sc && sc.isFlashButton) handleFlashUp(sc);
              } else if (cmd === 0xb0) {
                const norm = data2 / 127;
                if (data1 === 7 || data1 === 14) setGlobalMaster(norm);
              }
            };
          });
        };
        bindInputs();
        midiAccess.onstatechange = bindInputs;
      })
      .catch(() => {});
  }, [scenes, snapshotCues, windowMode, learnModeActive, learningTarget, controlBindings]);

  const handleJumpToAutoShowStep = (idx: number) => {
    const step = autoShowSteps[idx];
    if (!step) return;
    setAutoShowStepIndex(idx);
    setAutoShowElapsedSec(0);
    setCrossfadeSec(step.fadeSec);
    setActiveSceneIds(step.sceneIds);
    setMoveFxSpeed(clampStepMoveSpeed(step.moveSpeed));
    setChaseFxSpeed(step.chaseSpeed);
    setGlobalFanSpread(step.fanSpread);
  };

  const handleTriggerClockEvent = (ev: ClockScheduleEvent) => {
    setCrossfadeSec(ev.fadeSec ?? 2.0);
    if (ev.actionType === 'blackout_on') {
      setAutoShowRunning(false);
      setGlobalBlackout(true);
    } else if (ev.actionType === 'start_autoshow_cue') {
      setGlobalBlackout(false);
      const targetIdx = autoShowSteps.findIndex((s) => s.id === ev.targetAutoShowStepId);
      const safeIdx = targetIdx >= 0 ? targetIdx : 0;
      handleJumpToAutoShowStep(safeIdx);
      setAutoShowRunning(true);
    }
  };

  // 24-Hour Real-Time Event Clock Schedule Watcher (checks HH:MM every second)
  useEffect(() => {
    if (windowMode !== 'console') return;
    const timer = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayKey = `${now.toDateString()}_${hhmm}`;
      if (lastTriggeredClockKeyRef.current === dayKey) return;

      const matchingEv = clockSchedule.find((ev) => ev.enabled && ev.timeHHMM === hhmm);
      if (matchingEv) {
        lastTriggeredClockKeyRef.current = dayKey;
        handleTriggerClockEvent(matchingEv);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [windowMode, clockSchedule, autoShowSteps]);

  // Demo Audio FFT & Auto-Drop Simulator (when user activates Demo Audio without physical mic)
  useEffect(() => {
    if (windowMode !== 'console' || !audioDemoSim) return;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      // Simulate 16-second DJ cycle: 11s energetic club beat + 5s breakdown calm
      const cyclePos = frame % 160; // 10Hz ticks -> 16s
      const isBreakdown = cyclePos >= 110;
      const isKickTick = !isBreakdown && cyclePos % 5 === 0;
      const bass = isBreakdown
        ? Math.round(10 + Math.random() * 12)
        : isKickTick
          ? Math.round(84 + Math.random() * 16)
          : Math.round(40 + Math.random() * 25);
      const mid = isBreakdown
        ? Math.round(25 + Math.random() * 20)
        : Math.round(50 + Math.random() * 35);
      const high = isBreakdown
        ? Math.round(15 + Math.random() * 15)
        : Math.round(45 + Math.random() * 45);

      setAudioBands({ bass, mid, high, kickFlash: isKickTick });

      if (audioAutoDrop) {
        if (cyclePos === 110) {
          // Entering calm breakdown
          setMoveFxSpeed(0.5);
          setChaseFxSpeed(0.5);
        } else if (cyclePos === 0) {
          // Bass Drop hits!
          setMoveFxSpeed(1);
          setChaseFxSpeed(1);
          startTimeRef.current = performance.now();
        }
      }
    }, 100);
    return () => clearInterval(timer);
  }, [windowMode, audioDemoSim, audioAutoDrop]);

  // Multi-Hour Programmable Auto-Show Sequencer Timer (1s resolution)
  useEffect(() => {
    if ((windowMode !== 'console' && windowMode !== 'remote') || !autoShowRunning || autoShowSteps.length === 0)
      return;

    const timer = setInterval(() => {
      setAutoShowElapsedSec((prevElapsed) => {
        const curStep = autoShowSteps[autoShowStepIndex];
        const targetDur = curStep ? Math.max(5, curStep.durationSec) : 60;
        if (prevElapsed + 1 < targetDur) {
          return prevElapsed + 1;
        }

        // Advance to next enabled step
        const enabledIndices = autoShowSteps
          .map((s, i) => (s.enabled ? i : -1))
          .filter((i) => i !== -1);

        if (enabledIndices.length === 0) return 0;

        let nextIdx = enabledIndices[0];
        if (autoShowShuffle && enabledIndices.length > 1) {
          const candidates = enabledIndices.filter((i) => i !== autoShowStepIndex);
          nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          const pos = enabledIndices.indexOf(autoShowStepIndex);
          if (pos === -1 || pos + 1 >= enabledIndices.length) {
            if (!autoShowLoop) {
              setAutoShowRunning(false);
              return targetDur;
            }
            nextIdx = enabledIndices[0];
          } else {
            nextIdx = enabledIndices[pos + 1];
          }
        }

        const nextStep = autoShowSteps[nextIdx];
        if (nextStep) {
          setAutoShowStepIndex(nextIdx);
          setCrossfadeSec(nextStep.fadeSec);
          setActiveSceneIds(nextStep.sceneIds);
          setMoveFxSpeed(clampStepMoveSpeed(nextStep.moveSpeed));
          setChaseFxSpeed(nextStep.chaseSpeed);
          setGlobalFanSpread(nextStep.fanSpread);
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    windowMode,
    autoShowRunning,
    autoShowSteps,
    autoShowStepIndex,
    autoShowLoop,
    autoShowShuffle,
  ]);
  useEffect(() => {
    if (windowMode !== 'console' || !autopilotBeats || snapshotCues.length === 0) return;
    const msPerBeat = 60000 / Math.max(40, bpm);
    const intervalMs = msPerBeat * autopilotBeats;
    const timer = setInterval(() => {
      setActiveSnapshotId((prevId) => {
        const curIdx = snapshotCues.findIndex((c) => c.id === prevId);
        const nextCue = snapshotCues[(curIdx + 1) % snapshotCues.length];
        if (nextCue) {
          setActiveSceneIds(nextCue.sceneIds);
          return nextCue.id;
        }
        return prevId;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autopilotBeats, bpm, snapshotCues, windowMode]);

  // Live Keyboard Shortcuts + Key Learn + Temp Color Bump (Q, W, E, R) + Stomp (S) + Resync (Enter)
  useEffect(() => {
    if (windowMode !== 'console') return;
    const flashScenes = scenes.filter((s) => s.isFlashButton);

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      // 1. Key Learn Capture Mode
      if (learnModeActive && learningTarget) {
        e.preventDefault();
        const keyLabel = e.key.length === 1 ? e.key.toUpperCase() : e.code.replace('Key', '');
        setControlBindings((prev) => ({
          ...prev,
          [learningTarget.targetId]: {
            ...prev[learningTarget.targetId],
            targetType: learningTarget.targetType,
            targetId: learningTarget.targetId,
            key: e.code,
            keyLabel,
          },
        }));
        setLearningTarget(null);
        return;
      }

      // 2. Custom Learned Key Bindings
      const customBound = Object.values(controlBindings).find((b) => b.key === e.code);
      if (customBound) {
        e.preventDefault();
        if (customBound.targetType === 'scene') {
          const sc = scenes.find((s) => s.id === customBound.targetId);
          if (sc) {
            if (sc.isFlashButton) handleFlashDown(sc);
            else if (!e.repeat) handleToggleScene(sc);
          }
        } else if (customBound.targetType === 'macro' && !e.repeat) {
          const cue = snapshotCues.find((c) => c.id === customBound.targetId);
          if (cue) handleTriggerSnapshot(cue);
        }
        return;
      }

      // 3. Temp Color Bump Keys (Q, W, E, R)
      const bumpDef = TEMP_COLOR_BUMPS.find((b) => b.code === e.code);
      if (bumpDef) {
        setTempColorBump(bumpDef.palette);
        return;
      }

      // 4. Stomp Movement (S) & Phase Resync Beat 1 (Enter)
      if (e.code === 'KeyS' && !e.repeat) {
        setStompMovement((s) => !s);
        return;
      }
      if (e.code === 'KeyG' && !e.repeat) {
        handleStepSnapshotCue(1);
        return;
      }
      if (e.code === 'KeyH') {
        setHazeBlastActive(true);
        return;
      }
      if (e.code === 'KeyD' && !e.repeat) {
        setBuildUpActive(true);
        return;
      }
      if (e.code === 'Enter' && !e.repeat) {
        handleResyncBeatPhase();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) handleTapTempo();
      } else if (e.key === 'Escape') {
        setGroupProgrammers(DEFAULT_GROUP_PROGRAMMERS);
        setLearnModeActive(false);
        setLearningTarget(null);
      } else if (e.key.toLowerCase() === 'b' && !e.repeat) {
        setGlobalBlackout((b) => !b);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (flashScenes[idx]) handleFlashDown(flashScenes[idx]);
      } else if (e.key.startsWith('F') && e.key.length === 2) {
        const fNum = parseInt(e.key.slice(1), 10);
        if (fNum >= 1 && fNum <= snapshotCues.length) {
          e.preventDefault();
          const cue = snapshotCues[fNum - 1];
          handleTriggerSnapshot(cue);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'KeyH') {
        setHazeBlastActive(false);
      }
      if (e.code === 'KeyD') {
        triggerDropImpact();
      }

      // Release Custom Learned Flash Button
      const customBound = Object.values(controlBindings).find((b) => b.key === e.code);
      if (customBound && customBound.targetType === 'scene') {
        const sc = scenes.find((s) => s.id === customBound.targetId);
        if (sc && sc.isFlashButton) handleFlashUp(sc);
      }

      // Release Temp Color Bump (Q, W, E, R)
      const bumpDef = TEMP_COLOR_BUMPS.find((b) => b.code === e.code);
      if (bumpDef) {
        setTempColorBump((cur) => (cur === bumpDef.palette ? null : cur));
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (flashScenes[idx]) handleFlashUp(flashScenes[idx]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [scenes, snapshotCues, windowMode, learnModeActive, learningTarget, controlBindings]);

  // Dual Engine Clock:
  // 1) requestAnimationFrame (60 FPS) when the window is visible for ultra-smooth 3D movement.
  // 2) Web Worker / setInterval (40 Hz) when the window is minimized or hidden so DMX/Art-Net output NEVER freezes.
  const engineTickRef = useRef<((nowMs: number) => void) | null>(null);
  useEffect(() => {
    let rafId = 0;
    let lastTickAt = 0;

    const rafLoop = (nowMs: number) => {
      if (!document.hidden) {
        lastTickAt = nowMs;
        engineTickRef.current?.(nowMs);
      }
      rafId = window.requestAnimationFrame(rafLoop);
    };
    rafId = window.requestAnimationFrame(rafLoop);

    const bgCheck = () => {
      const nowMs = performance.now();
      if (document.hidden || nowMs - lastTickAt >= 32) {
        lastTickAt = nowMs;
        engineTickRef.current?.(nowMs);
      }
    };

    const workerSrc =
      "var t=setInterval(function(){postMessage(0)},25);onmessage=function(e){if(e.data==='stop'){clearInterval(t);close();}}";
    const blobUrl = URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' }));
    let worker: Worker | null = null;
    let fallbackTimer = 0;
    try {
      worker = new Worker(blobUrl);
      worker.onmessage = bgCheck;
    } catch {
      fallbackTimer = window.setInterval(bgCheck, 25);
    }
    return () => {
      window.cancelAnimationFrame(rafId);
      worker?.postMessage('stop');
      worker?.terminate();
      window.clearInterval(fallbackTimer);
      URL.revokeObjectURL(blobUrl);
    };
  }, [windowMode]);

  // Main Real-Time DMX512 + Smooth Crossfade + Multi-Window Broadcast Loop
  useEffect(() => {
    const tick = (nowMs: number) => {
      // If this is the 2nd-screen 3D Visualizer and the main console is actively broadcasting frames,
      // use the broadcast frames directly; otherwise evaluate locally so 3D ALWAYS moves!
      if (windowMode === 'visualizer' && nowMs - lastBroadcastReceivedRef.current < 250) {
        return;
      }

      const elapsedSec = (nowMs - startTimeRef.current) / 1000;
      const dtSec = Math.max(0.001, Math.min(0.1, (nowMs - lastFrameTimeMsRef.current) / 1000));
      lastFrameTimeMsRef.current = nowMs;

      if (!freezeDmx) {
        const baseActiveScenes = worklightActive
          ? scenes.filter(
              (s) => s.id === 'sc_all_on' || s.id === 'col_warm' || s.id === 'pos_downstage'
            )
          : scenes.filter((s) => activeSceneIds.includes(s.id));

        const blinderScene = scenes.find((s) => s.id === 'fl_blinder_audience');
        const activeSceneObjects =
          dropImpactActive && blinderScene
            ? [...baseActiveScenes, blinderScene]
            : buildUpActive && buildUpProgress > 55
              ? [
                  ...baseActiveScenes,
                  ...scenes.filter((s) => s.id === 'fl_strobe_hit' && !baseActiveScenes.includes(s)),
                ]
              : baseActiveScenes;

        const riserMultiplier = buildUpActive ? 1 + (buildUpProgress / 100) * 3.5 : 1;
        const selectedTheme = GLOBAL_COLOR_THEMES.find((t) => t.id === activeColorThemeId);

        const evaluated = evaluateDmxEngine({
          fixtures,
          profiles,
          groupCalibrations,
          activeScenes: activeSceneObjects,
          bpm,
          timeSec: elapsedSec,
          globalMaster: dropImpactActive ? 1 : globalMaster,
          globalFxSize,
          globalFxSpeed: moveFxSpeed * riserMultiplier,
          moveFxSpeed: moveFxSpeed * riserMultiplier,
          chaseFxSpeed: chaseFxSpeed * riserMultiplier,
          globalFanSpread,
          tempColorBump: worklightActive
            ? 'warm_white'
            : dropImpactActive
              ? 'white'
              : tempColorBump,
          stompMovement: worklightActive ? true : stompMovement,
          globalBlackout,
          highlightFixtureId,
          manualXYOverride: manualXY,
          groupProgrammers,
          crossfadeSec: dropImpactActive ? 0 : crossfadeSec,
          prevFrames: prevFramesRef.current,
          dtSec,
          globalPositionOverride: worklightActive
            ? 'downstage'
            : buildUpActive
              ? 'sky_fan'
              : globalPositionOverride,
          positionCalibrations,
          manualDmxOverrides,
          globalColorTheme: selectedTheme
            ? { primary: selectedTheme.primary, secondary: selectedTheme.secondary }
            : null,
          followspotWhiteActive,
          sceneSubmasterLevels,
          customRgbwOverride,
          audioBassLevel: (audioListening || audioDemoSim) ? audioBands.bass / 100 : undefined,
          globalOpticsOverride: globalOptics,
          worklightActive,
          isolateManualDmxUniverse: isolateDmxUniverse,
        });

        // Evaluate Special FX & Pyro (Sparkular, CO2, Flame, Confetti) Sine & PWM Waveforms + Manual Triggers
        // DMX Patch in Universe 1 starting at sfxState.startDmxChannel (default CH 490):
        // CH 490..493: Sparkular 1..4 | CH 494: Sparkular Pre-Heat 800°C
        // CH 495..498: CO2 Cryo Jets 1..4 | CH 499..502: Flame Projectors 1..4 | CH 503..504: Confetti 1..2
        const baseIdx = Math.max(0, Math.min(490, (sfxState.startDmxChannel || 490) - 1));

        const evalPattern0to255 = (
          pattern: SpecialFxWavePattern,
          unitIdx: number,
          totalUnits: number,
          manualVal0to100: number,
          masterScale0to1: number
        ): number => {
          if (!sfxState.armed) return 0;
          if (manualVal0to100 > 0) {
            return Math.round((manualVal0to100 / 100) * 255);
          }
          if (pattern === 'off') return 0;
          if (pattern === 'all_blast') return Math.round(masterScale0to1 * 255);

          const cyclePos = (elapsedSec * sfxState.sfxSpeedHz) % 1;
          const spreadRatio = (sfxState.sfxPhaseSpread || 360) / 360;

          let phaseOffset = (unitIdx / Math.max(1, totalUnits)) * spreadRatio;
          if (pattern === 'sine_sym_wings' || pattern === 'pwm_center_out') {
            const distFromCenter = Math.abs(unitIdx - (totalUnits - 1) / 2);
            phaseOffset = (distFromCenter / Math.max(1, (totalUnits - 1) / 2)) * 0.5 * spreadRatio;
          } else if (pattern === 'pwm_odd_even') {
            phaseOffset = unitIdx % 2 === 0 ? 0 : 0.5;
          }

          const unitPhase = (cyclePos - phaseOffset + 10) % 1;

          if (pattern === 'sine_wave' || pattern === 'sine_sym_wings') {
            const s = (Math.sin(unitPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            return Math.round(s * masterScale0to1 * 255);
          }

          if (pattern === 'pwm_random') {
            const slot = Math.floor(elapsedSec * sfxState.sfxSpeedHz * 3);
            const hash = Math.sin((slot + 1) * 19.73 + (unitIdx + 1) * 53.17) * 10000;
            const r = hash - Math.floor(hash);
            return r < sfxState.sfxPwmDuty * 0.65 ? Math.round(masterScale0to1 * 255) : 0;
          }

          // Square PWM Gate (pwm_chase_lr, pwm_center_out, pwm_odd_even)
          return unitPhase < sfxState.sfxPwmDuty ? Math.round(masterScale0to1 * 255) : 0;
        };

        const spkScale = (sfxState.sparkularMasterHeight ?? 85) / 100;
        const spkDmx: [number, number, number, number] = [0, 1, 2, 3].map((i) =>
          evalPattern0to255(
            sfxState.sparkularPattern,
            i,
            4,
            sfxState.sparkularManualUnits[i] || 0,
            spkScale
          )
        ) as [number, number, number, number];

        const co2Dmx: [number, number, number, number] = [0, 1, 2, 3].map((i) =>
          evalPattern0to255(
            sfxState.co2Pattern,
            i,
            4,
            sfxState.co2ManualUnits[i] ? 100 : 0,
            1
          )
        ) as [number, number, number, number];

        const flmDmx: [number, number, number, number] = [0, 1, 2, 3].map((i) =>
          evalPattern0to255(
            sfxState.flamePattern,
            i,
            4,
            sfxState.flameManualUnits[i] ? 100 : 0,
            1
          )
        ) as [number, number, number, number];

        const cnfDmx: [number, number] = [0, 1].map((i) =>
          evalPattern0to255(
            sfxState.confettiPattern,
            i,
            2,
            sfxState.confettiManualUnits[i] || 0,
            1
          )
        ) as [number, number];

        for (let i = 0; i < 4; i++) {
          evaluated.universes[1][baseIdx + i] = spkDmx[i]; // CH 490..493
          evaluated.universes[1][baseIdx + 5 + i] = co2Dmx[i]; // CH 495..498
          evaluated.universes[1][baseIdx + 9 + i] = flmDmx[i]; // CH 499..502
        }
        evaluated.universes[1][baseIdx + 4] = sfxState.sparkularPreheat ? 255 : 0; // CH 494 Pre-heat
        evaluated.universes[1][baseIdx + 13] = cnfDmx[0]; // CH 503
        evaluated.universes[1][baseIdx + 14] = cnfDmx[1]; // CH 504

        // Inject DMX Smoke / Hazer Machine Channels (Universe 1 CH 510 Pump + CH 511 Fan)
        if (hazeBlastActive || autoHazeEnabled || buildUpActive) {
          const pumpVal = hazeBlastActive || buildUpActive ? 255 : 90;
          const fanVal = hazeBlastActive || buildUpActive ? 255 : 165;
          evaluated.universes[1][hazeDmxChannel - 1] = pumpVal;
          evaluated.universes[1][hazeDmxChannel] = fanVal;
        }

        // Hahan SL04 Box 4-Port DMX Splitter Mode:
        // If Universes 2, 3, or 4 have no fixtures patched, mirror Universe 1 to all 4 physical XLR outputs!
        if (hahanSplitterMode) {
          const hasUni2 = fixtures.some((f) => f.universe === 2);
          const hasUni3 = fixtures.some((f) => f.universe === 3);
          const hasUni4 = fixtures.some((f) => f.universe === 4);
          if (!hasUni2) evaluated.universes[2] = [...evaluated.universes[1]];
          if (!hasUni3) evaluated.universes[3] = [...evaluated.universes[1]];
          if (!hasUni4) evaluated.universes[4] = [...evaluated.universes[1]];
        }

        prevFramesRef.current = evaluated.fixtureFrames;

        const nextLiveSfx = {
          sparkular: spkDmx,
          co2: co2Dmx,
          flame: flmDmx,
          confetti: cnfDmx,
        };

        // Throttle React UI state commits (24ms = ~42 FPS when 3D/SFX/Tester is visible, 50ms when hidden)
        // so 3D movements are silky-smooth while console buttons stay instant
        const uiIntervalMs =
          windowMode === 'visualizer' ||
          showInlineMiniVisualizer ||
          mainWorkspaceView === 'sfx_deck' ||
          isDmxTesterOpen ||
          isChannelFinderOpen
            ? 24
            : 50;
        if (nowMs - lastUiCommitRef.current >= uiIntervalMs) {
          lastUiCommitRef.current = nowMs;
          setLiveSfxLevels(nextLiveSfx);
          setFixtureFrames(evaluated.fixtureFrames);
          setUniverses(evaluated.universes);
        }

        if (windowMode !== 'console' && windowMode !== 'remote') return;

        // Broadcast live frame to 2nd-Screen 3D Visualizer and Mobile Remote
        if (windowMode === 'console') {
          syncChannelRef.current?.postMessage({
            type: 'STATE_FRAME',
            fixtures,
            profiles,
            groupCalibrations,
            fixtureFrames: evaluated.fixtureFrames,
            universes: evaluated.universes,
            manualXY,
            highlightFixtureId,
            snapshotCues,
            activeSnapshotId,
            globalBlackout,
            liveSfxLevels: nextLiveSfx,
          });
        }

        // Send UDP Art-Net frame at ~35Hz if backend bridge is running
        if (artnetConnected && nowMs - lastArtnetPostRef.current >= 22) {
          lastArtnetPostRef.current = nowMs;
          fetch('/api/artnet/frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: windowMode,
              universes: {
                1: evaluated.universes[1],
                2: evaluated.universes[2],
                3: evaluated.universes[3],
                4: evaluated.universes[4],
              },
              remoteState: {
                activeMacroLookId: activeSnapshotId,
                activeColorId: tempColorBump,
                activePosId: globalPositionOverride,
                globalMaster,
                globalBlackout,
                worklightActive,
                blinderOverride: dropImpactActive,
                freezeOverride: freezeDmx,
                hazeBlastActive,
                autoShowRunning,
                highlightedFixtureId: highlightFixtureId,
                groupCalibrations,
                fixtures,
              },
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.packetsSent) setArtnetPackets(d.packetsSent);
              if (
                windowMode === 'console' &&
                Array.isArray(d.remoteCommands) &&
                d.remoteCommands.length > 0
              ) {
                d.remoteCommands.forEach((cmd: RemoteCommandPayload) =>
                  executeRemoteCommandRef.current(cmd)
                );
              }
            })
            .catch(() => {});
        }
      }

    };

    engineTickRef.current = tick;
    return () => {
      if (engineTickRef.current === tick) engineTickRef.current = null;
    };
  }, [
    windowMode,
    fixtures,
    profiles,
    groupCalibrations,
    scenes,
    activeSceneIds,
    bpm,
    globalMaster,
    globalFxSize,
    moveFxSpeed,
    chaseFxSpeed,
    globalFanSpread,
    tempColorBump,
    stompMovement,
    crossfadeSec,
    globalBlackout,
    artnetConnected,
    highlightFixtureId,
    manualXY,
    groupProgrammers,
    snapshotCues,
    activeSnapshotId,
    hazeBlastActive,
    autoHazeEnabled,
    hazeDmxChannel,
    globalPositionOverride,
    positionCalibrations,
    manualDmxOverrides,
    freezeDmx,
    worklightActive,
    buildUpActive,
    buildUpProgress,
    dropImpactActive,
    activeColorThemeId,
    followspotWhiteActive,
    hahanSplitterMode,
    sceneSubmasterLevels,
    customRgbwOverride,
    audioListening,
    audioDemoSim,
    audioBands.bass,
    sfxState,
    globalOptics,
    isolateDmxUniverse,
    showInlineMiniVisualizer,
    mainWorkspaceView,
    isDmxTesterOpen,
    isChannelFinderOpen,
    autoShowRunning,
  ]);

  const handleDjCrossfaderChange = (lookA: string, lookB: string, pos0to100: number) => {
    setDjLookA(lookA);
    setDjLookB(lookB);
    setDjCrossfaderPos(pos0to100);
    const norm = Math.max(0, Math.min(100, pos0to100)) / 100;
    setActiveSceneIds((prev) => {
      const next = new Set(prev);
      if (norm < 0.98) next.add(lookA);
      else next.delete(lookA);
      if (norm > 0.02) next.add(lookB);
      else next.delete(lookB);
      return Array.from(next);
    });
    setSceneSubmasterLevels((prev) => ({
      ...prev,
      [lookA]: Number((1 - norm).toFixed(2)),
      [lookB]: Number(norm.toFixed(2)),
    }));
  };

  const handleOpen3DSecondScreen = () => {
    window.open(
      '/?window=visualizer',
      'GrandDas3DVisualizer',
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const handleResyncBeatPhase = () => {
    startTimeRef.current = performance.now();
  };

  const handleStepSnapshotCue = (delta: 1 | -1) => {
    if (snapshotCues.length === 0) return;
    setActiveSnapshotId((prevId) => {
      const curIdx = snapshotCues.findIndex((c) => c.id === prevId);
      const nextIdx =
        curIdx === -1
          ? 0
          : (curIdx + delta + snapshotCues.length) % snapshotCues.length;
      const nextCue = snapshotCues[nextIdx];
      if (nextCue) {
        setActiveSceneIds(nextCue.sceneIds);
        return nextCue.id;
      }
      return prevId;
    });
  };

  // Save entire GrandDas show to a .granddas.json file
  const handleSaveGrandDasShow = () => {
    const showData: GrandDasShowFile = {
      version: '2.3',
      savedAt: new Date().toISOString(),
      profiles,
      fixtures,
      groupCalibrations,
      scenes,
      snapshotCues,
      bindings: controlBindings,
      autoShowSteps,
      clockSchedule,
      positionCalibrations,
      touchPages,
    };
    const blob = new Blob([JSON.stringify(showData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Show_GrandDas_${fixtures.length}Focos.granddas.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load entire GrandDas show from a .granddas.json file
  const handleLoadGrandDasShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as GrandDasShowFile;
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.fixtures) setFixtures(parsed.fixtures);
        if (parsed.groupCalibrations) setGroupCalibrations(parsed.groupCalibrations);
        if (parsed.scenes) setScenes(parsed.scenes);
        if (parsed.snapshotCues) setSnapshotCues(parsed.snapshotCues);
        if (parsed.bindings) setControlBindings(parsed.bindings);
        if (parsed.autoShowSteps) setAutoShowSteps(parsed.autoShowSteps);
        if (parsed.clockSchedule) setClockSchedule(parsed.clockSchedule);
        if (parsed.positionCalibrations) setPositionCalibrations(parsed.positionCalibrations);
        if (parsed.touchPages) setTouchPages(parsed.touchPages);
      } catch {
        // ignore invalid JSON
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTriggerSnapshot = (cue: ShowSnapshotCue) => {
    if (learnModeActive) {
      setLearningTarget({ targetType: 'macro', targetId: cue.id, label: cue.name });
      return;
    }
    setWorklightActive(false);
    setActiveColorThemeId('auto');
    setCustomRgbwOverride((prev) => ({ ...prev, enabled: false }));
    setGlobalPositionOverride('transparent');
    setSceneSubmasterLevels({});
    setDjCrossfaderPos(0);
    setActiveSnapshotId(cue.id);
    setActiveSceneIds(cue.sceneIds);
  };

  // Stable reference so long-lived timers (Song Timeline) always call the latest trigger logic
  const handleTriggerSnapshotRef = useRef(handleTriggerSnapshot);
  handleTriggerSnapshotRef.current = handleTriggerSnapshot;
  const stableTriggerSnapshot = React.useCallback(
    (cue: ShowSnapshotCue) => handleTriggerSnapshotRef.current(cue),
    []
  );

  const handleSaveCurrentAsSnapshot = () => {
    const num = snapshotCues.length + 1;
    const newCue: ShowSnapshotCue = {
      id: `cue_custom_${Date.now().toString(36)}`,
      name: `${num}. MI LOOK #${num}`,
      hotkey: `F${num}`,
      colorHex: '#f59e0b',
      sceneIds: [...activeSceneIds],
    };
    setSnapshotCues((prev) => [...prev, newCue]);
    setActiveSnapshotId(newCue.id);
  };

  const handleToggleScene = (scene: RecipeScene) => {
    if (learnModeActive) {
      setLearningTarget({ targetType: 'scene', targetId: scene.id, label: scene.name });
      return;
    }
    setSelectedSceneIdForEdit(scene.id);
    if (scene.isFlashButton) return;

    // Clear any conflicting global override so the clicked bank scene responds immediately on stage
    if (scene.bankId === 'bank_colors') {
      setActiveColorThemeId('auto');
      setCustomRgbwOverride((prev) => ({ ...prev, enabled: false }));
    } else if (scene.bankId === 'bank_positions') {
      setGlobalPositionOverride('transparent');
    }
    if (sceneSubmasterLevels[scene.id] !== undefined && sceneSubmasterLevels[scene.id] < 1) {
      setSceneSubmasterLevels((prev) => {
        const copy = { ...prev };
        delete copy[scene.id];
        return copy;
      });
    }

    const bank = banks.find((b) => b.id === scene.bankId);
    setActiveSceneIds((prev) => {
      const isAlreadyActive = prev.includes(scene.id);
      if (isAlreadyActive) {
        return prev.filter((id) => id !== scene.id);
      }
      if (bank?.exclusive) {
        const otherBankSceneIds = scenes
          .filter((s) => s.bankId === scene.bankId && s.id !== scene.id)
          .map((s) => s.id);
        return [...prev.filter((id) => !otherBankSceneIds.includes(id)), scene.id];
      }
      return [...prev, scene.id];
    });
  };

  const handleFlashDown = (scene: RecipeScene) => {
    if (learnModeActive) {
      setLearningTarget({ targetType: 'scene', targetId: scene.id, label: scene.name });
      return;
    }
    setSelectedSceneIdForEdit(scene.id);
    setActiveSceneIds((prev) => (prev.includes(scene.id) ? prev : [...prev, scene.id]));
  };

  const handleFlashUp = (scene: RecipeScene) => {
    if (!scene.isFlashButton) return;
    setActiveSceneIds((prev) => prev.filter((id) => id !== scene.id));
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const history = tapTimesRef.current.filter((t) => now - t < 3000);
    history.push(now);
    tapTimesRef.current = history;

    if (history.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < history.length; i++) {
        totalDiff += history[i] - history[i - 1];
      }
      const avgMs = totalDiff / (history.length - 1);
      const nextBpm = Math.max(40, Math.min(220, Math.round(60000 / avgMs)));
      setBpm(nextBpm);
    }
  };

  const handleToggleAudioMic = async () => {
    if (audioListening) {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setAudioListening(false);
      setAudioBands({ bass: 0, mid: 0, high: 0, kickFlash: false });
      return;
    }
    setAudioDemoSim(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      src.connect(analyser);
      setAudioListening(true);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastPeak = 0;
      let calmFrames = 0;
      const checkAudio = () => {
        if (!audioCtxRef.current) return;
        analyser.getByteFrequencyData(data);
        const rawBass = (data[1] + data[2] + data[3] + data[4]) / 4;
        const rawMid = (data[8] + data[12] + data[16] + data[22]) / 4;
        const rawHigh = (data[32] + data[45] + data[60] + data[80]) / 4;

        const bassPct = Math.min(100, Math.round((rawBass / 255) * 100));
        const midPct = Math.min(100, Math.round((rawMid / 255) * 100));
        const highPct = Math.min(100, Math.round((rawHigh / 255) * 100));

        const now = performance.now();
        let isKick = false;
        if (rawBass > 195 && now - lastPeak > 260) {
          isKick = true;
          const diff = now - lastPeak;
          lastPeak = now;
          if (diff > 300 && diff < 1200) {
            const detected = Math.round(60000 / diff);
            setBpm((prev) => Math.round(prev * 0.75 + detected * 0.25));
          }
        }

        setAudioBands({ bass: bassPct, mid: midPct, high: highPct, kickFlash: isKick });

        // Intelligent Breakdown / Bass Drop Auto-Energy
        if (bassPct < 18 && midPct < 22) {
          calmFrames++;
          if (calmFrames === 90) {
            setMoveFxSpeed(0.5);
            setChaseFxSpeed(0.5);
          }
        } else if (bassPct > 76) {
          if (calmFrames >= 90) {
            setMoveFxSpeed(1);
            setChaseFxSpeed(1);
            startTimeRef.current = performance.now();
          }
          calmFrames = 0;
        }

        window.setTimeout(checkAudio, 20); // timer (not rAF) so audio-to-light keeps working when minimized
      };
      window.setTimeout(checkAudio, 20);
    } catch {
      setAudioListening(false);
    }
  };

  const handleUpdateGroupCalibration = (gId: GroupId, patch: Partial<GroupCalibration>) => {
    setGroupCalibrations((prev) => ({
      ...prev,
      [gId]: { ...prev[gId], ...patch },
    }));
  };

  const handleUpdateGroupProgrammer = (
    gId: GroupId,
    updater: (prev: GroupProgrammerState) => GroupProgrammerState
  ) => {
    setGroupProgrammers((prev) => ({
      ...prev,
      [gId]: updater(prev[gId]),
    }));
  };

  const handleClearGroupProgrammer = (gId: GroupId) => {
    setGroupProgrammers((prev) => ({
      ...prev,
      [gId]: DEFAULT_GROUP_PROGRAMMERS[gId],
    }));
  };

  const handleSaveProgrammerAsScene = (gId: GroupId) => {
    const p = groupProgrammers[gId];
    const newId = `sc_prog_${Date.now().toString(36)}`;
    const newScene: RecipeScene = {
      id: newId,
      bankId: 'bank_movements',
      name: `Preset ${gId.toUpperCase()} Custom`,
      colorHex: '#f59e0b',
      isFlashButton: false,
      targetGroups: [gId],
      dimmer: 1,
      colorPrimary: p.colorPrimary,
      colorSecondary: p.colorSecondary,
      positionPalette: p.positionPalette,
      strobeMode: p.strobeMode === 'transparent' ? 'off' : p.strobeMode,
      prismActive: p.prismActive === true,
      prismRotate: p.prismActive === true,
      goboSlot: p.goboSlot === 'transparent' ? 0 : p.goboSlot,
      zoomValue: 'transparent',
      fx: {
        waveform: p.fxWaveform === 'transparent' ? 'none' : p.fxWaveform,
        wings: p.wings,
        wingDirection: 'outside_in',
        blocks: 1,
        interleave: 1,
        phaseSpread: 360,
        size: 0.65,
        bpmDivision: 1,
        dutyCycle: 0.5,
      },
    };
    setScenes((prev) => [...prev, newScene]);
    setSelectedSceneIdForEdit(newId);
    setRightPanelMode('recipe_editor');
    setIsRightDrawerOpen(true);
  };

  const handleUpdateScene = (sceneId: string, updater: (prev: RecipeScene) => RecipeScene) => {
    setScenes((prev) => prev.map((s) => (s.id === sceneId ? updater(s) : s)));
  };

  const handleDuplicateScene = (scene: RecipeScene) => {
    const newId = `sc_${Date.now().toString(36)}`;
    const copy: RecipeScene = {
      ...scene,
      id: newId,
      name: `${scene.name} (Copia)`,
      fx: { ...scene.fx },
    };
    setScenes((prev) => [...prev, copy]);
    setSelectedSceneIdForEdit(newId);
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    setActiveSceneIds((prev) => prev.filter((id) => id !== sceneId));
  };

  const handleAddSceneToBank = (bankId: string) => {
    const newId = `sc_${Date.now().toString(36)}`;
    const newScene: RecipeScene = {
      id: newId,
      bankId,
      name: 'Nueva Receta MA2',
      colorHex: '#f59e0b',
      isFlashButton: bankId === 'bank_flash',
      targetGroups: ['beams', 'washes'],
      dimmer: 1,
      colorPrimary: 'cyan',
      colorSecondary: 'magenta',
      positionPalette: 'sky_fan',
      strobeMode: 'off',
      prismActive: false,
      prismRotate: false,
      goboSlot: 0,
      zoomValue: 'transparent',
      fx: {
        waveform: 'circle_pt',
        wings: 2,
        wingDirection: 'outside_in',
        blocks: 1,
        interleave: 1,
        phaseSpread: 360,
        size: 0.6,
        bpmDivision: 1,
        dutyCycle: 0.5,
      },
    };
    setScenes((prev) => [...prev, newScene]);
    setSelectedSceneIdForEdit(newId);
    setRightPanelMode('recipe_editor');
    setIsRightDrawerOpen(true);
  };

  const handleExportDaslightDvc = () => {
    const xml = compileRecipesToDaslight5Dvc({
      fixtures,
      profiles,
      groupCalibrations,
      banks,
      scenes,
      artnetTargetIp: artnetIp,
    });
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GrandDas_Cloned_${fixtures.length}Focos_Daslight5.dvc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChangeArtnetIp = (nextIp: string) => {
    setArtnetIp(nextIp);
    fetch('/api/artnet/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetIp: nextIp }),
    }).catch(() => {});
  };

  // ============================================================================
  // WINDOW MODE 1: DEDICATED 2ND-SCREEN 3D STAGE & DMX VISUALIZER
  // ============================================================================
  if (windowMode === 'visualizer') {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 p-2 select-none overflow-hidden flex flex-col">
        <StageVisualizer
          fixtures={fixtures}
          profiles={profiles}
          groupCalibrations={groupCalibrations}
          fixtureFrames={fixtureFrames}
          universes={universes}
          manualXY={manualXY}
          onUpdateManualXY={(nextXY) => {
            setManualXY(nextXY);
            syncChannelRef.current?.postMessage({
              type: 'ACTION_MANUAL_XY',
              manualXY: nextXY,
            });
          }}
          highlightedFixtureId={highlightFixtureId}
          onToggleHighlightFixture={(fId) => {
            setHighlightFixtureId(fId);
            syncChannelRef.current?.postMessage({
              type: 'ACTION_HIGHLIGHT',
              fixtureId: fId,
            });
          }}
          onUpdateFixture={(fId, patch) => {
            handleUpdateSingleFixture(fId, patch);
            syncChannelRef.current?.postMessage({
              type: 'ACTION_UPDATE_FIXTURE',
              fixtureId: fId,
              patch,
            });
          }}
          onUpdateGroupCalibration={(gId, patch) => {
            handleUpdateGroupCalibration(gId, patch);
            syncChannelRef.current?.postMessage({
              type: 'ACTION_CALIBRATE',
              groupId: gId,
              patch,
            });
          }}
          liveSfxLevels={liveSfxLevels}
          isStandaloneWindow={true}
        />
      </div>
    );
  }

  // ============================================================================
  // WINDOW MODE 2: STANDALONE MOBILE / TABLET STAGE TECH REMOTE (?remote=1)
  // ============================================================================
  if (windowMode === 'remote') {
    return (
      <StageRemoteView
        mode="fullscreen"
        lanIps={lanIps}
        activeMacroLookId={activeSnapshotId}
        activeColorId={tempColorBump}
        activePosId={globalPositionOverride}
        globalMaster={globalMaster}
        globalBlackout={globalBlackout}
        worklightActive={worklightActive}
        blinderOverride={dropImpactActive}
        freezeOverride={freezeDmx}
        hazeBlastActive={hazeBlastActive}
        autoShowRunning={autoShowRunning}
        highlightedFixtureId={highlightFixtureId}
        groupCalibrations={groupCalibrations}
        fixtures={fixtures}
        onExecuteCommand={handleExecuteRemoteCommand}
      />
    );
  }

  // ============================================================================
  // WINDOW MODE 3: MAIN CLEAN EXECUTOR CONSOLE
  // ============================================================================
  const selectedScene = scenes.find((s) => s.id === selectedSceneIdForEdit) || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Backdrop to close any open top dropdown menu when clicking outside */}
      {openTopMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenTopMenu(null)}
        />
      )}

      {/* KIOSK / SAFE CLUB MODE PIN UNLOCK MODAL */}
      {kioskUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase">
                Desbloquear Edición Técnica
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Introduce el PIN de técnico (por defecto <strong>1234</strong>) para volver a mostrar los menús de parcheo y edición.
              </p>
            </div>
            <input
              type="password"
              value={kioskPinInput}
              onChange={(e) => setKioskPinInput(e.target.value)}
              placeholder="PIN (1234)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-center text-lg font-mono font-black tracking-widest text-amber-300"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (kioskPinInput === '1234' || kioskPinInput === '')) {
                  setKioskSafeMode(false);
                  setKioskUnlockModalOpen(false);
                  setKioskPinInput('');
                }
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setKioskUnlockModalOpen(false);
                  setKioskPinInput('');
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (kioskPinInput === '1234' || kioskPinInput === '') {
                    setKioskSafeMode(false);
                    setKioskUnlockModalOpen(false);
                    setKioskPinInput('');
                  }
                }}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase cursor-pointer"
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNATTENDED AUTO-SHOW SECURITY LOCK OVERLAY */}
      {consoleLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                Consola Bloqueada (Modo Show Desatendido)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                El teclado y los botones están protegidos contra toques accidentales mientras el show corre hacia tu nodo Hahan SL04 Box (2.0.0.44).
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado Hahan USB:</span>
                <span className="font-mono font-bold text-emerald-400">
                  🟢 2.0.0.44 ({artnetPackets} tramas DMX)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Secuenciador Auto-Show:</span>
                <span className="font-bold text-purple-300">
                  {autoShowRunning
                    ? `ACTIVO · Cue ${autoShowStepIndex + 1}/${autoShowSteps.length}`
                    : 'Manual / Fijo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tempo Actual:</span>
                <span className="font-mono font-bold text-amber-300">{bpm} BPM</span>
              </div>
            </div>

            <button
              onClick={() => setConsoleLocked(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              DESBLOQUEAR CONSOLA
            </button>
          </div>
        </div>
      )}

      {/* CLEAN WINDOWS-STYLE MENU BAR + LIVE DIRECT TRANSPORT HEADER */}
      <header className="relative z-40 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        {/* Left: Brand + Windows-Style Dropdown Menus (Archivo, Montaje & Hahan, Editores & Show, Ventanas) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black tracking-wide text-white uppercase">
                  GrandDas
                </h1>
                {midiDeviceName && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🎹 MIDI
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dropdown Menu Bar (Hidden when Kiosk / Safe Club Mode is locked) */}
          {!kioskSafeMode ? (
          <div className="flex items-center gap-1">
            {/* 1. MENU ARCHIVO */}
            <div className="relative">
              <button
                onClick={() => setOpenTopMenu((m) => (m === 'file' ? null : 'file'))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  openTopMenu === 'file'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                Archivo
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openTopMenu === 'file' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50">
                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      handleSaveGrandDasShow();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>Guardar Show (.granddas.json)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Guarda focos, recetas, cues y agenda
                      </div>
                    </div>
                  </button>

                  <label className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-slate-200 cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>Cargar Show (.granddas.json)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Abre un archivo de show guardado
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        setOpenTopMenu(null);
                        handleLoadGrandDasShow(e);
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      handleExportDaslightDvc();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-sky-300 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div>Exportar Proyecto Daslight 5 (.dvc)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Compila tus recetas para abrirlas en Daslight 5
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">
                      ✅ Auto-Guardado Activo
                    </span>
                    <span className="font-mono text-slate-400">
                      {lastAutoSaveTime || 'Sincronizado'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsBackupModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>Copias de Seguridad (Volver Atrás)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Recupera el show tal como estaba hace minutos u horas
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      handleResetFactoryShow();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/15 flex items-center gap-2.5 text-left text-xs font-bold text-rose-300 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div>Restaurar Show Demo de Fábrica</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Reinicia focos, recetas y cues al estado inicial
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. MENU MONTAJE, PATCH & HAHAN */}
            <div className="relative">
              <button
                onClick={() => setOpenTopMenu((m) => (m === 'patch' ? null : 'patch'))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  openTopMenu === 'patch'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                Montaje & Patch ({fixtures.length})
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openTopMenu === 'patch' && (
                <div className="absolute left-0 mt-1.5 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1.5 z-50">
                  {/* 1-Click Quick Rig Presets (factory + your own saved rigs) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-amber-400">
                      ⚡ Cambiar Montaje Rápido (1 Clic):
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-0.5">
                      {[...RIG_PRESETS, ...customRigs].map((preset) => {
                        const isCustom = customRigs.some((r) => r.id === preset.id);
                        const isCurrent = rigSignature(preset.fixtures) === currentRigSignature;
                        return (
                          <div key={preset.id} className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (isCurrent) return;
                                requestSafetyBackup('antes_cambiar_montaje');
                                setFixtures(JSON.parse(JSON.stringify(preset.fixtures)));
                                setOpenTopMenu(null);
                              }}
                              className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold flex items-center justify-between border transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-500 text-slate-950 border-white shadow'
                                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-amber-500/50'
                              }`}
                              title={preset.subtitle}
                            >
                              <span className="truncate">
                                {isCustom ? '⭐ ' : ''}
                                {preset.name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                  isCurrent ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {preset.fixtures.length}u
                              </span>
                            </button>
                            {isCustom && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Borrar el montaje guardado «${preset.name}»?`)) {
                                    setCustomRigs((prev) => prev.filter((r) => r.id !== preset.id));
                                  }
                                }}
                                className="px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-300 text-[10px] cursor-pointer"
                                title="Borrar este montaje guardado"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        const name = window.prompt(
                          'Nombre para guardar este montaje (ej: "Boda Finca El Olivar"):',
                          `Mi montaje ${fixtures.length} focos`
                        );
                        if (!name || !name.trim()) return;
                        const counts = (['beams', 'spots', 'washes', 'blinders', 'strobes', 'bars'] as GroupId[])
                          .map((g) => ({ g, n: fixtures.filter((f) => f.groupId === g).length }))
                          .filter((x) => x.n > 0)
                          .map((x) => `${x.n}x ${x.g}`)
                          .join(', ');
                        setCustomRigs((prev) => [
                          ...prev,
                          {
                            id: `rig_user_${Date.now().toString(36)}`,
                            name: name.trim(),
                            subtitle: counts,
                            badge: `${fixtures.length} Focos · Mío`,
                            fixtures: JSON.parse(JSON.stringify(fixtures)),
                          },
                        ]);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-black cursor-pointer"
                    >
                      💾 Guardar Montaje Actual con Nombre…
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsCloneModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>Clonador de Grupos, Patch & Importar .DVC</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Cambia tus focos o importa shows de Daslight 5
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsFixtureBuilderOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-orange-300 cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <div>Editor Visual de Fixtures (.SSL2) & Plano 2D</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Crea perfiles de focos y colócalos en el escenario 2D
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsChannelFinderOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-emerald-300 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>🔍 Buscador / Escáner Rápido de Focos Reales</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Descubre qué hace cada canal DMX en vivo y crea el perfil en 1 clic
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsDmxTesterOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div>Monitor / Tester 512 Canales + Hoja Pines DIP</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Prueba canales sueltos e imprime la hoja de montaje
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  {/* Hahan Hardware Settings neatly inside the Hardware menu */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5" />
                        Interfaz Hahan SL04 Box
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {artnetPackets} pkts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">IP:</span>
                      <input
                        type="text"
                        value={artnetIp}
                        onChange={(e) => handleChangeArtnetIp(e.target.value)}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs"
                      />
                      <button
                        onClick={() => {
                          const nextOffset: 0 | 1 = artnetUniOffset === 0 ? 1 : 0;
                          setArtnetUniOffset(nextOffset);
                          fetch('/api/artnet/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ universeOffset: nextOffset }),
                          }).catch(() => {});
                        }}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 font-mono text-[10px] cursor-pointer"
                      >
                        SubUni:{artnetUniOffset}..{artnetUniOffset + 3}
                      </button>
                      <button
                        onClick={() => {
                          const nextBc = !artnetUseBroadcast;
                          setArtnetUseBroadcast(nextBc);
                          fetch('/api/artnet/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ useBroadcast: nextBc }),
                          }).catch(() => {});
                        }}
                        className={`px-2 py-1 rounded border font-mono text-[10px] cursor-pointer ${
                          artnetUseBroadcast
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {artnetUseBroadcast ? 'BCast' : 'Direct'}
                      </button>
                    </div>

                    <button
                      onClick={() => setHahanSplitterMode((s) => !s)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-between transition cursor-pointer ${
                        hahanSplitterMode
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                      title="Clona el Universo 1 en las 4 bocas XLR del Hahan SL04 Box si los Universos 2, 3 o 4 están vacíos"
                    >
                      <span>🔀 Modo Splitter 4 Bocas XLR (Clonar Uni 1)</span>
                      <span className="font-mono font-black">
                        {hahanSplitterMode ? 'ON (4x Out)' : 'OFF'}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <button
                        onClick={() => {
                          setOpenTopMenu(null);
                          setCalibratingGroupId('beams');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Crosshair className="w-3 h-3" />
                        Calibrar 4P Beams
                      </button>
                      <button
                        onClick={() => {
                          setOpenTopMenu(null);
                          setCalibratingGroupId('washes');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Crosshair className="w-3 h-3" />
                        Calibrar 4P Washes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MENU EDITORES & PROGRAMACION */}
            <div className="relative">
              <button
                onClick={() => setOpenTopMenu((m) => (m === 'tools' ? null : 'tools'))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  openTopMenu === 'tools' || isRightDrawerOpen || learnModeActive
                    ? 'bg-slate-800 text-purple-300 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                Editores & Programación
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openTopMenu === 'tools' && (
                <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50">
                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsAutoShowModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-purple-300 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div>Programar Auto-Show & Agenda 24h</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Edita la lista de Cues por minutos y horarios
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsSongTimelineOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-pink-300 cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-pink-400 shrink-0" />
                    <div>
                      <div>🎵 Timeline de Canción (Sincronizar Música)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Carga un MP3 y dispara los Looks en el segundo exacto
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsRightDrawerOpen((o) => !o);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    {isRightDrawerOpen ? (
                      <PanelRightClose className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <PanelRightOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div>
                        {isRightDrawerOpen
                          ? 'Ocultar Inspector Recetas / Pool MA2'
                          : 'Abrir Inspector Recetas / Pool MA2'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Edita ondas, wings, colores y efectos de cada botón
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      handleSaveCurrentAsSnapshot();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-emerald-300 cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>Guardar Estado Actual como Macro-Look</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Añade un botón rápido a la fila de Looks
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsCalibratingPosPreset((v) => !v);
                      if (globalPositionOverride === 'transparent') {
                        setGlobalPositionOverride('dj_booth');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    <Crosshair className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div>Calibrar Posiciones MA2 en Sala (Pan/Tilt/Fan)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Ajusta dónde está la Cabina DJ, Público o Cielo
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setLearnModeActive((l) => !l);
                      setLearningTarget(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-pink-300 cursor-pointer"
                  >
                    <Keyboard className="w-4 h-4 text-pink-400 shrink-0" />
                    <div>
                      <div>
                        {learnModeActive
                          ? 'Salir de Modo Learn MIDI / Teclas'
                          : 'Asignar Teclas y Botones MIDI (Learn)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Haz clic en un botón y pulsa tu controlador MIDI
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. MENU VENTANAS & REMOTO */}
            <div className="relative">
              <button
                onClick={() => setOpenTopMenu((m) => (m === 'windows' ? null : 'windows'))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  openTopMenu === 'windows'
                    ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                Ventanas & Remoto
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openTopMenu === 'windows' && (
                <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50">
                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      handleOpen3DSecondScreen();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-indigo-300 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div>Abrir Visualizador 3D en 2ª Pantalla</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Ventana dedicada para otro monitor
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setShowInlineMiniVisualizer((v) => !v);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div>
                        {showInlineMiniVisualizer
                          ? 'Ocultar Mini-3D Acoplado'
                          : 'Mostrar Mini-3D Acoplado arriba'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Vista previa compacta si usas 1 sola pantalla
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setIsMobileRemoteModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-emerald-300 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>Mando Técnico Wi-Fi (Calibración 4P)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Enfoca límites de escenario desde el móvil
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setOpenTopMenu(null);
                      setMainWorkspaceView((v) =>
                        v === 'touch_wing' ? 'executors' : 'touch_wing'
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>
                        {mainWorkspaceView === 'touch_wing'
                          ? 'Volver a Vista 6 Bancos Ejecutores'
                          : 'Abrir Página Touch & Custom Fader Wing'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Crea tus propios Faders y Botones tipo Daslight Touch
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Modo Cabina Segura (Edición Protegida)</span>
            </div>
          )}

          {/* 1-Click Workspace Page Switcher: 6-Bank Executors vs. Daslight Touch & Fader Wing vs. Special FX Deck */}
          <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setMainWorkspaceView('executors')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                mainWorkspaceView === 'executors'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista clásica de 6 Bancos de Ejecutores"
            >
              🎛️ 6 Bancos
            </button>
            <button
              onClick={() => setMainWorkspaceView('touch_wing')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                mainWorkspaceView === 'touch_wing'
                  ? 'bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 shadow'
                  : 'text-cyan-300 hover:text-white'
              }`}
              title="Abrir Página de Fader Wing Personalizable + Daslight Touch + Crossfader DJ"
            >
              🎚️ Touch / Fader Wing
            </button>
            <button
              onClick={() => setMainWorkspaceView('sfx_deck')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                mainWorkspaceView === 'sfx_deck'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow'
                  : 'text-rose-300 hover:text-white'
              }`}
              title="Abrir Pantalla Grande de Efectos Especiales: Sparkular, CO2, Fuego y Confeti con generador Sine / PWM"
            >
              🧨 FX Especiales (CO2/Fuego/Sparkular)
            </button>
          </div>

          {/* Prominent Hahan SL04 Box Green LED Status Pill */}
          <button
            onClick={() => setOpenTopMenu((m) => (m === 'patch' ? null : 'patch'))}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold cursor-pointer transition shadow ${
              artnetConnected
                ? 'bg-emerald-950/80 border-emerald-400/70 text-emerald-300 shadow-emerald-500/20 hover:border-emerald-300'
                : 'bg-amber-950/80 border-amber-400/70 text-amber-300 hover:border-amber-300'
            }`}
            title="Interfaz Hahan SL04 Box por USB RNDIS (Haz clic para configurar IP / Splitter 4 Bocas)"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                artnetConnected
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span>
              {artnetConnected
                ? `🟢 HAHAN ${artnetIp}`
                : `🔌 Hahan ${artnetIp}`}
            </span>
          </button>
        </div>

        {/* Center: ONLY Live Musical Tempo & Audio FFT Controls */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-right mr-1">
            <div className="text-xs font-black font-mono text-amber-400">{bpm} BPM</div>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-16 h-1 accent-amber-500 block cursor-pointer"
            />
          </div>
          <button
            onClick={handleTapTempo}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition cursor-pointer"
            title="Tap Tempo (Barra Espaciadora)"
          >
            TAP
          </button>
          <button
            onClick={handleToggleAudioMic}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
              audioListening
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Audio-to-Light real por Micrófono / Línea (Analizador FFT Graves/Medios/Agudos)"
          >
            <Music className="w-3.5 h-3.5" />
            {audioListening ? 'Mic ON' : 'Mic FFT'}
          </button>

          <button
            onClick={() => {
              if (audioListening) {
                audioCtxRef.current?.close();
                audioCtxRef.current = null;
                setAudioListening(false);
              }
              setAudioDemoSim((d) => {
                const next = !d;
                if (!next) setAudioBands({ bass: 0, mid: 0, high: 0, kickFlash: false });
                return next;
              });
            }}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
              audioDemoSim
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Simulador de Audio FFT + Breakdown/Drop para probar la reacción musical sin micro conectado"
          >
            {audioDemoSim ? '🎵 Demo ON' : 'Demo'}
          </button>

          {(audioListening || audioDemoSim) && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">
              <div className="flex items-end gap-0.5 h-4 w-7" title="Graves / Medios / Agudos">
                <div
                  className="w-2 bg-rose-500 rounded-t transition-all duration-75"
                  style={{ height: `${Math.max(15, audioBands.bass)}%` }}
                />
                <div
                  className="w-2 bg-amber-400 rounded-t transition-all duration-75"
                  style={{ height: `${Math.max(15, audioBands.mid)}%` }}
                />
                <div
                  className="w-2 bg-cyan-400 rounded-t transition-all duration-75"
                  style={{ height: `${Math.max(15, audioBands.high)}%` }}
                />
              </div>
              <button
                onClick={() => setAudioAutoDrop((a) => !a)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black transition cursor-pointer ${
                  audioAutoDrop
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
                title="Auto-Drop: baja la velocidad en los parones musicales y explota al volver el subgrave"
              >
                {audioBands.kickFlash ? '🥁 KICK!' : 'Auto-Drop'}
              </button>
            </div>
          )}
        </div>

        {/* Right: ONLY Direct Live Show Controls (Auto-Show Play/Pause, Worklight Cortesía, Freeze DMX, 3D Popout, Console Lock) */}
        <div className="flex items-center gap-1.5">
          {/* 1-Click Auto-Show Live Play/Pause + Edit button */}
          <div className="flex items-center rounded-xl overflow-hidden border border-purple-500/40 bg-slate-950">
            <button
              onClick={() => {
                setAutoShowRunning((prev) => {
                  const target = !prev;
                  if (target && autoShowSteps.length > 0) {
                    const safeIdx =
                      autoShowStepIndex < autoShowSteps.length ? autoShowStepIndex : 0;
                    handleJumpToAutoShowStep(safeIdx);
                  }
                  return target;
                });
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-black transition cursor-pointer ${
                autoShowRunning
                  ? 'bg-emerald-500 text-slate-950 animate-pulse'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200'
              }`}
              title="Arrancar / Pausar el Show Automático de Horas en directo"
            >
              {autoShowRunning ? (
                <Pause className="w-3.5 h-3.5 fill-slate-950" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              {autoShowRunning
                ? `Auto-Show (${autoShowStepIndex + 1}/${autoShowSteps.length})`
                : 'Auto-Show'}
            </button>
            <button
              onClick={() => setIsAutoShowModalOpen(true)}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border-l border-purple-500/30 text-[10px] font-bold cursor-pointer"
              title="Abrir lista de Cues y Agenda Horaria del Auto-Show"
            >
              Cues
            </button>
          </div>

          {/* 1-Click Channel Finder / Unknown Fixture Scanner */}
          {!kioskSafeMode && (
            <button
              onClick={() => setIsChannelFinderOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-black text-xs transition cursor-pointer"
              title="Buscador / Escáner Rápido de Focos Reales: sube canales de 0 a 255 en vivo, etiquétalos y guarda el perfil en 1 clic"
            >
              <Search className="w-3.5 h-3.5" />
              Test Focos
            </button>
          )}

          {/* 1-Click Mobile Wi-Fi Stage Remote + Offline QR */}
          <button
            onClick={() => setIsMobileRemoteModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-black text-xs transition cursor-pointer"
            title="Abrir Mando Móvil Wi-Fi + Código QR Offline (Calibración de escenario desde pista y test de focos)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mando QR
          </button>

          {/* 1-Click Worklight / Luz de Cortesía */}
          <button
            onClick={() => setWorklightActive((w) => !w)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              worklightActive
                ? 'bg-amber-300 text-slate-950 border-white shadow-lg shadow-amber-300/30'
                : 'bg-slate-950 border-slate-800 text-amber-200 hover:border-amber-400/50'
            }`}
            title="Luz de Sala / Trabajo en Blanco Cálido al 85% sin movimiento (ideal para recoger, limpiar o montaje)"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Luz Trabajo
          </button>

          {/* 1-Click Freeze DMX Output */}
          <button
            onClick={() => setFreezeDmx((f) => !f)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              freezeDmx
                ? 'bg-sky-400 text-slate-950 border-white animate-pulse shadow-lg shadow-sky-400/30'
                : 'bg-slate-950 border-slate-800 text-sky-300 hover:border-sky-400/50'
            }`}
            title="Congela inmediatamente la foto DMX actual en el escenario"
          >
            <Snowflake className="w-3.5 h-3.5" />
            Freeze
          </button>

          {/* Quick 1-Click Inline Mini-3D Preview Toggle + 2nd Screen 3D Popout */}
          <button
            onClick={() => setShowInlineMiniVisualizer((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-black text-xs transition cursor-pointer ${
              showInlineMiniVisualizer
                ? 'bg-indigo-500 text-white border-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-950 border-slate-800 text-indigo-300 hover:border-indigo-400/50'
            }`}
            title="Mostrar / Ocultar el Visualizador 3D integrado arriba en esta misma pantalla"
          >
            <Eye className="w-3.5 h-3.5" />
            Mini-3D
          </button>

          <button
            onClick={handleOpen3DSecondScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs shadow transition cursor-pointer"
            title="Abrir Visualizador 3D en 2ª Pantalla independiente"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            3D
          </button>

          {/* 1-Click Clean / Zen Mode Toggle */}
          <button
            onClick={() => setZenCleanMode((z) => !z)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              zenCleanMode
                ? 'bg-emerald-400 text-slate-950 border-white shadow-lg shadow-emerald-400/30'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title="Modo Pantalla Limpia (Zen): Oculta la barra de paletas secundarias para dejar solo los botones grandes y faders"
          >
            <Eye className="w-3.5 h-3.5" />
            {zenCleanMode ? 'Vista Limpia ON' : 'Vista Limpia'}
          </button>

          {/* Safe Club / Kiosk Mode (Protects editing while keeping all live buttons active) */}
          <button
            onClick={() => {
              if (kioskSafeMode) {
                setKioskUnlockModalOpen(true);
              } else {
                setKioskSafeMode(true);
                setIsRightDrawerOpen(false);
                setOpenTopMenu(null);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              kioskSafeMode
                ? 'bg-emerald-500 text-slate-950 border-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-emerald-300'
            }`}
            title="Modo Cabina Segura (Club Lock): oculta menús técnicos y edición con PIN (1234) dejando todos los botones de directo operativos"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {kioskSafeMode ? 'Cabina Segura ON' : 'Modo Cabina'}
          </button>

          {/* Lock Console for Unattended Auto-Show */}
          <button
            onClick={() => setConsoleLocked(true)}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-300 transition cursor-pointer"
            title="Bloqueo Total de Pantalla (Show Desatendido)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* SMART DIAGNOSTIC ALERT BANNER (Shows if any group is Muted, Soloed, Frozen, Blackout, Worklight, Stomp, or Grand Master < 100%) */}
      {(() => {
        const mutedGroups = (Object.values(groupCalibrations) as GroupCalibration[]).filter(
          (c) => c.blackout
        );
        const soloGroups = (Object.values(groupCalibrations) as GroupCalibration[]).filter(
          (c) => c.soloActive
        );
        const hasWarning =
          globalBlackout ||
          freezeDmx ||
          worklightActive ||
          stompMovement ||
          isolateDmxUniverse !== null ||
          mutedGroups.length > 0 ||
          soloGroups.length > 0 ||
          globalMaster < 0.99;

        if (!hasWarning) return null;

        return (
          <div className="px-4 py-1 bg-amber-500/15 border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-amber-300 uppercase">
                ⚠️ Avisador de Estado en Vivo:
              </span>
              {globalBlackout && (
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                  🌑 BLACKOUT GENERAL ACTIVO
                </span>
              )}
              {worklightActive && (
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                  💡 LUZ DE TRABAJO ACTIVA (85% Cálido Fijo)
                </span>
              )}
              {freezeDmx && (
                <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-black text-[10px]">
                  ❄️ FREEZE DMX CONGELADO
                </span>
              )}
              {stompMovement && (
                <span className="px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-black text-[10px]">
                  🛑 STOMP P/T ACTIVO (Movimiento Parado)
                </span>
              )}
              {isolateDmxUniverse !== null && (
                <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px]">
                  🔍 UNIVERSO {isolateDmxUniverse} AISLADO POR BUSCADOR DE FOCOS
                </span>
              )}
              {globalMaster < 0.99 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-amber-200 font-bold text-[10px]">
                  🎚️ Grand Master al {Math.round(globalMaster * 100)}%
                </span>
              )}
              {soloGroups.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px]">
                  🎯 MODO SOLO: {soloGroups.map((g) => g.name.split('·')[1] || g.name).join(', ')} (El resto está silenciado)
                </span>
              )}
              {mutedGroups.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-500/30 border border-rose-400 text-rose-200 font-bold text-[10px]">
                  🔇 GRUPOS EN MUTE: {mutedGroups.map((g) => g.name.split('·')[1] || g.name).join(', ')}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setGlobalBlackout(false);
                setFreezeDmx(false);
                setWorklightActive(false);
                setStompMovement(false);
                setIsolateDmxUniverse(null);
                setManualDmxOverrides({});
                setSceneSubmasterLevels({});
                setDjCrossfaderPos(0);
                setGlobalMaster(1);
                setGroupCalibrations((prev) => {
                  const next = { ...prev };
                  (Object.keys(next) as GroupId[]).forEach((k) => {
                    next[k] = {
                      ...next[k],
                      blackout: false,
                      soloActive: false,
                      masterDimmer: next[k].masterDimmer < 0.1 ? 1 : next[k].masterDimmer,
                    };
                  });
                  return next;
                });
              }}
              className="px-2.5 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer shadow"
            >
              ✨ Restaurar Todo al 100% (Quitar Mute/Solo/Luz Trabajo/Freeze)
            </button>
          </div>
        );
      })()}

      {/* LIVE AUTO-SHOW SEQUENCER PROGRESS BAR (WHEN ACTIVE) */}
      {autoShowRunning && autoShowSteps[autoShowStepIndex] && (
        <div className="px-4 py-1.5 bg-purple-950/80 border-b border-purple-500/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase animate-pulse">
              ⏱️ AUTO-SHOW EN BUCLE ∞
            </span>
            <span className="font-bold text-white">
              Cue {autoShowStepIndex + 1}/{autoShowSteps.length}:{' '}
              <span className="text-amber-300">{autoShowSteps[autoShowStepIndex].name}</span>
            </span>
            <span className="font-mono text-purple-200 text-[11px]">
              (Restante:{' '}
              {formatDurationMinSec(
                Math.max(0, autoShowSteps[autoShowStepIndex].durationSec - autoShowElapsedSec)
              )}{' '}
              min · Fade {autoShowSteps[autoShowStepIndex].fadeSec.toFixed(1)}s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-36 h-2 rounded-full bg-slate-900 overflow-hidden border border-purple-500/30">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (autoShowElapsedSec /
                      Math.max(1, autoShowSteps[autoShowStepIndex].durationSec)) *
                      100
                  )}%`,
                }}
              />
            </div>

            <button
              onClick={() =>
                handleJumpToAutoShowStep((autoShowStepIndex + 1) % autoShowSteps.length)
              }
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold cursor-pointer"
            >
              <SkipForward className="w-3 h-3" />
              Siguiente Cue
            </button>

            <button
              onClick={() => setIsAutoShowModalOpen(true)}
              className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-[10px] font-bold cursor-pointer"
            >
              Editar Cues
            </button>

            <button
              onClick={() => setAutoShowRunning(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-bold cursor-pointer"
            >
              <Pause className="w-3 h-3" />
              Pausar
            </button>
          </div>
        </div>
      )}

      {/* MIDI / KEY LEARN BANNER */}
      {learnModeActive && (
        <div className="px-4 py-1.5 bg-pink-600/90 text-white text-xs font-bold flex items-center justify-between shrink-0">
          <span>
            🎹 <strong>MODO LEARN ACTIVO:</strong>{' '}
            {learningTarget
              ? `Pulsa ahora cualquier TECLA o PAD MIDI para asignarlo a «${learningTarget.label}»...`
              : 'Haz clic en cualquier botón Ejecutor o Macro-Look para elegirlo...'}
          </span>
          <button
            onClick={() => {
              setLearnModeActive(false);
              setLearningTarget(null);
            }}
            className="px-2.5 py-0.5 rounded bg-black/40 hover:bg-black/60 text-white text-[11px] cursor-pointer"
          >
            Salir de Learn [Esc]
          </button>
        </div>
      )}

      {/* UNIFIED CLEAN TABBED LIVE PALETTE BAR (Hidden when Zen Clean Mode is ON) */}
      {!zenCleanMode && (
        <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Left: 4 Clean Palette Category Tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 shrink-0">
            {(
              [
                { id: 'looks', label: '🎬 1. Macro-Looks' },
                { id: 'colors', label: '🎨 2. Color & Kelvin' },
                { id: 'positions', label: '🎯 3. Posiciones MA2' },
                { id: 'optics', label: '🔮 4. Gobos, Zoom & Golpes' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTopTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  activeTopTab === tab.id
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Center: Content of the Active Tab (Only 1 clean row at a time!) */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5">
            {activeTopTab === 'looks' && (
              <>
                <button
                  onClick={() => handleStepSnapshotCue(-1)}
                  className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 shrink-0 cursor-pointer"
                  title="Macro-Look anterior"
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleStepSnapshotCue(1)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow shrink-0 cursor-pointer"
                  title="Avanzar al siguiente Macro-Look [G]"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-slate-950" />
                  GO+ [G]
                </button>
                <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />
                {snapshotCues.map((cue) => {
                  const isCurrent = activeSnapshotId === cue.id;
                  const bound = controlBindings[cue.id];
                  return (
                    <button
                      key={cue.id}
                      onClick={() => handleTriggerSnapshot(cue)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-800 text-white border-white shadow-md'
                          : 'bg-slate-950/90 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                      style={{ borderBottomWidth: '3px', borderBottomColor: cue.colorHex }}
                    >
                      <span>{cue.name}</span>
                      <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                        {bound?.keyLabel || cue.hotkey}
                      </span>
                    </button>
                  );
                })}
                <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />
                {/* Auto-Piloto 8B / 16B & Crossfader DJ A <-> B */}
                <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-0.5 shrink-0">
                  <span className="text-[9px] font-black text-amber-400 uppercase">Auto:</span>
                  {([0, 8, 16] as const).map((mode) => (
                    <button
                      key={String(mode)}
                      onClick={() => setAutopilotBeats(mode)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer transition ${
                        autopilotBeats === mode
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 0 ? 'Off' : `${mode}B`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-0.5 shrink-0">
                  <span className="text-[9px] font-black text-cyan-400">A</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={djCrossfaderPos}
                    onChange={(e) =>
                      handleDjCrossfaderChange(djLookA, djLookB, Number(e.target.value))
                    }
                    className="w-16 h-1.5 accent-amber-400 cursor-pointer"
                    title="Crossfader DJ entre Movimiento A (Círculo) y Movimiento B (Ballyhoo)"
                  />
                  <span className="text-[9px] font-black text-rose-400">B</span>
                </div>
              </>
            )}

            {activeTopTab === 'colors' && (
              <>
                <button
                  onClick={() => {
                    setCustomRgbwOverride((prev) => ({ ...prev, enabled: false }));
                    setActiveColorThemeId('auto');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                    activeColorThemeId === 'auto' && !customRgbwOverride.enabled
                      ? 'bg-pink-500 text-slate-950 border-pink-300 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Auto (Escena)
                </button>
                {GLOBAL_COLOR_THEMES.map((theme) => {
                  const isSelected =
                    activeColorThemeId === theme.id && !customRgbwOverride.enabled;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setCustomRgbwOverride((prev) => ({ ...prev, enabled: false }));
                        setActiveColorThemeId(theme.id);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white border-white shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${theme.hexA} 50%, ${theme.hexB} 50%)`,
                        }}
                      />
                      <span>{theme.label}</span>
                    </button>
                  );
                })}

                <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-800 shrink-0">
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
                      setCustomRgbwOverride((prev) => ({ ...prev, enabled: true, r, g, b }));
                    }}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700"
                    title="Selector Libre RGBW"
                  />
                  <button
                    onClick={() =>
                      setCustomRgbwOverride((prev) => ({ ...prev, enabled: !prev.enabled }))
                    }
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      customRgbwOverride.enabled
                        ? 'bg-pink-500 text-slate-950 border-white shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {customRgbwOverride.enabled
                      ? `Blanco ${customRgbwOverride.kelvin}K`
                      : 'RGBW / Kelvin'}
                  </button>
                  <span className="text-[10px] text-amber-200 font-bold">2700K</span>
                  <input
                    type="range"
                    min={2700}
                    max={8000}
                    step={100}
                    value={customRgbwOverride.kelvin}
                    onChange={(e) => {
                      const k = parseInt(e.target.value, 10);
                      const norm = (k - 2700) / (8000 - 2700);
                      const r = norm < 0.5 ? 255 : Math.round(255 - (norm - 0.5) * 110);
                      const g =
                        norm < 0.5
                          ? Math.round(180 + norm * 150)
                          : Math.round(255 - (norm - 0.5) * 30);
                      const b = norm < 0.5 ? Math.round(90 + norm * 330) : 255;
                      const w = Math.round(180 + (1 - Math.abs(norm - 0.5) * 2) * 75);
                      setCustomRgbwOverride((prev) => ({
                        ...prev,
                        enabled: true,
                        kelvin: k,
                        r,
                        g,
                        b,
                        w,
                      }));
                    }}
                    className="w-20 h-1.5 accent-amber-300 cursor-pointer"
                  />
                  <span className="text-[10px] text-sky-300 font-bold">8000K</span>
                </div>
              </>
            )}

            {activeTopTab === 'positions' && (
              <>
                <button
                  onClick={() => {
                    setGlobalPositionOverride('transparent');
                    setIsCalibratingPosPreset(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                    globalPositionOverride === 'transparent'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Auto (Receta)
                </button>
                {(
                  Object.values(positionCalibrations) as PositionPaletteCalibration[]
                ).map((preset) => {
                  const isActive = globalPositionOverride === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setGlobalPositionOverride(preset.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-white shadow'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-white'
                      }`}
                    >
                      {preset.shortLabel}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setFollowspotOpen((prev) => {
                      const next = !prev;
                      setManualXY((m) => ({ ...m, enabled: next }));
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black border transition shrink-0 cursor-pointer ${
                    followspotOpen
                      ? 'bg-amber-400 text-slate-950 border-white shadow'
                      : 'bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                  }`}
                >
                  🎯 Cañón XY {followspotOpen ? 'ACTIVO' : ''}
                </button>
                {globalPositionOverride !== 'transparent' && (
                  <button
                    onClick={() => setIsCalibratingPosPreset((v) => !v)}
                    className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-cyan-300 cursor-pointer"
                  >
                    ⚙️ Ajustar Punto
                  </button>
                )}
              </>
            )}

            {activeTopTab === 'optics' && (
              <>
                {/* Gobo Wheel Quick Selector for Spots & Beams */}
                <span className="text-[10px] font-black uppercase text-purple-400 shrink-0">
                  Gobos:
                </span>
                {[
                  { slot: 'auto' as const, label: 'Auto' },
                  { slot: 0, label: '⚪ Abierto' },
                  { slot: 1, label: '☀️ G1 Rayos' },
                  { slot: 2, label: '✨ G2 Estrellas' },
                  { slot: 3, label: '🌀 G3 Anillo' },
                  { slot: 4, label: '🟣 G4 Puntos' },
                ].map((g) => (
                  <button
                    key={String(g.slot)}
                    onClick={() =>
                      setGlobalOptics((prev) => ({ ...prev, goboSlot: g.slot }))
                    }
                    className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition shrink-0 cursor-pointer ${
                      globalOptics.goboSlot === g.slot
                        ? 'bg-purple-500 text-slate-950 border-white shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

                {/* Global Prism Toggle */}
                <button
                  onClick={() =>
                    setGlobalOptics((prev) => ({
                      ...prev,
                      prismActive: prev.prismActive === true ? 'auto' : true,
                    }))
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition shrink-0 cursor-pointer ${
                    globalOptics.prismActive === true
                      ? 'bg-amber-400 text-slate-950 border-white shadow'
                      : 'bg-slate-950 text-amber-300 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  💎 Prisma {globalOptics.prismActive === true ? 'ON' : 'Auto'}
                </button>

                {/* Global Zoom Slider */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 text-[10px]">
                  <span className="text-sky-300 font-bold">Zoom:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={
                      globalOptics.zoomValue === 'auto'
                        ? 50
                        : Math.round(globalOptics.zoomValue * 100)
                    }
                    onChange={(e) =>
                      setGlobalOptics((prev) => ({
                        ...prev,
                        zoomValue: parseInt(e.target.value, 10) / 100,
                      }))
                    }
                    className="w-16 h-1.5 accent-sky-400 cursor-pointer"
                  />
                  {globalOptics.zoomValue !== 'auto' && (
                    <button
                      onClick={() =>
                        setGlobalOptics((prev) => ({ ...prev, zoomValue: 'auto' }))
                      }
                      className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Auto
                    </button>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0" />

                {/* Temp Bumps Q W E R */}
                {TEMP_COLOR_BUMPS.map((b) => {
                  const isPressed = tempColorBump === b.palette;
                  return (
                    <button
                      key={b.palette}
                      onMouseDown={() => setTempColorBump(b.palette)}
                      onMouseUp={() => setTempColorBump(null)}
                      onMouseLeave={() => isPressed && setTempColorBump(null)}
                      className={`px-2 py-1 rounded-xl text-[10px] font-black border transition shrink-0 cursor-pointer ${
                        isPressed
                          ? 'scale-95 text-slate-950 border-white'
                          : 'bg-slate-950 text-slate-200 border-slate-800'
                      }`}
                      style={{
                        backgroundColor: isPressed ? b.hex : undefined,
                        borderBottomWidth: '3px',
                        borderBottomColor: b.hex,
                      }}
                    >
                      {b.label} [{b.hotkey}]
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Right: Always-Accessible Live Performance Triggers (SUBIDA/DROP, Stomp, Resync, Humo) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onMouseDown={() => setBuildUpActive(true)}
              onMouseUp={() => buildUpActive && triggerDropImpact()}
              onMouseLeave={() => buildUpActive && triggerDropImpact()}
              className={`relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                dropImpactActive
                  ? 'bg-white text-slate-950 border-white shadow-xl scale-105'
                  : buildUpActive
                    ? 'bg-amber-500 text-slate-950 border-white shadow-lg'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white border-amber-300/40 shadow'
              }`}
              title="Mantén pulsado (o pulsa [D]) para acelerar la SUBIDA y suelta para disparar el 💥 DROP!"
            >
              {buildUpActive && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/35 transition-all duration-75"
                  style={{ width: `${buildUpProgress}%` }}
                />
              )}
              <span className="relative z-10">
                {dropImpactActive
                  ? '💥 ¡DROP!'
                  : buildUpActive
                    ? `🚀 ${Math.round(buildUpProgress)}%`
                    : '🚀 SUBIDA / DROP [D]'}
              </span>
            </button>

            <button
              onClick={() => setStompMovement((s) => !s)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                stompMovement
                  ? 'bg-orange-500 text-slate-950 border-orange-300 animate-pulse'
                  : 'bg-slate-950 text-orange-300 border-orange-500/40 hover:bg-orange-500/15'
              }`}
              title="Parar/Congelar Movimiento Pan/Tilt [S]"
            >
              {stompMovement ? '🛑 STOMP ON' : 'Stomp P/T [S]'}
            </button>

            <button
              onClick={handleResyncBeatPhase}
              className="px-2 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-black transition cursor-pointer"
              title="Reiniciar ondas al Beat 1 [Enter]"
            >
              🔄 Beat 1
            </button>

            <button
              onMouseDown={() => setHazeBlastActive(true)}
              onMouseUp={() => setHazeBlastActive(false)}
              onMouseLeave={() => hazeBlastActive && setHazeBlastActive(false)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                hazeBlastActive
                  ? 'bg-teal-400 text-slate-950 border-white shadow-lg scale-95'
                  : 'bg-slate-950 text-teal-300 border-teal-500/40 hover:bg-teal-500/15'
              }`}
              title="Ráfaga de Humo / Hazer al 100% [H]"
            >
              💨 Humo [H]
            </button>
          </div>

          {isCalibratingPosPreset && globalPositionOverride !== 'transparent' && (
            <div className="w-full flex flex-wrap items-center justify-end gap-2 text-[10px] pt-1 border-t border-slate-800">
              <span className="text-amber-300 font-bold">
                ⚙️ Calibrando «{positionCalibrations[globalPositionOverride].shortLabel}»:
              </span>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                <span className="text-slate-400">Pan:</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={Math.round(
                    positionCalibrations[globalPositionOverride].panOffsetNorm * 100
                  )}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    setPositionCalibrations((prev) => ({
                      ...prev,
                      [globalPositionOverride]: {
                        ...prev[globalPositionOverride],
                        panOffsetNorm: val,
                      },
                    }));
                  }}
                  className="w-16 h-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-slate-400">Tilt:</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={Math.round(
                    positionCalibrations[globalPositionOverride].tiltOffsetNorm * 100
                  )}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    setPositionCalibrations((prev) => ({
                      ...prev,
                      [globalPositionOverride]: {
                        ...prev[globalPositionOverride],
                        tiltOffsetNorm: val,
                      },
                    }));
                  }}
                  className="w-16 h-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-slate-400">Fan:</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={Math.round(
                    positionCalibrations[globalPositionOverride].fanFactor * 100
                  )}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    setPositionCalibrations((prev) => ({
                      ...prev,
                      [globalPositionOverride]: {
                        ...prev[globalPositionOverride],
                        fanFactor: val,
                      },
                    }));
                  }}
                  className="w-16 h-1 accent-amber-400 cursor-pointer"
                />
                <button
                  onClick={() => setIsCalibratingPosPreset(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING LIVE FOLLOWSPOT XY PAD (CAÑÓN DE SEGUIMIENTO EN DIRECTO) */}
      {followspotOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-72 bg-slate-900/95 backdrop-blur-md border-2 border-amber-400 rounded-2xl shadow-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-amber-400" />
              🎯 Cañón Seguimiento XY
            </span>
            <button
              onClick={() => {
                setFollowspotOpen(false);
                setManualXY((m) => ({ ...m, enabled: false }));
              }}
              className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer"
            >
              Soltar Show
            </button>
          </div>

          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const updatePos = (clientX: number, clientY: number) => {
                const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
                const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
                setManualXY((prev) => ({
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
            className="relative h-40 w-full rounded-xl bg-slate-950 border border-slate-700 cursor-crosshair overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(251,191,36,0.12) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800" />
            <div className="absolute top-1.5 left-2 text-[9px] text-slate-500 font-mono">
              ESCENARIO / FONDO
            </div>
            <div className="absolute bottom-1.5 left-2 text-[9px] text-slate-500 font-mono">
              PÚBLICO / FRENTE
            </div>
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/60 pointer-events-none"
              style={{
                left: `${((manualXY.panNorm + 1) / 2) * 100}%`,
                top: `${((manualXY.tiltNorm + 1) / 2) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'beams', label: 'Beams' },
                { id: 'spots', label: 'Spots' },
                { id: 'washes', label: 'Washes' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() =>
                  setManualXY((prev) => ({ ...prev, enabled: true, targetGroup: opt.id }))
                }
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                  manualXY.targetGroup === opt.id
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setFollowspotWhiteActive((w) => !w)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black border cursor-pointer ${
                followspotWhiteActive
                  ? 'bg-white text-slate-950 border-white shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {followspotWhiteActive ? '💡 Blanco 100% ON' : 'Usar Color Show'}
            </button>
            <button
              onClick={() => setManualXY((prev) => ({ ...prev, panNorm: 0, tiltNorm: 0 }))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
            >
              Centrar
            </button>
          </div>
        </div>
      )}

      {/* OPTIONAL COLLAPSIBLE MINI-3D PREVIEW (HIDDEN BY DEFAULT SO EXECUTORS ARE 100% CLEAN) */}
      {showInlineMiniVisualizer && (
        <div className="h-[290px] px-3 pt-2 shrink-0">
          <StageVisualizer
            fixtures={fixtures}
            profiles={profiles}
            groupCalibrations={groupCalibrations}
            fixtureFrames={fixtureFrames}
            universes={universes}
            onOpenCalibrationModal={(gId) => setCalibratingGroupId(gId)}
            onUpdateGroupCalibration={handleUpdateGroupCalibration}
            manualXY={manualXY}
            onUpdateManualXY={setManualXY}
            onPopoutWindow={handleOpen3DSecondScreen}
            highlightedFixtureId={highlightFixtureId}
            onToggleHighlightFixture={(fId) => setHighlightFixtureId(fId)}
            onUpdateFixture={handleUpdateSingleFixture}
            liveSfxLevels={liveSfxLevels}
          />
        </div>
      )}

      {/* MAIN WORKSPACE: SWITCH BETWEEN 6-BANK EXECUTORS AND DASLIGHT TOUCH / CUSTOM FADER WING */}
      {mainWorkspaceView === 'touch_wing' ? (
        <CustomTouchFaderWingView
          touchPages={touchPages}
          onUpdateTouchPages={setTouchPages}
          scenes={scenes}
          activeSceneIds={activeSceneIds}
          onToggleScene={handleToggleScene}
          onFlashDown={handleFlashDown}
          onFlashUp={handleFlashUp}
          sceneSubmasterLevels={sceneSubmasterLevels}
          onChangeSceneSubmaster={(sceneId, lvl) =>
            setSceneSubmasterLevels((prev) => ({ ...prev, [sceneId]: lvl }))
          }
          groupCalibrations={groupCalibrations}
          onUpdateGroupCalibration={handleUpdateGroupCalibration}
          globalMaster={globalMaster}
          onChangeGlobalMaster={setGlobalMaster}
          moveFxSpeed={moveFxSpeed}
          onChangeMoveFxSpeed={setMoveFxSpeed}
          chaseFxSpeed={chaseFxSpeed}
          onChangeChaseFxSpeed={setChaseFxSpeed}
          globalFxSize={globalFxSize}
          onChangeGlobalFxSize={setGlobalFxSize}
          globalFanSpread={globalFanSpread}
          onChangeGlobalFanSpread={setGlobalFanSpread}
          crossfadeSec={crossfadeSec}
          onChangeCrossfadeSec={setCrossfadeSec}
          bpm={bpm}
          onChangeBpm={setBpm}
          manualDmxOverrides={manualDmxOverrides}
          onSetDmxOverride={(u, ch1, val) => {
            const key = `${u}:${ch1}`;
            setManualDmxOverrides((prev) => {
              if (val === null) {
                const copy = { ...prev };
                delete copy[key];
                return copy;
              }
              return { ...prev, [key]: val };
            });
          }}
          snapshotCues={snapshotCues}
          activeSnapshotId={activeSnapshotId}
          onTriggerSnapshot={handleTriggerSnapshot}
          globalPositionOverride={globalPositionOverride}
          onChangeGlobalPositionOverride={setGlobalPositionOverride}
          positionCalibrations={positionCalibrations}
          activeColorThemeId={activeColorThemeId}
          onChangeColorThemeId={setActiveColorThemeId}
          colorThemes={GLOBAL_COLOR_THEMES}
          buildUpActive={buildUpActive}
          buildUpProgress={buildUpProgress}
          dropImpactActive={dropImpactActive}
          onStartBuildUp={() => setBuildUpActive(true)}
          onTriggerDropImpact={triggerDropImpact}
          hazeBlastActive={hazeBlastActive}
          onSetHazeBlastActive={setHazeBlastActive}
          worklightActive={worklightActive}
          onToggleWorklight={() => setWorklightActive((w) => !w)}
          freezeDmx={freezeDmx}
          onToggleFreezeDmx={() => setFreezeDmx((f) => !f)}
          stompMovement={stompMovement}
          onToggleStompMovement={() => setStompMovement((s) => !s)}
          onResyncBeat={handleResyncBeatPhase}
          globalBlackout={globalBlackout}
          onToggleBlackout={() => setGlobalBlackout((b) => !b)}
          manualXY={manualXY}
          onUpdateManualXY={setManualXY}
          followspotWhiteActive={followspotWhiteActive}
          onToggleFollowspotWhite={() => setFollowspotWhiteActive((w) => !w)}
          customRgbwOverride={customRgbwOverride}
          onUpdateCustomRgbwOverride={setCustomRgbwOverride}
          djLookA={djLookA}
          djLookB={djLookB}
          djCrossfaderPos={djCrossfaderPos}
          onChangeDjCrossfader={handleDjCrossfaderChange}
          isStandaloneTouchWindow={new URLSearchParams(window.location.search).get('window') === 'touch'}
        />
      ) : mainWorkspaceView === 'sfx_deck' ? (
        <SpecialFxDeckView
          sfxState={sfxState}
          onUpdateSfxState={setSfxState}
          liveSfxLevels={liveSfxLevels}
          bpm={bpm}
          hazeBlastActive={hazeBlastActive}
          onSetHazeBlastActive={setHazeBlastActive}
          autoHazeEnabled={autoHazeEnabled}
          onToggleAutoHaze={() => setAutoHazeEnabled((a) => !a)}
          onEmergencyStopAllSfx={() => {
            setHazeBlastActive(false);
            setAutoHazeEnabled(false);
            setSfxState((prev) => ({
              ...prev,
              armed: false,
              sparkularPattern: 'off',
              sparkularManualUnits: [0, 0, 0, 0],
              co2Pattern: 'off',
              co2ManualUnits: [false, false, false, false],
              flamePattern: 'off',
              flameManualUnits: [false, false, false, false],
              confettiPattern: 'off',
              confettiManualUnits: [0, 0],
            }));
          }}
        />
      ) : (
        <div className="flex-1 min-h-0 flex gap-2.5 p-3 overflow-hidden">
          {/* 6-Column Dedicated Executor Matrix */}
        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 h-full overflow-hidden">
          {banks.map((bank) => {
            const bankScenes = scenes.filter((s) => s.bankId === bank.id);
            return (
              <div
                key={bank.id}
                className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col h-full overflow-hidden shadow-inner"
              >
                {/* Bank Header */}
                <div
                  className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0"
                  style={{ borderBottomColor: `${bank.colorHex}55` }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: bank.colorHex }}
                    />
                    <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                      {bank.name}
                    </span>
                  </div>
                  {!kioskSafeMode && (
                    <button
                      onClick={() => handleAddSceneToBank(bank.id)}
                      className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Añadir nuevo botón ejecutor a este banco"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Executor Pads Column */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {bankScenes.map((sc, sIdx) => {
                    const isActive = activeSceneIds.includes(sc.id);
                    const isEditing = selectedSceneIdForEdit === sc.id && isRightDrawerOpen;
                    const isLearningThis = learningTarget?.targetId === sc.id;
                    const bound = controlBindings[sc.id];

                    return (
                      <div
                        key={sc.id}
                        onClick={() => handleToggleScene(sc)}
                        onMouseDown={() => sc.isFlashButton && handleFlashDown(sc)}
                        onMouseUp={() => sc.isFlashButton && handleFlashUp(sc)}
                        onMouseLeave={() => sc.isFlashButton && isActive && handleFlashUp(sc)}
                        className={`group relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isLearningThis
                            ? 'bg-pink-950/80 border-pink-400 ring-2 ring-pink-400 animate-pulse'
                            : isActive
                              ? 'bg-slate-800 border-white shadow-lg scale-[1.01]'
                              : 'bg-slate-950/90 border-slate-800/90 hover:border-slate-600 hover:bg-slate-900'
                        } ${isEditing ? 'ring-2 ring-amber-400' : ''}`}
                        style={{
                          borderLeftWidth: '5px',
                          borderLeftColor: sc.colorHex,
                          boxShadow: isActive ? `0 0 18px -4px ${sc.colorHex}66` : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="text-xs font-extrabold text-white leading-snug">
                            {sc.name}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full transition ${
                                isActive
                                  ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                                  : 'bg-slate-800'
                              }`}
                            />
                            {!kioskSafeMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSceneIdForEdit(sc.id);
                                  setRightPanelMode('recipe_editor');
                                  setIsRightDrawerOpen(true);
                                }}
                                className="p-1 rounded-md opacity-40 group-hover:opacity-100 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                title="Editar receta de este ejecutor"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 mt-2 text-[10px]">
                          <div className="flex flex-wrap items-center gap-1">
                            {sc.targetGroups.length >= 5 ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-800 font-semibold">
                                Todo el Rig
                              </span>
                            ) : (
                              sc.targetGroups.map((g) => {
                                const groupShort: Record<GroupId, string> = {
                                  beams: 'Beams',
                                  washes: 'Washes',
                                  spots: 'Spots',
                                  blinders: 'Cegad.',
                                  strobes: 'Strobos',
                                  bars: 'Barras',
                                };
                                return (
                                  <span
                                    key={g}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-800/90 font-medium"
                                  >
                                    {groupShort[g] || g}
                                  </span>
                                );
                              })
                            )}
                          </div>
                          <div className="flex items-center gap-1 font-mono">
                            {sc.isFlashButton && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                                ⚡ [{bound?.keyLabel || sIdx + 1}]
                              </span>
                            )}
                            {!sc.isFlashButton && bound?.keyLabel && (
                              <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                                [{bound.keyLabel}]
                              </span>
                            )}
                            {bound?.midiNote !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                M#{bound.midiNote}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Right Drawer: MA2 Preset Pool & Recipe Editor */}
        {isRightDrawerOpen && (
          <div className="w-[390px] shrink-0 h-full flex flex-col gap-2 bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 shadow-2xl">
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setRightPanelMode('preset_pool')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  rightPanelMode === 'preset_pool'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎛️ Preset Pool MA2
              </button>
              <button
                onClick={() => setRightPanelMode('recipe_editor')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  rightPanelMode === 'recipe_editor'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ Inspector Receta
              </button>
            </div>

            <div className="flex-1 min-h-0">
              {rightPanelMode === 'preset_pool' ? (
                <GroupPresetPoolPanel
                  groupProgrammers={groupProgrammers}
                  onUpdateGroupProgrammer={handleUpdateGroupProgrammer}
                  onClearGroupProgrammer={handleClearGroupProgrammer}
                  onClearAllProgrammers={() => setGroupProgrammers(DEFAULT_GROUP_PROGRAMMERS)}
                  onSaveProgrammerAsScene={handleSaveProgrammerAsScene}
                />
              ) : (
                <RecipeInspectorPanel
                  scene={selectedScene}
                  onUpdateScene={handleUpdateScene}
                  onDuplicateScene={handleDuplicateScene}
                  onDeleteScene={handleDeleteScene}
                />
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* BOTTOM CONSOLE FADER WING: 6 GROUP MASTERS + FANNING (<>) + FADE/INERTIA + DUAL SPEED MASTERS + GRAND MASTER */}
      <BottomFaderDock
        fixtures={fixtures}
        groupCalibrations={groupCalibrations}
        handleUpdateGroupCalibration={handleUpdateGroupCalibration}
        setCalibratingGroupId={setCalibratingGroupId}
        showBottomFaderDock={showBottomFaderDock}
        setShowBottomFaderDock={setShowBottomFaderDock}
        globalMaster={globalMaster}
        setGlobalMaster={setGlobalMaster}
        globalBlackout={globalBlackout}
        setGlobalBlackout={setGlobalBlackout}
        globalFanSpread={globalFanSpread}
        setGlobalFanSpread={setGlobalFanSpread}
        crossfadeSec={crossfadeSec}
        setCrossfadeSec={setCrossfadeSec}
        moveFxSpeed={moveFxSpeed}
        setMoveFxSpeed={setMoveFxSpeed}
        chaseFxSpeed={chaseFxSpeed}
        setChaseFxSpeed={setChaseFxSpeed}
        globalFxSize={globalFxSize}
        setGlobalFxSize={setGlobalFxSize}
      />

      {/* MODALS */}
      <BackupRestoreModal
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={(show) => applySavedShowPayload(show)}
      />

      <SongTimelineModal
        open={isSongTimelineOpen}
        onClose={() => setIsSongTimelineOpen(false)}
        timeline={songTimeline}
        onChangeTimeline={setSongTimeline}
        snapshotCues={snapshotCues}
        activeSnapshotId={activeSnapshotId}
        onTriggerCue={stableTriggerSnapshot}
      />

      <CloneRigModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        fixtures={fixtures}
        profiles={profiles}
        onUpdateFixtures={setFixtures}
        onAddCustomProfile={(p) => setProfiles((prev) => [...prev, p])}
        highlightFixtureId={highlightFixtureId}
        onSetHighlightFixtureId={setHighlightFixtureId}
      />

      <StageCalibrationModal
        groupId={calibratingGroupId}
        onClose={() => setCalibratingGroupId(null)}
        calibrations={groupCalibrations}
        onUpdateCalibration={handleUpdateGroupCalibration}
      />

      {isMobileRemoteModalOpen && (
        <StageRemoteView
          mode="modal"
          onClose={() => setIsMobileRemoteModalOpen(false)}
          lanIps={lanIps}
          onLanIpsChange={setLanIps}
          activeMacroLookId={activeSnapshotId}
          activeColorId={tempColorBump}
          activePosId={globalPositionOverride}
          globalMaster={globalMaster}
          globalBlackout={globalBlackout}
          worklightActive={worklightActive}
          blinderOverride={dropImpactActive}
          freezeOverride={freezeDmx}
          hazeBlastActive={hazeBlastActive}
          autoShowRunning={autoShowRunning}
          highlightedFixtureId={highlightFixtureId}
          groupCalibrations={groupCalibrations}
          fixtures={fixtures}
          onExecuteCommand={handleExecuteRemoteCommand}
        />
      )}

      <ChannelFinderModal
        isOpen={isChannelFinderOpen}
        onClose={() => setIsChannelFinderOpen(false)}
        manualDmxOverrides={manualDmxOverrides}
        onUpdateManualDmxOverrides={setManualDmxOverrides}
        isolateUniverse={isolateDmxUniverse}
        onSetIsolateUniverse={setIsolateDmxUniverse}
        onSaveDiscoveredProfile={(newProfile, patchOpts) => {
          setProfiles((prev) => [...prev, newProfile]);
          if (patchOpts && patchOpts.quantity > 0) {
            setFixtures((prev) => {
              const existingInGroup = prev.filter((f) => f.groupId === newProfile.category).length;
              const added: PatchedFixture[] = [];
              for (let i = 0; i < patchOpts.quantity; i++) {
                const addr = patchOpts.startAddress + i * newProfile.channelCount;
                if (addr + newProfile.channelCount - 1 > 512) break;
                const xSpread =
                  patchOpts.quantity === 1
                    ? 0
                    : -0.75 + (i / (patchOpts.quantity - 1)) * 1.5;
                added.push({
                  id: `disc-fix-${Date.now()}-${i + 1}`,
                  name: `${newProfile.name} #${existingInGroup + i + 1}`,
                  profileId: newProfile.id,
                  groupId: newProfile.category,
                  universe: patchOpts.universe,
                  address: addr,
                  orderInGroup: existingInGroup + i,
                  stageX: Number(xSpread.toFixed(2)),
                  stageY: 0.25,
                });
              }
              return [...prev, ...added];
            });
          }
        }}
      />

      <FixtureBuilderModal
        isOpen={isFixtureBuilderOpen}
        onClose={() => setIsFixtureBuilderOpen(false)}
        profiles={profiles}
        onSaveProfile={(savedProfile) => {
          setProfiles((prev) => {
            const exists = prev.some((p) => p.id === savedProfile.id);
            if (exists) {
              return prev.map((p) => (p.id === savedProfile.id ? savedProfile : p));
            }
            return [...prev, savedProfile];
          });
        }}
        onDeleteProfile={(profId) => {
          setProfiles((prev) => prev.filter((p) => p.id !== profId));
        }}
        fixtures={fixtures}
        onUpdateFixtures={setFixtures}
      />

      <AutoShowSequencerModal
        isOpen={isAutoShowModalOpen}
        onClose={() => setIsAutoShowModalOpen(false)}
        steps={autoShowSteps}
        onUpdateSteps={setAutoShowSteps}
        isRunning={autoShowRunning}
        onToggleRunning={(next) => {
          setAutoShowRunning((prev) => {
            const target = next !== undefined ? next : !prev;
            if (target && !prev && autoShowSteps.length > 0) {
              const safeIdx = autoShowStepIndex < autoShowSteps.length ? autoShowStepIndex : 0;
              handleJumpToAutoShowStep(safeIdx);
            }
            return target;
          });
        }}
        currentStepIndex={autoShowStepIndex}
        elapsedInStepSec={autoShowElapsedSec}
        onJumpToStep={handleJumpToAutoShowStep}
        loopInfinite={autoShowLoop}
        onToggleLoopInfinite={() => setAutoShowLoop((b) => !b)}
        shuffleMode={autoShowShuffle}
        onToggleShuffleMode={() => setAutoShowShuffle((b) => !b)}
        banks={DEFAULT_BANKS}
        scenes={scenes}
        activeSceneIds={activeSceneIds}
        clockSchedule={clockSchedule}
        onUpdateClockSchedule={setClockSchedule}
        onTriggerClockEventNow={handleTriggerClockEvent}
      />

      <DmxChannelTesterModal
        isOpen={isDmxTesterOpen}
        onClose={() => setIsDmxTesterOpen(false)}
        universes={universes}
        fixtures={fixtures}
        profiles={profiles}
        manualDmxOverrides={manualDmxOverrides}
        onSetChannelOverride={(u, ch1, val) => {
          const key = `${u}:${ch1}`;
          setManualDmxOverrides((prev) => {
            if (val === null) {
              const copy = { ...prev };
              delete copy[key];
              return copy;
            }
            return { ...prev, [key]: val };
          });
        }}
        onClearAllOverrides={() => setManualDmxOverrides({})}
        hazePatch={{
          enabled: true,
          universe: 1,
          pumpChannel: hazeDmxChannel,
          fanChannel: hazeDmxChannel + 1,
        }}
      />
    </div>
  );
}

export default App;
