import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

// Merch moved into the Shop. Client-side redirect because the beatsontheblockfest.com
// CloudFront distribution isn't managed by CDK, so a CloudFront redirect wouldn't reach it.
export default function MerchRedirect() {
  const router = useRouter()

  useEffect(() => {
    void router.replace('/shop')
  }, [router])

  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content="0; url=/shop" />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://beatsontheblockfest.com/shop" />
      </Head>
      <main className="min-h-screen flex items-center justify-center p-8 text-center">
        <p>Merch has moved to the <Link href="/shop" className="text-brand-pink underline">Shop</Link>.</p>
      </main>
    </>
  )
}
