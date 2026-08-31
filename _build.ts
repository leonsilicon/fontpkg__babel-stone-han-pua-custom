#!/usr/bin/env bun

import { chmod, rename, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { createFont, type TTF } from "fonteditor-core";

type ExtendedGlyph = TTF.Glyph & {
  compound?: boolean;
  glyfs?: unknown[];
  instructions?: ArrayLike<number>;
};

const ROOT = import.meta.dir;
const FONT_PATH = join(ROOT, "BabelStoneHanPUACustom.ttf");
const WALK_SECOND_STROKE_GLYPH_DATA_PATH = join(
  ROOT,
  "data",
  "walk_second_stroke_glyph.json",
);
const WALK_SECOND_STROKE_SOURCE_SVG_PATH = join(
  ROOT,
  "data",
  "walk_radical_second_stroke_exact.svg",
);
const SHAN_OVER_ONE_GLYPH_DATA_PATH = join(
  ROOT,
  "data",
  "shan-over-one-glyph.json",
);
const SHAN_OVER_ONE_SOURCE_SVG_PATH = join(
  ROOT,
  "data",
  "shan-over-one-source.svg",
);
const COVER_OVER_TOWEL_GLYPH_DATA_PATH = join(
  ROOT,
  "data",
  "cover-over-towel-glyph.json",
);
const COVER_OVER_TOWEL_SOURCE_SVG_PATH = join(
  ROOT,
  "data",
  "cover-over-towel-source.svg",
);
const PERSON_STROKE_PAIR_GLYPH_DATA_PATH = join(
  ROOT,
  "data",
  "person-stroke-pair-glyph.json",
);
const PERSON_STROKE_PAIR_SOURCE_SVG_PATH = join(
  ROOT,
  "data",
  "person-stroke-pair-source.svg",
);
const TEMP_FONT_PATH = `${FONT_PATH}.tmp`;

const EXISTING_CUSTOM_CODE_POINT = 0xf8df;
const WALK_SECOND_STROKE_CODE_POINT = 0xf8e0;
const SHAN_OVER_ONE_CODE_POINT = 0xf8e1;
const COVER_OVER_TOWEL_CODE_POINT = 0xf8e2;
const PERSON_STROKE_PAIR_CODE_POINT = 0xf8e3;
const LEGACY_U_F8E4_CODE_POINT = 0xf8e4;
const WALK_SECOND_STROKE_GLYPH_NAME = "walkSecondStroke";
const SHAN_OVER_ONE_GLYPH_NAME = "shanOverOne";
const COVER_OVER_TOWEL_GLYPH_NAME = "coverOverTowel";
const PERSON_STROKE_PAIR_GLYPH_NAME = "personStrokePair";
const EXPECTED_GLYPH_COUNT = 6126;
const EXPECTED_WALK_SECOND_STROKE_SOURCE_PATH_IDS = [
  "walkSecondStroke-hzzp",
];
const EXPECTED_SHAN_OVER_ONE_SOURCE_PATH_IDS = [
  "shanOverOne-shan",
  "shanOverOne-one",
];
const EXPECTED_COVER_OVER_TOWEL_SOURCE_PATH_IDS = [
  "coverOverTowel-component",
];
const EXPECTED_PERSON_STROKE_PAIR_SOURCE_PATH_IDS = [
  "personStrokePair-pie",
  "personStrokePair-dot",
];
const MODIFICATION_NOTICE =
  "BabelStone Han PUA Custom contains the BabelStone Han PUA repertoire " +
  "plus custom glyphs U+F8DF through U+F8E3. Modified 2026-08-25: added " +
  "U+F8E0 walkSecondStroke from stroke 2 of U+8FB6 using AnimCJK/Arphic " +
  "PL KaitiM-derived contours. Modified 2026-08-30: added U+F8E1 " +
  "shanOverOne (IDS ⿱山一) from the first two contours of BabelStone Han " +
  "U+4E97. Modified 2026-08-31: added U+F8E2 coverOverTowel (IDS ⿱冖巾) " +
  "from the first contour of BabelStone Han U+5E1A; and U+F8E3 " +
  "personStrokePair, composed at original scale from standalone BabelStone " +
  "Han U+31D2 and U+4E36 contours and centered in the em square.";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readFont(buffer: ArrayBuffer | Buffer) {
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => {
    // fonteditor-core reports the length of one retained hint program as a
    // bare number. The font is valid and the hint data round-trips unchanged.
    if (values.length === 1 && typeof values[0] === "number") {
      return;
    }
    originalWarn(...values);
  };

  try {
    return createFont(buffer, {
      type: "ttf",
      hinting: true,
      kerning: true,
      compound2simple: false,
    });
  } finally {
    console.warn = originalWarn;
  }
}

function normalizedContours(glyph: ExtendedGlyph) {
  return (glyph.contours ?? []).map((contour) =>
    contour.map((point) => ({
      x: point.x,
      y: point.y,
      onCurve: Boolean(point.onCurve),
    })),
  );
}

function glyphFingerprint(glyph: ExtendedGlyph) {
  return JSON.stringify({
    contours: normalizedContours(glyph),
    compound: Boolean(glyph.compound),
    components: glyph.glyfs ?? [],
    instructions: glyph.instructions
      ? Array.from(glyph.instructions)
      : [],
    advanceWidth: glyph.advanceWidth,
    leftSideBearing: glyph.leftSideBearing,
    xMin: glyph.xMin,
    yMin: glyph.yMin,
    xMax: glyph.xMax,
    yMax: glyph.yMax,
    unicode: [...(glyph.unicode ?? [])].sort((a, b) => a - b),
  });
}

function contourArea(contour: TTF.Contour) {
  return (
    contour.reduce((area, point, index) => {
      const next = contour[(index + 1) % contour.length];
      return area + point.x * next.y - next.x * point.y;
    }, 0) / 2
  );
}

function contourBounds(contour: TTF.Contour) {
  return [
    Math.min(...contour.map((point) => point.x)),
    Math.min(...contour.map((point) => point.y)),
    Math.max(...contour.map((point) => point.x)),
    Math.max(...contour.map((point) => point.y)),
  ];
}

type FlattenedPoint = {
  x: number;
  y: number;
};

function pointDistance(left: FlattenedPoint, right: FlattenedPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function flattenContour(contour: TTF.Contour, maxStep = 2) {
  const expanded: Array<FlattenedPoint & { onCurve: boolean }> = [];
  for (let index = 0; index < contour.length; index += 1) {
    const point = contour[index];
    const next = contour[(index + 1) % contour.length];
    expanded.push({
      x: point.x,
      y: point.y,
      onCurve: Boolean(point.onCurve),
    });
    if (!point.onCurve && !next.onCurve) {
      expanded.push({
        x: (point.x + next.x) / 2,
        y: (point.y + next.y) / 2,
        onCurve: true,
      });
    }
  }

  const startIndex = expanded.findIndex((point) => point.onCurve);
  assert(startIndex >= 0, "Contour must contain an on-curve point");
  const points = [
    ...expanded.slice(startIndex),
    ...expanded.slice(0, startIndex),
  ];
  const start = points[0];
  const flattened: FlattenedPoint[] = [{ x: start.x, y: start.y }];
  let current: FlattenedPoint = start;
  let index = 1;

  while (index <= points.length) {
    const point = points[index % points.length];
    if (point.onCurve) {
      const steps = Math.max(
        1,
        Math.ceil(pointDistance(current, point) / maxStep),
      );
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        flattened.push({
          x: current.x + (point.x - current.x) * progress,
          y: current.y + (point.y - current.y) * progress,
        });
      }
      current = point;
      index += 1;
      continue;
    }

    const end = points[(index + 1) % points.length];
    assert(end.onCurve, "Expanded contour controls must end on-curve");
    const approximateLength =
      pointDistance(current, point) + pointDistance(point, end);
    const steps = Math.max(2, Math.ceil(approximateLength / maxStep));
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const remaining = 1 - progress;
      flattened.push({
        x:
          remaining * remaining * current.x +
          2 * remaining * progress * point.x +
          progress * progress * end.x,
        y:
          remaining * remaining * current.y +
          2 * remaining * progress * point.y +
          progress * progress * end.y,
      });
    }
    current = end;
    index += 2;
  }

  if (pointDistance(flattened[0], flattened.at(-1)!) < 0.001) {
    flattened.pop();
  }
  return flattened;
}

function direction(
  start: FlattenedPoint,
  end: FlattenedPoint,
  point: FlattenedPoint,
) {
  return (
    (end.x - start.x) * (point.y - start.y) -
    (end.y - start.y) * (point.x - start.x)
  );
}

function segmentsStrictlyIntersect(
  leftStart: FlattenedPoint,
  leftEnd: FlattenedPoint,
  rightStart: FlattenedPoint,
  rightEnd: FlattenedPoint,
) {
  const epsilon = 1e-7;
  const leftRightStart = direction(leftStart, leftEnd, rightStart);
  const leftRightEnd = direction(leftStart, leftEnd, rightEnd);
  const rightLeftStart = direction(rightStart, rightEnd, leftStart);
  const rightLeftEnd = direction(rightStart, rightEnd, leftEnd);
  return (
    leftRightStart * leftRightEnd < -epsilon &&
    rightLeftStart * rightLeftEnd < -epsilon
  );
}

function assertContourDoesNotSelfIntersect(contour: TTF.Contour) {
  const points = flattenContour(contour);
  for (let left = 0; left < points.length; left += 1) {
    const leftNext = (left + 1) % points.length;
    for (let right = left + 1; right < points.length; right += 1) {
      const rightNext = (right + 1) % points.length;
      if (leftNext === right || rightNext === left) {
        continue;
      }
      assert(
        !segmentsStrictlyIntersect(
          points[left],
          points[leftNext],
          points[right],
          points[rightNext],
        ),
        `Contour intersects itself at flattened segments ${left} and ${right}`,
      );
    }
  }
}

function validateWalkSecondStrokeGlyphData(
  value: unknown,
): asserts value is TTF.Glyph {
  assert(typeof value === "object" && value !== null, "Invalid glyph data");
  const glyph = value as TTF.Glyph;
  assert(
    glyph.name === WALK_SECOND_STROKE_GLYPH_NAME,
    `Expected glyph name ${WALK_SECOND_STROKE_GLYPH_NAME}`,
  );
  assert(
    glyph.unicode?.length === 1 &&
      glyph.unicode[0] === WALK_SECOND_STROKE_CODE_POINT,
    "The glyph data must map only U+F8E0",
  );
  assert(glyph.advanceWidth === 1024, "Expected a 1024-unit advance width");
  assert(glyph.leftSideBearing === 82, "Expected an 82-unit left side bearing");
  assert(
    [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax].join(",") ===
      "82,321,348,698",
    "Unexpected walkSecondStroke bounding box",
  );
  assert(
    glyph.contours?.length === 1,
    "walkSecondStroke must contain one contour",
  );
  assert(
    glyph.contours[0].length === 41,
    "walkSecondStroke must contain exactly 41 TrueType points",
  );
  for (const contour of glyph.contours) {
    assert(contourArea(contour) < 0, "TrueType contours must be clockwise");
  }
}

function validateShanOverOneGlyphData(
  value: unknown,
): asserts value is TTF.Glyph {
  assert(typeof value === "object" && value !== null, "Invalid glyph data");
  const glyph = value as TTF.Glyph;
  assert(
    glyph.name === SHAN_OVER_ONE_GLYPH_NAME,
    `Expected glyph name ${SHAN_OVER_ONE_GLYPH_NAME}`,
  );
  assert(
    glyph.unicode?.length === 1 &&
      glyph.unicode[0] === SHAN_OVER_ONE_CODE_POINT,
    "The glyph data must map only U+F8E1",
  );
  assert(glyph.advanceWidth === 1024, "Expected a 1024-unit advance width");
  assert(glyph.leftSideBearing === 142, "Expected a 142-unit left side bearing");
  assert(
    [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax].join(",") ===
      "142,242,889,868",
    "Unexpected shanOverOne bounding box",
  );
  assert(glyph.contours?.length === 2, "shanOverOne must contain two contours");
  assert(
    glyph.contours[0].length === 71 && glyph.contours[1].length === 23,
    "shanOverOne must contain exactly 94 TrueType points",
  );
  const shanBottom = Math.min(...glyph.contours[0].map((point) => point.y));
  const oneTop = Math.max(...glyph.contours[1].map((point) => point.y));
  assert(
    shanBottom > oneTop,
    "shanOverOne must retain a visible gap between 山 and 一",
  );
  for (const contour of glyph.contours) {
    assert(contourArea(contour) < 0, "TrueType contours must be clockwise");
  }
}

function validateCoverOverTowelGlyphData(
  value: unknown,
): asserts value is TTF.Glyph {
  assert(typeof value === "object" && value !== null, "Invalid glyph data");
  const glyph = value as TTF.Glyph;
  assert(
    glyph.name === COVER_OVER_TOWEL_GLYPH_NAME,
    `Expected glyph name ${COVER_OVER_TOWEL_GLYPH_NAME}`,
  );
  assert(
    glyph.unicode?.length === 1 &&
      glyph.unicode[0] === COVER_OVER_TOWEL_CODE_POINT,
    "The glyph data must map only U+F8E2",
  );
  assert(glyph.advanceWidth === 1024, "Expected a 1024-unit advance width");
  assert(glyph.leftSideBearing === 41, "Expected a 41-unit left side bearing");
  assert(
    [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax].join(",") ===
      "41,-98,975,546",
    "Unexpected coverOverTowel bounding box",
  );
  assert(
    glyph.contours?.length === 1,
    "coverOverTowel must contain one contour",
  );
  assert(
    glyph.contours[0].length === 103,
    "coverOverTowel must contain exactly 103 TrueType points",
  );
  assert(
    contourArea(glyph.contours[0]) < 0,
    "TrueType contours must be clockwise",
  );
}

function validatePersonStrokePairGlyphData(
  value: unknown,
): asserts value is TTF.Glyph {
  assert(typeof value === "object" && value !== null, "Invalid glyph data");
  const glyph = value as TTF.Glyph;
  assert(
    glyph.name === PERSON_STROKE_PAIR_GLYPH_NAME,
    `Expected glyph name ${PERSON_STROKE_PAIR_GLYPH_NAME}`,
  );
  assert(
    glyph.unicode?.length === 1 &&
      glyph.unicode[0] === PERSON_STROKE_PAIR_CODE_POINT,
    "The glyph data must map only U+F8E3",
  );
  assert(glyph.advanceWidth === 1024, "Expected a 1024-unit advance width");
  assert(glyph.leftSideBearing === 189, "Expected a 189-unit left side bearing");
  assert(
    [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax].join(",") ===
      "189,153,836,872",
    "Unexpected personStrokePair bounding box",
  );
  assert(
    glyph.contours?.length === 2,
    "personStrokePair must contain two contours",
  );
  assert(
    glyph.contours[0].length === 22 && glyph.contours[1].length === 16,
    "personStrokePair must contain the exact ㇒ and 丶 contour point counts",
  );
  assert(
    contourBounds(glyph.contours[0]).join(",") === "189,220,770,872",
    "Unexpected translated ㇒ contour bounds",
  );
  assert(
    contourBounds(glyph.contours[1]).join(",") === "526,153,836,555",
    "Unexpected translated 丶 contour bounds",
  );
  for (const contour of glyph.contours) {
    assert(
      contourArea(contour) < 0,
      "TrueType contours must be clockwise",
    );
    assertContourDoesNotSelfIntersect(contour);
  }
  assert(
    glyph.contours[0].some(
      (point) => point.x >= 526 && point.x <= 550 && point.y >= 533 && point.y <= 555,
    ),
    "The ㇒ and 丶 contours must overlap at the branch",
  );
}

function validateSourceSvg(svg: string, expectedPathIds: string[]) {
  const pathIds = Array.from(
    svg.matchAll(/<path\b[^>]*\bid="([^"]+)"/g),
    (match) => match[1],
  );
  assert(
    JSON.stringify(pathIds) === JSON.stringify(expectedPathIds),
    `Expected SVG paths ${expectedPathIds.join(", ")}`,
  );
}

function writeFont(font: ReturnType<typeof readFont>) {
  return font.write({
    type: "ttf",
    toBuffer: true,
    hinting: true,
    kerning: true,
  });
}

function buffersEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && left.equals(right);
}

function verifyBuiltFont(
  output: Buffer,
  beforeFingerprints: string[],
  replacedGlyphIndices: Set<number>,
) {
  const builtFont = readFont(output);
  const built = builtFont.get();
  const existingCustomIndex = built.cmap[EXISTING_CUSTOM_CODE_POINT];
  const walkSecondStrokeIndex = built.cmap[WALK_SECOND_STROKE_CODE_POINT];
  const shanOverOneIndex = built.cmap[SHAN_OVER_ONE_CODE_POINT];
  const coverOverTowelIndex = built.cmap[COVER_OVER_TOWEL_CODE_POINT];
  const personStrokePairIndex = built.cmap[PERSON_STROKE_PAIR_CODE_POINT];

  assert(existingCustomIndex !== undefined, "U+F8DF is missing after the build");
  assert(
    walkSecondStrokeIndex !== undefined,
    "U+F8E0 is missing after the build",
  );
  assert(shanOverOneIndex !== undefined, "U+F8E1 is missing after the build");
  assert(
    coverOverTowelIndex !== undefined,
    "U+F8E2 is missing after the build",
  );
  assert(
    personStrokePairIndex !== undefined,
    "U+F8E3 is missing after the build",
  );
  assert(
    built.cmap[LEGACY_U_F8E4_CODE_POINT] === undefined,
    "Obsolete U+F8E4 is still mapped after the build",
  );
  assert(
    walkSecondStrokeIndex === existingCustomIndex + 1,
    "walkSecondStroke is not immediately after the existing custom glyph",
  );
  assert(
    shanOverOneIndex === walkSecondStrokeIndex + 1,
    "shanOverOne is not immediately after walkSecondStroke",
  );
  assert(
    coverOverTowelIndex === shanOverOneIndex + 1,
    "coverOverTowel is not immediately after shanOverOne",
  );
  assert(
    personStrokePairIndex === coverOverTowelIndex + 1,
    "personStrokePair is not immediately after coverOverTowel",
  );
  assert(
    built.glyf.length === EXPECTED_GLYPH_COUNT,
    `Expected ${EXPECTED_GLYPH_COUNT} glyphs, found ${built.glyf.length}`,
  );

  validateWalkSecondStrokeGlyphData(built.glyf[walkSecondStrokeIndex]);
  validateShanOverOneGlyphData(built.glyf[shanOverOneIndex]);
  validateCoverOverTowelGlyphData(built.glyf[coverOverTowelIndex]);
  validatePersonStrokePairGlyphData(built.glyf[personStrokePairIndex]);
  assert(
    built.name.description === MODIFICATION_NOTICE,
    "The required modification notice is missing from the font",
  );
  assert(
    built.name.licence?.startsWith("ARPHIC PUBLIC LICENSE"),
    "The Arphic Public License is missing from the font",
  );
  assert(
    built["OS/2"].usLastCharIndex === PERSON_STROKE_PAIR_CODE_POINT,
    "OS/2 does not end at U+F8E3",
  );

  for (let index = 0; index < beforeFingerprints.length; index += 1) {
    if (replacedGlyphIndices.has(index)) {
      continue;
    }
    assert(
      glyphFingerprint(built.glyf[index]) === beforeFingerprints[index],
      `Pre-existing glyph ${index} changed during the build`,
    );
  }

  const secondPass = writeFont(builtFont);
  assert(
    buffersEqual(output, secondPass),
    "The font build is not byte-for-byte deterministic",
  );
}

async function main() {
  const [
    fontBuffer,
    walkSecondStrokeGlyphData,
    walkSecondStrokeSourceSvg,
    shanOverOneGlyphData,
    shanOverOneSourceSvg,
    coverOverTowelGlyphData,
    coverOverTowelSourceSvg,
    personStrokePairGlyphData,
    personStrokePairSourceSvg,
    fontStats,
  ] = await Promise.all([
    Bun.file(FONT_PATH).arrayBuffer(),
    Bun.file(WALK_SECOND_STROKE_GLYPH_DATA_PATH).json(),
    Bun.file(WALK_SECOND_STROKE_SOURCE_SVG_PATH).text(),
    Bun.file(SHAN_OVER_ONE_GLYPH_DATA_PATH).json(),
    Bun.file(SHAN_OVER_ONE_SOURCE_SVG_PATH).text(),
    Bun.file(COVER_OVER_TOWEL_GLYPH_DATA_PATH).json(),
    Bun.file(COVER_OVER_TOWEL_SOURCE_SVG_PATH).text(),
    Bun.file(PERSON_STROKE_PAIR_GLYPH_DATA_PATH).json(),
    Bun.file(PERSON_STROKE_PAIR_SOURCE_SVG_PATH).text(),
    stat(FONT_PATH),
  ]);

  validateWalkSecondStrokeGlyphData(walkSecondStrokeGlyphData);
  validateSourceSvg(
    walkSecondStrokeSourceSvg,
    EXPECTED_WALK_SECOND_STROKE_SOURCE_PATH_IDS,
  );
  validateShanOverOneGlyphData(shanOverOneGlyphData);
  validateSourceSvg(
    shanOverOneSourceSvg,
    EXPECTED_SHAN_OVER_ONE_SOURCE_PATH_IDS,
  );
  validateCoverOverTowelGlyphData(coverOverTowelGlyphData);
  validateSourceSvg(
    coverOverTowelSourceSvg,
    EXPECTED_COVER_OVER_TOWEL_SOURCE_PATH_IDS,
  );
  validatePersonStrokePairGlyphData(personStrokePairGlyphData);
  validateSourceSvg(
    personStrokePairSourceSvg,
    EXPECTED_PERSON_STROKE_PAIR_SOURCE_PATH_IDS,
  );

  const font = readFont(fontBuffer);
  const ttf = font.get();
  const beforeFingerprints = ttf.glyf.map((glyph) =>
    glyphFingerprint(glyph as ExtendedGlyph),
  );
  const existingCustomIndex = ttf.cmap[EXISTING_CUSTOM_CODE_POINT];
  const existingWalkSecondStrokeIndex =
    ttf.cmap[WALK_SECOND_STROKE_CODE_POINT];
  const existingShanOverOneIndex = ttf.cmap[SHAN_OVER_ONE_CODE_POINT];
  const existingCoverOverTowelIndex = ttf.cmap[COVER_OVER_TOWEL_CODE_POINT];
  const existingPersonStrokePairIndex = ttf.cmap[PERSON_STROKE_PAIR_CODE_POINT];
  const legacyUF8E4Index = ttf.cmap[LEGACY_U_F8E4_CODE_POINT];

  assert(
    existingCustomIndex !== undefined,
    "Expected the existing U+F8DF glyph",
  );
  assert(
    existingWalkSecondStrokeIndex === undefined ||
      existingWalkSecondStrokeIndex === existingCustomIndex + 1,
    "U+F8E0 is occupied outside the expected glyph slot",
  );

  let walkSecondStrokeIndex: number;
  const replacedGlyphIndices = new Set<number>();
  if (legacyUF8E4Index !== undefined) {
    assert(
      legacyUF8E4Index === ttf.glyf.length - 1,
      "Legacy U+F8E4 must be the final glyph before removal",
    );
    replacedGlyphIndices.add(legacyUF8E4Index);
    ttf.glyf.pop();
    delete ttf.cmap[LEGACY_U_F8E4_CODE_POINT];
  }
  if (existingWalkSecondStrokeIndex === undefined) {
    assert(
      existingCustomIndex === ttf.glyf.length - 1,
      "U+F8DF must be the final base glyph before appending walkSecondStroke",
    );
    walkSecondStrokeIndex = ttf.glyf.length;
    ttf.glyf.push(structuredClone(walkSecondStrokeGlyphData));
  } else {
    walkSecondStrokeIndex = existingWalkSecondStrokeIndex;
    replacedGlyphIndices.add(walkSecondStrokeIndex);
    ttf.glyf[walkSecondStrokeIndex] = structuredClone(
      walkSecondStrokeGlyphData,
    );
  }
  ttf.cmap[WALK_SECOND_STROKE_CODE_POINT] = walkSecondStrokeIndex;

  assert(
    existingShanOverOneIndex === undefined ||
      existingShanOverOneIndex === walkSecondStrokeIndex + 1,
    "U+F8E1 is occupied outside the expected glyph slot",
  );
  let shanOverOneIndex: number;
  if (existingShanOverOneIndex === undefined) {
    assert(
      walkSecondStrokeIndex === ttf.glyf.length - 1,
      "U+F8E0 must be the final glyph before appending shanOverOne",
    );
    shanOverOneIndex = ttf.glyf.length;
    ttf.glyf.push(structuredClone(shanOverOneGlyphData));
  } else {
    shanOverOneIndex = existingShanOverOneIndex;
    replacedGlyphIndices.add(shanOverOneIndex);
    ttf.glyf[shanOverOneIndex] = structuredClone(shanOverOneGlyphData);
  }

  ttf.cmap[SHAN_OVER_ONE_CODE_POINT] = shanOverOneIndex;

  assert(
    existingCoverOverTowelIndex === undefined ||
      existingCoverOverTowelIndex === shanOverOneIndex + 1,
    "U+F8E2 is occupied outside the expected glyph slot",
  );
  let coverOverTowelIndex: number;
  if (existingCoverOverTowelIndex === undefined) {
    assert(
      shanOverOneIndex === ttf.glyf.length - 1,
      "U+F8E1 must be the final glyph before appending coverOverTowel",
    );
    coverOverTowelIndex = ttf.glyf.length;
    ttf.glyf.push(structuredClone(coverOverTowelGlyphData));
  } else {
    coverOverTowelIndex = existingCoverOverTowelIndex;
    replacedGlyphIndices.add(coverOverTowelIndex);
    ttf.glyf[coverOverTowelIndex] = structuredClone(
      coverOverTowelGlyphData,
    );
  }

  ttf.cmap[COVER_OVER_TOWEL_CODE_POINT] = coverOverTowelIndex;

  assert(
    existingPersonStrokePairIndex === undefined ||
      existingPersonStrokePairIndex === coverOverTowelIndex + 1,
    "U+F8E3 is occupied outside the expected glyph slot",
  );
  let personStrokePairIndex: number;
  if (existingPersonStrokePairIndex === undefined) {
    assert(
      coverOverTowelIndex === ttf.glyf.length - 1,
      "U+F8E2 must be the final glyph before appending personStrokePair",
    );
    personStrokePairIndex = ttf.glyf.length;
    ttf.glyf.push(structuredClone(personStrokePairGlyphData));
  } else {
    personStrokePairIndex = existingPersonStrokePairIndex;
    replacedGlyphIndices.add(personStrokePairIndex);
    ttf.glyf[personStrokePairIndex] = structuredClone(
      personStrokePairGlyphData,
    );
  }

  ttf.cmap[PERSON_STROKE_PAIR_CODE_POINT] = personStrokePairIndex;
  ttf.maxp.numGlyphs = ttf.glyf.length;
  ttf["OS/2"].usLastCharIndex = PERSON_STROKE_PAIR_CODE_POINT;
  ttf.name.description = MODIFICATION_NOTICE;

  const output = writeFont(font);
  verifyBuiltFont(output, beforeFingerprints, replacedGlyphIndices);

  try {
    await Bun.write(TEMP_FONT_PATH, output);
    await chmod(TEMP_FONT_PATH, fontStats.mode);
    await rename(TEMP_FONT_PATH, FONT_PATH);
  } finally {
    await unlink(TEMP_FONT_PATH).catch(() => undefined);
  }

  const digest = new Bun.CryptoHasher("sha256")
    .update(output)
    .digest("hex");
  console.log(
    `Built and verified U+F8E0 ${WALK_SECOND_STROKE_GLYPH_NAME} and ` +
      `U+F8E1 ${SHAN_OVER_ONE_GLYPH_NAME} and ` +
      `U+F8E2 ${COVER_OVER_TOWEL_GLYPH_NAME} and ` +
      `U+F8E3 ${PERSON_STROKE_PAIR_GLYPH_NAME}: sha256 ${digest}`,
  );
}

await main();
