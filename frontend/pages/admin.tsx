import { useState, useEffect } from 'react'
import { getAdminPhotos, getAdminEvents } from '../lib/api'
import { AuthGate } from '../components/admin/AuthGate'
import { PhotosTab } from '../components/admin/PhotosTab'
import { EventsTab } from '../components/admin/EventsTab'
import type { Photo } from '@shared/types/photos'
import type { Event } from '@shared/types/events'

const STORAGE_KEY = 'connect_admin_key'

type Tab = 'photos' | 'events'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('photos')

  // Check for stored key on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      getAdminPhotos(stored)
        .then(() => setAdminKey(stored))
        .catch(() => localStorage.removeItem(STORAGE_KEY))
    }
  }, [])

  // Load photos + events when authenticated
  useEffect(() => {
    if (!adminKey) return
    Promise.all([
      getAdminPhotos(adminKey).then((r) => setPhotos(r.photos)),
      getAdminEvents(adminKey).then(setEvents),
    ]).catch(console.error)
  }, [adminKey])

  if (!adminKey) {
    return <AuthGate onAuth={(key) => { localStorage.setItem(STORAGE_KEY, key); setAdminKey(key) }} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setAdminKey(null) }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 flex gap-1">
        {(['photos', 'events'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'photos' && (
        <PhotosTab adminKey={adminKey} photos={photos} events={events} setPhotos={setPhotos} />
      )}
      {activeTab === 'events' && (
        <EventsTab adminKey={adminKey} events={events} setEvents={setEvents} />
      )}
    </div>
  )
}
