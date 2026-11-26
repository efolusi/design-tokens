# Font size steps and control heights

## Font sizes

`text.<step>` is the font size scale. Names run from `7xl` down to `4xs`; Swift names are `text<Step>` (`text3xs`, `text4xs`).

| Token | Value | Use |
|---|---|---|
| `text.4xs` | 9px | The smallest label: avatar initials in `sm`, a count in a 14 px badge |
| `text.3xs` | 10px | Dense uppercase and mono labels: badges, chart axis labels, a frozen-card tag |
| `text.2xs` | 11px | Captions and metadata |
| `text.xs` | 12px | Smallest running UI text |

Values between the steps (9.5 px, 10.5 px) take the nearest step that reads at least as large (`3xs`). 8 px has no step on purpose: it is below the size floor for UI text. A consumer using 8 px raises it to `4xs`.

Use `3xs` and `4xs` for labels of a few characters, never for text a person has to read in sentences.

## Control heights

`control.h-<step>` is the height of a button, input or select. The steps between two named sizes use the `-plus` suffix, as `radius.xs-plus` does.

| Token | Default | Compact | Coarse pointer |
|---|---|---|---|
| `control.h-xs` | 24px | 20px | `tap.min` |
| `control.h-sm` | 28px | 24px | `tap.min` |
| `control.h-sm-plus` | 32px | 28px | `tap.min` |
| `control.h-md` | 36px | 30px | `tap.min` |
| `control.h-md-plus` | 40px | 34px | `tap.min` |
| `control.h-lg` | 44px | 38px | `tap.min` |
| `control.h-xl` | 52px | 46px | none |

Swift names are `controlHSmPlus` and `controlHMdPlus`; the compact values are in `GlamorTokens.Compact`. Heights ascend in every density; a test holds that.
