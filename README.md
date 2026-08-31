# BabelStone Han PUA Custom

## 📦 Package Info

| Property | Value |
|----------|-------|
| Package Name | `@leonsilicon/fontpkg__babel-stone-han-pua-custom` |
| Display Name | BabelStone Han PUA Custom |
| Version | 0.0.5 |
| License | Arphic Public License |
| Total Size | 48.54 MB |
| File Count | 1 |

## 📁 Included Files

| File | Format | Size | Style |
|------|--------|------|-------|
| BabelStoneHanPUACustom.ttf | TTF | 6.3 MB | - |

## Custom glyphs

| Code point | Literal | Glyph name | JavaScript escape | Contents |
|------------|---------|------------|-------------------|----------|
| U+F8DF | `` | `uniF8DF` | `\uF8DF` | Existing custom glyph |
| U+F8E0 | `` | `walkSecondStroke` | `\uF8E0` | Contextual second stroke of 辶 only |
| U+F8E1 | `` | `shanOverOne` | `\uF8E1` | Detached `⿱山一` component |
| U+F8E2 | `` | `coverOverTowel` | `\uF8E2` | `⿱冖巾` component from 帚 |
| U+F8E3 | `` | `personRight` | `\uF8E3` | Positional 人 component from the right of 以 |
| U+F8E4 | `` | `personBottom` | `\uF8E4` | Positional 人 component from the bottom of 亥 |

U+F8E0 through U+F8E4 are Private Use Area characters. They must be displayed
with this font; another font may show tofu or unrelated glyphs.

U+31CB (㇋, CJK STROKE HZZP) is the semantic Unicode stroke category, but its
standalone glyph is not used because it is normalized differently. U+F8E0 uses
path 2 directly from the Simplified Chinese
[AnimCJK U+8FB6 source](https://github.com/parsimonhi/animCJK/blob/master/svgsZhHans/36790.svg),
which is derived from the Arphic PL KaitiM fonts. This preserves the contextual
shape and placement required to overlap with that 辶 outline. The retained
source SVG, TrueType contour data, and overlap verification are in `data/`.

U+F8E1 is the detached `⿱山一` component shared by 徵, 䘗, 澂, and 鰴. Its
outline uses the first two contours of BabelStone Han's 亗 (U+4E97): the
font's native 山 and first 一 are retained exactly, while 亗's extra bottom
horizontal is omitted. The 78-unit gap between 山 and 一 is retained. The
source SVG and exact TrueType contour data are in `data/`.

For example:

```toml
decomposition = "彳\uF8E1𡈼攵" # 徵
decomposition = "行\uF8E1糸"   # 䘗
decomposition = "氵\uF8E1王攵" # 澂
decomposition = "彳\uF8E1魚攵" # 鰴
```

U+F8E2 is the `⿱冖巾` component extracted from BabelStone Han's 帚 (U+5E1A).
Its outline is exactly the character's first TrueType contour; only 帚's upper
contour is omitted. This preserves an exact overlay with the source character.
In BabelStone Han's 帝, the 冖 outline is merged with the upper strokes, so an
exact 帝 extraction would require inventing hidden contour boundaries. The 帚
form is complete and independently encoded in one contour. The contextual
versions in 帝 and 带 have different proportions. The source SVG and exact
TrueType contour data are in `data/`.

```toml
ids = "⿱冖巾"
character = "\uF8E2"
```

U+F8E3 and U+F8E4 are exact positional forms of 人. U+F8E3 retains the second
TrueType contour of BabelStone Han's 以 (U+4EE5), where 人 is tall and narrow
on the right. U+F8E4 retains the first contour of 亥 (U+4EA5), where 人 is
compressed and wide on the bottom. Both have the final stroke branching from
the middle of the first stroke, but their proportions and branch points differ,
so separate PUA characters preserve both source outlines exactly.

```toml
component = "人"
right_variant = "\uF8E3"
bottom_variant = "\uF8E4"
```

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
