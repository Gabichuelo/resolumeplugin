/**
 * 100% Offline ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, EC Level L)
 * Supports URLs up to 78 characters (Version 3-L 29x29 & Version 4-L 33x33)
 * Zero external dependencies — works in venues without internet.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function computeReedSolomon(data: number[], ecCount: number): number[] {
  // Build generator polynomial of degree ecCount
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(gen.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], root);
    }
    gen = next;
  }

  const msg = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) msg[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return msg.slice(data.length);
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = Array.from(new TextEncoder().encode(text));
  // Use Version 3-L (53 bytes max) or Version 4-L (78 bytes max)
  const isV4 = utf8.length > 53;
  const size = isV4 ? 33 : 29;
  const dataCapacityBytes = isV4 ? 80 : 55;
  const ecBytes = isV4 ? 20 : 15;
  const alignCoord = isV4 ? 26 : 22;

  // Encode Byte Mode (0100) + 8-bit length + bytes + terminator
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(utf8.length, 8);
  for (const b of utf8) pushBits(b, 8);

  const maxBits = dataCapacityBytes * 8;
  const term = Math.min(4, maxBits - bits.length);
  pushBits(0, term);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
    dataCodewords.push(byte);
  }

  let padToggle = true;
  while (dataCodewords.length < dataCapacityBytes) {
    dataCodewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  const ecCodewords = computeReedSolomon(dataCodewords, ecBytes);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns (7x7) + separators
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr <= 6 && (dr === 6 || dc === 0 || dc === 6);
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inCenter));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment pattern (5x5 centered at alignCoord, alignCoord)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dist = Math.max(Math.abs(dr), Math.abs(dc));
      setFunctionModule(alignCoord + dr, alignCoord + dc, dist !== 1);
    }
  }

  // Reserve Format Info areas around Top-Left, Top-Right (8 modules) and Bottom-Left (7 modules + Dark Module)
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, false);
  }
  for (let i = 0; i < 7; i++) {
    setFunctionModule(size - 1 - i, 8, false);
  }
  // Mandatory Dark Module at (4 * V + 9, 8) = (size - 8, 8)
  setFunctionModule(size - 8, 8, true);

  // Place data bits in upward/downward 2-column zig-zag
  const allBits: number[] = [];
  for (const cw of allCodewords) {
    for (let b = 7; b >= 0; b--) allBits.push((cw >> b) & 1);
  }
  // Remainder bits (7 for V3/V4)
  for (let i = 0; i < 7; i++) allBits.push(0);

  let bitIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Skip vertical timing pattern column
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = rightCol - dc;
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] === 1 : false;
          // Apply Mask 0: (r + c) % 2 === 0
          const maskInvert = (r + c) % 2 === 0;
          modules[r][c] = bit !== maskInvert;
        }
      }
    }
    upward = !upward;
  }

  // Write ISO/IEC 18004 Format Information for Level L (01) + Mask 0 (000) -> 0x77c4
  // Bit 0 is LSB, Bit 14 is MSB:
  // Copy 1 (around Top-Left finder):
  //   bits 0..5 -> (0,8)..(5,8)
  //   bit 6     -> (7,8)
  //   bit 7     -> (8,8)
  //   bit 8     -> (8,7)
  //   bits 9..14-> (8,5)..(8,0)
  const formatBits = 0x77c4;
  for (let i = 0; i <= 5; i++) {
    setFunctionModule(i, 8, ((formatBits >> i) & 1) === 1);
  }
  setFunctionModule(7, 8, ((formatBits >> 6) & 1) === 1);
  setFunctionModule(8, 8, ((formatBits >> 7) & 1) === 1);
  setFunctionModule(8, 7, ((formatBits >> 8) & 1) === 1);
  for (let i = 9; i <= 14; i++) {
    setFunctionModule(8, 14 - i, ((formatBits >> i) & 1) === 1);
  }

  // Copy 2 (Top-Right row 8 has bits 0..7, Bottom-Left col 8 has bits 8..14):
  for (let i = 0; i <= 7; i++) {
    setFunctionModule(8, size - 1 - i, ((formatBits >> i) & 1) === 1);
  }
  for (let i = 8; i <= 14; i++) {
    setFunctionModule(size - 15 + i, 8, ((formatBits >> i) & 1) === 1);
  }

  return modules;
}
