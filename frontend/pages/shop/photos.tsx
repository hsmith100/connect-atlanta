import { useRouter } from 'next/router'
import SEO from '../../components/shared/SEO'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import EventPhotosPage from '../../components/store/EventPhotosPage'

export default function ShopPhotos() {
  const router = useRouter()
  const event = typeof router.query.event === 'string' ? router.query.event : null

  return (
    <>
      <SEO
        title="Event Photos | Beats on the Block"
        description="Browse and buy full-resolution photos from Beats on the Block events."
        canonicalUrl="https://beatsontheblockfest.com/shop#photos"
      />
      <Header />
      <main className="pt-28 md:pt-[3.5rem] min-h-screen">
        {router.isReady && <EventPhotosPage key={event ?? 'none'} collectionId={event} />}
      </main>
      <Footer />
    </>
  )
}
