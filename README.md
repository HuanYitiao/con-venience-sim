# con-venience Design System

> *Ubi amici, ibi opes.* — Plautus
> Where there are friends, there is wealth.

A design system for **con-venience**, an open-source wearable social device for
fursuit conventions. Two fursuiters can't pull out their phones — paws don't
type, mesh eyes can't see Face ID — so they touch wrists, and contacts swap.
This system covers everything around that interaction: the on-device pixel UI,
the simulator that lets contributors iterate without flashing hardware, and the
off-device surfaces (docs, packaging, web companion) that reach the community.

---

## Sources

This system was distilled from these repositories. Open them for canonical
source-of-truth before making large changes; this system reflects them at a
point in time and may drift.

- **Firmware + UI mockups** → https://github.com/HuanYitiao/con-venience
  - `firmware/con-venience/` — Arduino/PlatformIO project (ESP32-S3-Zero)
  - `ui/Bob/*.png` — page-by-page UI mockups (1280×640, rendered from a
    296×128 1-bit canvas)
  - `ui/ui_logic.svg` — page state machine sketch
  - `tools/convert.py` — Floyd–Steinberg dither for avatars and QR codes
- **Simulator (target deliverable)** → https://github.com/HuanYitiao/con-venience-sim
  - Empty / private at the time of writing. The `ui_kits/simulator/` folder
    in *this* design system is the closest thing to a working spec.

If you have access, **read both before designing**. This system is a digest —
the firmware page state machine, button timings, and storage schema all live
in the upstream repo and will always be authoritative.

---

## Product context

**con-venience** is a wrist-worn device with:

| | |
|---|---|
| MCU | ESP32-S3-Zero |
| Display | 2.9" Waveshare e-ink, **296×128px**, 1-bit B&W |
| Input | **One** physical button (short press, long press) |
| Audio | Passive piezo buzzer (Game Boy–style melodies) |
| Power | CR2450 coin cell, ~18h convention day |
| Contact | ACOM (single-wire UART over two exposed pads + magnets) |
| Wireless | BLE for bulk pairing; USB for PC sync |

The signature interaction is **ACOM**: press two devices' contact pads
together and they handshake usernames over a half-duplex single-wire UART.
No menus, no Bluetooth pairing dance — just touch.

The display is e-ink because the device sits idle on your arm all day showing
a QR code, and e-ink draws ~0 mW when static. This forces a 1-bit visual
language: pure black ink on light-grey "paper," dithered halftones for tone,
pixel-perfect bitmap fonts.

---

## What lives in this repo

```
.
├── README.md                  ← this file
├── SKILL.md                   ← Claude / Agent Skills entry point
├── colors_and_type.css        ← single source of truth for tokens
├── fonts/                     ← Google Fonts substitutions + notes
├── assets/                    ← logos, screen mockups, ui_logic.svg
│   ├── avatar-bob.png         ← reference 1-bit avatar (the user, "Bob")
│   └── screens/               ← original Bob/*.png mockups from upstream
├── preview/                   ← Design System tab cards (small visual specs)
├── ui_kits/
│   └── simulator/             ← interactive e-ink + button simulator
│       ├── index.html
│       └── *.jsx              ← React components
└── slides/                    ← (none yet — no slide template was provided)
```

---

## Content fundamentals

The product copy in the upstream README sets the tone. It is the strongest
single reference for *how* this brand talks.

**Voice.** Warm, a little wry, written by and for a niche community that takes
itself seriously *and* lightly. The README opens with a Latin epigraph from
Plautus and closes with "Once a year, it is permitted to go a little mad" —
that mix of classical-quotation seriousness and "press wrists, done" plainness
is the brand. Don't pick one mode; alternate.

**Pronoun.** Mostly **you** ("you can't unlock your phone through mesh eyes")
and **the community** ("the people who would use this are also the people who
can improve it"). Avoid "we" — the project is collective, not a company. Never
"users."

**Casing.** Sentence case everywhere. The product name is lowercase with a
hyphen: **con-venience**. Never "Con-Venience," never "ConVenience." The
emphasis lands on "convenience" (as in: this is convenient) and "con" (as in:
convention, fursuit con). The hyphen earns the pun.

**Density.** Short paragraphs. The README uses tables and `[ ]` checklists for
status. Prose is compact: a sentence or two per idea, then a heading or a
table. Mirror this in copy you write.

**Concrete examples** (from the upstream README):

> *Ever hit it off with another fursuiter, only to realize — you can't unlock
> your phone through mesh eyes, can't type with paws on, and definitely don't
> want to break the magic by de-suiting just to swap contacts?*
>
> **con-venience** solves that. Two wrists touch. Done.

> The furry community has a lot of programmers. This project is designed for
> them.

> The hardware is a platform. What runs on it is up to everyone.

**Emoji.** Used sparingly and *only* paw-themed (🐾) plus a few neutral
markers (📱, 🎉, 😴) in tables. Never as decoration. The pixel art carries the
character — emoji is for filesystem-friendly inline iconography in markdown.

**Code comments.** The firmware has Chinese inline comments (the maintainer is
bilingual). Leave them in place when editing firmware; **do not translate**.
For new comments, English is fine, but matching surrounding-file language is
respectful.

**Latin epigraphs.** Used twice in the README, both as section bookends. If you
add a third, make sure it earns its place — they're a flavor, not a template.

---

## Visual foundations

**Color.** There are exactly two colors on the device: **ink** (`#111111`) and
**paper** (`#c4c4c4`, the cool light-grey of a real Waveshare panel — *not*
pure white). All "shades" between are dithered black-on-paper at varying
densities. Off-device surfaces add a small companion palette (`--chassis`,
`--led-amber`, `--warning`) but never inside the screen frame.

**Type.** Bitmap pixel fonts only. On-device the firmware uses u8g2's
`logisoso`, `inb16`, and `profont` families. The web substitutes
**Silkscreen** (display), **Pixelify Sans** (UI), **VT323** (mono) from Google
Fonts. ⚠️ These are visually-close but not pixel-identical substitutes — flag
when fidelity matters.

**Spacing.** A coarse pixel scale: 2 / 4 / 8 / 12 / 16 / 24 / 32. The device
canvas is 296×128; most layouts split it as 128×128 (avatar square) + 168×128
(text panel). The mockups in `assets/screens/` are the canonical layouts.

**Backgrounds.** Three patterns appear in upstream mockups:
1. **Plain paper** — most pages. The default.
2. **Edge dither** — the homepage uses vertical dithered halftone bands at the
   left and right edges to frame the centered avatar. Treat as decoration, not
   border.
3. **Inverted bar** — the selection state. A solid black row with paper-color
   text, anchored to the row's exact pixel height. No padding bleed.

No full-bleed photography. No gradients (the device can't render them).
Halftone dither stands in for any tonal variation.

**Animation.** The display is e-ink — full refresh is ~700ms, partial refresh
~300ms. Animation on-device is **stepped, not eased**: discrete frames, no
interpolation. The "pairing" page cycles through 3–4 sonar-arc frames at
~500ms each. The simulator should mimic this with a stepped easing
(`steps(N, end)`), never a smooth tween. Off-device UI (web docs) can use
gentle 200ms ease-outs, but never on anything that represents the device.

**Hover/press.** On-device there are no hover states (no pointer). A button
press is felt, not seen — except for the optional buzzer tick. In the
simulator, hovering the device button shows a faint paper-colored ring; press
inverts the ring. Off-device buttons darken 6% on hover, scale 0.98 on press.

**Borders.** Screen content typically has **no** border — the device bezel
provides the frame. Selection is the only "border" pattern, drawn as a filled
inverted bar (not an outline). Off-device, 1px solid `--ink` is the only
border weight.

**Shadows.** None on-device (1-bit, no anti-alias). Off-device, a single hard
shadow: `0 2px 0 var(--ink)` — pixel-art style, no blur.

**Corners.** Strictly square on-device. The chassis renders with
`--radius-chassis: 18px`. The e-ink cutout in the bezel uses
`--radius-screen: 6px`. Nothing else is rounded.

**Transparency / blur.** Never on-device (it's a 1-bit panel). Off-device, no
blurs — they read as anti-aliasing artifacts and clash with the pixel
aesthetic.

**Imagery.** Avatars are 64×64 1-bit, Floyd–Steinberg dithered from source
photos via `tools/convert.py`. QR codes are direct threshold (no dither).
There are no photographs anywhere in the visual system — only dithered
bitmaps, line art, and pixel illustrations.

**Cards / surfaces.** Off-device, a "card" is `--paper` background, `1px solid
--ink`, `--radius-0`, optional `0 2px 0 var(--ink)` hard shadow. On-device,
there is no card concept — content sits directly on the canvas.

**Layout rules.** The 296×128 frame is the only "viewport." On-device pages
follow one of three templates:
- **Hero + label** (homepage): centered illustration, optional dither edges
- **Split** (profile, friends list): 128px avatar column left, text column right
- **Stack** (menu): vertical list of rows, one selected (inverted)

The simulator should never break out of 296×128 — if content overflows, it
scrolls (1-row at a time, stepped, no momentum) or paginates.

---

## Iconography

The on-device "icon set" is **drawn directly into the firmware as bitmaps**
(no SVG, no font). Three icon styles appear in the upstream mockups:

1. **Pixel character illustrations** — the avatar (`Bob.png`), the wolf head
   from the friends-sortment page, the diamond-with-paw "Con" emblem. These
   are hand-crafted 64×64 or 128×128 1-bit images, often dithered.
2. **Outline glyphs** — the wrist-pairing icon, the "Connecting to PC..."
   sonar circles. Single-pixel-stroke line art with dashed/dotted segments to
   imply motion or transparency.
3. **Inverted-bar selection** — not an icon per se, but the selection state
   is the closest the UI gets to a UI primitive.

**Web/simulator icon strategy.** For UI chrome *outside* the e-ink frame
(simulator toolbars, docs nav, web companion), we use **Lucide Icons** from
CDN — 1.5px stroke, square caps, set to `currentColor`. Lucide's geometric
style sits adjacent to the pixel aesthetic without competing with it.

⚠️ **Flagged substitution** — Lucide is *not* in the upstream repo. It's a
default chosen here because the project has no off-device icon set. If the
upstream picks one (e.g. for the future companion app), swap to that.

**Emoji.** Used in markdown tables only (🐾 📱 🎉 😴). Never in UI. The pixel
art is the brand voice; emoji would dilute it.

**Unicode glyphs.** The README uses no special unicode — em-dashes (—), single
quotes for Latin epigraphs, and ASCII checklists `[x] [~] [ ]`. Keep it
boring; the pixel art does the work.

**Logos.** No formal wordmark yet. The closest things are:
- The hyphenated lowercase string **con-venience**, set in Silkscreen
- The pixel-cat avatar (`assets/avatar-bob.png`) used as a project mascot
- The diamond-with-paw "Con" emblem from `assets/screens/friends_sortment.png`

If you need a placeholder logo, use the Silkscreen wordmark over a 1px solid
`--ink` underline. Don't invent a glyph — wait for the maintainer to draw one.

---

## Index — what to read next

| File | What it gives you |
|---|---|
| `colors_and_type.css` | All design tokens. Import this; don't duplicate values. |
| `fonts/README.md` | Font sources and the Google Fonts `<link>` block. |
| `preview/*.html` | Visual specimen cards rendered in the Design System tab. |
| `ui_kits/simulator/index.html` | The interactive e-ink simulator. **This is the main deliverable** — use it to test page flows without flashing firmware. |
| `ui_kits/simulator/README.md` | How the simulator maps to firmware concepts. |
| `assets/screens/*.png` | Reference mockups from upstream. Source of truth for page layouts. |
| `assets/ui_logic.svg` | The page state machine sketch from upstream. |
| `SKILL.md` | Entry point when this folder is loaded as an Agent Skill. |

---

*Built for the furry community. Designed in Sweden.*
