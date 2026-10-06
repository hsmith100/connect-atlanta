import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import type { Photographer } from '@shared/types/store'
import { createPhotographer, updatePhotographer } from '../../../lib/api/adminStore'

interface Props {
  adminKey: string
  photographers: Photographer[]
  setPhotographers: React.Dispatch<React.SetStateAction<Photographer[]>>
}

const inputClass = 'bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 w-full'

function parsePct(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null
}

export function PhotographersSection({ adminKey, photographers, setPhotographers }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pct, setPct] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPct, setEditPct] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const commissionPct = parsePct(pct)
    if (!name.trim() || !email.trim() || commissionPct === null) {
      setError('Enter a name, email and a commission between 0 and 100.')
      return
    }
    setAdding(true)
    setError('')
    try {
      const created = await createPhotographer(adminKey, { name: name.trim(), email: email.trim(), commissionPct })
      setPhotographers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setEmail('')
      setPct('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add photographer.')
    } finally {
      setAdding(false)
    }
  }

  async function save(id: string, patch: { commissionPct?: number; active?: boolean }) {
    setBusyId(id)
    setError('')
    try {
      const updated = await updatePhotographer(adminKey, id, patch)
      setPhotographers((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update photographer.')
    } finally {
      setBusyId(null)
    }
  }

  function handleSavePct(id: string) {
    const commissionPct = parsePct(editPct)
    if (commissionPct === null) {
      setError('Commission must be between 0 and 100.')
      return
    }
    void save(id, { commissionPct })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto] items-end">
        <label className="text-xs text-gray-400 space-y-1">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Commission %</span>
          <input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add photographer
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {photographers.length === 0 ? (
        <p className="text-sm text-gray-400">No photographers yet. Add one before uploading photos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Commission</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {photographers.map((p) => (
                <tr key={p.id} className="border-b border-gray-900">
                  <td className="py-2 pr-4 text-white">{p.name}</td>
                  <td className="py-2 pr-4 text-gray-300">{p.email}</td>
                  <td className="py-2 pr-4">
                    {editingId === p.id ? (
                      <span className="flex items-center gap-2">
                        <input
                          aria-label={`Commission for ${p.name}`}
                          inputMode="decimal"
                          value={editPct}
                          onChange={(e) => setEditPct(e.target.value)}
                          className="bg-gray-800 text-white rounded px-2 py-1 w-20 border border-gray-700"
                        />
                        <button type="button" onClick={() => handleSavePct(p.id)} disabled={busyId === p.id} className="text-brand-pink text-xs font-semibold">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 text-xs">Cancel</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingId(p.id); setEditPct(String(p.commissionPct)) }}
                        className="text-gray-200 hover:text-white underline decoration-dotted"
                        title="Edit commission (applies to future sales only)"
                      >
                        {p.commissionPct}%
                      </button>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void save(p.id, { active: !p.active })}
                      disabled={busyId === p.id}
                      className="text-xs text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      {busyId === p.id ? 'Saving…' : p.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
