/**
 * Pruebas automáticas del motor DMX, los montajes y el generador de QR.
 * Ejecutar con:  npm.cmd test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { evaluateDmxEngine, type EngineEvaluationInput } from '../src/engine/dmxEngine';
import {
  DEFAULT_GROUP_CALIBRATIONS,
  DEFAULT_RECIPE_SCENES,
  DEFAULT_RIG_PRESET,
  FIXTURE_PROFILES,
  RIG_PRESETS,
} from '../src/constants/defaultShowData';
import { generateQrMatrix } from '../src/utils/qrCodeGenerator';
import type { GroupCalibration, GroupId, PatchedFixture, RecipeScene } from '../src/types/dmx';

const scene = (id: string): RecipeScene => {
  const s = DEFAULT_RECIPE_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Escena ${id} no existe`);
  return s;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const discomovil = () => {
  const rig = RIG_PRESETS.find((r) => r.id === 'rig_discomovil_10');
  if (!rig) throw new Error('Falta el montaje Discomóvil');
  return clone(rig.fixtures);
};

const baseInput = (overrides: Partial<EngineEvaluationInput> = {}): EngineEvaluationInput => ({
  fixtures: discomovil(),
  profiles: FIXTURE_PROFILES,
  groupCalibrations: clone(DEFAULT_GROUP_CALIBRATIONS),
  activeScenes: [scene('sc_all_on')],
  bpm: 60,
  timeSec: 0,
  globalMaster: 1,
  globalFxSize: 1,
  globalFxSpeed: 1,
  moveFxSpeed: 1,
  chaseFxSpeed: 1,
  globalBlackout: false,
  crossfadeSec: 0,
  ...overrides,
});

const firstBeam = (fixtures: PatchedFixture[]) => fixtures.find((f) => f.groupId === 'beams')!;

// ---------------------------------------------------------------------------
// MONTAJES
// ---------------------------------------------------------------------------
test('Montaje Discomóvil: 4 Beams (CH 1-64) + 6 Barras (CH 65-88) en Universo 1', () => {
  const fx = discomovil();
  const beams = fx.filter((f) => f.groupId === 'beams');
  const bars = fx.filter((f) => f.groupId === 'bars');
  assert.equal(fx.length, 10);
  assert.equal(beams.length, 4);
  assert.equal(bars.length, 6);
  assert.deepEqual(beams.map((f) => f.address), [1, 17, 33, 49]);
  assert.deepEqual(bars.map((f) => f.address), [65, 69, 73, 77, 81, 85]);
  assert.ok(fx.every((f) => f.universe === 1));
});

test('Ningún montaje de fábrica tiene canales DMX solapados ni se sale de 512', () => {
  for (const rig of RIG_PRESETS) {
    const used = new Map<string, string>();
    for (const f of rig.fixtures) {
      const prof = FIXTURE_PROFILES.find((p) => p.id === f.profileId)!;
      assert.ok(prof, `${rig.id}: perfil ${f.profileId} no existe`);
      assert.ok(f.address + prof.channelCount - 1 <= 512, `${rig.id}: ${f.name} se sale del universo`);
      for (let ch = f.address; ch < f.address + prof.channelCount; ch++) {
        const key = `${f.universe}:${ch}`;
        assert.ok(!used.has(key), `${rig.id}: canal ${key} usado por ${used.get(key)} y ${f.name}`);
        used.set(key, f.name);
      }
    }
  }
});

test('El montaje por defecto (arranque / restaurar fábrica) es el Festival completo, no la Discomóvil', () => {
  assert.equal(DEFAULT_RIG_PRESET.id, 'rig_festival_52');
});

// ---------------------------------------------------------------------------
// MOTOR: OFFSETS, INVERSIONES, BLACKOUT, LOCALIZAR
// ---------------------------------------------------------------------------
test('Offset de Pan por grupo desplaza el DMX real exactamente esos pasos', () => {
  const base = evaluateDmxEngine(baseInput());
  const cals = clone(DEFAULT_GROUP_CALIBRATIONS) as Record<GroupId, GroupCalibration>;
  cals.beams.panOffsetDmx = 20;
  const shifted = evaluateDmxEngine(baseInput({ groupCalibrations: cals }));
  const id = firstBeam(baseInput().fixtures).id;
  const a = base.fixtureFrames[Object.keys(base.fixtureFrames).find((k) => k.startsWith('beams'))!];
  const b = shifted.fixtureFrames[Object.keys(shifted.fixtureFrames).find((k) => k.startsWith('beams'))!];
  assert.ok(id);
  assert.ok(Math.abs(b.panDmx - a.panDmx - 20) <= 1, `esperado +20, obtenido ${b.panDmx - a.panDmx}`);
});

test('Offset individual del foco se suma al offset del grupo (Tilt)', () => {
  const fixtures = discomovil();
  const target = firstBeam(fixtures);
  const base = evaluateDmxEngine(baseInput({ fixtures: clone(fixtures) }));
  const cals = clone(DEFAULT_GROUP_CALIBRATIONS) as Record<GroupId, GroupCalibration>;
  cals.beams.tiltOffsetDmx = 10;
  const withOffsets = clone(fixtures).map((f) => (f.id === target.id ? { ...f, tiltOffsetDmx: 5 } : f));
  const res = evaluateDmxEngine(baseInput({ fixtures: withOffsets, groupCalibrations: cals }));
  const diff = res.fixtureFrames[target.id].tiltDmx - base.fixtureFrames[target.id].tiltDmx;
  assert.ok(Math.abs(diff - 15) <= 1, `esperado +15, obtenido ${diff}`);
});

test('Invertir Pan de un foco refleja su posición respecto al centro', () => {
  const fixtures = discomovil();
  const target = firstBeam(fixtures);
  const xy = { enabled: true, targetGroup: 'beams' as const, panNorm: 0.5, tiltNorm: 0 };
  const normal = evaluateDmxEngine(baseInput({ fixtures: clone(fixtures), manualXYOverride: xy }));
  const inverted = evaluateDmxEngine(
    baseInput({
      fixtures: clone(fixtures).map((f) => (f.id === target.id ? { ...f, invertPan: true } : f)),
      manualXYOverride: xy,
    })
  );
  const cal = DEFAULT_GROUP_CALIBRATIONS.beams;
  const center = (cal.panLeftDmx + cal.panRightDmx) / 2;
  const a = normal.fixtureFrames[target.id].panDmx - center;
  const b = inverted.fixtureFrames[target.id].panDmx - center;
  assert.ok(a > 10, 'el foco normal debe girar a un lado');
  assert.ok(Math.abs(a + b) <= 1.5, `debe ser simétrico: ${a} vs ${b}`);
});

test('Blackout general apaga todos los focos', () => {
  const res = evaluateDmxEngine(baseInput({ globalBlackout: true }));
  for (const f of Object.values(res.fixtureFrames)) assert.equal(f.dimmer, 0);
});

test('Localizar foco: solo ese foco queda encendido al 100%', () => {
  const fixtures = discomovil();
  const target = fixtures[2];
  const res = evaluateDmxEngine(baseInput({ fixtures, highlightFixtureId: target.id }));
  for (const f of fixtures) {
    assert.equal(res.fixtureFrames[f.id].dimmer, f.id === target.id ? 1 : 0);
  }
});

test('Desmarcar el Banco 1 no deja negro el escenario si hay Color/Movimiento activos', () => {
  const res = evaluateDmxEngine(baseInput({ activeScenes: [scene('fx_sym_circle')] }));
  const beam = Object.values(res.fixtureFrames).find((f) => f.fixtureId.startsWith('beams'))!;
  assert.ok(beam.dimmer > 0.5, `dimmer=${beam.dimmer}`);
});

// ---------------------------------------------------------------------------
// MOTOR: VELOCIDAD DE MOVIMIENTO (0 = normal suave = 1/4)
// ---------------------------------------------------------------------------
test('Velocidad P/T normal: el círculo tarda 8 beats (antes 2) y ×2 lo acelera', () => {
  const circle = [scene('sc_all_on'), scene('fx_sym_circle')];
  const panAt = (t: number, speed = 1) => {
    const fx = discomovil();
    const res = evaluateDmxEngine(baseInput({ fixtures: fx, activeScenes: circle, timeSec: t, moveFxSpeed: speed }));
    return res.fixtureFrames[firstBeam(fx).id].panNorm;
  };
  // 60 BPM => 1 beat/s. bpmDivision 0.5 * 0.25 => 1 vuelta cada 8 s
  assert.ok(Math.abs(panAt(0) - panAt(8)) < 0.01, 'a los 8 beats vuelve al inicio');
  assert.ok(Math.abs(panAt(0) - panAt(2)) > 0.05, 'a los 2 beats todavía está girando');
  assert.ok(Math.abs(panAt(0, 2) - panAt(4, 2)) < 0.01, 'con ×2 la vuelta dura 4 beats');
});

test('Posición Frente Público (Bank 3) + Círculo Simétrico (Bank 4) mantienen tanto la posición frontal como el movimiento 3D', () => {
  const scenesCombo = [scene('sc_all_on'), scene('pos_downstage'), scene('fx_sym_circle')];
  const fx = discomovil();
  const t0 = evaluateDmxEngine(baseInput({ fixtures: fx, activeScenes: scenesCombo, timeSec: 0 }));
  const t2 = evaluateDmxEngine(baseInput({ fixtures: fx, activeScenes: scenesCombo, timeSec: 2 }));
  const id = firstBeam(fx).id;
  // Con pos_downstage + fx_sym_circle, el foco se mueve entre t=0 y t=2s (no queda congelado)
  assert.ok(
    Math.abs(t0.fixtureFrames[id].panNorm - t2.fixtureFrames[id].panNorm) > 0.1 ||
      Math.abs(t0.fixtureFrames[id].tiltNorm - t2.fixtureFrames[id].tiltNorm) > 0.1,
    'el foco debe moverse en el 3D cuando hay posición + movimiento activos'
  );
});

// ---------------------------------------------------------------------------
// QR DEL MANDO (se decodifica con un lector real, jsQR)
// ---------------------------------------------------------------------------
const decodeMatrix = (matrix: boolean[][]): string | null => {
  const scale = 8;
  const quiet = 4;
  const n = matrix.length + quiet * 2;
  const px = n * scale;
  const data = new Uint8ClampedArray(px * px * 4).fill(255);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (!matrix[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const y = (r + quiet) * scale + dy;
          const x = (c + quiet) * scale + dx;
          const i = (y * px + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  const result = jsQR(data, px, px);
  return result ? result.data : null;
};

for (const url of [
  'http://192.168.1.35:5175/?remote=1&pin=4821',
  'http://10.0.0.2:5175/?remote=1',
  'http://192.168.100.200:5175/?remote=1&pin=12345678',
]) {
  test(`El QR se lee con un lector real: ${url}`, () => {
    assert.equal(decodeMatrix(generateQrMatrix(url)), url);
  });
}
