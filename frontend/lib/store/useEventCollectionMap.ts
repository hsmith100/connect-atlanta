import { useEffect, useState } from 'react'
import { getPublicCollections } from '../api/store'

// eventId → collectionId for events that have photos for sale. Empty if unavailable,
// so callers simply don't show "buy" links rather than an error.
export function useEventCollectionMap(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    getPublicCollections()
      .then((collections) => {
        if (!cancelled) setMap(Object.fromEntries(collections.map((c) => [c.eventId, c.id])))
      })
      .catch(() => { /* no buy links */ })
    return () => { cancelled = true }
  }, [])

  return map
}
