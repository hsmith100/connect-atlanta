import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CartItem {
  photoId: string
  collectionId: string
  thumbnailUrl: string
}

interface StoreCart {
  items: CartItem[]
  count: number
  has: (photoId: string) => boolean
  add: (item: CartItem) => void
  remove: (photoId: string) => void
  removeMany: (photoIds: string[]) => void
  clear: () => void
}

const STORAGE_KEY = 'bob_photo_cart'

const CartContext = createContext<StoreCart | null>(null)

// Storage can be unavailable (private mode, blocked site data). The cart then simply
// isn't remembered across reloads; it still works for the visit.
function readStored(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((i): i is CartItem => !!i && typeof i.photoId === 'string' && typeof i.collectionId === 'string')
      : []
  } catch {
    return []
  }
}

function writeStored(items: CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore — see readStored
  }
}

// Prices are never stored here; the cart page always asks the server for current prices.
export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load after mount: the static export renders without window, so reading storage
  // during the first render would mismatch the server HTML.
  useEffect(() => {
    const stored = readStored()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage after hydration
    setItems(stored)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) writeStored(items)
  }, [items, loaded])

  const add = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.photoId === item.photoId) ? prev : [...prev, item]))
  }, [])
  const remove = useCallback((photoId: string) => {
    setItems((prev) => prev.filter((i) => i.photoId !== photoId))
  }, [])
  const removeMany = useCallback((photoIds: string[]) => {
    const ids = new Set(photoIds)
    setItems((prev) => prev.filter((i) => !ids.has(i.photoId)))
  }, [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<StoreCart>(() => ({
    items,
    count: items.length,
    has: (photoId) => items.some((i) => i.photoId === photoId),
    add,
    remove,
    removeMany,
    clear,
  }), [items, add, remove, removeMany, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useStoreCart(): StoreCart {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useStoreCart must be used inside StoreCartProvider')
  return ctx
}

// For always-rendered UI like the header: 0 when there's no provider (e.g. isolated tests).
export function useCartCount(): number {
  return useContext(CartContext)?.count ?? 0
}
