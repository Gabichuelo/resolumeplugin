import React, { useEffect, useRef, useState } from 'react';
import {
  Eye,
  Activity,
  Sliders,
  Sparkles,
  Crosshair,
  ExternalLink,
  Box,
  RotateCcw,
  Lightbulb,
  ArrowLeftRight,
  ArrowUpDown,
  X,
  ZoomIn,
  Camera,
  Compass,
} from 'lucide-react';
import type {
  ComputedFixtureFrame,
  FixtureProfile,
  GroupCalibration,
  GroupId,
  ManualXYOverride,
  PatchedFixture,
} from '../types/dmx';

interface LiveSfxLevels {
  sparkular: [number, number, number, number];
  co2: [number, number, number, number];
  flame: [number, number, number, number];
  confetti: [number, number];
}

interface StageVisualizerProps {
  fixtures: PatchedFixture[];
  profiles: FixtureProfile[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  fixtureFrames: Record<string, ComputedFixtureFrame>;
  universes: Record<number, number[]>;
  onOpenCalibrationModal?: (groupId: GroupId) => void;
  onUpdateGroupCalibration?: (groupId: GroupId, patch: Partial<GroupCalibration>) => void;
  manualXY: ManualXYOverride;
  onUpdateManualXY: (next: ManualXYOverride) => void;
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  highlightedFixtureId?: string | null;
  onToggleHighlightFixture?: (fixtureId: string | null) => void;
  onUpdateFixture?: (fixtureId: string, patch: Partial<PatchedFixture>) => void;
  liveSfxLevels?: LiveSfxLevels;
}

interface ProjectedFixtureHit {
  fixtureId: string;
  sx: number;
  sy: number;
  radius: number;
}

const CAMERA_PRESETS: Array<{
  id: string;
  label: string;
  yaw: number;
  pitch: number;
  zoom: number;
}> = [
  { id: 'front', label: '🎥 Frontal Público', yaw: 0, pitch: 0.28, zoom: 1.05 },
  { id: 'iso', label: '📐 Isométrica 3D', yaw: -0.45, pitch: 0.38, zoom: 1.04 },
  { id: 'top', label: '🦅 Cenital (Planta)', yaw: 0, pitch: 1.15, zoom: 0.95 },
  { id: 'side', label: '🎸 Lateral Truss', yaw: 1.02, pitch: 0.22, zoom: 1.02 },
  { id: 'low', label: '🕺 Contrapicado', yaw: 0.14, pitch: -0.05, zoom: 1.12 },
];

export const StageVisualizer: React.FC<StageVisualizerProps> = ({
  fixtures,
  profiles,
  groupCalibrations,
  fixtureFrames,
  universes,
  onOpenCalibrationModal,
  onUpdateGroupCalibration,
  manualXY,
  onUpdateManualXY,
  isStandaloneWindow = false,
  onPopoutWindow,
  highlightedFixtureId = null,
  onToggleHighlightFixture,
  onUpdateFixture,
  liveSfxLevels,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectedHitsRef = useRef<ProjectedFixtureHit[]>([]);
  const orbitDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startYaw: number;
    startPitch: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startYaw: 0,
    startPitch: 0.28,
    moved: false,
  });

  const [viewMode, setViewMode] = useState<'3d' | 'stage' | 'dmx'>('3d');
  const [selectedUniverse, setSelectedUniverse] = useState<number>(1);
  const [showDmxLabels, setShowDmxLabels] = useState<boolean>(true);
  const [camYaw, setCamYaw] = useState<number>(0); // -1.45 to +1.45 rad
  const [camPitch, setCamPitch] = useState<number>(0.28); // -0.15 to +1.25 rad
  const [camZoom, setCamZoom] = useState<number>(1.05); // 0.65 to 1.85
  const [hazeDensity, setHazeDensity] = useState<number>(1.0);
  const [beamBoost, setBeamBoost] = useState<number>(1.55); // 0.8 to 2.4 volumetric boost
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [offsetPanelOpen, setOffsetPanelOpen] = useState<boolean>(false);
  const [offsetActiveGroup, setOffsetActiveGroup] = useState<'beams' | 'spots' | 'washes'>('beams');

  const profileMap = React.useMemo(() => {
    const m = new Map<string, FixtureProfile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const selectedFixture = React.useMemo(
    () => fixtures.find((f) => f.id === selectedFixtureId) || null,
    [fixtures, selectedFixtureId]
  );

  // Accurate 3D world position anchored directly to its physical truss:
  // wz = -0.82 is BACKSTAGE (Fondo), wz = +0.95 is FRONT EDGE / AUDIENCE (Línea Amarilla Frontal)
  const getFixture3DPos = React.useCallback((fix: PatchedFixture) => {
    const wx = fix.stageX * 1.06;
    if (fix.groupId === 'beams') {
      return { wx, wy: 0.94, wz: -0.82 };
    }
    if (fix.groupId === 'spots') {
      return { wx, wy: 0.88, wz: -0.46 };
    }
    if (fix.groupId === 'washes') {
      return { wx, wy: 0.82, wz: -0.1 };
    }
    if (fix.groupId === 'blinders') {
      return { wx, wy: 0.76, wz: 0.34 };
    }
    if (fix.groupId === 'strobes') {
      return { wx, wy: 0.72, wz: 0.38 };
    }
    // LED Bars on floor/totems
    return { wx, wy: 0.06, wz: -0.68 };
  }, []);

  useEffect(() => {
    if (viewMode === 'dmx') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (
      canvas.width !== Math.floor(rect.width * dpr) ||
      canvas.height !== Math.floor(rect.height * dpr)
    ) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const nowMs = performance.now();
    const hits: ProjectedFixtureHit[] = [];

    // Deep Arena Background with subtle stage atmosphere
    const bgGrad = ctx.createRadialGradient(
      W * 0.5,
      H * 0.35,
      15,
      W * 0.5,
      H * 0.55,
      Math.max(W, H) * 0.9
    );
    bgGrad.addColorStop(0, '#111c33');
    bgGrad.addColorStop(0.55, '#070d1c');
    bgGrad.addColorStop(1, '#020409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    if (viewMode === '3d') {
      // TRUE 3D Perspective Projection:
      // Camera sits in the audience (FOH) at +Z looking towards the stage (-Z).
      // Therefore:
      // - Front of stage (wz = +0.95, Yellow Line) is CLOSEST to the camera (smaller depth, wider, lower on screen)
      // - Back of stage (wz = -0.82, Back Truss) is FARTHEST from the camera (larger depth, narrower, higher on screen)
      const project3D = (wx: number, wy: number, wz: number) => {
        const cosY = Math.cos(camYaw);
        const sinY = Math.sin(camYaw);
        const rx = wx * cosY - wz * sinY;
        const rz = wx * sinY + wz * cosY;

        const cosP = Math.cos(camPitch);
        const sinP = Math.sin(camPitch);
        const centerY = 0.42;
        const ry = (wy - centerY) * cosP - rz * sinP;
        // Important: -rz * cosP makes wz = +0.95 (Front) closer to camera and wz = -0.82 (Back) farther away!
        const rz2 = -rz * cosP + (wy - centerY) * sinP;

        const fov = Math.min(W, H) * 1.25 * camZoom;
        const camDist = 2.85;
        const depth = Math.max(0.45, camDist + rz2);
        const scale = fov / depth;
        return {
          sx: W * 0.5 + rx * scale,
          sy: H * 0.52 - ry * scale,
          scale,
          depth,
        };
      };

      // 1. Draw 3D Stage Deck Floor Surface + Perspective Grid (wy = 0)
      const deckBL = project3D(-1.25, 0, -1.0);
      const deckBR = project3D(1.25, 0, -1.0);
      const deckFR = project3D(1.25, 0, 0.95);
      const deckFL = project3D(-1.25, 0, 0.95);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.beginPath();
      ctx.moveTo(deckBL.sx, deckBL.sy);
      ctx.lineTo(deckBR.sx, deckBR.sy);
      ctx.lineTo(deckFR.sx, deckFR.sy);
      ctx.lineTo(deckFL.sx, deckFL.sy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1;
      for (let gx = -1.2; gx <= 1.201; gx += 0.3) {
        const p1 = project3D(gx, 0, -1.0);
        const p2 = project3D(gx, 0, 0.95);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
      for (let gz = -1.0; gz <= 0.951; gz += 0.24) {
        const p1 = project3D(-1.25, 0, gz);
        const p2 = project3D(1.25, 0, gz);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      // Backstage Edge Label (Fondo del Escenario)
      const bCenter = project3D(0, 0, -1.0);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▲ FONDO DEL ESCENARIO (TELÓN TRASERO) ▲', bCenter.sx, bCenter.sy - 6);

      // Front Stage Safety Line (Yellow Line = Borde Frontal hacia el Público / Cabina)
      const fLeft = project3D(-1.25, 0, 0.95);
      const fRight = project3D(1.25, 0, 0.95);
      const fCenter = project3D(0, 0, 0.95);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.88)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fLeft.sx, fLeft.sy);
      ctx.lineTo(fRight.sx, fRight.sy);
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '▼ FRENTE ESCENARIO / PÚBLICO (LÍNEA AMARILLA = BORDE FRONTAL) ▼',
        fCenter.sx,
        fCenter.sy + 14
      );

      // 2. Draw 3D Aluminum Box Trusses & Vertical Support Towers (sorted back-to-front)
      const trussDefs: Array<{ label: string; wy: number; wz: number; color: string }> = [
        { label: 'PUENTE 1 TRASERO (BEAMS)', wy: 0.94, wz: -0.82, color: '#f59e0b' },
        { label: 'SUELO FONDO (BARRAS LED)', wy: 0.06, wz: -0.68, color: '#ec4899' },
        { label: 'PUENTE 2 MEDIO-TRASERO (SPOTS GOBO)', wy: 0.88, wz: -0.46, color: '#c084fc' },
        { label: 'PUENTE 3 CENTRAL (WASHES)', wy: 0.82, wz: -0.1, color: '#38bdf8' },
        { label: 'PUENTE 4 FRONTAL (CEGADORAS + STROBOS)', wy: 0.76, wz: 0.35, color: '#facc15' },
      ];

      for (const t of trussDefs) {
        const pL = project3D(-1.14, t.wy, t.wz);
        const pR = project3D(1.14, t.wy, t.wz);
        const pLTop = project3D(-1.14, t.wy + 0.035, t.wz);
        const pRTop = project3D(1.14, t.wy + 0.035, t.wz);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(pL.sx, pL.sy);
        ctx.lineTo(pR.sx, pR.sy);
        ctx.moveTo(pLTop.sx, pLTop.sy);
        ctx.lineTo(pRTop.sx, pRTop.sy);
        ctx.stroke();

        // Side vertical truss towers
        const baseL = project3D(-1.14, 0, t.wz);
        const baseR = project3D(1.14, 0, t.wz);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pLTop.sx, pLTop.sy);
        ctx.lineTo(baseL.sx, baseL.sy);
        ctx.moveTo(pRTop.sx, pRTop.sy);
        ctx.lineTo(baseR.sx, baseR.sy);
        ctx.stroke();

        if (showDmxLabels) {
          ctx.fillStyle = t.color;
          ctx.font = 'bold 9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(t.label, pLTop.sx + 4, pLTop.sy - 5);
        }
      }

      // 3. Render Multi-Layer Volumetric 3D Cones & Floor Pool Gobo Projections
      // Now beams starting at Back Truss (wz = -0.82) shoot FORWARD towards the Front Yellow Line (+Z = Audience)!
      ctx.globalCompositeOperation = 'screen';

      // Depth sorting (painter's algorithm): fixtures are drawn from the farthest to the closest
      // to the camera, so a front fixture's head and beam always cover the ones behind it,
      // whatever camera angle you choose.
      const depthSorted = [...fixtures].sort((a, b) => {
        const pa = getFixture3DPos(a);
        const pb = getFixture3DPos(b);
        return project3D(pb.wx, pb.wy, pb.wz).depth - project3D(pa.wx, pa.wy, pa.wz).depth;
      });

      const drawBeam = (fix: PatchedFixture) => {
        const frame = fixtureFrames[fix.id];
        if (!frame) return;

        const isHighlighted = highlightedFixtureId === fix.id;
        let strobeGate = 1;
        if (!isHighlighted && frame.strobeHz > 0) {
          const periodMs = 1000 / frame.strobeHz;
          strobeGate = nowMs % periodMs < periodMs * 0.45 ? 1 : 0.04;
        }

        const effectiveDimmer = isHighlighted ? 1 : frame.dimmer;
        const rawAlpha = effectiveDimmer * strobeGate * hazeDensity * beamBoost;
        if (rawAlpha <= 0.015) return;

        const dispR = isHighlighted ? 255 : Math.min(255, Math.round(frame.r + frame.w * 0.8));
        const dispG = isHighlighted ? 255 : Math.min(255, Math.round(frame.g + frame.w * 0.8));
        const dispB = isHighlighted ? 255 : Math.min(255, Math.round(frame.b + frame.w * 0.8));

        const { wx, wy, wz } = getFixture3DPos(fix);
        const headProj = project3D(wx, wy, wz);

        if (fix.groupId === 'beams' || fix.groupId === 'washes' || fix.groupId === 'spots') {
          const isBeam = fix.groupId === 'beams';
          const isSpot = fix.groupId === 'spots';
          const worldSpread = isBeam ? 0.11 : isSpot ? 0.18 : 0.32;
          const lensRadiusPx = Math.max(3, (isBeam ? 0.022 : 0.032) * headProj.scale);

          const renderVolumetricRay = (panOffset: number, tiltOffset: number, rayBoost: number) => {
            // Compute 3D ray target pointing FORWARD toward the Front Yellow Line (+Z) and DOWN toward stage floor (-Y)
            // panNorm: -1 (Stage Left) .. 0 (Center Front) .. +1 (Stage Right)
            // tiltNorm: -1 (Straight down at stage floor) .. 0 (Downstage front edge) .. +1 (Up towards audience sky)
            const effPan = frame.panNorm + panOffset;
            const effTilt = frame.tiltNorm + tiltOffset;

            const dirX = effPan * 0.92;
            const dirZ = 0.88 + effTilt * 0.38; // Positive Z = Forward towards the audience / Yellow Line!
            const dirY = effTilt * 0.58 - 0.58; // Negative Y = Down towards stage deck (wy = 0)

            let tEndWX = wx + dirX * 1.35;
            let tEndWY = wy + dirY * 1.35;
            let tEndWZ = wz + dirZ * 1.35;
            let hitsFloor = false;

            if (tEndWY <= 0.01 && dirY < -0.02) {
              const tFloor = (0 - wy) / dirY;
              tEndWX = wx + dirX * tFloor;
              tEndWY = 0;
              tEndWZ = wz + dirZ * tFloor;
              hitsFloor = true;
            }

            const tCenter = project3D(tEndWX, tEndWY, tEndWZ);

            const dx = tCenter.sx - headProj.sx;
            const dy = tCenter.sy - headProj.sy;
            const rayLenPx = Math.hypot(dx, dy) || 1;
            const nx = -dy / rayLenPx;
            const ny = dx / rayLenPx;

            const endRadiusPx = Math.max(14, worldSpread * tCenter.scale);
            const aOuter = Math.min(0.68, rawAlpha * rayBoost * 0.38);
            const aMid = Math.min(0.94, rawAlpha * rayBoost * 0.74);
            const aCore = Math.min(1.0, rawAlpha * rayBoost * 0.96);

            // Layer 1: Wide Atmospheric Haze Halo
            const outerGrad = ctx.createLinearGradient(
              headProj.sx,
              headProj.sy,
              tCenter.sx,
              tCenter.sy
            );
            outerGrad.addColorStop(0, `rgba(${dispR}, ${dispG}, ${dispB}, ${aOuter})`);
            outerGrad.addColorStop(0.65, `rgba(${dispR}, ${dispG}, ${dispB}, ${aOuter * 0.45})`);
            outerGrad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);

            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.moveTo(
              headProj.sx - nx * lensRadiusPx * 1.6,
              headProj.sy - ny * lensRadiusPx * 1.6
            );
            ctx.lineTo(
              headProj.sx + nx * lensRadiusPx * 1.6,
              headProj.sy + ny * lensRadiusPx * 1.6
            );
            ctx.lineTo(tCenter.sx + nx * endRadiusPx * 1.45, tCenter.sy + ny * endRadiusPx * 1.45);
            ctx.lineTo(tCenter.sx - nx * endRadiusPx * 1.45, tCenter.sy - ny * endRadiusPx * 1.45);
            ctx.closePath();
            ctx.fill();

            // Layer 2: Crisp Volumetric Cone Body
            const midGrad = ctx.createLinearGradient(
              headProj.sx,
              headProj.sy,
              tCenter.sx,
              tCenter.sy
            );
            midGrad.addColorStop(0, `rgba(${dispR}, ${dispG}, ${dispB}, ${aMid})`);
            midGrad.addColorStop(0.7, `rgba(${dispR}, ${dispG}, ${dispB}, ${aMid * 0.45})`);
            midGrad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0.05)`);

            ctx.fillStyle = midGrad;
            ctx.beginPath();
            ctx.moveTo(headProj.sx - nx * lensRadiusPx, headProj.sy - ny * lensRadiusPx);
            ctx.lineTo(headProj.sx + nx * lensRadiusPx, headProj.sy + ny * lensRadiusPx);
            ctx.lineTo(tCenter.sx + nx * endRadiusPx, tCenter.sy + ny * endRadiusPx);
            ctx.lineTo(tCenter.sx - nx * endRadiusPx, tCenter.sy - ny * endRadiusPx);
            ctx.closePath();
            ctx.fill();

            // Layer 3: High-Intensity Laser/Beam Core Spine
            if (isBeam || isSpot) {
              const coreWidth = isBeam ? endRadiusPx * 0.26 : endRadiusPx * 0.18;
              const coreGrad = ctx.createLinearGradient(
                headProj.sx,
                headProj.sy,
                tCenter.sx,
                tCenter.sy
              );
              const coreR = Math.min(255, dispR + 80);
              const coreG = Math.min(255, dispG + 80);
              const coreB = Math.min(255, dispB + 80);
              coreGrad.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, ${aCore})`);
              coreGrad.addColorStop(0.75, `rgba(${dispR}, ${dispG}, ${dispB}, ${aCore * 0.58})`);
              coreGrad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);

              ctx.fillStyle = coreGrad;
              ctx.beginPath();
              ctx.moveTo(
                headProj.sx - nx * (lensRadiusPx * 0.5),
                headProj.sy - ny * (lensRadiusPx * 0.5)
              );
              ctx.lineTo(
                headProj.sx + nx * (lensRadiusPx * 0.5),
                headProj.sy + ny * (lensRadiusPx * 0.5)
              );
              ctx.lineTo(tCenter.sx + nx * coreWidth, tCenter.sy + ny * coreWidth);
              ctx.lineTo(tCenter.sx - nx * coreWidth, tCenter.sy - ny * coreWidth);
              ctx.closePath();
              ctx.fill();
            }

            // Layer 4: 3D Stage Floor Pool + Gobo Pattern Projection on Stage Deck
            if (
              hitsFloor &&
              tEndWX >= -1.45 &&
              tEndWX <= 1.45 &&
              tEndWZ >= -1.15 &&
              tEndWZ <= 1.25
            ) {
              const spotRx = Math.max(10, endRadiusPx * 0.95);
              const spotRy = Math.max(
                6,
                spotRx * Math.min(1, Math.sin(Math.max(0.22, camPitch)) + 0.25)
              );
              const floorGrad = ctx.createRadialGradient(
                tCenter.sx,
                tCenter.sy,
                1,
                tCenter.sx,
                tCenter.sy,
                spotRx
              );
              floorGrad.addColorStop(
                0,
                `rgba(${Math.min(255, dispR + 55)}, ${Math.min(255, dispG + 55)}, ${Math.min(255, dispB + 55)}, ${Math.min(0.95, aMid * 0.9)})`
              );
              floorGrad.addColorStop(0.55, `rgba(${dispR}, ${dispG}, ${dispB}, ${aMid * 0.45})`);
              floorGrad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);

              ctx.fillStyle = floorGrad;
              ctx.beginPath();
              ctx.ellipse(tCenter.sx, tCenter.sy, spotRx, spotRy, 0, 0, Math.PI * 2);
              ctx.fill();

              if (frame.gobo > 0) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.85, aCore * 0.75)})`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.ellipse(
                  tCenter.sx,
                  tCenter.sy,
                  spotRx * 0.55,
                  spotRy * 0.55,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
              }
            }
          };

          if (frame.prism) {
            renderVolumetricRay(-0.18, 0.04, 0.72);
            renderVolumetricRay(0, -0.05, 0.9);
            renderVolumetricRay(0.18, 0.04, 0.72);
          } else {
            renderVolumetricRay(0, 0, 1.0);
          }

          // Fixture Lens Hot-Spot Bloom
          const lensBloomRadius = Math.max(12, 0.075 * headProj.scale);
          const bloomGrad = ctx.createRadialGradient(
            headProj.sx,
            headProj.sy,
            1,
            headProj.sx,
            headProj.sy,
            lensBloomRadius
          );
          bloomGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, rawAlpha)})`);
          bloomGrad.addColorStop(
            0.4,
            `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(0.85, rawAlpha * 0.7)})`
          );
          bloomGrad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);
          ctx.fillStyle = bloomGrad;
          ctx.beginPath();
          ctx.arc(headProj.sx, headProj.sy, lensBloomRadius, 0, Math.PI * 2);
          ctx.fill();
        } else if (fix.groupId === 'strobes' || fix.groupId === 'blinders') {
          const isBlinder = fix.groupId === 'blinders';
          const rad = Math.max(28, (isBlinder ? 0.34 : 0.25) * headProj.scale);
          const grad = ctx.createRadialGradient(
            headProj.sx,
            headProj.sy,
            2,
            headProj.sx,
            headProj.sy,
            rad
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, rawAlpha)})`);
          grad.addColorStop(
            0.3,
            `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(0.95, rawAlpha * 0.8)})`
          );
          grad.addColorStop(0.65, `rgba(${dispR}, ${dispG}, ${dispB}, ${rawAlpha * 0.35})`);
          grad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(headProj.sx, headProj.sy, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (fix.groupId === 'bars') {
          const topProj = project3D(wx, wy + 0.52, wz);
          const barHalfW = Math.max(10, 0.085 * headProj.scale);
          const grad = ctx.createLinearGradient(headProj.sx, headProj.sy, topProj.sx, topProj.sy);
          grad.addColorStop(0, `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(1, rawAlpha * 0.95)})`);
          grad.addColorStop(
            0.5,
            `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(0.75, rawAlpha * 0.5)})`
          );
          grad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(headProj.sx - barHalfW, headProj.sy);
          ctx.lineTo(headProj.sx + barHalfW, headProj.sy);
          ctx.lineTo(topProj.sx + barHalfW * 1.35, topProj.sy);
          ctx.lineTo(topProj.sx - barHalfW * 1.35, topProj.sy);
          ctx.closePath();
          ctx.fill();
        }
      };

      // 3B. Render Live Stage Special FX (Sparkular, CO2, Flame) on Front Stage Edge (Yellow Line)
      const drawSfx = () => {
        if (!liveSfxLevels) return;
        const sfxXPositions: [number, number, number, number] = [-0.9, -0.3, 0.3, 0.9];
        for (let i = 0; i < 4; i++) {
          const sxWorld = sfxXPositions[i];
          const baseP = project3D(sxWorld, 0.02, 0.88);

          const sparkLvl = (liveSfxLevels.sparkular[i] || 0) / 100;
          if (sparkLvl > 0.05) {
            const topP = project3D(sxWorld, 0.02 + sparkLvl * 0.68, 0.88);
            const g = ctx.createLinearGradient(baseP.sx, baseP.sy, topP.sx, topP.sy);
            g.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
            g.addColorStop(0.5, 'rgba(251, 191, 36, 0.75)');
            g.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(baseP.sx - 4, baseP.sy);
            ctx.lineTo(baseP.sx + 4, baseP.sy);
            ctx.lineTo(topP.sx + 18 * sparkLvl, topP.sy);
            ctx.lineTo(topP.sx - 18 * sparkLvl, topP.sy);
            ctx.closePath();
            ctx.fill();
          }

          const co2Lvl = (liveSfxLevels.co2[i] || 0) / 100;
          if (co2Lvl > 0.05) {
            const topP = project3D(sxWorld + 0.08, 0.02 + co2Lvl * 0.85, 0.88);
            const g = ctx.createLinearGradient(baseP.sx, baseP.sy, topP.sx, topP.sy);
            g.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
            g.addColorStop(0.6, 'rgba(186, 230, 253, 0.5)');
            g.addColorStop(1, 'rgba(186, 230, 253, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(baseP.sx - 5, baseP.sy);
            ctx.lineTo(baseP.sx + 5, baseP.sy);
            ctx.lineTo(topP.sx + 26, topP.sy);
            ctx.lineTo(topP.sx - 26, topP.sy);
            ctx.closePath();
            ctx.fill();
          }

          const flameLvl = (liveSfxLevels.flame[i] || 0) / 100;
          if (flameLvl > 0.05) {
            const topP = project3D(sxWorld - 0.08, 0.02 + flameLvl * 0.62, 0.88);
            const g = ctx.createLinearGradient(baseP.sx, baseP.sy, topP.sx, topP.sy);
            g.addColorStop(0, 'rgba(254, 240, 138, 0.98)');
            g.addColorStop(0.45, 'rgba(249, 115, 22, 0.85)');
            g.addColorStop(1, 'rgba(220, 38, 38, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(baseP.sx - 6, baseP.sy);
            ctx.lineTo(baseP.sx + 6, baseP.sy);
            ctx.lineTo(topP.sx + 16, topP.sy);
            ctx.lineTo(topP.sx - 16, topP.sy);
            ctx.closePath();
            ctx.fill();
          }
        }
      };

      // 4. Draw 3D Fixture Heads & Record Hit Targets for Direct Click Selection
      const drawHead = (fix: PatchedFixture) => {
        const frame = fixtureFrames[fix.id];
        if (!frame) return;
        const { wx, wy, wz } = getFixture3DPos(fix);
        const p = project3D(wx, wy, wz);

        const isSelected = selectedFixtureId === fix.id;
        const isHighlighted = highlightedFixtureId === fix.id;
        const effDim = isHighlighted ? 1 : frame.dimmer;

        const dispR = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.r + frame.w * 0.6) * effDim));
        const dispG = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.g + frame.w * 0.6) * effDim));
        const dispB = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.b + frame.w * 0.6) * effDim));

        const headRadius = isSelected ? 8.5 : 6.8;
        hits.push({ fixtureId: fix.id, sx: p.sx, sy: p.sy, radius: 14 });

        if (isSelected || isHighlighted) {
          ctx.strokeStyle = isHighlighted ? '#fde047' : '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, headRadius + 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = effDim > 0.02 ? `rgb(${dispR}, ${dispG}, ${dispB})` : '#1e293b';
        ctx.strokeStyle = isSelected ? '#38bdf8' : effDim > 0.02 ? '#ffffff' : '#64748b';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (showDmxLabels) {
          ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
          ctx.font = 'bold 9px Inter, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`#${fix.orderInGroup + 1}`, p.sx, p.sy + 16);
        }
      };

      // Far -> near: each fixture paints its additive beam first, then its solid head on top
      for (const fix of depthSorted) {
        ctx.globalCompositeOperation = 'screen';
        drawBeam(fix);
        ctx.globalCompositeOperation = 'source-over';
        drawHead(fix);
      }
      // Pyro / CO2 effects sit on the very front edge, closest to the audience: drawn last
      ctx.globalCompositeOperation = 'screen';
      drawSfx();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // 2.5D Symmetrical Top-Front View
      const groupOrder: GroupId[] = ['beams', 'spots', 'washes', 'blinders', 'strobes', 'bars'];
      const rowYNorm: Record<GroupId, number> = {
        beams: 0.12,
        spots: 0.26,
        washes: 0.41,
        blinders: 0.56,
        strobes: 0.71,
        bars: 0.86,
      };

      for (const gId of groupOrder) {
        const y = H * rowYNorm[gId];
        const cal = groupCalibrations[gId];
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(W * 0.06, y);
        ctx.lineTo(W * 0.94, y);
        ctx.stroke();

        ctx.fillStyle = cal.color;
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(cal.name, W * 0.06, y - 10);
      }

      ctx.globalCompositeOperation = 'screen';

      for (const fix of fixtures) {
        const frame = fixtureFrames[fix.id];
        if (!frame) continue;

        const x = W * 0.5 + fix.stageX * (W * 0.41);
        const y = H * rowYNorm[fix.groupId];

        const isHighlighted = highlightedFixtureId === fix.id;
        let strobeGate = 1;
        if (!isHighlighted && frame.strobeHz > 0) {
          const periodMs = 1000 / frame.strobeHz;
          strobeGate = nowMs % periodMs < periodMs * 0.42 ? 1 : 0.05;
        }

        const effDim = isHighlighted ? 1 : frame.dimmer;
        const alpha = effDim * strobeGate * hazeDensity * beamBoost;
        if (alpha > 0.01) {
          const dispR = isHighlighted ? 255 : Math.min(255, Math.round(frame.r + frame.w * 0.7));
          const dispG = isHighlighted ? 255 : Math.min(255, Math.round(frame.g + frame.w * 0.7));
          const dispB = isHighlighted ? 255 : Math.min(255, Math.round(frame.b + frame.w * 0.7));

          if (fix.groupId === 'beams' || fix.groupId === 'washes' || fix.groupId === 'spots') {
            const isBeam = fix.groupId === 'beams';
            const beamLen = isBeam ? H * 0.55 : fix.groupId === 'spots' ? H * 0.46 : H * 0.36;
            const spreadWidth = isBeam ? 24 : fix.groupId === 'spots' ? 40 : 60;
            const dx = frame.panNorm * (W * 0.26);
            const dy = -frame.tiltNorm * (H * 0.34) + (isBeam ? H * 0.14 : H * 0.18);

            const drawCone = (angleOffsetRad: number, coneAlpha: number) => {
              const baseAngle = Math.atan2(dy, dx) + angleOffsetRad;
              const dist = Math.min(beamLen, Math.hypot(dx, dy) + H * 0.22);
              const tx = x + Math.cos(baseAngle) * dist;
              const ty = y + Math.sin(baseAngle) * dist;
              const perpX = -Math.sin(baseAngle) * spreadWidth;
              const perpY = Math.cos(baseAngle) * spreadWidth;

              const grad = ctx.createLinearGradient(x, y, tx, ty);
              grad.addColorStop(
                0,
                `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(0.95, coneAlpha * 0.85)})`
              );
              grad.addColorStop(0.6, `rgba(${dispR}, ${dispG}, ${dispB}, ${coneAlpha * 0.32})`);
              grad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);

              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(tx - perpX, ty - perpY);
              ctx.lineTo(tx + perpX, ty + perpY);
              ctx.closePath();
              ctx.fill();
            };

            if (frame.prism) {
              drawCone(-0.18, alpha * 0.65);
              drawCone(0, alpha * 0.85);
              drawCone(0.18, alpha * 0.65);
            } else {
              drawCone(0, alpha);
            }
          } else if (fix.groupId === 'strobes' || fix.groupId === 'blinders') {
            const rad = fix.groupId === 'blinders' ? 68 : 52;
            const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
            grad.addColorStop(0, `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(1, alpha)})`);
            grad.addColorStop(0.5, `rgba(${dispR}, ${dispG}, ${dispB}, ${alpha * 0.45})`);
            grad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fill();
          } else if (fix.groupId === 'bars') {
            const barW = Math.min(
              48,
              (W * 0.72) / Math.max(4, fixtures.filter((f) => f.groupId === 'bars').length)
            );
            const grad = ctx.createRadialGradient(x, y, 2, x, y, barW * 1.1);
            grad.addColorStop(0, `rgba(${dispR}, ${dispG}, ${dispB}, ${Math.min(0.95, alpha)})`);
            grad.addColorStop(1, `rgba(${dispR}, ${dispG}, ${dispB}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - barW * 0.8, y - 18, barW * 1.6, 36);
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      for (const fix of fixtures) {
        const frame = fixtureFrames[fix.id];
        const prof = profileMap.get(fix.profileId);
        if (!frame) continue;

        const x = W * 0.5 + fix.stageX * (W * 0.41);
        const y = H * rowYNorm[fix.groupId];
        const isSelected = selectedFixtureId === fix.id;
        const isHighlighted = highlightedFixtureId === fix.id;
        const effDim = isHighlighted ? 1 : frame.dimmer;

        hits.push({ fixtureId: fix.id, sx: x, sy: y, radius: 14 });

        const dispR = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.r + frame.w * 0.6) * effDim));
        const dispG = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.g + frame.w * 0.6) * effDim));
        const dispB = isHighlighted
          ? 255
          : Math.min(255, Math.round((frame.b + frame.w * 0.6) * effDim));

        ctx.fillStyle = effDim > 0.02 ? `rgb(${dispR}, ${dispG}, ${dispB})` : '#1e293b';
        ctx.strokeStyle = isSelected ? '#38bdf8' : effDim > 0.02 ? '#ffffff' : '#475569';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;

        if (fix.groupId === 'bars' || fix.groupId === 'strobes') {
          ctx.beginPath();
          ctx.roundRect(x - 11, y - 6, 22, 12, 3);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        if (showDmxLabels) {
          ctx.fillStyle = isSelected ? '#38bdf8' : '#cbd5e1';
          ctx.font = '600 9px Inter, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`#${fix.orderInGroup + 1}`, x, y + 18);

          if (
            prof &&
            (fix.groupId === 'beams' || fix.groupId === 'washes' || fix.groupId === 'spots')
          ) {
            ctx.fillStyle = '#64748b';
            ctx.font = '8px monospace';
            ctx.fillText(`${frame.panDmx}/${frame.tiltDmx}`, x, y + 27);
          }
        }
      }
    }

    projectedHitsRef.current = hits;
    ctx.restore();
  }, [
    fixtures,
    fixtureFrames,
    groupCalibrations,
    profileMap,
    viewMode,
    showDmxLabels,
    camYaw,
    camPitch,
    camZoom,
    hazeDensity,
    beamBoost,
    selectedFixtureId,
    highlightedFixtureId,
    liveSfxLevels,
    getFixture3DPos,
  ]);

  const currentUniChannels = universes[selectedUniverse] || new Array(512).fill(0);
  const activeOffsetCal = groupCalibrations[offsetActiveGroup];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/95 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
            {isStandaloneWindow ? 'MONITOR 3D ESCENARIO · 2ª PANTALLA EN VIVO' : 'Visualizador 3D'} (
            {fixtures.length} Focos)
          </span>
          <span className="hidden lg:inline-block text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            💡 Clic en un foco = Localizar / Offset Individual
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Global Orientation & Model Offset Button */}
          {onUpdateGroupCalibration && (
            <button
              onClick={() => setOffsetPanelOpen((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                offsetPanelOpen
                  ? 'bg-cyan-500 text-slate-950 border-white shadow'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
              }`}
              title="Configurar Offset de Pan y Tilt por familia si cambias de modelo de focos o están colgados mirando hacia otro lado"
            >
              <Compass className="w-3.5 h-3.5" />
              🧭 Offset Focos / Giro
            </button>
          )}

          {onOpenCalibrationModal && (
            <>
              <button
                onClick={() => onOpenCalibrationModal('beams')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                title="Calibrar los 4 límites de escenario (Pan/Tilt) para el grupo Beams"
              >
                <Sliders className="w-3 h-3" />
                Límites 4P
              </button>
              <div className="h-4 w-px bg-slate-800 mx-0.5" />
            </>
          )}

          {viewMode !== 'dmx' && (
            <>
              <button
                onClick={() => onUpdateManualXY({ ...manualXY, enabled: !manualXY.enabled })}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                  manualXY.enabled
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow shadow-emerald-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                }`}
                title="Activa el modo Cañón de Seguimiento (Followspot): arrastra el ratón sobre el escenario para apuntar los cabezales en directo"
              >
                <Crosshair className="w-3 h-3" />
                {manualXY.enabled ? 'Followspot XY: ACTIVO' : 'Apuntar con Ratón (XY)'}
              </button>

              <button
                onClick={() => setShowDmxLabels((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                  showDmxLabels
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                Etiquetas
              </button>
            </>
          )}

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Escenario 3D
            </button>
            <button
              onClick={() => setViewMode('stage')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'stage'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              2D Frontal
            </button>
            <button
              onClick={() => setViewMode('dmx')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'dmx'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              DMX512
            </button>
          </div>

          {!isStandaloneWindow && onPopoutWindow && (
            <button
              onClick={onPopoutWindow}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition cursor-pointer"
              title="Abrir Visualizador 3D en una ventana independiente para arrastrar a tu 2º monitor"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              2ª Pantalla
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode !== 'dmx' ? (
        <div
          className={`relative flex-1 min-h-[240px] select-none ${
            manualXY.enabled
              ? 'cursor-crosshair'
              : viewMode === '3d'
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-pointer'
          }`}
          onWheel={(e) => {
            if (viewMode !== '3d') return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.08 : -0.08;
            setCamZoom((prev) =>
              Math.max(0.65, Math.min(1.85, Number((prev + delta).toFixed(2))))
            );
          }}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            if (manualXY.enabled) {
              const nx = (clickX / rect.width) * 2 - 1;
              const ny = 1 - (clickY / rect.height) * 2;
              onUpdateManualXY({
                ...manualXY,
                panNorm: Math.max(-1, Math.min(1, nx)),
                tiltNorm: Math.max(-1, Math.min(1, ny)),
              });
              return;
            }

            orbitDragRef.current = {
              active: true,
              startX: e.clientX,
              startY: e.clientY,
              startYaw: camYaw,
              startPitch: camPitch,
              moved: false,
            };
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (manualXY.enabled && e.buttons === 1) {
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2;
              onUpdateManualXY({
                ...manualXY,
                panNorm: Math.max(-1, Math.min(1, nx)),
                tiltNorm: Math.max(-1, Math.min(1, ny)),
              });
              return;
            }

            if (viewMode === '3d' && orbitDragRef.current.active && e.buttons === 1) {
              const dx = e.clientX - orbitDragRef.current.startX;
              const dy = e.clientY - orbitDragRef.current.startY;
              if (Math.hypot(dx, dy) > 4) {
                orbitDragRef.current.moved = true;
              }
              setCamYaw(
                Math.max(-1.45, Math.min(1.45, orbitDragRef.current.startYaw + dx * 0.0065))
              );
              setCamPitch(
                Math.max(-0.15, Math.min(1.25, orbitDragRef.current.startPitch + dy * 0.0055))
              );
            }
          }}
          onMouseUp={(e) => {
            const wasMoved = orbitDragRef.current.moved;
            orbitDragRef.current.active = false;
            if (manualXY.enabled || wasMoved) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            let closestId: string | null = null;
            let closestDist = 999;
            for (const h of projectedHitsRef.current) {
              const d = Math.hypot(clickX - h.sx, clickY - h.sy);
              if (d <= h.radius && d < closestDist) {
                closestDist = d;
                closestId = h.fixtureId;
              }
            }
            if (closestId) {
              setSelectedFixtureId((prev) => (prev === closestId ? null : closestId));
            }
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Quick Camera Angle Presets Bar (Top Left of 3D Canvas) */}
          {viewMode === '3d' && !manualXY.enabled && (
            <div className="absolute top-2 left-2.5 flex flex-wrap items-center gap-1 bg-slate-950/85 backdrop-blur-sm border border-slate-800/90 rounded-xl p-1">
              <span className="text-[9px] font-black uppercase text-slate-400 px-1.5 flex items-center gap-1">
                <Camera className="w-3 h-3 text-amber-400" />
                Cámara:
              </span>
              {CAMERA_PRESETS.map((preset) => {
                const isClose =
                  Math.abs(camYaw - preset.yaw) < 0.08 && Math.abs(camPitch - preset.pitch) < 0.08;
                return (
                  <button
                    key={preset.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setCamYaw(preset.yaw);
                      setCamPitch(preset.pitch);
                      setCamZoom(preset.zoom);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      isClose
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Global Model Orientation / Pan-Tilt Offset Popover (Por si cambias de modelo de focos) */}
          {offsetPanelOpen && onUpdateGroupCalibration && activeOffsetCal && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-11 left-2.5 z-30 w-80 bg-slate-950/95 backdrop-blur-md border-2 border-cyan-400 rounded-2xl shadow-2xl p-3 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="font-black text-cyan-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Offset de Orientación (Cambio de Focos)</span>
                </div>
                <button
                  onClick={() => setOffsetPanelOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Si cambias de modelo de cabezas móviles o las cuelgan giradas en el puente, ajusta aquí su <strong>Offset de Pan/Tilt</strong> sin tener que tocar ninguna escena.
              </p>

              {/* Group Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'beams', label: 'Beams' },
                    { id: 'spots', label: 'Spots (Gobos)' },
                    { id: 'washes', label: 'Washes' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setOffsetActiveGroup(g.id)}
                    className={`py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      offsetActiveGroup === g.id
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Pan Offset Controls */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">Offset Pan (Giro Horizontal):</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {(activeOffsetCal.panOffsetDmx || 0) > 0
                      ? `+${activeOffsetCal.panOffsetDmx}`
                      : activeOffsetCal.panOffsetDmx || 0}{' '}
                    DMX
                  </span>
                </div>
                <input
                  type="range"
                  min={-127}
                  max={127}
                  step={1}
                  value={activeOffsetCal.panOffsetDmx || 0}
                  onChange={(e) =>
                    onUpdateGroupCalibration(offsetActiveGroup, {
                      panOffsetDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[
                    { label: '-90° Izq', val: -43 },
                    { label: '0° Frente', val: 0 },
                    { label: '+90° Der', val: 43 },
                    { label: '180° Atrás', val: 85 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() =>
                        onUpdateGroupCalibration(offsetActiveGroup, {
                          panOffsetDmx: preset.val,
                        })
                      }
                      className={`py-1 rounded text-[9px] font-bold border cursor-pointer ${
                        (activeOffsetCal.panOffsetDmx || 0) === preset.val
                          ? 'bg-cyan-500 text-slate-950 border-white'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tilt Offset Controls */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">Offset Tilt (Inclinación Vertical):</span>
                  <span className="font-mono font-bold text-amber-300">
                    {(activeOffsetCal.tiltOffsetDmx || 0) > 0
                      ? `+${activeOffsetCal.tiltOffsetDmx}`
                      : activeOffsetCal.tiltOffsetDmx || 0}{' '}
                    DMX
                  </span>
                </div>
                <input
                  type="range"
                  min={-127}
                  max={127}
                  step={1}
                  value={activeOffsetCal.tiltOffsetDmx || 0}
                  onChange={(e) =>
                    onUpdateGroupCalibration(offsetActiveGroup, {
                      tiltOffsetDmx: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-1.5 accent-amber-400 cursor-pointer"
                />
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {[
                    { label: '-45° Más Suelo', val: -32 },
                    { label: '0° Normal', val: 0 },
                    { label: '+45° Más Alto', val: 32 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() =>
                        onUpdateGroupCalibration(offsetActiveGroup, {
                          tiltOffsetDmx: preset.val,
                        })
                      }
                      className={`py-1 rounded text-[9px] font-bold border cursor-pointer ${
                        (activeOffsetCal.tiltOffsetDmx || 0) === preset.val
                          ? 'bg-amber-500 text-slate-950 border-white'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Invert Pan / Tilt */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    onUpdateGroupCalibration(offsetActiveGroup, {
                      invertPanGroup: !activeOffsetCal.invertPanGroup,
                    })
                  }
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    activeOffsetCal.invertPanGroup
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  ⇄ Invertir Pan Grupo: {activeOffsetCal.invertPanGroup ? 'SÍ' : 'NO'}
                </button>
                <button
                  onClick={() =>
                    onUpdateGroupCalibration(offsetActiveGroup, {
                      invertTiltGroup: !activeOffsetCal.invertTiltGroup,
                    })
                  }
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    activeOffsetCal.invertTiltGroup
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  ⇅ Invertir Tilt Grupo: {activeOffsetCal.invertTiltGroup ? 'SÍ' : 'NO'}
                </button>
              </div>
            </div>
          )}

          {/* Direct Click Fixture Inspector Overlay Card (Blindaje #3, #4 + Offset Individual) */}
          {selectedFixture && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-11 right-3 z-20 w-68 bg-slate-950/95 backdrop-blur-md border-2 border-sky-400 rounded-2xl shadow-2xl p-3 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div>
                  <div className="font-black text-white flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px]">
                      #{selectedFixture.orderInGroup + 1}
                    </span>
                    <span className="truncate max-w-[140px]">{selectedFixture.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Universo {selectedFixture.universe} · Dir DMX{' '}
                    <strong className="text-amber-300">
                      CH {String(selectedFixture.address).padStart(3, '0')}
                    </strong>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFixtureId(null)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {onToggleHighlightFixture && (
                <button
                  onClick={() =>
                    onToggleHighlightFixture(
                      highlightedFixtureId === selectedFixture.id ? null : selectedFixture.id
                    )
                  }
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl font-black text-[11px] border transition cursor-pointer ${
                    highlightedFixtureId === selectedFixture.id
                      ? 'bg-yellow-300 text-slate-950 border-white shadow-lg'
                      : 'bg-slate-900 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/15'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {highlightedFixtureId === selectedFixture.id
                    ? '🔦 LOCALIZANDO EN BLANCO (ON)'
                    : '🔦 Localizar Foco en Escenario'}
                </button>
              )}

              {onUpdateFixture && (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateFixture(selectedFixture.id, {
                          invertPan: !selectedFixture.invertPan,
                        })
                      }
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        selectedFixture.invertPan
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Inv. Pan {selectedFixture.invertPan ? 'SÍ' : 'NO'}
                    </button>
                    <button
                      onClick={() =>
                        onUpdateFixture(selectedFixture.id, {
                          invertTilt: !selectedFixture.invertTilt,
                        })
                      }
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        selectedFixture.invertTilt
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      Inv. Tilt {selectedFixture.invertTilt ? 'SÍ' : 'NO'}
                    </button>
                  </div>

                  {/* Individual Fixture Pan/Tilt Offset */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Offset Pan Individual:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {selectedFixture.panOffsetDmx || 0} DMX
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-127}
                      max={127}
                      step={1}
                      value={selectedFixture.panOffsetDmx || 0}
                      onChange={(e) =>
                        onUpdateFixture(selectedFixture.id, {
                          panOffsetDmx: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-slate-400 font-bold">Offset Tilt Individual:</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {selectedFixture.tiltOffsetDmx || 0} DMX
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-127}
                      max={127}
                      step={1}
                      value={selectedFixture.tiltOffsetDmx || 0}
                      onChange={(e) =>
                        onUpdateFixture(selectedFixture.id, {
                          tiltOffsetDmx: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full h-1.5 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Stage X Position Slider on Truss */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Posición en Puente (X):</span>
                      <span className="font-mono text-sky-300 font-bold">
                        {selectedFixture.stageX.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.05}
                      value={selectedFixture.stageX}
                      onChange={(e) =>
                        onUpdateFixture(selectedFixture.id, {
                          stageX: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-1.5 accent-sky-400 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3D Camera Orbit, Zoom & Volumetric Power Controls */}
          {viewMode === '3d' && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2.5 flex flex-wrap items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 text-[10px] text-slate-300"
            >
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Giro:</span>
                <input
                  type="range"
                  min={-1.4}
                  max={1.4}
                  step={0.02}
                  value={camYaw}
                  onChange={(e) => setCamYaw(parseFloat(e.target.value))}
                  className="w-14 accent-amber-400 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Altura:</span>
                <input
                  type="range"
                  min={-0.12}
                  max={1.2}
                  step={0.02}
                  value={camPitch}
                  onChange={(e) => setCamPitch(parseFloat(e.target.value))}
                  className="w-14 accent-amber-400 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-sky-400" />
                <input
                  type="range"
                  min={0.65}
                  max={1.85}
                  step={0.05}
                  value={camZoom}
                  onChange={(e) => setCamZoom(parseFloat(e.target.value))}
                  className="w-12 accent-sky-400 cursor-pointer"
                  title="Zoom de Cámara 3D (o usa la rueda del ratón)"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-300 font-bold">🔆 Potencia:</span>
                <input
                  type="range"
                  min={0.8}
                  max={2.4}
                  step={0.1}
                  value={beamBoost}
                  onChange={(e) => setBeamBoost(parseFloat(e.target.value))}
                  className="w-14 accent-amber-400 cursor-pointer"
                  title="Potencia visual de los haces en 3D"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Haze:</span>
                <input
                  type="range"
                  min={0.4}
                  max={1.5}
                  step={0.05}
                  value={hazeDensity}
                  onChange={(e) => setHazeDensity(parseFloat(e.target.value))}
                  className="w-12 accent-sky-400 cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  setCamYaw(0);
                  setCamPitch(0.28);
                  setCamZoom(1.05);
                  setBeamBoost(1.55);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] cursor-pointer"
                title="Restaurar Cámara 3D Frontal"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          )}

          {manualXY.enabled && (
            <div className="absolute top-2 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-[11px] text-emerald-300">
              <span>
                🎯 <strong>Modo Followspot Activo:</strong> Arrastra en el escenario para apuntar:
              </span>
              <select
                value={manualXY.targetGroup}
                onChange={(e) =>
                  onUpdateManualXY({
                    ...manualXY,
                    targetGroup: e.target.value as GroupId | 'all',
                  })
                }
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/40 text-white text-[10px]"
              >
                <option value="all">Todos los Cabezales</option>
                <option value="beams">Solo Beams</option>
                <option value="spots">Solo Spots</option>
                <option value="washes">Solo Washes</option>
              </select>
            </div>
          )}

          <div className="absolute bottom-2 right-3 hidden xl:flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/85 border border-slate-800 text-[10px] text-slate-400 pointer-events-none">
            <span>
              Beams:{' '}
              <strong className="text-amber-400">
                {fixtures.filter((f) => f.groupId === 'beams').length}
              </strong>
            </span>
            <span>
              Spots:{' '}
              <strong className="text-purple-400">
                {fixtures.filter((f) => f.groupId === 'spots').length}
              </strong>
            </span>
            <span>
              Washes:{' '}
              <strong className="text-sky-400">
                {fixtures.filter((f) => f.groupId === 'washes').length}
              </strong>
            </span>
            <span>
              Cegad:{' '}
              <strong className="text-orange-400">
                {fixtures.filter((f) => f.groupId === 'blinders').length}
              </strong>
            </span>
            <span>
              Strobos:{' '}
              <strong className="text-yellow-400">
                {fixtures.filter((f) => f.groupId === 'strobes').length}
              </strong>
            </span>
            <span>
              Barras:{' '}
              <strong className="text-pink-400">
                {fixtures.filter((f) => f.groupId === 'bars').length}
              </strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUniverse(u)}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    selectedUniverse === u
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Universo {u} (Art-Net Net 0 · SubUni {u - 1})
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              512 Canales DMX en Tiempo Real (0..255)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-16 gap-1 pr-1 font-mono">
            {currentUniChannels.slice(0, 256).map((val, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center py-1 rounded border text-[10px] ${
                  val > 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-600'
                }`}
              >
                <span className="text-[8px] opacity-60">CH{idx + 1}</span>
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
