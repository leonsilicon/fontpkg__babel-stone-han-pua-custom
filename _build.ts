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
const GLYPH_DATA_PATH = join(ROOT, "data", "walk_second_stroke_glyph.json");
const SOURCE_SVG_PATH = join(
  ROOT,
  "data",
  "walk_radical_second_stroke_exact.svg",
);
const TEMP_FONT_PATH = `${FONT_PATH}.tmp`;

const CODE_POINT = 0xf8e0;
const PREVIOUS_CUSTOM_CODE_POINT = 0xf8df;
const GLYPH_NAME = "walkSecondStroke";
const EXPECTED_GLYPH_COUNT = 6123;
const EXPECTED_SOURCE_PATH_IDS = ["walkSecondStroke-hzzp"];
const MODIFICATION_NOTICE =
  "BabelStone Han PUA Custom contains the BabelStone Han PUA repertoire " +
  "plus custom glyphs U+F8DF and U+F8E0. Modified 2026-08-25: added " +
  "U+F8E0 walkSecondStroke from stroke 2 of U+8FB6 using " +
  "AnimCJK/Arphic PL KaitiM-derived contours.";

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

function validateGlyphData(value: unknown): asserts value is TTF.Glyph {
  assert(typeof value === "object" && value !== null, "Invalid glyph data");
  const glyph = value as TTF.Glyph;
  assert(glyph.name === GLYPH_NAME, `Expected glyph name ${GLYPH_NAME}`);
  assert(
    glyph.unicode?.length === 1 && glyph.unicode[0] === CODE_POINT,
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

function validateSourceSvg(svg: string) {
  const pathIds = Array.from(
    svg.matchAll(/<path\b[^>]*\bid="([^"]+)"/g),
    (match) => match[1],
  );
  assert(
    JSON.stringify(pathIds) === JSON.stringify(EXPECTED_SOURCE_PATH_IDS),
    `Expected SVG paths ${EXPECTED_SOURCE_PATH_IDS.join(", ")}`,
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
  replacedGlyphIndex: number | undefined,
) {
  const builtFont = readFont(output);
  const built = builtFont.get();
  const previousIndex = built.cmap[PREVIOUS_CUSTOM_CODE_POINT];
  const walkSecondStrokeIndex = built.cmap[CODE_POINT];

  assert(previousIndex !== undefined, "U+F8DF is missing after the build");
  assert(
    walkSecondStrokeIndex !== undefined,
    "U+F8E0 is missing after the build",
  );
  assert(
    walkSecondStrokeIndex === previousIndex + 1,
    "walkSecondStroke is not immediately after the existing custom glyph",
  );
  assert(
    built.glyf.length === EXPECTED_GLYPH_COUNT,
    `Expected ${EXPECTED_GLYPH_COUNT} glyphs, found ${built.glyf.length}`,
  );

  validateGlyphData(built.glyf[walkSecondStrokeIndex]);
  assert(
    built.name.description === MODIFICATION_NOTICE,
    "The required modification notice is missing from the font",
  );
  assert(
    built.name.licence?.startsWith("ARPHIC PUBLIC LICENSE"),
    "The Arphic Public License is missing from the font",
  );
  assert(
    built["OS/2"].usLastCharIndex === CODE_POINT,
    "OS/2 does not end at U+F8E0",
  );

  for (let index = 0; index < beforeFingerprints.length; index += 1) {
    if (index === replacedGlyphIndex) {
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
  const [fontBuffer, glyphData, sourceSvg, fontStats] = await Promise.all([
    Bun.file(FONT_PATH).arrayBuffer(),
    Bun.file(GLYPH_DATA_PATH).json(),
    Bun.file(SOURCE_SVG_PATH).text(),
    stat(FONT_PATH),
  ]);

  validateGlyphData(glyphData);
  validateSourceSvg(sourceSvg);

  const font = readFont(fontBuffer);
  const ttf = font.get();
  const beforeFingerprints = ttf.glyf.map((glyph) =>
    glyphFingerprint(glyph as ExtendedGlyph),
  );
  const previousIndex = ttf.cmap[PREVIOUS_CUSTOM_CODE_POINT];
  const existingIndex = ttf.cmap[CODE_POINT];

  assert(previousIndex !== undefined, "Expected the existing U+F8DF glyph");
  assert(
    existingIndex === undefined || existingIndex === previousIndex + 1,
    "U+F8E0 is occupied outside the expected glyph slot",
  );

  const newGlyph = structuredClone(glyphData);
  let walkSecondStrokeIndex: number;
  if (existingIndex === undefined) {
    assert(
      previousIndex === ttf.glyf.length - 1,
      "U+F8DF must be the final base glyph before appending walkSecondStroke",
    );
    walkSecondStrokeIndex = ttf.glyf.length;
    ttf.glyf.push(newGlyph);
  } else {
    walkSecondStrokeIndex = existingIndex;
    ttf.glyf[walkSecondStrokeIndex] = newGlyph;
  }

  ttf.cmap[CODE_POINT] = walkSecondStrokeIndex;
  ttf.maxp.numGlyphs = ttf.glyf.length;
  ttf["OS/2"].usLastCharIndex = CODE_POINT;
  ttf.name.description = MODIFICATION_NOTICE;

  const output = writeFont(font);
  verifyBuiltFont(output, beforeFingerprints, existingIndex);

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
    `Built and verified U+F8E0 ${GLYPH_NAME}: ` +
      `1 contour, 41 points, sha256 ${digest}`,
  );
}

await main();
