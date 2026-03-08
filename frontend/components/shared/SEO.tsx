import Head from 'next/head'

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object | null;
}

export default function SEO({
  title = 'Connect Events - Beats on the Beltline | Atlanta EDM Festival',
  description = 'Atlanta\'s premier FREE outdoor electronic music experience. Join us for Beats on the Beltline featuring top DJs, amazing vibes, and unforgettable daytime parties on the Atlanta BeltLine.',
  keywords = 'atlanta events, beats on the beltline, edm atlanta, electronic music festival, atlanta beltline, free concerts atlanta, outdoor music atlanta, atlanta edm, house music atlanta, techno atlanta',
  ogImage = '/images/ConnectLogoBIG-Black.svg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noindex = false,
  structuredData = null,
}: SEOProps) {
  // Get the current URL if canonical is not provided
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://connectevents.co'
  const canonical = canonicalUrl || siteUrl

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Connect Events" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="content-language" content="en" />
      <meta name="author" content="Connect Events, Inc." />

      {/* Geographic Meta Tags */}
      <meta name="geo.region" content="US-GA" />
      <meta name="geo.placename" content="Atlanta" />
      <meta name="geo.position" content="33.7490;-84.3880" />
      <meta name="ICBM" content="33.7490, -84.3880" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}
