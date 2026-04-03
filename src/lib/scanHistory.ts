export interface ScanRecord {
  name: string | null
  mode: 'conference' | 'workshop'
  timestamp: string   // ISO date string
  success: boolean
}

const STORAGE_KEY = 'eventscanner_history'
const MAX_ENTRIES = 50

/**
 * Adds a new scan to the history, prepending it to localStorage.
 * Automatically timestamps the record and maintains a maximum of 50 entries.
 */
export function addScan(record: Omit<ScanRecord, 'timestamp'>): void {
  try {
    const scans = getScans()

    const newRecord: ScanRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    }

    // Prepend new record and limit to MAX_ENTRIES
    const updated = [newRecord, ...scans].slice(0, MAX_ENTRIES)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to add scan to history:', error)
  }
}

/**
 * Retrieves all stored scan records, ordered newest first.
 * Returns an empty array if nothing is stored or on parse error.
 */
export function getScans(): ScanRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to retrieve scan history:', error)
    return []
  }
}

/**
 * Clears all stored scan records from localStorage.
 */
export function clearScans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear scan history:', error)
  }
}
