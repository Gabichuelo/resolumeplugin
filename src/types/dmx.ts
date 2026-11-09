export type GroupId = 'beams' | 'washes' | 'spots' | 'blinders' | 'strobes' | 'bars';

export const ALL_GROUP_IDS: GroupId[] = [
  'beams',
  'washes',
  'spots',
  'blinders',
  'strobes',
  'bars',
];

export type LocationZoneId = 'back_truss' | 'mid_truss' | 'front_truss' | 'floor_totems';

export type ColorPaletteId =
  | 'transparent'
  | 'white'
  | 'warm_white'
  | 'red'
  | 'blue'
  | 'cyan'
  | 'magenta'
  | 'amber'
  | 'green'
  | 'uv';

export type PositionPaletteId =
  | 'transparent'
  | 'downstage'
  | 'sky_fan'
  | 'x_cross'
  | 'center_focus'
  | 'floor_wash'
  | 'dj_booth'
  | 'wide_roof';

export type FxWaveformId =
  | 'none'
  | 'dimmer_chase'
  | 'sine_pulse'
  | 'circle_pt'
  | 'tilt_wave'
  | 'pan_sweep'
  | 'figure8_pt'
  | 'ballyhoo'
  | 'color_twotone'
  | 'rainbow'
  | 'strobe_sparkle'
  | 'matrix_radial'
  | 'matrix_sweep_y'
  | 'vu_meter'
  | 'fire_flicker'
  | 'police_siren'
  | 'champagne_bubbles'
  | 'ping_pong';

export type WingDirectionMode =
  | 'outside_in'
  | 'center_out'
  | 'linear'
  | 'back_to_front'
  | 'front_to_back'
  | 'radial_center'
  | 'diagonal_2d';

export interface FixtureProfile {
  id: string;
  name: string;
  manufacturer: string;
  category: GroupId;
  channelCount: number;
  sslLibraryKey: 'sharpy7R' | 'robin300' | 'stroboIP65' | 'barRGBW' | 'bsw400';
  sslPath?: string;
  description: string;
  channels: {
    dimmer?: number;
    shutter?: number;
    strobe?: number;
    pan?: number;
    panFine?: number;
    tilt?: number;
    tiltFine?: number;
    red?: number;
    green?: number;
    blue?: number;
    white?: number;
    cyan?: number;
    magenta?: number;
    yellow?: number;
    colorWheel?: number;
    gobo?: number;
    prism?: number;
    prismRot?: number;
    zoom?: number;
    focus?: number;
    whiteTubeDimmer?: number;
    whiteTubeStrobe?: number;
  };
  dmxRules: {
    shutterOpen: number;
    shutterClosed: number;
    strobeSlow: number;
    strobeMed: number;
    strobeFast: number;
    prismOn: number;
    prismOff: number;
    prismRotCw: number;
    colorWheelMap?: Partial<Record<ColorPaletteId, number>>;
    goboSlots?: number[];
  };
}

export interface PatchedFixture {
  id: string;
  name: string;
  profileId: string;
  groupId: GroupId;
  locationZone?: LocationZoneId;
  universe: number; // 1..4
  address: number;  // 1..512
  orderInGroup: number; // 0..N-1
  stageX: number; // -1.0 (Stage Left) to +1.0 (Stage Right)
  stageY: number; // 0.0 (Back Truss) to 1.0 (Front Truss)
  invertPan?: boolean;
  invertTilt?: boolean;
  panOffsetDmx?: number;  // -127..+127 DMX offset for individual fixture orientation
  tiltOffsetDmx?: number; // -127..+127 DMX offset for individual fixture orientation
}

export interface GroupCalibration {
  groupId: GroupId;
  name: string;
  color: string;
  masterDimmer: number; // 0..1
  blackout: boolean;
  flashActive: boolean;
  soloActive?: boolean;
  panLeftDmx: number;
  panRightDmx: number;
  tiltFloorDmx: number;
  tiltSkyDmx: number;
  invertPanGroup: boolean;
  invertTiltGroup: boolean;
  panOffsetDmx?: number;  // -127..+127 global Pan Offset when changing fixture models
  tiltOffsetDmx?: number; // -127..+127 global Tilt Offset when changing fixture models
}

export interface PositionPaletteCalibration {
  id: Exclude<PositionPaletteId, 'transparent'>;
  name: string;
  shortLabel: string;
  panOffsetNorm: number;  // -1..+1 center pan offset
  tiltOffsetNorm: number; // -1..+1 center tilt offset
  fanFactor: number;      // -1..+1 stageX fan multiplier
}

export interface ClockScheduleEvent {
  id: string;
  timeHHMM: string; // '21:00', '23:30', '00:00'
  name: string;
  enabled: boolean;
  actionType: 'start_autoshow_cue' | 'activate_scenes' | 'blackout_on';
  targetAutoShowStepId?: string;
  targetSceneIds?: string[];
  fadeSec: number;
}

export interface GroupProgrammerState {
  active: boolean;
  colorPrimary: ColorPaletteId;
  colorSecondary: ColorPaletteId;
  positionPalette: PositionPaletteId;
  fxWaveform: FxWaveformId | 'transparent';
  wings: 1 | 2 | 4;
  prismActive: boolean | 'transparent';
  goboSlot: number | 'transparent';
  strobeMode: 'transparent' | 'off' | 'slow' | 'medium' | 'fast' | 'blinder';
}

export interface RecipeFxConfig {
  waveform: FxWaveformId;
  wings: 1 | 2 | 4;
  wingDirection: WingDirectionMode;
  blocks: 1 | 2 | 4;
  interleave: 1 | 2 | 3 | 4;
  phaseSpread: 0 | 90 | 180 | 360;
  size: number; // 0..1
  bpmDivision: 0.25 | 0.5 | 1 | 2 | 4;
  dutyCycle: number; // 0.1..0.9
}

export interface RecipeScene {
  id: string;
  bankId: string;
  name: string;
  colorHex: string;
  hotkey?: string;
  midiNote?: number;
  isFlashButton: boolean;
  targetGroups: GroupId[];
  targetZones?: LocationZoneId[];
  dimmer: number | 'transparent';
  colorPrimary: ColorPaletteId;
  colorSecondary: ColorPaletteId;
  positionPalette: PositionPaletteId;
  strobeMode: 'off' | 'slow' | 'medium' | 'fast' | 'blinder';
  prismActive: boolean;
  prismRotate: boolean;
  goboSlot: number;
  zoomValue: number | 'transparent';
  fx: RecipeFxConfig;
}

export interface SceneBank {
  id: string;
  name: string;
  colorHex: string;
  exclusive: boolean;
}

export interface ShowSnapshotCue {
  id: string;
  name: string;
  hotkey: string;
  colorHex: string;
  sceneIds: string[];
}

export interface ManualXYOverride {
  enabled: boolean;
  targetGroup: GroupId | 'all';
  panNorm: number;
  tiltNorm: number;
}

export interface ComputedFixtureFrame {
  fixtureId: string;
  r: number;
  g: number;
  b: number;
  w: number;
  dimmer: number;
  shutterOpen: boolean;
  strobeHz: number;
  panNorm: number;
  tiltNorm: number;
  panDmx: number;
  tiltDmx: number;
  prism: boolean;
  gobo: number;
  dmxChannels: number[];
}

export interface RigPresetTemplate {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  fixtures: PatchedFixture[];
}

export interface ControlBinding {
  targetType: 'scene' | 'fader' | 'macro';
  targetId: string;
  key?: string;         // Keyboard code e.g. 'KeyZ', 'Digit5'
  keyLabel?: string;    // Display label e.g. 'Z', '5'
  midiNote?: number;    // MIDI Note 0..127
  midiCC?: number;      // MIDI CC 0..127
}

export interface AutoShowStep {
  id: string;
  name: string;
  colorHex: string;
  enabled: boolean;
  durationSec: number; // e.g. 120 = 2 min, 300 = 5 min
  fadeSec: number;     // Smooth transition crossfade time when entering this cue
  sceneIds: string[];  // Which Executor buttons / FX recipes run in this cue
  moveSpeed: number;   // 0.25, 0.5, 1, 2
  chaseSpeed: number;  // 0.25, 0.5, 1, 2
  fanSpread: number;   // -1..+1
}

export type CustomFaderTargetType =
  | 'group_dimmer'
  | 'scene_level'
  | 'console_param'
  | 'dmx_channel';

export type ConsoleParamTargetId =
  | 'global_master'
  | 'move_speed'
  | 'chase_speed'
  | 'fx_size'
  | 'fan_spread'
  | 'crossfade_sec'
  | 'bpm'
  | 'haze_level';

export interface CustomFaderControl {
  id: string;
  label: string;
  colorHex: string;
  targetType: CustomFaderTargetType;
  targetId: string; // groupId ('beams'...), sceneId ('fx_sym_circle'...), consoleParam ('move_speed'...), or '1:1' (uni:ch)
  hotkey?: string;
}

export type CustomButtonTargetType =
  | 'scene_toggle'
  | 'scene_flash'
  | 'macro_look'
  | 'position_preset'
  | 'color_theme'
  | 'special_action';

export type SpecialActionTargetId =
  | 'buildup_drop'
  | 'haze_blast'
  | 'worklight'
  | 'freeze_dmx'
  | 'stomp_pt'
  | 'resync_beat'
  | 'blackout';

export interface CustomButtonControl {
  id: string;
  label: string;
  subtitle?: string;
  colorHex: string;
  size?: 'normal' | 'wide';
  targetType: CustomButtonTargetType;
  targetId: string;
  hotkey?: string;
}

export interface CustomTouchPage {
  id: string;
  name: string;
  faders: CustomFaderControl[];
  buttons: CustomButtonControl[];
  showXYPad: boolean;
}

export interface CustomRgbwOverride {
  enabled: boolean;
  r: number;
  g: number;
  b: number;
  w: number;
  kelvin?: number; // 2700..8000K
  hex: string;
}

export type StrobeOverrideMode =
  | 'off'
  | 'slow'
  | 'medium'
  | 'fast'
  | 'alternate'
  | 'random_sparkle'
  | 'uv_rave';

export type SpecialFxMachineType = 'sparkular' | 'co2' | 'flame' | 'confetti';

export type SpecialFxWavePattern =
  | 'off'
  | 'all_blast'
  | 'sine_wave'
  | 'sine_sym_wings'
  | 'pwm_chase_lr'
  | 'pwm_center_out'
  | 'pwm_odd_even'
  | 'pwm_random';

export interface SpecialFxDeckState {
  armed: boolean; // Safety Key Armed/Safe
  sparkularPreheat: boolean;
  startDmxChannel: number; // Default CH 490 on Universe 1 (490..509)
  // 4 Sparkular units (0..100%)
  sparkularPattern: SpecialFxWavePattern;
  sparkularMasterHeight: number; // 0..100%
  sparkularManualUnits: [number, number, number, number];
  // 4 CO2 Cryo Jets (0..100%)
  co2Pattern: SpecialFxWavePattern;
  co2ManualUnits: [boolean, boolean, boolean, boolean];
  // 4 Flame Projectors (0..100%)
  flamePattern: SpecialFxWavePattern;
  flameManualUnits: [boolean, boolean, boolean, boolean];
  // 2 Confetti Turbines / Stadium Shots
  confettiPattern: SpecialFxWavePattern;
  confettiManualUnits: [ number, number ]; // 0..100%
  // Shared Sine / PWM Generator parameters for SFX
  sfxSpeedHz: number;     // 0.25..4.0 Hz (or BPM synced)
  sfxPwmDuty: number;     // 0.15..0.85 duty cycle for PWM pulses
  sfxPhaseSpread: number; // 90..360 deg spread across the 4 units
}

export interface GrandDasShowFile {
  version: string;
  savedAt: string;
  profiles: FixtureProfile[];
  fixtures: PatchedFixture[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  scenes: RecipeScene[];
  snapshotCues: ShowSnapshotCue[];
  bindings: Record<string, ControlBinding>;
  autoShowSteps?: AutoShowStep[];
  clockSchedule?: ClockScheduleEvent[];
  positionCalibrations?: Record<Exclude<PositionPaletteId, 'transparent'>, PositionPaletteCalibration>;
  touchPages?: CustomTouchPage[];
}
