# Simulator UI kit

This is the **con-venience simulator** — a web-based reproduction of the
device's e-ink display and single-button input, so you can iterate on the UI
without flashing firmware to hardware.

It is not a functional reimplementation of the firmware; it is a *visual and
interaction* recreation of the page state machine described in
`assets/ui_logic.svg` and the mockups in `assets/screens/`.

## Mapping to the firmware

| Simulator concept | Firmware analogue |
|---|---|
| `Page` enum in `simulator.jsx` | The page state machine in `main.cpp` |
| `useButton()` hook | `btn_read()` in `lib/button/button.cpp` |
| short click | `BTN_CLICK` — moves selection / cycles page |
| long press ≥ 300ms | `BTN_LONG_PRESS` — enters / activates / opens pair mode |
| `<Avatar/>` 64×64 bitmap | `Contact.avatar[AVATAR_LEN]` (512 bytes, 64×64 1-bit) |
| Page list | `homepage → menu → friends_list → friend_profile`, plus `pairing`, `connect` |

## Controls

- **Click the physical button** (right side of the chassis) — sends a short
  click; release within 300ms for `BTN_CLICK`, hold for `BTN_LONG_PRESS`.
- **Spacebar** — same, keyboard shortcut.
- **B key** — toggle the e-ink "ghosting" effect on refresh, for fun.

## Caveats

- Fonts are Silkscreen / Pixelify Sans (Google Fonts) substitutes; the device
  uses u8g2 bitmap fonts. Close, not identical.
- ACOM contact, BLE pairing, and USB-to-PC are *simulated as cosmetic
  animations only*. Real protocol behavior lives in the firmware.
- Storage is in-memory — refreshing the simulator wipes "saved" contacts.
