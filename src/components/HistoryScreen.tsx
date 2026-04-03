import { useState } from 'react'
import { getScans, clearScans, type ScanRecord } from '../lib/scanHistory'

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr}h ago`

  const thenDate = new Date(iso)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const hhmm = thenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (thenDate >= yesterdayStart && thenDate < todayStart) {
    return `Yesterday at ${hhmm}`
  }

  const day = thenDate.getDate()
  const month = thenDate.toLocaleString('default', { month: 'short' })
  return `${day} ${month} at ${hhmm}`
}

function dateGroupLabel(iso: string): string {
  const date = new Date(iso)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  if (date >= todayStart) return 'Today'
  if (date >= yesterdayStart) return 'Yesterday'

  const day = date.getDate()
  const month = date.toLocaleString('default', { month: 'short' })
  const year = date.getFullYear()
  const thisYear = new Date().getFullYear()
  return year === thisYear ? `${day} ${month}` : `${day} ${month} ${year}`
}

function groupByDate(scans: ScanRecord[]): { label: string; items: ScanRecord[] }[] {
  const groups: Map<string, ScanRecord[]> = new Map()
  for (const scan of scans) {
    const label = dateGroupLabel(scan.timestamp)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(scan)
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

function ScanIcon({ mode, success }: { mode: 'conference' | 'workshop'; success: boolean }) {
  const bg = !success ? '#fee2e2' : mode === 'conference' ? '#dbeafe' : '#ede9fe'
  const color = !success ? '#ef4444' : mode === 'conference' ? '#2563eb' : '#7c3aed'

  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {success ? (
        mode === 'conference' ? (
          // Users icon
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) : (
          // Briefcase icon
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )
      ) : (
        // X icon for failed
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" width="18" height="18">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </div>
  )
}

export default function HistoryScreen() {
  const [refreshKey, setRefreshKey] = useState(0)
  const scans = getScans()
  const groups = groupByDate(scans)

  function handleClear() {
    clearScans()
    setRefreshKey(k => k + 1)
  }

  // refreshKey used to trigger re-render
  void refreshKey

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Scan History</h1>
        {scans.length > 0 && (
          <span style={styles.countBadge}>{scans.length}</span>
        )}
      </div>

      {scans.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>No scans yet</p>
          <p style={styles.emptySubtitle}>Scans will appear here after check-ins</p>
        </div>
      ) : (
        <div style={styles.list} className="no-scrollbar">
          {groups.map((group) => (
            <div key={group.label}>
              <div style={styles.groupHeader}>{group.label}</div>
              <div style={styles.groupCard}>
                {group.items.map((scan, i) => (
                  <div key={`${scan.timestamp}-${i}`}>
                    <div style={styles.scanRow}>
                      <ScanIcon mode={scan.mode} success={scan.success} />
                      <div style={styles.scanInfo}>
                        <span style={styles.scanName}>{scan.name ?? 'Unknown Attendee'}</span>
                        <span style={{
                          ...styles.modeBadge,
                          background: scan.mode === 'conference' ? '#dbeafe' : '#ede9fe',
                          color: scan.mode === 'conference' ? '#1d4ed8' : '#6d28d9',
                        }}>
                          {scan.mode === 'conference' ? 'Conference' : 'Workshop'}
                        </span>
                      </div>
                      <span style={styles.scanTime}>{relativeTime(scan.timestamp)}</span>
                    </div>
                    {i < group.items.length - 1 && <div style={styles.divider} />}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button style={styles.clearBtn} onClick={handleClear}>
            Clear History
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#f0f4f8',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 20px 12px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1e293b',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: 600,
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: 99,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px 100px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '8px 4px 6px',
  },
  groupCard: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  scanRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
  },
  scanInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  scanName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modeBadge: {
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    padding: '2px 8px',
    alignSelf: 'flex-start',
  },
  scanTime: {
    fontSize: 12,
    color: '#94a3b8',
    flexShrink: 0,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    background: '#f1f5f9',
    marginLeft: 68,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '0 32px 80px',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    background: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  clearBtn: {
    marginTop: 8,
    alignSelf: 'center',
    padding: '12px 32px',
    background: 'transparent',
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 600,
    border: '1.5px solid #fecaca',
    borderRadius: 12,
  },
}
