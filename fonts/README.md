# Fonts

The firmware uses **u8g2 bitmap fonts** (typically `u8g2_font_logisoso16_tr`,
`u8g2_font_inb16_mr`, `u8g2_font_profont15_tr` — chosen by page in `main.cpp`).
None of these are web-distributable, so the simulator and web companion
substitute the closest free pixel fonts from Google Fonts:

| Use | Web font (Google Fonts) | On-device equivalent |
|---|---|---|
| Display / usernames | **Silkscreen** | `u8g2_font_logisoso16/22/32_tr` |
| UI body / menus | **Pixelify Sans** | `u8g2_font_inb16_mr` |
| Mono / logs | **VT323** | `u8g2_font_profont15_tr` |

⚠️ **Flagged substitution** — Silkscreen and Pixelify Sans are *visually
similar* to the u8g2 set but not pixel-identical. If you need pixel-perfect
fidelity (e.g. screenshots for marketing), extract glyphs from the actual
u8g2 BDF source and ship them as a custom webfont.

The fonts are pulled from Google Fonts at the top of every HTML file:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Pixelify+Sans:wght@400..700&family=VT323&display=swap" rel="stylesheet">
```
