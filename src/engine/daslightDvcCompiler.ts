import { deflate, Deflate, inflate } from 'pako';
import { OFFICIAL_SSL_LIBRARIES } from '../constants/officialSslLibraries';
import { FIXTURE_PROFILES, normalizeGroupOrders } from '../constants/defaultShowData';
import { evaluateDmxEngine } from './dmxEngine';
import type {
  FixtureProfile,
  GroupCalibration,
  GroupId,
  PatchedFixture,
  RecipeScene,
  SceneBank,
} from '../types/dmx';

function generateDasUid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/**
 * Compresses a Uint8Array using Z_SYNC_FLUSH (mode 2) matching Daslight 5's CDataCompressor format
 */
function deflateSyncFlush(input: Uint8Array): Uint8Array {
  const deflator = new Deflate();
  const chunks: Uint8Array[] = [];
  deflator.onData = (chunk: Uint8Array) => {
    chunks.push(new Uint8Array(chunk));
  };
  deflator.push(input, 2); // Z_SYNC_FLUSH
  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Compiles the current Patched Rig + Calibrations + GrandMA2-style Recipes into a 100% native
 * Daslight 5 (.dvc) file so any rig swap immediately works inside Daslight 5 as well.
 */
export function compileRecipesToDaslight5Dvc(params: {
  fixtures: PatchedFixture[];
  profiles: FixtureProfile[];
  groupCalibrations: Record<GroupId, GroupCalibration>;
  banks: SceneBank[];
  scenes: RecipeScene[];
  artnetTargetIp?: string;
}): string {
  const { fixtures, profiles, groupCalibrations, banks, scenes, artnetTargetIp = '2.0.0.44' } = params;

  const profileMap = new Map<string, FixtureProfile>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  const fixtureUidMap = new Map<string, string>();
  fixtures.forEach((f) => fixtureUidMap.set(f.id, generateDasUid()));

  // Group fixtures by sslLibraryKey so each <FIXTURES> block carries its authentic <SSLLIBRARY>
  const sslBuckets = new Map<string, PatchedFixture[]>();
  fixtures.forEach((f) => {
    const prof = profileMap.get(f.profileId) || profiles[0];
    const key = prof.sslLibraryKey || 'sharpy7R';
    if (!sslBuckets.has(key)) sslBuckets.set(key, []);
    sslBuckets.get(key)!.push(f);
  });

  const rowYByGroup: Record<GroupId, number> = {
    beams: 160,
    spots: 260,
    washes: 360,
    blinders: 460,
    strobes: 560,
    bars: 680,
  };

  let fixturesBlocksXml = '';
  sslBuckets.forEach((list, sslKey) => {
    const lib = OFFICIAL_SSL_LIBRARIES[sslKey] || OFFICIAL_SSL_LIBRARIES.sharpy7R;
    const tags = list
      .map((f, idx) => {
        const dasUid = fixtureUidMap.get(f.id)!;
        const posX = Math.round(500 + f.stageX * 380);
        const posY = rowYByGroup[f.groupId] || 300;
        const cleanName = f.name.replace(/[^a-zA-Z0-9 _#-]/g, '').trim() || `Fixture ${idx + 1}`;
        let beamsXml = '';
        for (let b = 0; b < lib.beamCount; b++) {
          beamsXml += `<BEAM INDEX="${b}" POSX="${posX}" POSY="${posY}"/>`;
        }
        return `<FIXTURE TYPE="0" DASUID="${dasUid}" NAME="${cleanName}" INDEX="${idx + 1}" SHAPE="1" SIZE="30" POSX="${posX}" POSY="${posY}" ANGLE="0" ADDRESS="${f.address}" UNIVERS="${Math.max(0, f.universe - 1)}" OUTMODE="${lib.outmode}" FLAG="${lib.flag}">${beamsXml}</FIXTURE>`;
      })
      .join('');
    fixturesBlocksXml += `<FIXTURES>${lib.xml}${tags}</FIXTURES>`;
  });

  const patchXml = `<PATCH NBFIXTURE="${fixtures.length}">${fixturesBlocksXml}</PATCH>`;
  const patchUtf8 = new TextEncoder().encode(patchXml);
  const deflatedPatch = deflate(patchUtf8);

  const patchHeader = new Uint8Array(4);
  const len = patchUtf8.length;
  patchHeader[0] = (len >> 24) & 0xff;
  patchHeader[1] = (len >> 16) & 0xff;
  patchHeader[2] = (len >> 8) & 0xff;
  patchHeader[3] = len & 0xff;

  const patchCombined = new Uint8Array(4 + deflatedPatch.length);
  patchCombined.set(patchHeader, 0);
  patchCombined.set(deflatedPatch, 4);
  const patchsDataBase64 = uint8ArrayToBase64(patchCombined);

  // Build <FIXTUREGROUPS>
  const groupIds: GroupId[] = ['beams', 'washes', 'spots', 'blinders', 'strobes', 'bars'];
  const groupXmlTags: string[] = [];

  const allTags = fixtures.map((f) => `<FIXTURE DASUID="${fixtureUidMap.get(f.id)!}"/>`).join('');
  groupXmlTags.push(
    `<FIXTUREGROUP DASUID="${generateDasUid()}" NAME="All (${fixtures.length})" TOGGLE_BLACKOUT="0" TOGGLE_STROBE="0" TOGGLE_FULL="0" TOGGLE_EXCLUSIVE_FULL="0" TOGGLE_FLASH="0" TOGGLE_EXCLUSIVE_FLASH="0"><FIXTURES>${allTags}</FIXTURES><BEAMSELECTION/></FIXTUREGROUP>`
  );

  for (const gId of groupIds) {
    const members = fixtures.filter((f) => f.groupId === gId);
    if (members.length === 0) continue;
    const gTags = members.map((f) => `<FIXTURE DASUID="${fixtureUidMap.get(f.id)!}"/>`).join('');
    const gName = groupCalibrations[gId].name.replace(/[^a-zA-Z0-9 _-]/g, '');
    groupXmlTags.push(
      `<FIXTUREGROUP DASUID="${generateDasUid()}" NAME="${gName}" TOGGLE_BLACKOUT="0" TOGGLE_STROBE="0" TOGGLE_FULL="0" TOGGLE_EXCLUSIVE_FULL="0" TOGGLE_FLASH="0" TOGGLE_EXCLUSIVE_FLASH="0"><FIXTURES>${gTags}</FIXTURES><BEAMSELECTION/></FIXTUREGROUP>`
    );
  }

  // Compile each RecipeScene into native Daslight 5 <SCENE> with exact binary <FIXTUREDATA>
  let firstSceneUid = '';
  const bankXmlList: string[] = [];

  for (const bank of banks) {
    const bankScenes = scenes.filter((s) => s.bankId === bank.id);
    if (bankScenes.length === 0) continue;

    const sceneXmlItems = bankScenes.map((scene) => {
      const sceneUid = generateDasUid();
      if (!firstSceneUid) firstSceneUid = sceneUid;

      // Evaluate our HAL + Calibration engine at t=0.25s for this RecipeScene
      const evalSnapshot = evaluateDmxEngine({
        fixtures,
        profiles,
        groupCalibrations,
        activeScenes: [scene],
        bpm: 128,
        timeSec: 0.25,
        globalMaster: 1,
        globalFxSize: 1,
        globalFxSpeed: 1,
        globalBlackout: false,
      });

      const fixtureDataXml = fixtures
        .map((f) => {
          const prof = profileMap.get(f.profileId) || profiles[0];
          const lib = OFFICIAL_SSL_LIBRARIES[prof.sslLibraryKey] || OFFICIAL_SSL_LIBRARIES.sharpy7R;
          const chCount = lib.channelCount;
          const beamCount = lib.beamCount;

          const bufLen = 2 + chCount * 2 + 4 + beamCount * 27;
          const buf = new Uint8Array(bufLen);
          buf[0] = (chCount >> 8) & 0xff;
          buf[1] = chCount & 0xff;

          // Default all channels to transparent (0xffff)
          for (let i = 0; i < chCount; i++) {
            buf[2 + i * 2] = 0xff;
            buf[2 + i * 2 + 1] = 0xff;
          }

          const beamHeaderOffset = 2 + chCount * 2;
          buf[beamHeaderOffset] = (beamCount >> 24) & 0xff;
          buf[beamHeaderOffset + 1] = (beamCount >> 16) & 0xff;
          buf[beamHeaderOffset + 2] = (beamCount >> 8) & 0xff;
          buf[beamHeaderOffset + 3] = beamCount & 0xff;

          const beamsBaseOffset = beamHeaderOffset + 4;
          for (let b = 0; b < beamCount; b++) {
            const bOff = beamsBaseOffset + b * 27;
            for (let fIdx = 0; fIdx < 13; fIdx++) {
              const val16 = fIdx === 8 || fIdx === 11 ? 0x3c00 : 0xbc00;
              buf[bOff + fIdx * 2] = (val16 >> 8) & 0xff;
              buf[bOff + fIdx * 2 + 1] = val16 & 0xff;
            }
            buf[bOff + 26] = 0x00;
          }

          const isTargeted = scene.targetGroups.includes(f.groupId);
          if (isTargeted) {
            const frame = evalSnapshot.fixtureFrames[f.id];
            const setCh = (ch1: number | undefined, v: number) => {
              if (!ch1 || ch1 < 1 || ch1 > chCount) return;
              const off = 2 + (ch1 - 1) * 2;
              buf[off] = 0x00;
              buf[off + 1] = Math.max(0, Math.min(255, Math.round(v)));
            };

            if (scene.dimmer !== 'transparent' || scene.fx.waveform === 'dimmer_chase' || scene.fx.waveform === 'sine_pulse') {
              if (prof.channels.dimmer) {
                setCh(prof.channels.dimmer, frame.dmxChannels[prof.channels.dimmer - 1]);
              }
              if (prof.channels.shutter) {
                setCh(prof.channels.shutter, frame.dmxChannels[prof.channels.shutter - 1]);
              }
              if (!prof.channels.dimmer) {
                // Virtual dimmer on 4CH RGBW bar
                setCh(prof.channels.red, frame.dmxChannels[(prof.channels.red || 1) - 1]);
                setCh(prof.channels.green, frame.dmxChannels[(prof.channels.green || 2) - 1]);
                setCh(prof.channels.blue, frame.dmxChannels[(prof.channels.blue || 3) - 1]);
                setCh(prof.channels.white, frame.dmxChannels[(prof.channels.white || 4) - 1]);
              }
            }

            if (scene.colorPrimary !== 'transparent' || scene.fx.waveform === 'rainbow') {
              setCh(prof.channels.red, frame.dmxChannels[(prof.channels.red || 1) - 1]);
              setCh(prof.channels.green, frame.dmxChannels[(prof.channels.green || 1) - 1]);
              setCh(prof.channels.blue, frame.dmxChannels[(prof.channels.blue || 1) - 1]);
              setCh(prof.channels.white, frame.dmxChannels[(prof.channels.white || 1) - 1]);
              setCh(prof.channels.colorWheel, frame.dmxChannels[(prof.channels.colorWheel || 1) - 1]);
              setCh(prof.channels.cyan, frame.dmxChannels[(prof.channels.cyan || 1) - 1]);
              setCh(prof.channels.magenta, frame.dmxChannels[(prof.channels.magenta || 1) - 1]);
              setCh(prof.channels.yellow, frame.dmxChannels[(prof.channels.yellow || 1) - 1]);
            }

            if (
              scene.positionPalette !== 'transparent' ||
              scene.fx.waveform === 'circle_pt' ||
              scene.fx.waveform === 'tilt_wave' ||
              scene.fx.waveform === 'pan_sweep' ||
              scene.fx.waveform === 'ballyhoo'
            ) {
              setCh(prof.channels.pan, frame.panDmx);
              setCh(prof.channels.tilt, frame.tiltDmx);
            }

            if (scene.strobeMode !== 'off') {
              setCh(prof.channels.strobe, frame.dmxChannels[(prof.channels.strobe || 1) - 1]);
              setCh(prof.channels.whiteTubeStrobe, frame.dmxChannels[(prof.channels.whiteTubeStrobe || 1) - 1]);
              setCh(prof.channels.whiteTubeDimmer, frame.dmxChannels[(prof.channels.whiteTubeDimmer || 1) - 1]);
            }

            if (scene.prismActive) {
              setCh(prof.channels.prism, frame.dmxChannels[(prof.channels.prism || 1) - 1]);
              setCh(prof.channels.prismRot, frame.dmxChannels[(prof.channels.prismRot || 1) - 1]);
            }
          }

          const compressedB64 = uint8ArrayToBase64(deflateSyncFlush(buf));
          return `                    <FIXTUREDATA FIXTURE="${fixtureUidMap.get(f.id)!}" DATA="${compressedB64}"/>`;
        })
        .join('\n');

      const cleanColor = scene.colorHex.startsWith('#') && scene.colorHex.length === 7
        ? `#ff${scene.colorHex.slice(1)}`
        : scene.colorHex;

      return `            <SCENE DASUID="${sceneUid}" NAME="${scene.name.replace(/["<>]/g, '')}" COLOR="${cleanColor}" ENABLE="1" VISIBLE="1" LOOP_MODE="0" LOOP="0" PLAY_DIRECTION="-1" PLAY_MODE="${scene.isFlashButton ? 1 : 2}" FLASH="${scene.isFlashButton ? 1 : 0}" BOUNCE_MODE="1" PLAY_TRIGGER="2" PLAY_DIVISION="8" DIMMER="1" D_FEATURE="1" SPEED="1" PHASE="0" SIZE="1" PHASE_IN="0" PHASE_OUT="0" AUTO_RELEASE_END="1" JUMP_MODE="-1" RELEASE_MODE="2" RELEASE_PROTECT_MODE="0" FADE_IN="0" FADE_OUT="0" ATTRIBUTEVALUE_MODE="0" LTPPRIORITY="2" PAUSE="1" SAIMAGEPATH="">
                <FIXTUREDATAS NB="${fixtures.length}">
${fixtureDataXml}
                </FIXTUREDATAS>
                <RACKS/>
            </SCENE>`;
    });

    const bankColor = bank.colorHex.startsWith('#') && bank.colorHex.length === 7
      ? `#ff${bank.colorHex.slice(1)}`
      : bank.colorHex;

    bankXmlList.push(`        <BANK DASUID="${generateDasUid()}" NAME="${bank.name.replace(/["<>]/g, '')}" COLOR="${bankColor}" COLLAPSED="0" PAUSED="0" HIDDEN="0" NBSCENE="${sceneXmlItems.length}">
${sceneXmlItems.join('\n')}
        </BANK>`);
  }

  return `<DLMFILE TYPE="Daslight" VERSION="5" DASBUILD="25.0905.165.111" VERSIONFILE="2">
    <CONFIGURATION VIEWZOOM="1" VIEWPOSX="-202" VIEWPOSY="-158" TOUCH_DOCK_MANAGER="0000014c78da7550316ec3300cdcfb0a427b6277eba028085c780a521471da59b58894a82c15126d24797d29a7f0d44e3ade1d8f07e9ed65f03061ca14c3463dae6b0518fae8289c37ead4b5ab27b535fa95776eb2a147f71cfb2fd18ed7cc38c0dbb2a8e094312db3c43431b0a5204c918d5e66687db43c1fa8853f7e7b6216fa25118a85e78055091803df7777092d74f6638e82664c098bd462669aac873d4d085d1cfb4f31bf933b23c3c10ef8b7051a1f33ba72be32ba2ae152836e984d0dbaba23797f8b095cba0bfee72fccc30f1c696f91" TOUCH_ZOOMS="1"/>
    <PATCHS DATA="${patchsDataBase64}"/>
    <FIXTUREGROUPS>
      ${groupXmlTags.join('\n      ')}
    </FIXTUREGROUPS>
    <SCENES>
${bankXmlList.join('\n')}
        <DAS_SELECTIONS SELECTED_LIVE_BANK="0">
            <SELECTED_LIVE_SCENES DASUID="${firstSceneUid}"/>
        </DAS_SELECTIONS>
    </SCENES>
    <SHORTCUTS/>
    <TOUCH>
        <TOUCHPAGE DASUID="${generateDasUid()}" NAME="GrandDas Live Touch" TOUCHCONTROL="0"/>
    </TOUCH>
    <DEVICES>
        <DASTLDEVICE DASTLNAME="Hahan Light Box" DASTLACTIVE="TRUE" DASTLCURRENTIDTYPE="1" DASTLBROADCAST="FALSE" DASTLZONEMERGETYPE="TRUE" DASBLACKOUT="TRUE" VERSION="4" TYPE="1" DASSERIAL="" ADDRESS="${artnetTargetIp}/2.255.255.255">
            <DASTLUNIVERSES DASTLNB="0"/>
            <DASZONES DASTLNB="0"/>
        </DASTLDEVICE>
    </DEVICES>
</DLMFILE>`;
}

/**
 * Parses a raw Daslight 5 .dvc XML string directly in the browser, decompressing <PATCHS DATA="...">
 * and converting all patched fixtures into our Universal Groups (beams, washes, strobes, bars) automatically!
 */
export function importDaslight5DvcXml(xmlContent: string): PatchedFixture[] {
  const match = xmlContent.match(/<PATCHS\s+DATA="([^"]+)"/);
  if (!match || !match[1]) {
    throw new Error('No se encontró el bloque <PATCHS DATA="..."> en el archivo .dvc');
  }

  const rawBytes = base64ToUint8Array(match[1]);
  const inflatedBytes = inflate(rawBytes.subarray(4));
  const patchXml = new TextDecoder('utf-8').decode(inflatedBytes);

  const imported: PatchedFixture[] = [];
  const blocks = patchXml.split('</FIXTURES>');

  for (const block of blocks) {
    const sslNameMatch = block.match(/SSLNAME="([^"]+)"/);
    const sslName = (sslNameMatch ? sslNameMatch[1] : '').toLowerCase();
    const nbChMatch = block.match(/SSLNBCHANNEL="(\d+)"/);
    const chCount = nbChMatch ? parseInt(nbChMatch[1], 10) : 16;

    // Auto-match to our HAL profile & universal group
    let profileId = 'sharpy_7r_16ch';
    let groupId: GroupId = 'beams';

    if (sslName.includes('robin') || sslName.includes('wash') || chCount === 15) {
      profileId = 'robin_300_15ch';
      groupId = 'washes';
    } else if (sslName.includes('strob') || chCount === 18) {
      profileId = 'strobo_ip65_18ch';
      groupId = 'strobes';
    } else if (sslName.includes('rgbw') || sslName.includes('bar') || chCount === 4) {
      profileId = 'bar_rgbw_4ch';
      groupId = 'bars';
    } else if (sslName.includes('bsw') || sslName.includes('cmy') || chCount === 26) {
      profileId = 'bsw_400_26ch';
      groupId = 'beams';
    } else {
      const byCh = FIXTURE_PROFILES.find((p) => p.channelCount === chCount);
      if (byCh) {
        profileId = byCh.id;
        groupId = byCh.category;
      }
    }

    const fixRegex = /<FIXTURE\s+([^>]+)>/g;
    let m: RegExpExecArray | null;
    while ((m = fixRegex.exec(block)) !== null) {
      const attrs = m[1];
      const getAttr = (k: string) => {
        const am = attrs.match(new RegExp(`${k}="([^"]*)"`));
        return am ? am[1] : '';
      };
      const uid = getAttr('DASUID');
      if (!uid) continue;

      imported.push({
        id: uid,
        name: getAttr('NAME') || 'Fixture',
        profileId,
        groupId,
        universe: parseInt(getAttr('UNIVERS') || '0', 10) + 1,
        address: parseInt(getAttr('ADDRESS') || '1', 10),
        orderInGroup: 0,
        stageX: 0,
        stageY: 0.5,
      });
    }
  }

  return normalizeGroupOrders(imported);
}
