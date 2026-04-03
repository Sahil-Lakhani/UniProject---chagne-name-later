interface ScanResult {
  success: boolean
  alreadyScanned?: boolean
  scannedAt?: string | null
  name?: string | null
  workshopInterest?: string | null
  warning?: boolean
  error?: string
}

interface Props {
  result: ScanResult
  mode: 'conference' | 'workshop'
  onDismiss: () => void
}

/**
 * ResultCard
 *
 * Full-screen feedback card shown after a scan attempt.
 * Green = success, red = already scanned / error, amber warning if
 * workshop attendee had workshopInterest = "No".
 */
export default function ResultCard({ result, mode, onDismiss }: Props) {
  const modeLabel = mode === 'conference' ? 'Conference' : 'Workshop'

  let title: string
  let subtitle: string
  let accent: string

  if (result.error) {
    title = 'Invalid QR Code'
    subtitle = result.error
    accent = 'var(--red-500)'
  } else if (result.alreadyScanned) {
    title = 'Already Scanned'
    subtitle = `This attendee was already checked in${result.scannedAt ? ` at ${formatTime(result.scannedAt)}` : ''}.`
    accent = 'var(--red-500)'
  } else {
    title = `${modeLabel} ✓`
    subtitle = result.name ? `Welcome, ${result.name}!` : 'Check-in successful.'
    accent = 'var(--green-500)'
  }

  return (
    <div style={{ ...styles.overlay, borderTop: `6px solid ${accent}` }}>
      <div style={styles.iconRing}>
        <span style={{ fontSize: 36 }}>
          {result.error ? '✗' : result.alreadyScanned ? '⚠' : '✓'}
        </span>
      </div>

      <h2 style={{ ...styles.title, color: accent }}>{title}</h2>
      <p style={styles.subtitle}>{subtitle}</p>

      {result.warning && (
        <div style={styles.warningBadge}>
          ⚠ Attendee selected "No" for workshop interest
        </div>
      )}

      {result.workshopInterest && !result.alreadyScanned && !result.error && mode === 'workshop' && (
        <div style={styles.infoBadge}>
          Workshop interest: <strong>{result.workshopInterest}</strong>
        </div>
      )}

      <button style={styles.btn} onClick={onDismiss}>
        Scan Next
      </button>
    </div>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    zIndex: 200,
    gap: 16,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'var(--blue-50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--gray-600)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  warningBadge: {
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },
  infoBadge: {
    background: 'var(--blue-50)',
    color: 'var(--blue-800)',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    textAlign: 'center',
  },
  btn: {
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
    padding: '16px 0',
    background: 'var(--blue-600)',
    color: '#fff',
    fontSize: 17,
    fontWeight: 600,
    borderRadius: 14,
  },
}
