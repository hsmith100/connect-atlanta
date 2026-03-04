import { useState, useCallback } from 'react'
import { updateSponsorNotes } from '../../../lib/api/adminSubmissions'
import { type Submission, type DateFilter, filterByDate, fmt, downloadCsv, DATE_FILTER_OPTIONS } from './shared'

interface Props {
  sponsors: Submission[]
  adminKey: string
}

export function SponsorsSection({ sponsors, adminKey }: Props) {
  const [filter, setFilter] = useState<DateFilter>('all')
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(sponsors.map((s) => [s.id as string, (s.notes as string) ?? '']))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const filtered = filterByDate(sponsors, filter)

  const handleBlur = useCallback(async (id: string) => {
    setSaving((prev) => ({ ...prev, [id]: true }))
    try {
      await updateSponsorNotes(adminKey, id, notes[id] ?? '')
    } catch (e) {
      console.error('Failed to save notes:', e)
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }))
    }
  }, [adminKey, notes])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Sponsor Inquiries ({filtered.length})</h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as DateFilter)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            {DATE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => downloadCsv(
              'sponsor-inquiries.csv',
              ['Name', 'Company', 'Email', 'Phone', 'Industry', 'Notes', 'Submitted'],
              filtered,
              ['name', 'company', 'email', 'phone', 'productIndustry', 'notes', 'createdAt'],
            )}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No submissions in this period.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const id = s.id as string
            return (
              <div key={id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="mb-3">
                  <p className="font-semibold">{s.name as string} — <span className="text-gray-300">{s.company as string}</span></p>
                  <p className="text-sm text-gray-400">{s.email as string} · {s.phone as string}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{fmt(s.createdAt as string)}</p>
                </div>
                <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">{s.productIndustry as string}</p>
                <div className="relative">
                  <textarea
                    value={notes[id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [id]: e.target.value }))}
                    onBlur={() => void handleBlur(id)}
                    placeholder="Notes (autosaved on blur)..."
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
                  />
                  {saving[id] && (
                    <span className="absolute bottom-2 right-2 text-xs text-gray-500">Saving…</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
