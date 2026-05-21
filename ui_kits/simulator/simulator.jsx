// ============================================================
// con-venience simulator — App
//
// Two input variants you can switch between live:
//   1. D-pad + OK + big pair button   (variant: "dpad")
//   2. Crown + big pair button         (variant: "crown")
//
// Both variants resolve to the same intent stream:
//   intent_next     — move cursor down
//   intent_prev     — move cursor up
//   intent_select   — confirm / enter
//   intent_back     — go up one level
//   intent_qr       — show my QR  (short press big button)
//   intent_pair     — enter pair  (long  press big button)
//
// Page state machine is intent-driven (see reduce() below).
// ============================================================

const { useState, useEffect, useRef, useCallback } = React;

const LONG_PRESS_MS = 300;
const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{}/*EDITMODE-END*/;

// -------------------- state reducer -------------------------
const MENU_TARGETS = ['friends_list', 'my_profile', 'pairing', 'connect'];

function reduce(state, intent) {
  const { page, cursor, contactIdx } = state;

  // intent_pair always wins, from any page
  if (intent === 'intent_pair') {
    return { ...state, page: 'pairing', cursor: 0 };
  }
  // intent_qr from anywhere returns home (home now shows the QR)
  if (intent === 'intent_qr') {
    return { ...state, page: 'home', cursor: 0 };
  }
  // ACOM contact simulated — show success then auto-return to home
  if (intent === 'intent_acom_success') {
    // pick a random contact as the "newly added" friend
    const newIdx = Math.floor(Math.random() * CV_DATA.CONTACTS.length);
    return { ...state, page: 'pairing_success', contactIdx: newIdx };
  }

  switch (page) {
    case 'home':
      if (intent === 'intent_select')  return { ...state, page: 'friends_list', cursor: 0 };
      if (intent === 'intent_next')    return { ...state, page: 'friends_list', cursor: 0 };
      if (intent === 'intent_prev')    return { ...state, page: 'friends_list', cursor: 0 };
      return state;

    case 'menu':
      // kept for legacy/dev-panel jump only
      if (intent === 'intent_back')    return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'friends_list':
      if (intent === 'intent_next')    return { ...state, cursor: (cursor + 1) % CV_DATA.CONTACTS.length, contactIdx: (cursor + 1) % CV_DATA.CONTACTS.length };
      if (intent === 'intent_prev')    return { ...state, cursor: (cursor - 1 + CV_DATA.CONTACTS.length) % CV_DATA.CONTACTS.length, contactIdx: (cursor - 1 + CV_DATA.CONTACTS.length) % CV_DATA.CONTACTS.length };
      if (intent === 'intent_select')  return { ...state, page: 'friend_profile', contactIdx: cursor };
      if (intent === 'intent_back')    return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'friend_profile':
      if (intent === 'intent_back' || intent === 'intent_select') return { ...state, page: 'friends_list' };
      return state;

    case 'my_profile':
      if (intent === 'intent_back' || intent === 'intent_select') return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'pairing':
      if (intent === 'intent_select')  return reduce(state, 'intent_acom_success');
      if (intent === 'intent_back')    return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'pairing_success':
      if (intent === 'intent_back' || intent === 'intent_select') return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'connect':
      if (intent === 'intent_back' || intent === 'intent_select') return { ...state, page: 'home', cursor: 0 };
      return state;

    case 'low_battery':
      if (intent === 'intent_back' || intent === 'intent_select') return { ...state, page: 'home', cursor: 0 };
      return state;

    default:
      return state;
  }
}

// -------------------- page router ---------------------------
function PageRouter({ page, cursor, contactIdx, fire }) {
  switch (page) {
    case 'home':           return <HomePage />;
    case 'menu':           return <MenuPage cursor={cursor} />;
    case 'friends_list':   return <FriendsListPage cursor={cursor} />;
    case 'friend_profile': return <FriendProfilePage contact={CV_DATA.CONTACTS[contactIdx]} />;
    case 'my_profile':     return <MyProfilePage />;
    case 'pairing':        return <PairingPage onAcomReceived={() => fire('intent_acom_success')} />;
    case 'pairing_success':return <PairingSuccessPage contact={CV_DATA.CONTACTS[contactIdx]} onDone={() => fire('intent_back')} />;
    case 'connect':        return <ConnectPage />;
    case 'low_battery':    return <LowBatteryPage />;
    default:               return <HomePage />;
  }
}

// =================== INPUT CONTROLS =========================

// ---- Big pair button (common to both variants) -------------
function BigPairButton({ onShort, onLong }) {
  const [held, setHeld] = useState(false);
  const triggered = useRef(false);
  const timer = useRef(null);

  const down = () => {
    if (held) return;
    setHeld(true);
    triggered.current = false;
    timer.current = setTimeout(() => {
      triggered.current = true;
      onLong && onLong();
    }, LONG_PRESS_MS);
  };
  const up = () => {
    if (!held) return;
    setHeld(false);
    if (timer.current) clearTimeout(timer.current);
    if (!triggered.current) onShort && onShort();
  };

  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); down(); }}
      onMouseUp={(e) => { e.preventDefault(); up(); }}
      onMouseLeave={() => up()}
      onTouchStart={(e) => { e.preventDefault(); down(); }}
      onTouchEnd={(e) => { e.preventDefault(); up(); }}
      title="Big paw button — short = QR, long = pair"
      style={{
        width: 64, height: 64, borderRadius: '50%',
        background: held ? '#0a0a0a' : 'radial-gradient(circle at 35% 30%, #3a3a3a, #1a1a1a 70%)',
        border: '2px solid #0a0a0a',
        boxShadow: held
          ? 'inset 0 4px 10px rgba(0,0,0,0.7), 0 1px 0 #000'
          : '0 4px 0 #000, inset 0 2px 0 rgba(255,255,255,0.08)',
        cursor: 'pointer',
        position: 'relative',
        transform: held ? 'translateY(3px)' : 'none',
        transition: 'transform 60ms ease-out',
        userSelect: 'none',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 11, color: '#f1b24a', letterSpacing: 0,
      }}>PAIR</span>
    </button>
  );
}

// ---- D-pad + OK -------------------------------------------
function DPadInput({ onIntent }) {
  const Btn = ({ children, onClick, style }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      onTouchStart={(e) => { e.preventDefault(); onClick(); }}
      style={{
        position: 'absolute', width: 28, height: 28,
        background: 'linear-gradient(180deg, #3a3a3a, #1c1c1c)',
        border: '1px solid #0a0a0a',
        boxShadow: '0 2px 0 #000, inset 0 1px 0 rgba(255,255,255,0.08)',
        color: '#c4c4c4', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 10,
        padding: 0, userSelect: 'none',
        ...style,
      }}
    >{children}</button>
  );
  return (
    <div style={{ position: 'relative', width: 92, height: 92 }}>
      <Btn onClick={() => onIntent('intent_prev')} style={{ left: 32, top: 0 }}>▲</Btn>
      <Btn onClick={() => onIntent('intent_back')} style={{ left: 0, top: 32 }}>◀</Btn>
      <Btn onClick={() => onIntent('intent_select')} style={{ left: 32, top: 32, background: 'radial-gradient(circle at 35% 30%, #5a5a5a, #2a2a2a 70%)', borderRadius: 14 }}>OK</Btn>
      <Btn onClick={() => onIntent('intent_select')} style={{ left: 64, top: 32 }}>▶</Btn>
      <Btn onClick={() => onIntent('intent_next')} style={{ left: 32, top: 64 }}>▼</Btn>
    </div>
  );
}

// ---- Crown (rotary encoder) -------------------------------
function CrownInput({ onIntent }) {
  const [angle, setAngle] = useState(0);
  const [held, setHeld] = useState(false);
  const triggered = useRef(false);
  const timer = useRef(null);

  // drag-to-rotate using mouse Y delta
  const wheelRef = useRef(null);
  const dragStart = useRef(null);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    setAngle(a => a + dir * 18);
    onIntent(dir > 0 ? 'intent_next' : 'intent_prev');
  }, [onIntent]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onMouseDown = (e) => {
    dragStart.current = { y: e.clientY, angle, lastNotch: 0 };
  };
  const onMouseMove = (e) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    const newAngle = dragStart.current.angle + dy * 2;
    setAngle(newAngle);
    // emit intents at notches every 20deg
    const totalNotches = Math.floor(Math.abs(newAngle - dragStart.current.angle) / 20);
    if (totalNotches > dragStart.current.lastNotch) {
      const dir = (newAngle - dragStart.current.angle) > 0 ? 1 : -1;
      for (let i = 0; i < totalNotches - dragStart.current.lastNotch; i++) {
        onIntent(dir > 0 ? 'intent_next' : 'intent_prev');
      }
      dragStart.current.lastNotch = totalNotches;
    }
  };
  const onMouseUp = () => { dragStart.current = null; };

  const press = () => {
    if (held) return;
    setHeld(true);
    triggered.current = false;
    timer.current = setTimeout(() => {
      triggered.current = true;
      onIntent('intent_back');
    }, LONG_PRESS_MS);
  };
  const release = () => {
    if (!held) return;
    setHeld(false);
    if (timer.current) clearTimeout(timer.current);
    if (!triggered.current) onIntent('intent_select');
  };

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ width: 92, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
    >
      <div
        ref={wheelRef}
        onMouseDown={onMouseDown}
        onPointerDown={(e) => { e.preventDefault(); press(); setTimeout(() => {}, 0); }}
        onPointerUp={release}
        onPointerLeave={release}
        title="Crown — drag or scroll to rotate, click to select, hold ≥300ms to back"
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: held
            ? 'radial-gradient(circle at 50% 50%, #1a1a1a, #0a0a0a)'
            : 'conic-gradient(from 0deg, #3a3a3a 0deg, #1c1c1c 30deg, #3a3a3a 60deg, #1c1c1c 90deg, #3a3a3a 120deg, #1c1c1c 150deg, #3a3a3a 180deg, #1c1c1c 210deg, #3a3a3a 240deg, #1c1c1c 270deg, #3a3a3a 300deg, #1c1c1c 330deg, #3a3a3a 360deg)',
          border: '2px solid #0a0a0a',
          boxShadow: held
            ? 'inset 0 3px 8px rgba(0,0,0,0.7)'
            : '0 4px 0 #000, inset 0 0 0 6px rgba(0,0,0,0.18)',
          transform: `rotate(${angle}deg) ${held ? 'translateY(2px)' : ''}`,
          transition: held ? 'none' : 'transform 80ms linear',
          cursor: 'grab',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 30%, #2a2a2a, #0e0e0e)',
          border: '1px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 9, color: '#888',
        }}>OK</div>
      </div>
    </div>
  );
}

// =================== CHASSIS ================================
function Chassis({ children, variant, onIntent, onBigShort, onBigLong }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #232323, #131313)',
        borderRadius: 26,
        padding: 22,
        position: 'relative',
        boxShadow: '0 6px 0 #000, 0 16px 40px rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      {/* LEFT — D-pad input */}
      <div style={{ alignSelf: 'center' }}>
        <DPadInput onIntent={onIntent} />
      </div>

      {/* CENTER — screen */}
      <div style={{ position: 'relative' }}>
        {/* speaker grille top */}
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: '#0a0a0a' }} />
          ))}
        </div>
        {children}
        {/* tiny status LED */}
        <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
          width: 5, height: 5, borderRadius: 5, background: '#7fd4a8', boxShadow: '0 0 6px rgba(127,212,168,0.6)' }} />
      </div>

      {/* RIGHT — big paw button */}
      <div style={{ alignSelf: 'center' }}>
        <BigPairButton onShort={onBigShort} onLong={onBigLong} />
      </div>
    </div>
  );
}

// =================== APP ====================================
function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULT_TWEAKS);
  const [state, setState] = useState({ page: 'home', cursor: 0, contactIdx: 0 });

  const fire = useCallback((intent) => {
    setState(s => reduce(s, intent));
  }, []);

  // big-button short = QR, long = pair
  const onBigShort = useCallback(() => fire('intent_qr'),   [fire]);
  const onBigLong  = useCallback(() => fire('intent_pair'), [fire]);

  // keyboard
  useEffect(() => {
    const kd = (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'ArrowUp':    e.preventDefault(); fire('intent_prev'); break;
        case 'ArrowDown':  e.preventDefault(); fire('intent_next'); break;
        case 'ArrowLeft':  e.preventDefault(); fire('intent_back'); break;
        case 'ArrowRight': e.preventDefault(); fire('intent_select'); break;
        case 'Enter':
        case 'Space':      e.preventDefault(); fire('intent_select'); break;
        case 'Backspace':
        case 'Escape':     e.preventDefault(); fire('intent_back'); break;
        case 'KeyQ':       fire('intent_qr'); break;
        case 'KeyP':       fire('intent_pair'); break;
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [fire]);

  const ghosting = useGhostRefresh([state.page, state.cursor, state.contactIdx]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Chassis
        onIntent={fire}
        onBigShort={onBigShort}
        onBigLong={onBigLong}
      >
        <div
          style={{
            width: 296 * 2,
            height: 128 * 2,
            borderRadius: 6,
            overflow: 'hidden',
            background: 'var(--paper)',
            position: 'relative',
            boxShadow: 'inset 0 0 0 1px #111, inset 0 0 30px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ position: 'absolute', width: 296, height: 128, transformOrigin: '0 0', transform: 'scale(2)', imageRendering: 'pixelated' }}>
            <PageRouter page={state.page} cursor={state.cursor} contactIdx={state.contactIdx} fire={fire} />
            {ghosting && <div style={{ position: 'absolute', inset: 0, background: 'rgba(196,196,196,0.55)', pointerEvents: 'none' }} />}
          </div>
        </div>
      </Chassis>

      <DevPanel state={state} fire={fire} onJump={(p) => setState({ page: p, cursor: 0, contactIdx: 0 })} />
    </div>
  );
}

// -------------------- ghost refresh hook -------------------
function useGhostRefresh(deps) {
  const [ghosting, setGhosting] = useState(false);
  useEffect(() => {
    setGhosting(true);
    const t = setTimeout(() => setGhosting(false), 220);
    return () => clearTimeout(t);
  }, deps);
  return ghosting;
}

// -------------------- DEV panel ----------------------------
const PAGES = ['home', 'friends_list', 'friend_profile', 'pairing', 'pairing_success', 'connect', 'low_battery'];
const PAGE_LABEL = { home: 'home', friends_list: 'friends', friend_profile: 'profile', pairing: 'pair', pairing_success: 'pair✓', connect: 'pc', low_battery: 'low bat' };

function DevPanel({ state, fire, onJump }) {
  const btn = (extra = {}) => ({
    display: 'inline-block', margin: '2px 4px 2px 0',
    padding: '3px 8px', background: '#2a2a2a', color: '#c4c4c4',
    border: '1px solid #3a3a3a', borderRadius: 4,
    fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
    ...extra,
  });
  return (
    <div style={{ width: 260, background: '#1a1a1a', color: '#c4c4c4', padding: 14, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 13, boxShadow: '0 6px 0 #000' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 10, color: '#f1b24a' }}>DEV</div>

      <div style={{ marginBottom: 10, opacity: 0.8 }}>
        page: <b style={{ color: '#fff' }}>{state.page}</b><br />
        cursor: <b style={{ color: '#fff' }}>{state.cursor}</b>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ opacity: 0.6, marginBottom: 4 }}>fire intent</div>
        <button onClick={() => fire('intent_prev')}   style={btn()}>prev</button>
        <button onClick={() => fire('intent_next')}   style={btn()}>next</button>
        <button onClick={() => fire('intent_select')} style={btn()}>select</button>
        <button onClick={() => fire('intent_back')}   style={btn()}>back</button>
        <button onClick={() => fire('intent_qr')}     style={btn()}>qr</button>
        <button onClick={() => fire('intent_pair')}   style={btn()}>pair</button>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ opacity: 0.6, marginBottom: 4 }}>jump to</div>
        {PAGES.map(p => (
          <button
            key={p}
            onClick={() => onJump(p)}
            style={btn({
              background: p === state.page ? '#f1b24a' : '#2a2a2a',
              color: p === state.page ? '#111' : '#c4c4c4',
            })}
          >{PAGE_LABEL[p]}</button>
        ))}
      </div>

      <div style={{ marginTop: 10, opacity: 0.55, fontSize: 12, lineHeight: 1.35 }}>
        keys: ↑↓ = prev/next · → / Enter / Space = select · ← / Esc = back · Q = QR · P = pair
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
