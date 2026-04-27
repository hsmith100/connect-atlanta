import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import SEO from '../components/shared/SEO'

export default function NotFound() {
  return (
    <>
      <SEO
        title="404 | Beats on the Block"
        description="Page not found."
      />
      <Header />
      <main className="pt-28 md:pt-[3.5rem] min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-horizon text-8xl font-black text-brand-primary mb-4">404</p>
          <p className="text-2xl text-brand-header mb-8">Page not found.</p>
          <Link href="/" className="btn-festival btn-lg">
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
