import type { NextPageContext } from 'next'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import SEO from '../components/shared/SEO'

interface ErrorProps {
  statusCode?: number
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <>
      <SEO
        title={`${statusCode ?? 'Error'} | Beats on the Block`}
        description="Something went wrong."
      />
      <Header />
      <main className="pt-28 md:pt-[3.5rem] min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-horizon text-8xl font-black text-brand-primary mb-4">
            {statusCode ?? 'Error'}
          </p>
          <p className="text-2xl text-brand-header mb-8">
            {statusCode === 404 ? 'Page not found.' : 'Something went wrong.'}
          </p>
          <Link href="/" className="btn-festival btn-lg">
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
