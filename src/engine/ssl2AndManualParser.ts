import type { ColorPaletteId, FixtureProfile, GroupId } from '../types/dmx';

/**
 * Parses a Daslight 5 <SSLLIBRARY> XML definition and extracts all semantic DMX channels,
 * shutter/strobe DMX values, color wheel slots, and gobo slots automatically.
 */
export function parseSslLibraryXmlToProfile(
  sslXml: string,
  customName?: string
): FixtureProfile {
  const sslNameMatch = sslXml.match(/SSLNAME="([^"]+)"/);
  const rawSslPath = sslNameMatch ? sslNameMatch[1] : 'Generic/Custom.ssl2';
  const parts = rawSslPath.split('/');
  const manufacturer = parts.length > 1 ? parts[0] : 'Nicolaudie SSL2';
  const baseName =
    customName ||
    (parts[parts.length - 1] || 'Fixture').replace(/\.ssl2$/i, '');

  const nbChMatch = sslXml.match(/SSLNBCHANNEL="(\d+)"/);
  const channelCount = nbChMatch ? parseInt(nbChMatch[1], 10) : 16;

  const channels: FixtureProfile['channels'] = {};
  const dmxRules: FixtureProfile['dmxRules'] = {
    shutterOpen: 255,
    shutterClosed: 0,
    strobeSlow: 45,
    strobeMed: 140,
    strobeFast: 240,
    prismOn: 160,
    prismOff: 0,
    prismRotCw: 170,
  };

  // Match all <SSLCHANNEL ...>...</SSLCHANNEL> or self-closing <SSLCHANNEL .../>
  const channelRegex = /<SSLCHANNEL\s+([^>]+?)(?:\/>|>([\s\S]*?)<\/SSLCHANNEL>)/g;
  let m: RegExpExecArray | null;
  let chIndex1Based = 0;

  while ((m = channelRegex.exec(sslXml)) !== null) {
    chIndex1Based++;
    const attrs = m[1];
    const body = m[2] || '';

    const getAttr = (k: string) => {
      const am = attrs.match(new RegExp(`${k}="([^"]*)"`));
      return am ? am[1] : '';
    };

    const chType = parseInt(getAttr('SSLCHANNELTYPE') || '0', 10);
    const chName = (getAttr('SSLCHANNELNAME') || '').toLowerCase();
    const isLsb = getAttr('SSLCHANNELLSB') === '1';

    if (chType === 1) {
      if (isLsb) channels.panFine = chIndex1Based;
      else channels.pan = chIndex1Based;
    } else if (chType === 2) {
      if (isLsb) channels.tiltFine = chIndex1Based;
      else channels.tilt = chIndex1Based;
    } else if (chType === 7 || chName.includes('dimmer')) {
      if (!channels.dimmer) channels.dimmer = chIndex1Based;
    } else if (chType === 15 || chName.includes('shutter') || chName.includes('strob')) {
      if (!channels.shutter) channels.shutter = chIndex1Based;
      if (!channels.strobe) channels.strobe = chIndex1Based;

      // Inspect <SSLPRESET> inside Shutter channel for exact Open / Strobe DMX values
      const presetOpen = body.match(/SSLPRESETTYPE="19"[^>]*SSLPRESETDMXDEFAULT="(\d+)"/);
      if (presetOpen) {
        dmxRules.shutterOpen = parseInt(presetOpen[1], 10);
      }
      const presetStrobe = body.match(/SSLPRESETTYPE="21"[^>]*SSLPRESETDMXSTART="(\d+)"[^>]*SSLPRESETDMXEND="(\d+)"/);
      if (presetStrobe) {
        const sStart = parseInt(presetStrobe[1], 10);
        const sEnd = parseInt(presetStrobe[2], 10);
        dmxRules.strobeSlow = Math.round(sStart + (sEnd - sStart) * 0.2);
        dmxRules.strobeMed = Math.round(sStart + (sEnd - sStart) * 0.55);
        dmxRules.strobeFast = Math.round(sStart + (sEnd - sStart) * 0.9);
      }
    } else if (chType === 25 || chName === 'red' || chName.includes('red')) {
      if (!channels.red) channels.red = chIndex1Based;
    } else if (chType === 26 || chName === 'green' || chName.includes('green')) {
      if (!channels.green) channels.green = chIndex1Based;
    } else if (chType === 27 || chName === 'blue' || chName.includes('blue')) {
      if (!channels.blue) channels.blue = chIndex1Based;
    } else if (chType === 31 || chName === 'white' || chName.includes('white')) {
      if (!channels.white) channels.white = chIndex1Based;
    } else if (chType === 28 || chName.includes('cyan')) {
      if (!channels.cyan) channels.cyan = chIndex1Based;
    } else if (chType === 29 || chName.includes('magenta')) {
      if (!channels.magenta) channels.magenta = chIndex1Based;
    } else if (chType === 30 || chName.includes('yellow')) {
      if (!channels.yellow) channels.yellow = chIndex1Based;
    } else if (chType === 8 || chName.includes('gobo')) {
      if (!channels.gobo) channels.gobo = chIndex1Based;
    } else if (chType === 19 || (chName.includes('prism') && !chName.includes('rot'))) {
      if (!channels.prism) channels.prism = chIndex1Based;
    } else if (chType === 20 || (chName.includes('prism') && chName.includes('rot'))) {
      if (!channels.prismRot) channels.prismRot = chIndex1Based;
    } else if (chType === 14 || chName.includes('zoom')) {
      if (!channels.zoom) channels.zoom = chIndex1Based;
    } else if (chType === 16 || chName.includes('focus')) {
      if (!channels.focus) channels.focus = chIndex1Based;
    } else if (chName.includes('color wheel') || chName === 'color' || chName === 'colour') {
      if (!channels.colorWheel) {
        channels.colorWheel = chIndex1Based;
        dmxRules.colorWheelMap = {
          white: 0,
          red: 15,
          amber: 28,
          green: 42,
          cyan: 65,
          blue: 55,
          magenta: 50,
          uv: 85,
        };
      }
    }
  }

  // Determine best universal group category automatically
  let category: GroupId = 'beams';
  if (channels.pan && channels.red && !channels.gobo) {
    category = 'washes';
  } else if (!channels.pan && channels.strobe && channelCount >= 10) {
    category = 'strobes';
  } else if (!channels.pan && (channels.red || channels.dimmer)) {
    category = 'bars';
  }

  return {
    id: `ssl2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    name: `${baseName} (${channelCount}CH)`,
    manufacturer,
    category,
    channelCount,
    sslLibraryKey:
      category === 'washes'
        ? 'robin300'
        : category === 'strobes'
          ? 'stroboIP65'
          : category === 'bars'
            ? 'barRGBW'
            : 'sharpy7R',
    sslPath: rawSslPath,
    description: `Extraído automáticamente de librería SSL2 (${rawSslPath}).`,
    channels,
    dmxRules,
  };
}

/**
 * Intelligent DMX Manual Parser (Spanish / English / Chinese)
 * Paste raw text from any PDF/Word fixture manual (e.g., "CH1 Pan, CH2 Pan Fine, CH3 Tilt...")
 * and it builds a complete HAL FixtureProfile automatically!
 */
export function parseManualTextToProfile(
  rawText: string,
  fixtureName: string,
  manufacturer: string,
  defaultCategory: GroupId
): FixtureProfile {
  const lines = rawText
    .replace(/\t/g, ' ')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const channels: FixtureProfile['channels'] = {};
  let maxCh = 0;

  const assignLine = (chNum: number, desc: string) => {
    if (chNum < 1 || chNum > 512) return;
    if (chNum > maxCh) maxCh = chNum;
    const d = desc.toLowerCase();

    if (d.includes('pan fine') || d.includes('x fine') || d.includes('x-axis fine') || d.includes('fino x')) {
      channels.panFine = chNum;
    } else if (d.includes('tilt fine') || d.includes('y fine') || d.includes('y-axis fine') || d.includes('fino y')) {
      channels.tiltFine = chNum;
    } else if (d.includes('pan') || d.includes('x axle') || d.includes('x axis') || d.includes('horizontal')) {
      if (!d.includes('speed') && !d.includes('vel')) channels.pan = chNum;
    } else if (d.includes('tilt') || d.includes('y axle') || d.includes('y axis') || d.includes('vertical')) {
      if (!d.includes('speed') && !d.includes('vel')) channels.tilt = chNum;
    } else if (d.includes('dimmer') || d.includes('aiming') || d.includes('intensidad') || d.includes('atenuador')) {
      if (!channels.dimmer) channels.dimmer = chNum;
    } else if (d.includes('shutter') || d.includes('strob') || d.includes('flicker') || d.includes('cut off') || d.includes('estrobo')) {
      if (!channels.shutter) channels.shutter = chNum;
      if (!channels.strobe) channels.strobe = chNum;
    } else if (d.includes('cyan') || d.includes('ching') || d.includes('cmy blue')) {
      channels.cyan = chNum;
    } else if (d.includes('magenta') || d.includes('pinkish red') || d.includes('cmy red')) {
      channels.magenta = chNum;
    } else if (d.includes('yellow') || d.includes('amarillo')) {
      channels.yellow = chNum;
    } else if (d.includes('red') || d.includes('rojo')) {
      if (!channels.red) channels.red = chNum;
    } else if (d.includes('green') || d.includes('verde')) {
      if (!channels.green) channels.green = chNum;
    } else if (d.includes('blue') || d.includes('azul')) {
      if (!channels.blue) channels.blue = chNum;
    } else if (d.includes('white') || d.includes('blanco')) {
      if (!channels.white) channels.white = chNum;
    } else if (d.includes('color wheel') || d.includes('colour wheel') || d.includes('rueda de color') || d === 'color') {
      if (!channels.colorWheel) channels.colorWheel = chNum;
    } else if (d.includes('gobo') || d.includes('patterned')) {
      if (!channels.gobo) channels.gobo = chNum;
    } else if ((d.includes('prism') || d.includes('prisma') || d.includes('lens 1')) && !d.includes('rot') && !d.includes('spin')) {
      if (!channels.prism) channels.prism = chNum;
    } else if ((d.includes('prism') || d.includes('prisma') || d.includes('lens')) && (d.includes('rot') || d.includes('spin'))) {
      if (!channels.prismRot) channels.prismRot = chNum;
    } else if (d.includes('zoom') || d.includes('amplify')) {
      if (!channels.zoom) channels.zoom = chNum;
    } else if (d.includes('focus') || d.includes('enfoque')) {
      if (!channels.focus) channels.focus = chNum;
    }
  };

  const chRegex = /^(?:CH|Channel|Canal)?\s*(\d{1,3})[\s:.\-|]+(.+)$/i;
  for (const line of lines) {
    const m = line.match(chRegex);
    if (m) {
      assignLine(parseInt(m[1], 10), m[2]);
    }
  }

  const finalChCount = Math.max(4, maxCh || 16);
  const colorWheelMap: Partial<Record<ColorPaletteId, number>> | undefined = channels.colorWheel
    ? {
        white: 0,
        red: 14,
        amber: 26,
        green: 40,
        cyan: 66,
        blue: 56,
        magenta: 48,
        uv: 82,
      }
    : undefined;

  return {
    id: `manual_${Date.now().toString(36)}`,
    name: `${fixtureName} (${finalChCount}CH)`,
    manufacturer: manufacturer || 'Manual Import',
    category: defaultCategory,
    channelCount: finalChCount,
    sslLibraryKey:
      defaultCategory === 'washes'
        ? 'robin300'
        : defaultCategory === 'strobes'
          ? 'stroboIP65'
          : defaultCategory === 'bars'
            ? 'barRGBW'
            : 'sharpy7R',
    description: `Generado automáticamente analizando el texto del manual DMX (${finalChCount} canales).`,
    channels,
    dmxRules: {
      shutterOpen: 255,
      shutterClosed: 0,
      strobeSlow: 45,
      strobeMed: 145,
      strobeFast: 242,
      prismOn: 150,
      prismOff: 0,
      prismRotCw: 175,
      colorWheelMap,
      goboSlots: [0, 15, 30, 45, 60, 75],
    },
  };
}
