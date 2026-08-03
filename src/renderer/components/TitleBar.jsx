import { memo } from 'react';

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    flexShrink: 0,
    background: '#0a0a0a',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    WebkitAppRegion: 'drag',
    userSelect: 'none',
    position: 'relative'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
    WebkitAppRegion: 'no-drag'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
    WebkitAppRegion: 'no-drag'
  },
  title: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    pointerEvents: 'none'
  },
  brand: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    background: 'linear-gradient(90deg, #F47521 0%, #ff9c5a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0px 2px 4px rgba(244, 117, 33, 0.2))'
  },
  brandSuffix: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.15em',
    color: '#666',
    textTransform: 'uppercase'
  },
  button: (round) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: round ? '50%' : 8,
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })
};

const neutralHover = {
  onMouseEnter: (e) => Object.assign(e.currentTarget.style, { background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }),
  onMouseLeave: (e) => Object.assign(e.currentTarget.style, { background: 'transparent', color: '#888' })
};

const dangerHover = {
  onMouseEnter: (e) =>
    Object.assign(e.currentTarget.style, {
      background: '#e81123',
      color: '#fff',
      boxShadow: '0 0 10px rgba(232, 17, 35, 0.4)'
    }),
  onMouseLeave: (e) =>
    Object.assign(e.currentTarget.style, { background: 'transparent', color: '#888', boxShadow: 'none' })
};

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  );
}

function MaximizeIcon({ isMaximized }) {
  if (isMaximized) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3.5" y="1.5" width="7" height="7" rx="1" />
        <rect x="1.5" y="3.5" width="7" height="7" rx="1" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="8" height="8" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
      <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
    </svg>
  );
}

function TitleBar({ windowState, onSettingsToggle }) {
  const isMaximized = windowState === 'maximized';

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <button onClick={onSettingsToggle} title="Settings" style={styles.button(true)} {...neutralHover}>
          <SettingsIcon />
        </button>
      </div>

      <div style={styles.title}>
        <span style={styles.brand}>Crunchyroll</span>
        <span style={styles.brandSuffix}>For Desktop</span>
      </div>

      <div style={styles.right}>
        <button
          onClick={() => window.electronAPI.window.minimize()}
          title="Minimize"
          style={styles.button(false)}
          {...neutralHover}
        >
          <MinimizeIcon />
        </button>

        <button
          onClick={() => window.electronAPI.window.maximize()}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={styles.button(false)}
          {...neutralHover}
        >
          <MaximizeIcon isMaximized={isMaximized} />
        </button>

        <button
          onClick={() => window.electronAPI.window.close()}
          title="Close"
          style={styles.button(false)}
          {...dangerHover}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export default memo(TitleBar);
