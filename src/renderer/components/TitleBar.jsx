import React from 'react';

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

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

export default function TitleBar({ windowState, onSettingsToggle }) {
  const isMaximized = windowState === 'maximized';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={onSettingsToggle}
          title="Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
        >
          <SettingsIcon />
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none'
        }}
      >
        <span
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #F47521 0%, #ff9c5a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0px 2px 4px rgba(244, 117, 33, 0.2))'
          }}
        >
          Crunchyroll
        </span>
        <span
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.15em',
            color: '#666',
            textTransform: 'uppercase',
          }}
        >
          For Desktop
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.electronAPI.window.minimize()}
          title="Minimize"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
        >
          <MinimizeIcon />
        </button>

        <button
          onClick={() => window.electronAPI.window.maximize()}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
        >
          <MaximizeIcon isMaximized={isMaximized} />
        </button>

        <button
          onClick={() => window.electronAPI.window.close()}
          title="Close"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e81123'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 10px rgba(232, 17, 35, 0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
