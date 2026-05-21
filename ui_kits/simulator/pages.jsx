// ============================================================
// con-venience simulator — pages (v2, full vision)
//
// Changes from upstream mockups:
//   - HOME: QR + name + species + URL, all on one screen
//           (was: just the avatar; QR was a separate page behind a click)
//   - PAIRING: two pixel wrists slide toward each other, magnet sparks
//             between them, paw stamp blooms at the moment of contact
//             (was: generic sonar arcs)
//   - PAIRING_SUCCESS: big paw stamp + "+ Alice" — auto-dismisses
//   - FRIENDS_LIST: the LEFT avatar now mirrors the SELECTED friend,
//                  not the user. Scrolling actually changes what you see.
//   - LOW_BATTERY: full-screen warning (no persistent battery indicator
//                 — we rely on the ESP32 brown-out detector instead)
// ============================================================

const { useState, useEffect, useRef, useMemo } = React;
const CV_SELF       = window.CV_DATA.SELF;
const CV_CONTACTS   = window.CV_DATA.CONTACTS;
const CV_AVATAR_BOB = window.CV_AVATAR_BOB || '../../assets/avatar-bob.png';

// ----- atoms ------------------------------------------------

// 16x16 1-bit geometric avatars, drawn as pixel rects. Renders crisp at
// any size (typically 64–112px on the device's logical canvas).
// Each shape is a hand-drawn placeholder for a future user-uploaded avatar.
const AVATAR_SHAPES = {
  // CAT — round head, pointed ears, slits for eyes
  cat: [
    [4,2,2,1],[10,2,2,1],
    [3,3,1,1],[5,3,1,1],[6,3,4,1],[10,3,1,1],[12,3,1,1],
    [2,4,1,2],[5,4,1,1],[10,4,1,1],[13,4,1,2],
    [2,5,1,1],[3,5,10,1],[13,5,1,1],
    [2,6,12,1],
    [2,7,1,1],[4,7,2,1],[10,7,2,1],[13,7,1,1],
    [2,8,12,1],
    [3,9,1,1],[7,9,2,1],[12,9,1,1],
    [3,10,2,1],[11,10,2,1],
    [4,11,8,1],
  ],
  // DOG — square head, floppy ears
  dog: [
    [3,2,2,3],[11,2,2,3],
    [4,3,1,1],[11,3,1,1],
    [4,4,8,1],
    [3,5,10,1],
    [3,6,1,1],[5,6,2,1],[9,6,2,1],[12,6,1,1],
    [3,7,10,1],
    [3,8,2,1],[6,8,4,1],[11,8,2,1],
    [4,9,8,1],
    [5,10,6,1],
    [7,11,2,1],
  ],
  // FOX — triangular head, big ears, sharp
  fox: [
    [3,2,1,3],[12,2,1,3],
    [4,3,1,2],[11,3,1,2],
    [5,4,6,1],
    [4,5,8,1],
    [3,6,1,1],[5,6,1,1],[10,6,1,1],[12,6,1,1],
    [3,7,10,1],
    [4,8,1,1],[7,8,2,1],[11,8,1,1],
    [4,9,8,1],
    [5,10,1,1],[10,10,1,1],
    [6,11,4,1],
  ],
  // WOLF — angular, with stripe muzzle
  wolf: [
    [3,1,2,2],[11,1,2,2],
    [4,2,1,2],[11,2,1,2],
    [4,3,8,1],
    [3,4,10,1],
    [2,5,12,1],
    [2,6,1,1],[5,6,1,1],[10,6,1,1],[13,6,1,1],
    [2,7,12,1],
    [3,8,2,1],[6,8,4,1],[11,8,2,1],
    [4,9,1,1],[7,9,2,1],[11,9,1,1],
    [5,10,6,1],
    [6,11,4,1],
  ],
  // WOLF2 — bigger, mohawk on top
  wolf2: [
    [7,1,2,1],
    [3,2,2,2],[6,2,1,2],[9,2,1,2],[11,2,2,2],
    [4,3,1,1],[11,3,1,1],
    [3,4,10,1],
    [2,5,12,1],
    [2,6,1,1],[4,6,2,1],[10,6,2,1],[13,6,1,1],
    [2,7,12,1],
    [3,8,1,1],[5,8,6,1],[12,8,1,1],
    [4,9,8,1],
    [5,10,1,1],[7,10,2,1],[10,10,1,1],
    [6,11,4,1],
  ],
  // RABBIT — long ears
  rabbit: [
    [5,1,1,5],[10,1,1,5],
    [6,1,1,4],[9,1,1,4],
    [4,6,8,1],
    [3,7,10,1],
    [3,8,1,1],[5,8,1,1],[10,8,1,1],[12,8,1,1],
    [3,9,10,1],
    [4,10,1,1],[7,10,2,1],[11,10,1,1],
    [5,11,6,1],
    [6,12,1,1],[7,12,2,1],[9,12,1,1],
  ],
  // OTTER — rounded oval, whiskers
  otter: [
    [5,2,6,1],
    [4,3,1,1],[11,3,1,1],
    [3,4,1,2],[12,4,1,2],
    [2,5,1,3],[13,5,1,3],
    [2,6,1,1],[5,6,1,1],[10,6,1,1],[13,6,1,1],
    [2,7,12,1],
    [2,8,1,1],[4,8,1,1],[6,8,4,1],[11,8,1,1],[13,8,1,1],
    [3,9,10,1],
    [4,10,8,1],
    [5,11,6,1],
    [7,12,2,1],
  ],
  // BOB (the user) — simple pixel face for fallback
  bob: [
    [4,2,8,1],
    [3,3,10,1],
    [2,4,12,1],
    [2,5,2,1],[5,5,1,1],[10,5,1,1],[12,5,2,1],
    [2,6,12,1],
    [2,7,12,1],
    [3,8,1,1],[6,8,4,1],[12,8,1,1],
    [3,9,10,1],
    [4,10,8,1],
    [5,11,6,1],
  ],
};

function GeoAvatar({ shape = 'cat', size = 64, border = true }) {
  const cells = AVATAR_SHAPES[shape] || AVATAR_SHAPES.cat;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        background: 'var(--paper)',
        flexShrink: 0,
      }}
    >
      {border && (
        <>
          <rect x="0" y="0" width="16" height="1" fill="#111" />
          <rect x="0" y="15" width="16" height="1" fill="#111" />
          <rect x="0" y="0" width="1" height="16" fill="#111" />
          <rect x="15" y="0" width="1" height="16" fill="#111" />
        </>
      )}
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#111" />
      ))}
    </svg>
  );
}

function Avatar({ src = CV_AVATAR_BOB, size = 110, style }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
      alt=""
    />
  );
}

function Row({ children, selected, size = 22 }) {
  return (
    <div
      style={{
        fontFamily: '"Pixelify Sans", "VT323", monospace',
        fontSize: size,
        lineHeight: 1,
        padding: '2px 6px',
        background: selected ? '#111' : 'transparent',
        color: selected ? '#c4c4c4' : '#111',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function LabelKV({ k, v, size = 13 }) {
  return (
    <div style={{ fontFamily: '"Pixelify Sans", "VT323", monospace', fontSize: size, lineHeight: 1.15, marginBottom: 1 }}>
      {k}{k ? ': ' : ''}{v}
    </div>
  );
}

// Pseudo QR — visual stub, not a real encoder. SVG with integer rects
// for predictable rendering inside the scaled canvas.
function QR({ size = 96 }) {
  const N = 21;
  const cell = Math.floor(size / N); // integer cells, no fractional grid
  const real = cell * N;
  const grid = useMemo(() => {
    const g = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const finder = (xx, yy) =>
          (xx < 7 && yy < 7 &&
            (xx === 0 || xx === 6 || yy === 0 || yy === 6 ||
             (xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4)));
        const isFinder = finder(x, y) || finder(N - 1 - x, y) || finder(x, N - 1 - y);
        const on = isFinder || ((x * 7 + y * 11 + x * y) % 3 === 0);
        if (on) g.push([x, y]);
      }
    }
    return g;
  }, []);
  return (
    <svg
      width={real}
      height={real}
      viewBox={`0 0 ${N} ${N}`}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        flexShrink: 0,
        background: 'var(--paper)',
      }}
    >
      {grid.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill="#111" />
      ))}
    </svg>
  );
}

// Paw stamp — pad + 4 toes, drawn from rect cells (pixel)
function PawStamp({ size = 32 }) {
  // 16×16 paw centered in a `size` box
  const s = size / 16;
  const cells = [
    // pad
    [5, 8, 6, 5],
    [6, 7, 4, 1],
    [6, 13, 4, 1],
    // toes
    [2, 4, 2, 2],
    [5, 1, 2, 3],
    [9, 1, 2, 3],
    [12, 4, 2, 2],
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#111" />
      ))}
    </svg>
  );
}

// Single wrist with watch — drawn pixel-style with rects.
// "facing" = 'right' means the watch face points right (device-on-right-arm,
// looking at someone). 'left' = mirrored.
function Wrist({ facing = 'right' }) {
  const mirror = facing === 'left';
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      style={{
        transform: mirror ? 'scaleX(-1)' : 'none',
        imageRendering: 'pixelated',
        display: 'block',
      }}
    >
      {/* arm / cuff */}
      <rect x="0"  y="22" width="34" height="12" fill="#111" />
      {/* strap top */}
      <rect x="30" y="18" width="4"  height="4"  fill="#111" />
      {/* strap bottom */}
      <rect x="30" y="34" width="4"  height="4"  fill="#111" />
      {/* device body */}
      <rect x="34" y="14" width="20" height="28" fill="#111" />
      {/* screen */}
      <rect x="36" y="16" width="16" height="24" fill="#c4c4c4" />
      {/* tiny screen content */}
      <rect x="38" y="18" width="4"  height="6"  fill="#111" />
      <rect x="44" y="20" width="6"  height="2"  fill="#111" />
      <rect x="44" y="24" width="4"  height="2"  fill="#111" />
      <rect x="38" y="28" width="12" height="2"  fill="#111" />
      <rect x="38" y="32" width="8"  height="2"  fill="#111" />
      {/* magnet/contact pad on outer edge */}
      <rect x="54" y="22" width="2"  height="12" fill="#111" />
    </svg>
  );
}

// ===== HOME — QR + photo + name (no URL — it's in the QR) ============
function HomePage() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 12px',
      }}
    >
      <QR size={108} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <GeoAvatar shape={CV_SELF.shape} size={56} />
        <div
          style={{
            fontFamily: '"Silkscreen", "Press Start 2P", monospace',
            fontSize: 28,
            lineHeight: 1,
            color: '#111',
            fontWeight: 700,
          }}
        >
          {CV_SELF.username}
        </div>
      </div>
    </div>
  );
}

// ===== MENU ===========================================================
function MenuPage({ cursor = 0 }) {
  const items = ['Friends', 'My profile', 'Pair', 'Connect to PC'];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '4px 12px',
      }}
    >
      <GeoAvatar shape={CV_SELF.shape} size={108} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((label, i) => (
          <Row key={label} selected={i === cursor} size={i === cursor ? 21 : 19}>
            {label}
          </Row>
        ))}
      </div>
    </div>
  );
}

// ===== FRIENDS LIST — left avatar mirrors selection =================
function FriendsListPage({ cursor = 0 }) {
  const start = Math.min(cursor, Math.max(0, CV_CONTACTS.length - 5));
  const view = CV_CONTACTS.slice(start, start + 5);
  const selectedIdx = cursor - start;
  const selectedContact = CV_CONTACTS[cursor];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '2px 8px',
      }}
    >
      <GeoAvatar shape={selectedContact.shape} size={104} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
        {view.map((c, i) => (
          <Row key={c.username} selected={i === selectedIdx} size={19}>
            {c.username}
          </Row>
        ))}
      </div>
    </div>
  );
}

// ===== FRIEND PROFILE =================================================
function FriendProfilePage({ contact = CV_CONTACTS[0] }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        gap: 14,
      }}
    >
      <GeoAvatar shape={contact.shape} size={104} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: '"Silkscreen", "Press Start 2P", monospace', fontSize: 24, lineHeight: 1, marginBottom: 6, fontWeight: 700 }}>
          {contact.username}
        </div>
        <LabelKV k="" v={contact.species} />
        <LabelKV k="" v={contact.tel} />
        <LabelKV k="" v={contact.furtrack} />
      </div>
    </div>
  );
}

// ===== MY PROFILE =====================================================
function MyProfilePage() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        gap: 14,
      }}
    >
      <GeoAvatar shape={CV_SELF.shape} size={104} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: '"Silkscreen", "Press Start 2P", monospace', fontSize: 28, lineHeight: 1, marginBottom: 4, fontWeight: 700 }}>
          {CV_SELF.username}
        </div>
        <LabelKV k="" v={CV_SELF.species} />
        <LabelKV k="" v={CV_SELF.tel} />
        <LabelKV k="" v={CV_SELF.furtrack} />
        <div
          style={{
            background: '#111',
            color: '#c4c4c4',
            fontFamily: '"Pixelify Sans", "VT323", monospace',
            fontSize: 13,
            padding: '1px 6px',
            display: 'inline-block',
            width: 'fit-content',
            marginTop: 4,
            lineHeight: 1,
          }}
        >
          Edit
        </div>
      </div>
    </div>
  );
}

// ===== PAIRING — two wrists touch, paw stamps =========================
function PairingPage({ onAcomReceived }) {
  // 6-frame loop: 0,1,2 = approach; 3 = touch; 4 = paw bloom; 5 = retreat
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 6), 280);
    return () => clearInterval(id);
  }, []);

  // Optional: auto-simulate ACOM success after ~5 seconds
  // (you can also press SELECT to skip)
  useEffect(() => {
    if (!onAcomReceived) return;
    const t = setTimeout(() => onAcomReceived(), 5000);
    return () => clearTimeout(t);
  }, [onAcomReceived]);

  // Wrist x-positions per frame (left wrist anchored to left of screen,
  // right wrist anchored to right). Each is the gap from its edge.
  const positions = [
    -30, -10, 14, 38, 38, -10,
  ];
  const leftX  = positions[frame];
  const rightX = positions[frame];

  // Paw appears on frame 3-4 only
  const showPaw = frame === 3 || frame === 4;
  const pawSize = frame === 3 ? 28 : 40;

  // Magnet "spark" dots between wrists, only on approach frames
  const showSparks = frame < 3;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* left wrist */}
      <div
        style={{
          position: 'absolute',
          left: leftX,
          top: 32,
          transition: 'left 200ms steps(2, end)',
        }}
      >
        <Wrist facing="right" />
      </div>

      {/* right wrist */}
      <div
        style={{
          position: 'absolute',
          right: rightX,
          top: 32,
          transition: 'right 200ms steps(2, end)',
        }}
      >
        <Wrist facing="left" />
      </div>

      {/* magnet sparks during approach */}
      {showSparks && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 52,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 2,
                height: 2,
                background: '#111',
                opacity: i === frame ? 1 : 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* paw stamp on contact */}
      {showPaw && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
          }}
        >
          <PawStamp size={pawSize} />
        </div>
      )}

      {/* caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: '"Pixelify Sans", "VT323", monospace',
          fontSize: 13,
          lineHeight: 1,
          letterSpacing: 1,
        }}
      >
        Touch wrists
      </div>
    </div>
  );
}

// ===== PAIRING SUCCESS — paw + name + their avatar ====================
function PairingSuccessPage({ contact = CV_CONTACTS[0], onDone }) {
  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(() => onDone(), 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 14px',
      }}
    >
      <GeoAvatar shape={contact.shape} size={88} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <PawStamp size={16} />
          <div
            style={{
              fontFamily: '"Silkscreen", "Press Start 2P", monospace',
              fontSize: 11,
              lineHeight: 1,
              letterSpacing: 1,
              opacity: 0.7,
              fontWeight: 700,
            }}
          >
            FRIEND ADDED
          </div>
        </div>
        <div
          style={{
            fontFamily: '"Silkscreen", "Press Start 2P", monospace',
            fontSize: 26,
            lineHeight: 1,
            fontWeight: 700,
          }}
        >
          {contact.username}
        </div>
        <div
          style={{
            fontFamily: '"Pixelify Sans", "VT323", monospace',
            fontSize: 13,
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          {contact.species}
        </div>
        <div
          style={{
            fontFamily: '"Pixelify Sans", "VT323", monospace',
            fontSize: 12,
            lineHeight: 1,
            marginTop: 4,
            opacity: 0.7,
          }}
        >
          {contact.tel}
        </div>
      </div>
    </div>
  );
}

// ===== CONNECT TO PC ==================================================
function ConnectPage() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 3), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 0',
      }}
    >
      <svg viewBox="0 0 200 70" width="220" height="60" style={{ imageRendering: 'pixelated' }}>
        <circle cx="100" cy="35" r="8" fill="none" stroke="#111" strokeWidth="3" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <path
              d={`M ${100 - 20 - i * 20} 14 A ${15 + i * 15} ${22 + i * 8} 0 0 0 ${100 - 20 - i * 20} 56`}
              stroke="#111"
              strokeWidth="2"
              fill="none"
              strokeDasharray="3 4"
              opacity={frame >= i ? 1 : 0.15}
            />
            <path
              d={`M ${100 + 20 + i * 20} 14 A ${15 + i * 15} ${22 + i * 8} 0 0 1 ${100 + 20 + i * 20} 56`}
              stroke="#111"
              strokeWidth="2"
              fill="none"
              strokeDasharray="3 4"
              opacity={frame >= i ? 1 : 0.15}
            />
          </g>
        ))}
      </svg>
      <div style={{ fontFamily: '"Pixelify Sans", "VT323", monospace', fontSize: 19, lineHeight: 1, marginTop: 6 }}>
        Connecting to PC...
      </div>
    </div>
  );
}

// ===== LOW BATTERY — full-screen warning =============================
function LowBatteryPage() {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      {/* battery icon */}
      <svg
        width="68"
        height="40"
        viewBox="0 0 68 40"
        style={{ imageRendering: 'pixelated', opacity: blink ? 1 : 0.25 }}
      >
        <rect x="2"  y="6"  width="56" height="28" fill="none" stroke="#111" strokeWidth="3" />
        <rect x="58" y="14" width="6"  height="12" fill="#111" />
        <rect x="6"  y="10" width="6"  height="20" fill="#111" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: '"Silkscreen", "Press Start 2P", monospace',
            fontSize: 16,
            lineHeight: 1,
            letterSpacing: 1,
            opacity: blink ? 1 : 0.25,
          }}
        >
          LOW BATTERY
        </div>
        <div style={{ fontFamily: '"Pixelify Sans", "VT323", monospace', fontSize: 13, marginTop: 6, lineHeight: 1 }}>
          Replace CR2450
        </div>
      </div>
    </div>
  );
}

// ----- exports ----------------------------------------------
Object.assign(window, {
  HomePage,
  MenuPage,
  FriendsListPage,
  FriendProfilePage,
  MyProfilePage,
  PairingPage,
  PairingSuccessPage,
  ConnectPage,
  LowBatteryPage,
  Avatar,
  Row,
  QR,
  PawStamp,
  Wrist,
});
