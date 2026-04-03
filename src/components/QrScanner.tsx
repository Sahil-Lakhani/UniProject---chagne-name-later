import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'

interface Props {
  onScan: (result: string) => void
  onClose: () => void
}

/**
 * QrScanner
 *
 * Full-screen camera overlay using @yudiel/react-qr-scanner.
 * The Scanner component manages the camera lifecycle entirely inside React —
 * no manual DOM injection, no useEffect camera wrangling.
 *
 * NOTE: Camera requires HTTPS on mobile (or localhost on desktop).
 */
export default function QrScanner({ onScan, onClose }: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)

  function handleScan(results: { rawValue: string }[]) {
    if (scanned || results.length === 0) return
    setScanned(true)
    onScan(results[0].rawValue)
  }

  function handleError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Scanner error:', msg)
    setErrorMsg(
      msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')
        ? 'Camera access denied. Allow camera permission and try again.'
        : `Camera error: ${msg}`
    )
  }

  return (
    <div style={styles.overlay}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close scanner">
          ✕
        </button>
        <span style={styles.headerText}>
          {errorMsg ? 'Camera error' : 'Align QR code in the frame'}
        </span>
      </div>

      {/* Error state */}
      {errorMsg ? (
        <div style={styles.centred}>
          <span style={{ fontSize: 48 }}>📷</span>
          <p style={styles.errorText}>{errorMsg}</p>
          <button style={styles.backBtn} onClick={onClose}>Go Back</button>
        </div>
      ) : (
        <>
          <div style={styles.scannerWrap}>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              scanDelay={300}
              components={{ audio: false, torch: false }}
              styles={{ container: { width: '100%', height: '100%' } }}
            />
          </div>
          <p style={styles.hint}>Hold steady — scanner activates automatically</p>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#111',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 100,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    background: 'rgba(0,0,0,0.7)',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: 18,
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
  },
  scannerWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    margin: '16px 0 24px',
    textAlign: 'center',
    padding: '0 24px',
  },
  centred: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '0 32px',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 300,
  },
  backBtn: {
    marginTop: 8,
    padding: '12px 28px',
    background: '#2563eb',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
  },
}
