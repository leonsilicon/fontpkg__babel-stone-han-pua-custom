# BabelStone Han PUA Custom

## 📦 Package Info

| Property | Value |
|----------|-------|
| Package Name | `@leonsilicon/fontpkg__babel-stone-han-pua-custom` |
| Display Name | BabelStone Han PUA Custom |
| Version | 0.0.2 |
| License | Arphic Public License |
| Total Size | 48.54 MB |
| File Count | 1 |

## 📁 Included Files

| File | Format | Size | Style |
|------|--------|------|-------|
| BabelStoneHanPUACustom.ttf | TTF | 6.3 MB | - |

## Custom glyphs

| Code point | Glyph name | JavaScript escape | Contents |
|------------|------------|-------------------|----------|
| U+F8DF | `uniF8DF` | `\uF8DF` | Existing custom glyph |
| U+F8E0 | `walkSecondStroke` | `\uF8E0` | Contextual second stroke of 辶 only |

U+F8E0 is a Private Use Area character. It must be displayed with this font;
another font may show tofu or an unrelated glyph.

U+31CB (㇋, CJK STROKE HZZP) is the semantic Unicode stroke category, but its
standalone glyph is not used because it is normalized differently. U+F8E0 uses
path 2 directly from the Simplified Chinese
[AnimCJK U+8FB6 source](https://github.com/parsimonhi/animCJK/blob/master/svgsZhHans/36790.svg),
which is derived from the Arphic PL KaitiM fonts. This preserves the contextual
shape and placement required to overlap with that 辶 outline. The retained
source SVG, TrueType contour data, and overlap verification are in `data/`.

To rebuild and verify the font:

```sh
bun install
./_build.ts
# or: bun run build
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
