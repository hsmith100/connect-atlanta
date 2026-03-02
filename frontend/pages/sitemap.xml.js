// This creates a dynamic sitemap at /sitemap.xml
// Automatically updates based on your pages

function generateSiteMap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const currentDate = new Date().toISOString()

    // Add your static pages here
    const staticPages = [
        {
            url: '',
            lastmod: currentDate,
            changefreq: 'weekly',
            priority: '1.0',
        },
        {
            url: '/about',
            lastmod: currentDate,
            changefreq: 'monthly',
            priority: '0.9',
        },
        {
            url: '/events',
            lastmod: currentDate,
            changefreq: 'weekly',
            priority: '0.9',
        },
        {
            url: '/gallery',
            lastmod: currentDate,
            changefreq: 'weekly',
            priority: '0.8',
        },
        {
            url: '/join',
            lastmod: currentDate,
            changefreq: 'monthly',
            priority: '0.8',
        },
        {
            url: '/merch',
            lastmod: currentDate,
            changefreq: 'monthly',
            priority: '0.7',
        },
        {
            url: '/contact',
            lastmod: currentDate,
            changefreq: 'monthly',
            priority: '0.7',
        },
        {
            url: '/privacy-policy',
            lastmod: '2026-01-22',
            changefreq: 'yearly',
            priority: '0.3',
        },
        {
            url: '/cookie-policy',
            lastmod: '2026-01-22',
            changefreq: 'yearly',
            priority: '0.3',
        },
        {
            url: '/terms-conditions',
            lastmod: '2026-01-22',
            changefreq: 'yearly',
            priority: '0.3',
        },
    ]

    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
            .map((page) => {
                return `
        <url>
          <loc>${baseUrl}${page.url}</loc>
          <lastmod>${page.lastmod}</lastmod>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>
      `
            })
            .join('')}
    </urlset>
  `
}

export async function getServerSideProps({ res }) {
    const sitemap = generateSiteMap()

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
    res.write(sitemap)
    res.end()

    return {
        props: {},
    }
}

export default function SiteMap() {
    // This component will never render because we return the sitemap in getServerSideProps
    return null
}

