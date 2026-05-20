---
name: con-venience-design
description: Use this skill to generate well-branded interfaces and assets for con-venience, an open-source wearable social device for fursuit conventions, either for production or throwaway prototypes / mocks / etc. Contains essential design guidelines, colors, type, fonts, assets, and a working e-ink + button simulator for prototyping new on-device pages.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

The visual language is **one physical constraint** dressed up as a brand:
a 296×128 1-bit e-ink display, driven by a single button, worn on the forearm
of someone in a fursuit. Every design decision flows from that. Pixel fonts.
Black ink on light-grey paper. Halftone dither in place of grey. Square
corners on-device, generous radii on the chassis. No animation that isn't
stepped. No icons that aren't 1-bit bitmaps.

The off-device tone is warm, a little wry, threaded with Latin epigraphs and
plain "two wrists touch, done" copy. The product name is lowercase and
hyphenated — **con-venience**. Never "Con-Venience."

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy
the assets you need out of `assets/` and `fonts/`, import `colors_and_type.css`
for tokens, and build a static HTML file for the user to view. The
`ui_kits/simulator/` folder is the canonical reference for what a "page" looks
like on this device — borrow components from there, or extend it with a new
page if the task is "design a new on-device screen."

If working on production code (the firmware in `HuanYitiao/con-venience` or
the simulator in `HuanYitiao/con-venience-sim`), copy assets and read the
rules here to become an expert in designing with this brand. The README has
sections on content fundamentals, visual foundations, and iconography that
cover the questions a designer typically asks first.

If the user invokes this skill without any other guidance, ask them what they
want to build or design, ask some questions (what page? what state? on-device
or off-device surface?), and act as an expert designer who outputs HTML
artifacts *or* production code, depending on the need.
