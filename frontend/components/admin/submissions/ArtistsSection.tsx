import { useState } from 'react'
import { type Submission, type DateFilter, filterByDate, fmt, downloadCsv, DATE_FILTER_OPTIONS } from './shared'

interface Props {
  artists: Submission[]
}

export function ArtistsSection({ artists }: Props) {
  const [filter, setFilter] = useState<DateFilter>('all')
  const filtered = filterByDate(artists, filter)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">DJ Applications ({filtered.length})</h2>
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
              'dj-applications.csv',
              ['DJ Name', 'Email', 'City', 'Main Genre', 'Submitted'],
              filtered,
              ['djName', 'email', 'city', 'mainGenre', 'createdAt'],
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="pb-2 pr-4 font-medium">DJ Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">City</th>
                <th className="pb-2 pr-4 font-medium">Genre</th>
                <th className="pb-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id as string} className="border-b border-gray-900 hover:bg-gray-900/50">
                  <td className="py-2 pr-4 font-medium">{a.djName as string}</td>
                  <td className="py-2 pr-4 text-gray-300">{a.email as string}</td>
                  <td className="py-2 pr-4 text-gray-300">{a.city as string}</td>
                  <td className="py-2 pr-4 text-gray-300">{a.mainGenre as string}</td>
                  <td className="py-2 text-gray-400">{fmt(a.createdAt as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
