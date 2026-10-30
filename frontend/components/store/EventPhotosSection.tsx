import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { PublicCollection } from '@shared/types/store'
import { getPublicCollections } from '../../lib/api/store'
import CollectionCard from './CollectionCard'

export default function EventPhotosSection() {
  const [collections, setCollections] = useState<PublicCollection[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getPublicCollections()
      .then(setCollections)
      .catch(() => setError(true))
  }, [])

  return (
    <section id="photos" className="py-12 md:py-16 bg-brand-bg scroll-mt-24">
      <div className="section-container">
        <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-3 text-brand-header uppercase">Event Photos</h2>
        <p className="text-center text-brand-text/80 mb-10">Download full-resolution photos. Checkout right here.</p>

        {error ? (
          <p role="alert" className="text-center text-brand-text">We couldn&apos;t load event photos right now. Please try again later.</p>
        ) : !collections ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-pink" size={40} aria-label="Loading event photos" /></div>
        ) : collections.length === 0 ? (
          <p className="text-center text-brand-text">No event photos are on sale right now.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
          </div>
        )}

        <p className="text-center text-sm mt-10">
          <Link href="/shop/download" className="text-brand-pink hover:underline">Lost your download link?</Link>
        </p>
      </div>
    </section>
  )
}
