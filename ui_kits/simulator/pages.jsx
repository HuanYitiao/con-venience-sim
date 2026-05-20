// ============================================================
// con-venience simulator — pages
// Each <Page> renders into the 296×128 e-ink frame.
// All sizing is in CSS px against a 296×128 logical canvas;
// the parent <Screen> scales the whole thing.
// ============================================================

const { useState, useEffect, useRef, useMemo } = React;
const CV_SELF = window.CV_DATA.SELF;
const CV_CONTACTS = window.CV_DATA.CONTACTS;
const CV_SORT_GROUPS = window.CV_DATA.SORT_GROUPS;

// ------------------------------------------------------------
// Building blocks
// ------------------------------------------------------------

function Avatar({ src = window.CV_AVATAR_BOB || '../../assets/avatar-bob.png', size = 110, style }) {
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

// Edge dither bands — used on the homepage to frame the avatar.
function EdgeDither({ side = 'left', width = 50 }) {
  const flip = side === 'right' ? 'scaleX(-1)' : 'none';
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width,
        transform: flip,
        backgroundImage:
          'linear-gradient(to right, rgba(17,17,17,1), rgba(17,17,17,0)), radial-gradient(#111 0.8px, transparent 1.1px)',
        backgroundSize: '100% 100%, 4px 4px',
        backgroundBlendMode: 'multiply',
        imageRendering: 'pixelated',
      }}
    />
  );
}

// A pixel-perfect row in a menu. `selected` inverts colors.
function Row({ children, selected, size = 22 }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-ui)',
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

function LabelKV({ k, v, size = 14 }) {
  return (
    <div style={{ fontFamily: 'var(--font-ui)', fontSize: size, lineHeight: 1.1, marginBottom: 2 }}>
      {k}:{v}
    </div>
  );
}

// ------------------------------------------------------------
// HOMEPAGE — idle, default page
// ------------------------------------------------------------
function HomepagePage() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)' }}>
      <EdgeDither side="left" width={50} />
      <EdgeDither side="right" width={50} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Avatar size={110} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MENU — Friends / My profile / Pair / Connect
// ------------------------------------------------------------
function MenuPage({ cursor = 0 }) {
  const items = ['Friends', 'My profile', 'Pair', 'Connect to PC'];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px' }}>
      <Avatar size={120} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginLeft: 4 }}>
        {items.map((label, i) => (
          <Row key={label} selected={i === cursor} size={i === cursor ? 22 : 20}>
            {label}
          </Row>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// FRIENDS LIST
// ------------------------------------------------------------
function FriendsListPage({ cursor = 0 }) {
  const start = Math.min(cursor, Math.max(0, CV_CONTACTS.length - 5));
  const view = CV_CONTACTS.slice(start, start + 5);
  const selectedIdx = cursor - start;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '2px 6px' }}>
      <Avatar size={110} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
        {view.map((c, i) => (
          <Row key={c.username} selected={i === selectedIdx} size={20}>
            {c.username}
          </Row>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// FRIEND PROFILE
// ------------------------------------------------------------
function FriendProfilePage({ contact = CV_CONTACTS[0] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '4px 6px' }}>
      <Avatar size={110} style={{ flexShrink: 0 }} />
      <div style={{ marginLeft: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, marginBottom: 4 }}>
          {contact.username}
        </div>
        <LabelKV k="Specise" v={contact.species} />
        <LabelKV k="Tel" v={contact.tel} />
        <LabelKV k="Fur_track" v={contact.furtrack} />
        <LabelKV k="Caught" v={contact.caught} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MY PROFILE
// ------------------------------------------------------------
function MyProfilePage() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
      <Avatar size={120} />
      <div style={{ marginLeft: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, marginBottom: 4 }}>
          {CV_SELF.username}
        </div>
        <LabelKV k="Specise" v={CV_SELF.species} />
        <LabelKV k="Tel" v={CV_SELF.tel} />
        <LabelKV k="Fur_track" v={CV_SELF.furtrack} />
        <div
          style={{
            background: '#111',
            color: '#c4c4c4',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            padding: '1px 6px',
            display: 'inline-block',
            width: 'fit-content',
            marginTop: 2,
            lineHeight: 1,
          }}
        >
          Edit
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// PAIRING — cycle 3 frames of sonar arcs
// ------------------------------------------------------------
function PairingPage() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 3), 420);
    return () => clearInterval(id);
  }, []);
  // Three arcs at varying visibility based on frame
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
      <Avatar size={120} />
      <svg viewBox="0 0 180 128" width="180" height="128" style={{ imageRendering: 'pixelated' }}>
        {[0, 1, 2].map(i => {
          const visible = frame >= i;
          return (
            <path
              key={i}
              d={`M ${30 + i * 30} 24 Q ${60 + i * 30} 64 ${30 + i * 30} 104`}
              stroke="#111"
              strokeWidth="3"
              fill="none"
              strokeDasharray="4 4"
              opacity={visible ? 1 : 0}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ------------------------------------------------------------
// CONNECT — "Connecting to PC..." concentric circles
// ------------------------------------------------------------
function ConnectPage() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 3), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
      <svg viewBox="0 0 200 70" width="220" height="60" style={{ imageRendering: 'pixelated' }}>
        <circle cx="100" cy="35" r="8" fill="none" stroke="#111" strokeWidth="3" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <path d={`M ${100 - 20 - i*20} 14 A ${15 + i*15} ${22 + i*8} 0 0 0 ${100 - 20 - i*20} 56`}
              stroke="#111" strokeWidth="2" fill="none" strokeDasharray="3 4"
              opacity={frame >= i ? 1 : 0.15} />
            <path d={`M ${100 + 20 + i*20} 14 A ${15 + i*15} ${22 + i*8} 0 0 1 ${100 + 20 + i*20} 56`}
              stroke="#111" strokeWidth="2" fill="none" strokeDasharray="3 4"
              opacity={frame >= i ? 1 : 0.15} />
          </g>
        ))}
      </svg>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 20, lineHeight: 1, marginTop: 6 }}>
        Connecting to PC...
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// QR code (basic representation — not a real encoder)
// ------------------------------------------------------------
function QRPage() {
  // 21×21 grid stub for visual purpose; not a real QR
  const grid = useMemo(() => {
    const g = [];
    for (let y = 0; y < 21; y++) {
      const row = [];
      for (let x = 0; x < 21; x++) {
        // finder patterns
        const finder = (xx, yy) =>
          (xx < 7 && yy < 7 && (xx === 0 || xx === 6 || yy === 0 || yy === 6 || (xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4)));
        const isFinder = finder(x, y) || finder(20 - x, y) || finder(x, 20 - y);
        const pseudo = isFinder ? 1 : ((x * 7 + y * 11 + x * y) % 3 === 0 ? 1 : 0);
        row.push(pseudo);
      }
      g.push(row);
    }
    return g;
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '4px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(21, 5px)`, gridAutoRows: '5px', imageRendering: 'pixelated' }}>
        {grid.flatMap((row, y) =>
          row.map((cell, x) => (
            <div key={`${x}-${y}`} style={{ background: cell ? '#111' : 'transparent' }} />
          ))
        )}
      </div>
      <div style={{ marginLeft: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, marginBottom: 4 }}>
          {CV_SELF.username}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.2 }}>{CV_SELF.url}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.2, marginTop: 4, opacity: 0.7 }}>
          Scan to add me
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// SORTMENT — choose how to sort friends
// ------------------------------------------------------------
function SortmentPage({ cursor = 0 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '4px 12px' }}>
      <div style={{ width: 110, height: 128, position: 'relative', flexShrink: 0 }}>
        {/* Diamond + paw emblem */}
        <svg viewBox="0 0 60 60" width="50" height="50" style={{ position: 'absolute', top: 6, left: 10, imageRendering: 'pixelated' }}>
          <polygon points="30,4 56,30 30,56 4,30" fill="none" stroke="#111" strokeWidth="2" strokeDasharray="2 2"/>
          <circle cx="30" cy="34" r="6" fill="#111"/>
          <circle cx="22" cy="26" r="2.5" fill="#111"/>
          <circle cx="30" cy="22" r="2.5" fill="#111"/>
          <circle cx="38" cy="26" r="2.5" fill="#111"/>
        </svg>
        {/* Wolf head emblem */}
        <svg viewBox="0 0 60 60" width="46" height="46" style={{ position: 'absolute', bottom: 6, left: 36, imageRendering: 'pixelated' }}>
          <polygon points="10,18 22,8 30,16 38,8 50,18 44,36 30,50 16,36" fill="none" stroke="#111" strokeWidth="2"/>
          <polygon points="22,26 28,32 22,38" fill="#111"/>
          <polygon points="38,26 32,32 38,38" fill="#111"/>
          <polygon points="26,44 30,40 34,44" fill="#111"/>
        </svg>
      </div>
      <div style={{ marginLeft: 4, display: 'flex', flexDirection: 'column' }}>
        {CV_SORT_GROUPS.map((g, i) => (
          <Row key={g.key} selected={i === cursor} size={20}>
            {g.label}
          </Row>
        ))}
      </div>
    </div>
  );
}

// Export all pages globally
Object.assign(window, {
  HomepagePage, MenuPage, FriendsListPage, FriendProfilePage,
  MyProfilePage, PairingPage, ConnectPage, QRPage, SortmentPage,
  Avatar, Row, EdgeDither,
});
