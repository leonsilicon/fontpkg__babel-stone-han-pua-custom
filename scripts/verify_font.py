#!/usr/bin/env python3
"""Verify the custom glyph mappings and walk-prefix outline."""

from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = REPOSITORY_ROOT / "BabelStoneHanPUACustom.ttf"


def contour_area(coordinates) -> float:
    return sum(
        coordinates[index][0] * coordinates[(index + 1) % len(coordinates)][1]
        - coordinates[(index + 1) % len(coordinates)][0]
        * coordinates[index][1]
        for index in range(len(coordinates))
    ) / 2


def main() -> None:
    font = TTFont(FONT_PATH)
    cmap = font.getBestCmap()
    order = font.getGlyphOrder()

    assert cmap[0xF8DF] == "uniF8DF"
    assert cmap[0xF8E0] == "walkPrefix"
    assert order.index("walkPrefix") == order.index("uniF8DF") + 1
    assert len(order) == 6123

    glyph = font["glyf"]["walkPrefix"]
    coordinates, contour_ends, _ = glyph.getCoordinates(font["glyf"])
    assert glyph.numberOfContours == 2
    assert len(coordinates) == 60
    assert list(contour_ends) == [18, 59]
    assert (glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax) == (82, 321, 350, 915)
    assert font["hmtx"]["walkPrefix"] == (1024, 82)

    descriptions = {
        record.toUnicode()
        for record in font["name"].names
        if record.nameID == 10
    }
    assert any(
        "Modified 2026-08-25" in description and "U+F8E0" in description
        for description in descriptions
    )

    start = 0
    for end in contour_ends:
        assert contour_area(coordinates[start : end + 1]) < 0
        start = end + 1

    for table in font["cmap"].tables:
        if table.isUnicode():
            assert table.cmap[0xF8E0] == "walkPrefix"

    print(
        "Verified U+F8E0 walkPrefix: 2 contours, 60 points, "
        "1024-unit advance width"
    )


if __name__ == "__main__":
    main()
