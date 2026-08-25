#!/usr/bin/env python3
"""Add the two-stroke walk-prefix glyph to BabelStoneHanPUACustom.ttf."""

from __future__ import annotations

import argparse
from pathlib import Path
import stat
import tempfile
import xml.etree.ElementTree as ET

from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont


CODE_POINT = 0xF8E0
PREVIOUS_CUSTOM_CODE_POINT = 0xF8DF
GLYPH_NAME = "walkPrefix"
ADVANCE_WIDTH = 1024
SVG_NAMESPACE = "{http://www.w3.org/2000/svg}"
MODIFICATION_NOTICE = (
    "BabelStone Han PUA Custom contains the BabelStone Han PUA repertoire "
    "plus custom glyphs U+F8DF and U+F8E0. Modified 2026-08-25: added "
    "U+F8E0 walkPrefix from strokes 1 and 2 of U+8FB6 using "
    "AnimCJK/Arphic PL KaitiM-derived contours."
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FONT = REPOSITORY_ROOT / "BabelStoneHanPUACustom.ttf"
DEFAULT_SOURCE = (
    REPOSITORY_ROOT / "sources" / "walk_radical_dot_plus_hzzp_exact.svg"
)


def build_glyph(source: Path, glyph_set):
    root = ET.parse(source).getroot()
    path_data = [
        element.attrib["d"]
        for element in root.findall(f".//{SVG_NAMESPACE}path")
        if element.attrib.get("d")
    ]
    if len(path_data) != 2:
        raise ValueError(f"Expected exactly two source paths, found {len(path_data)}")

    glyph_pen = TTGlyphPen(glyph_set)
    # The SVG uses cubic curves and a downward-positive y axis. The target is a
    # TrueType glyf table with quadratic curves and a 1024-unit, upward-positive
    # coordinate system. A one-unit conversion tolerance preserves the outline
    # visually while keeping the resulting glyph compact.
    quadratic_pen = Cu2QuPen(glyph_pen, max_err=1.0, reverse_direction=True)
    transformed_pen = TransformPen(quadratic_pen, (1, 0, 0, -1, 0, 1024))
    for data in path_data:
        parse_path(data, transformed_pen)

    return glyph_pen.glyph()


def add_glyph(font_path: Path, source_path: Path, output_path: Path) -> None:
    font = TTFont(font_path, recalcTimestamp=False)
    best_cmap = font.getBestCmap()
    if PREVIOUS_CUSTOM_CODE_POINT not in best_cmap:
        raise ValueError(
            f"Expected the existing custom glyph at "
            f"U+{PREVIOUS_CUSTOM_CODE_POINT:04X}"
        )

    existing_name = best_cmap.get(CODE_POINT)
    if existing_name not in (None, GLYPH_NAME):
        raise ValueError(
            f"U+{CODE_POINT:04X} is already mapped to {existing_name!r}; "
            "refusing to replace it"
        )

    glyph_order = font.getGlyphOrder()
    previous_name = best_cmap[PREVIOUS_CUSTOM_CODE_POINT]
    previous_index = glyph_order.index(previous_name)

    if GLYPH_NAME not in glyph_order:
        glyph_order.insert(previous_index + 1, GLYPH_NAME)
        font.setGlyphOrder(glyph_order)
    elif glyph_order.index(GLYPH_NAME) != previous_index + 1:
        raise ValueError(
            f"{GLYPH_NAME!r} exists but is not immediately after {previous_name!r}"
        )

    glyph = build_glyph(source_path, font.getGlyphSet())
    glyph.recalcBounds(font["glyf"])
    font["glyf"].glyphs[GLYPH_NAME] = glyph
    font["hmtx"].metrics[GLYPH_NAME] = (ADVANCE_WIDTH, glyph.xMin)

    mapped_tables = 0
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[CODE_POINT] = GLYPH_NAME
            mapped_tables += 1
    if mapped_tables == 0:
        raise ValueError("The font has no Unicode cmap table")

    if "OS/2" in font:
        font["OS/2"].usLastCharIndex = max(
            font["OS/2"].usLastCharIndex, CODE_POINT
        )

    # The Arphic Public License requires a dated modification notice inside
    # every modified file. Name ID 10 is the OpenType description field.
    font["name"].setName(MODIFICATION_NOTICE, 10, 3, 1, 0x0409)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.resolve() == font_path.resolve():
        with tempfile.NamedTemporaryFile(
            prefix=f".{output_path.name}.",
            suffix=".tmp",
            dir=output_path.parent,
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
        try:
            font.save(temporary_path, reorderTables=False)
            temporary_path.chmod(stat.S_IMODE(font_path.stat().st_mode))
            temporary_path.replace(output_path)
        finally:
            temporary_path.unlink(missing_ok=True)
    else:
        font.save(output_path, reorderTables=False)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", type=Path, default=DEFAULT_FONT)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_FONT)
    args = parser.parse_args()
    add_glyph(args.font, args.source, args.output)


if __name__ == "__main__":
    main()
