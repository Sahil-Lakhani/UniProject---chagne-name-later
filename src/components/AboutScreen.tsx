export default function AboutScreen() {
  function openLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={styles.page}>
      {/* App icon + name */}
      <div style={styles.heroSection}>
        <div style={styles.appIconCircle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <h1 style={styles.appName}>EventScan</h1>
        <span style={styles.versionBadge}>v1.0.0</span>
      </div>

      {/* Creator card */}
      <div style={styles.card}>
        <p style={styles.madeByLabel}>Made by</p>
        <p style={styles.creatorName}>Sahil Lakhani</p>
        <p style={styles.creatorTitle}>Masters in Applied Computer Science</p>
      </div>

      {/* Social links */}
      <div style={styles.linksRow}>
        <button
          style={styles.linkCard}
          onClick={() => openLink('https://github.com/Sahil-Lakhani')}
          aria-label="Open GitHub profile"
        >
          <span style={styles.githubColor}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </span>
          <span style={styles.linkLabel}>GitHub</span>
        </button>

        <button
          style={styles.linkCard}
          onClick={() => openLink('https://www.linkedin.com/in/sahil-lakhani/')}
          aria-label="Open LinkedIn profile"
        >
          <span style={styles.linkedinColor}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </span>
          <span style={styles.linkLabel}>LinkedIn</span>
        </button>
      </div>

      <p style={styles.footerText}>Built for event management · 2025</p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#f0f4f8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px 40px',
    gap: 24,
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  appIconCircle: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.5px',
  },
  versionBadge: {
    fontSize: 12,
    fontWeight: 500,
    color: '#64748b',
    background: '#e2e8f0',
    padding: '3px 10px',
    borderRadius: 99,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 20,
    padding: '28px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  madeByLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
  },
  creatorTitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 1.5,
  },
  linksRow: {
    display: 'flex',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  linkCard: {
    flex: 1,
    background: '#fff',
    borderRadius: 16,
    padding: '20px 12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    transition: 'transform 0.1s, box-shadow 0.1s',
    cursor: 'pointer',
  },
  githubColor: {
    color: '#1e293b',
  },
  linkedinColor: {
    color: '#0077b5',
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
  },
  footerText: {
    marginTop: 'auto',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
}
