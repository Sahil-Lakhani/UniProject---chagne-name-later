import { useState } from 'react'
import QrScanner from './components/QrScanner'
import ResultCard from './components/ResultCard'
import HistoryScreen from './components/HistoryScreen'
import AboutScreen from './components/AboutScreen'
import { markAsScanned } from './lib/sheets'
import { addScan, getScans, type ScanRecord } from './lib/scanHistory'

type Mode = 'conference' | 'workshop'
type Tab = 'scan' | 'history' | 'about'

type AppState =
  | { screen: 'home' }
  | { screen: 'scanning'; mode: Mode }
  | { screen: 'processing'; mode: Mode }
  | { screen: 'result'; mode: Mode; result: ScanResult }

interface ScanResult {
  success: boolean
  alreadyScanned?: boolean
  scannedAt?: string | null
  name?: string | null
  workshopInterest?: string | null
  warning?: boolean
  error?: string
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function CameraIcon({ color = 'currentColor', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ClockIcon({ color = 'currentColor', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function InfoIcon({ color = 'currentColor', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function UsersIcon({ color = 'currentColor', size = 32 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BriefcaseIcon({ color = 'currentColor', size = 32 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function GearIcon({ color = 'currentColor', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ── Recent scan relative time ─────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return 'Yesterday'
}

// ── Main App ──────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<AppState>({ screen: 'home' })
  const [activeTab, setActiveTab] = useState<Tab>('scan')

  function openScanner(mode: Mode) {
    setState({ screen: 'scanning', mode })
  }

  async function handleScan(rawToken: string, mode: Mode) {
    setState({ screen: 'processing', mode })
    try {
      const res = await markAsScanned(rawToken, mode)
      addScan({ name: res.name ?? null, mode, success: res.success })
      setState({ screen: 'result', mode, result: res })
    } catch (err) {
      addScan({ name: null, mode, success: false })
      setState({
        screen: 'result',
        mode,
        result: { success: false, error: err instanceof Error ? err.message : 'Failed to update sheet.' },
      })
    }
  }

  function goHome() {
    setState({ screen: 'home' })
  }

  // Full-screen overlays — no bottom nav
  if (state.screen === 'scanning') {
    return <QrScanner onScan={(raw) => handleScan(raw, state.mode)} onClose={goHome} />
  }

  if (state.screen === 'processing') {
    return (
      <div style={styles.processingScreen}>
        <div style={styles.spinner} />
        <p style={styles.processingText}>Checking in for {state.mode}…</p>
      </div>
    )
  }

  if (state.screen === 'result') {
    return (
      <ResultCard
        result={state.result}
        mode={state.mode}
        onDismiss={() => openScanner(state.mode)}
      />
    )
  }

  // Main app shell with bottom nav
  return (
    <div style={styles.shell}>
      {/* Page content */}
      <div style={styles.pageContent}>
        {activeTab === 'scan' && <ScanHome onOpenScanner={openScanner} />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'about' && <AboutScreen />}
      </div>

      {/* Bottom navigation */}
      <nav style={styles.bottomNav} aria-label="Main navigation">
        <NavButton
          label="Scan"
          active={activeTab === 'scan'}
          onClick={() => setActiveTab('scan')}
          icon={<CameraIcon color={activeTab === 'scan' ? '#2563eb' : '#94a3b8'} />}
        />
        <NavButton
          label="History"
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={<ClockIcon color={activeTab === 'history' ? '#2563eb' : '#94a3b8'} />}
        />
        <NavButton
          label="About"
          active={activeTab === 'about'}
          onClick={() => setActiveTab('about')}
          icon={<InfoIcon color={activeTab === 'about' ? '#2563eb' : '#94a3b8'} />}
        />
      </nav>
    </div>
  )
}

// ── Nav Button ────────────────────────────────────────────────────────────

function NavButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      className="nav-btn"
      style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span style={{ ...styles.navLabel, color: active ? '#2563eb' : '#94a3b8' }}>{label}</span>
    </button>
  )
}

// ── Scan Home Screen ──────────────────────────────────────────────────────

function ScanHome({ onOpenScanner }: { onOpenScanner: (mode: Mode) => void }) {
  const recentScans = getScans().slice(0, 5)

  return (
    <div style={styles.scanPage}>
      {/* Header */}
      <div style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconCircle}>
            <CameraIcon color="#fff" size={18} />
          </div>
          <span style={styles.headerTitle}>EventScan</span>
        </div>
        <button style={styles.gearBtn} aria-label="Settings">
          <GearIcon color="#94a3b8" size={20} />
        </button>
      </div>

      {/* Scan mode cards */}
      <div style={styles.cardsSection}>
        <p style={styles.sectionLabel}>Select scan type</p>
        <div style={styles.cardsGrid}>
          <ScanCard
            mode="conference"
            label="Conference"
            icon={<UsersIcon color="#2563eb" size={36} />}
            onClick={() => onOpenScanner('conference')}
          />
          <ScanCard
            mode="workshop"
            label="Workshop"
            icon={<BriefcaseIcon color="#4f46e5" size={36} />}
            onClick={() => onOpenScanner('workshop')}
          />
        </div>
      </div>

      {/* Recent scans */}
      <div style={styles.recentSection}>
        <div style={styles.recentHeader}>
          <div style={styles.recentTitleRow}>
            <ClockIcon color="#94a3b8" size={16} />
            <span style={styles.recentTitle}>Recent Scans</span>
          </div>
          {recentScans.length > 0 && (
            <span style={styles.recentCount}>{recentScans.length} SCANS</span>
          )}
        </div>

        <div style={styles.recentCard}>
          {recentScans.length === 0 ? (
            <p style={styles.noScansText}>No scans yet today</p>
          ) : (
            recentScans.map((scan: ScanRecord, i: number) => (
              <div key={`${scan.timestamp}-${i}`}>
                <div style={styles.recentRow}>
                  <div style={{
                    ...styles.recentDot,
                    background: !scan.success ? '#fee2e2' : scan.mode === 'conference' ? '#dbeafe' : '#ede9fe',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: !scan.success ? '#ef4444' : scan.mode === 'conference' ? '#2563eb' : '#7c3aed',
                    }} />
                  </div>
                  <div style={styles.recentInfo}>
                    <span style={styles.recentName}>{scan.name ?? 'Unknown Attendee'}</span>
                    <span style={styles.recentMode}>{scan.mode === 'conference' ? 'Conference' : 'Workshop'}</span>
                  </div>
                  <span style={styles.recentTime}>{relativeTime(scan.timestamp)}</span>
                </div>
                {i < recentScans.length - 1 && <div style={styles.recentDivider} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Scan Card ─────────────────────────────────────────────────────────────

function ScanCard({ mode, label, icon, onClick }: { mode: Mode; label: string; icon: React.ReactNode; onClick: () => void }) {
  const isConference = mode === 'conference'
  return (
    <button
      className="scan-card"
      style={{
        ...styles.scanCard,
        background: isConference ? '#eff6ff' : '#eef2ff',
        border: `2px solid ${isConference ? '#bfdbfe' : '#c7d2fe'}`,
      }}
      onClick={onClick}
      aria-label={`Open ${label} scanner`}
    >
      <div style={{
        ...styles.scanCardIconCircle,
        background: isConference ? '#dbeafe' : '#e0e7ff',
      }}>
        {icon}
      </div>
      <span style={{ ...styles.scanCardLabel, color: isConference ? '#1d4ed8' : '#4338ca' }}>
        {label}
      </span>
      <span style={{ ...styles.scanCardHint, color: isConference ? '#60a5fa' : '#818cf8' }}>
        Tap to scan
      </span>
    </button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f4f8',
  },
  pageContent: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 72,
  },
  // ── Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    background: '#fff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'stretch',
    zIndex: 50,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    background: 'transparent',
    padding: '6px 0',
    borderRadius: 0,
    transition: 'opacity 0.1s',
    minHeight: 44,
  },
  navBtnActive: {},
  navLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  // ── Processing
  processingScreen: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    gap: 20,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #dbeafe',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  processingText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  // ── Scan home
  scanPage: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    paddingBottom: 24,
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.3px',
  },
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Cards section
  cardsSection: {
    padding: '24px 20px 16px',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 12,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  scanCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    padding: '28px 16px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    minHeight: 160,
  },
  scanCardIconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCardLabel: {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.2px',
  },
  scanCardHint: {
    fontSize: 12,
    fontWeight: 500,
  },
  // ── Recent scans
  recentSection: {
    padding: '0 20px',
  },
  recentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#475569',
  },
  recentCount: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  recentCard: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  noScansText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    padding: '28px 0',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
  },
  recentDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  recentName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentMode: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recentTime: {
    fontSize: 12,
    color: '#94a3b8',
    flexShrink: 0,
  },
  recentDivider: {
    height: 1,
    background: '#f1f5f9',
    marginLeft: 60,
  },
}
