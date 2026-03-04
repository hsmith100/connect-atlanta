import { useState } from 'react'
import { type Submission, type DateFilter, filterByDate, fmt, downloadCsv, DATE_FILTER_OPTIONS } from './shared'

interface Props {
  signups: Submission[]
}

export function EmailSignupsSection({ signups }: Props) {
  // Includes newsletter signups (source: 'website') and contact form submissions (source: 'contact-form')
  const [filter, setFilter] = useState<DateFilter>('all')
  const filtered = filterByDate(signups, filter)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Contacts &amp; Signups ({filtered.length})</h2>
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
              'contacts-signups.csv',
              ['Name', 'Email', 'Phone', 'Source', 'Subject', 'Message', 'Submitted'],
              filtered,
              ['name', 'email', 'phone', 'source', 'subject', 'message', 'createdAt'],
            )}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No signups in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 pr-4 font-medium">Subject / Message</th>
                <th className="pb-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id as string} className="border-b border-gray-900 hover:bg-gray-900/50 align-top">
                  <td className="py-2 pr-4 font-medium">{s.name as string}</td>
                  <td className="py-2 pr-4 text-gray-300">{s.email as string}</td>
                  <td className="py-2 pr-4 text-gray-400">{(s.source as string) ?? '—'}</td>
                  <td className="py-2 pr-4 text-gray-400 max-w-xs">
                    {s.subject ? <p className="font-medium text-gray-300">{String(s.subject)}</p> : null}
                    {s.message ? <p className="text-xs truncate">{String(s.message)}</p> : null}
                  </td>
                  <td className="py-2 text-gray-400">{fmt(s.createdAt as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
