# BabelStone Han PUA Custom

## 📦 Package Info

| Property | Value |
|----------|-------|
| Package Name | `@leonsilicon/fontpkg__babel-stone-han-pua-custom` |
| Display Name | BabelStone Han PUA Custom |
| Version | 0.0.1 |
| License | Arphic Public License |
| Total Size | 48.54 MB |
| File Count | 1 |

## 📁 Included Files

| File | Format | Size | Style |
|------|--------|------|-------|
| BabelStoneHanPUACustom.ttf | TTF | 6.3 MB | - |

## Custom glyphs

| Code point | Glyph name | JavaScript/Python escape | Contents |
|------------|------------|--------------------------|----------|
| U+F8DF | `uniF8DF` | `\uF8DF` | Existing custom glyph |
| U+F8E0 | `walkPrefix` | `\uF8E0` | Strokes 1 and 2 of 辶 (dot + middle stroke) |

U+F8E0 is a Private Use Area character. It must be displayed with this font;
another font may show tofu or an unrelated glyph.

The walk-prefix outline uses paths 1 and 2 from the Simplified Chinese
[AnimCJK U+8FB6 source](https://github.com/parsimonhi/animCJK/blob/master/svgsZhHans/36790.svg),
which is derived from the Arphic PL KaitiM fonts. The retained source SVG is at
`sources/walk_radical_dot_plus_hzzp_exact.svg`.

To rebuild and verify the font:

```sh
python -m pip install fonttools
python scripts/add_walk_prefix_glyph.py
python scripts/verify_font.py
```

## 🏷️ Font Names

| Field | en |
|-------|-------|
| preferredFamily | - |
| fontFamily | BabelStone Han PUA Custom |
| fullName | BabelStone Han PUA Custom |
| postscriptName | BabelStoneHan PUA Custom |

## ℹ️ Font Information

| Property | Value |
|----------|-------|
| Version | Version 15.0.4; November 11, 2022 |
| Manufacturer | BabelStone |
| Copyright | (c) Copyright 1994-1999, Arphic Technology Co., Ltd.; (c) Copyright 2009-2022, Andrew West. |
| License URL | http://ftp.gnu.org/non-gnu/chinese-fonts-truetype/LICENSE |

## 🌍 Multi-language Names

### fullName

- **en**: BabelStone Han PUA Custom

### postscriptName

- **en**: BabelStoneHan PUA Custom

### fontFamily

- **en**: BabelStone Han PUA Custom

### uniqueSubfamily

- **en**: BabelStone Han PUA Custom:Version 0.0.0

### version

- **en**: Version 0.0.0; May 23, 2022

### manufacturer

- **en**: BabelStone

### licenseURL

- **en**: http://ftp.gnu.org/non-gnu/chinese-fonts-truetype/LICENSE
