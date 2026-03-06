import React, { useState, useEffect } from 'react';

const styles = {
  overlay: (closing) => ({
    position: 'absolute',
    inset: 0,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    transition: 'opacity 200ms',
    opacity: closing ? 0 : 1
  }),
  panel: (closing) => ({
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
    width: 380,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: closing ? 'translateX(100%)' : 'translateX(0)',
    fontFamily: "'Inter', sans-serif"
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '32px 28px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  headerIcon: {
    width: 44,
    height: 44,
    marginRight: 16,
    flexShrink: 0
  },
  headerIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#888',
    transition: 'all 0.2s ease'
  },
  section: {
    padding: '28px 28px 8px'
  },
  sectionLabel: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: 16
  },
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '20px',
    marginBottom: 12,
    transition: 'all 0.2s ease'
  },
  toggleTrack: (on) => ({
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on ? '#F47521' : 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'background 200ms',
    flexShrink: 0,
    border: 'none',
    padding: 0
  }),
  toggleThumb: (on) => ({
    position: 'absolute',
    top: 2,
    left: on ? 22 : 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1)'
  }),
  linkBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 14,
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    color: '#aaa',
    fontSize: 14,
    fontWeight: 500
  },
  footer: {
    padding: '24px 28px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#F47521',
    marginRight: 8,
    display: 'inline-block',
    boxShadow: '0 0 8px rgba(244, 117, 33, 0.6)'
  },
  footerText: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: '#666',
    textTransform: 'uppercase'
  }
};

function GpuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function SettingsPanel({ open, onClose }) {
  const [hardwareAccel, setHardwareAccel] = useState(true);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(true);

  useEffect(() => {
    if (open) {
      setOpening(true);
      setVisible(true);
      setClosing(false);
      window.electronAPI.settings.getHardwareAccel().then(setHardwareAccel);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpening(false);
        });
      });
    }
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 200);
  }

  function handleToggle(enabled) {
    setHardwareAccel(enabled);
    window.electronAPI.settings.setHardwareAccel(enabled);
    window.electronAPI.app.restart();
  }

  if (!visible) return null;

  return (
    <>
      <div style={styles.overlay(closing || opening)} onClick={handleClose} />

      <div style={styles.panel(closing || opening)}>

        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <img src="../../assets/icon-128.png" alt="Crunchyroll" style={styles.headerIconImg} />
          </div>
          <div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>Settings</div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 600, color: '#F47521', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Crunchyroll For Desktop</div>
          </div>
          <button
            style={styles.closeBtn}
            onClick={handleClose}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>

          <div style={styles.section}>
            <div style={styles.sectionLabel}>Performance</div>

            <div
              style={styles.linkBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(244, 117, 33, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; }}
            >
              <div style={{ color: hardwareAccel ? '#F47521' : '#666', flexShrink: 0 }}>
                <GpuIcon />
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#fff' }}>Hardware Acceleration</span>
              <button style={styles.toggleTrack(hardwareAccel)} onClick={() => handleToggle(!hardwareAccel)}>
                <div style={styles.toggleThumb(hardwareAccel)} />
              </button>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionLabel}>Links</div>

            <button
              style={styles.linkBtn}
              onClick={() => window.electronAPI.shell.openExternal('https://github.com/zyhloh/unofficial-crunchyroll-for-desktop')}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#aaa'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span style={{ flex: 1 }}>GitHub Repository</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={styles.footerDot} />
            <span style={styles.footerText}>v3.0.0</span>
          </div>
          <span style={styles.footerText}>By Zyhloh</span>
        </div>

      </div>
    </>
  );
}
