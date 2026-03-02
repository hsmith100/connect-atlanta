# SEO Implementation Guide for Music Festival Site

## ✅ What's Already Set Up

Your Next.js site is now configured with essential SEO infrastructure:

### 1. **Configuration Files**
- ✅ `next.config.js` - Optimized with image optimization, compression, and caching
- ✅ `pages/_document.js` - Proper HTML structure and language tags
- ✅ `pages/sitemap.xml.js` - Dynamic sitemap generation
- ✅ `public/robots.txt` - Search engine crawling rules

### 2. **SEO Components**
- ✅ `components/SEO.js` - Reusable SEO metadata component
- ✅ `components/EventStructuredData.js` - JSON-LD structured data for events

### 3. **Example Implementation**
- ✅ `pages/index.js` - Updated with SEO component usage

---

## 📖 How to Use SEO Components

### Basic Page SEO (Every Page Should Have This)

```javascript
import SEO from '../components/SEO'

export default function YourPage() {
  return (
    <>
      <SEO 
        title="Page Title | Music Festival 2025"
        description="Describe what's on this page (150-160 characters is ideal)"
        keywords="specific, keywords, for, this, page"
        canonicalUrl="https://yourfestival.com/page-url"
      />
      
      <main>
        {/* Your page content */}
      </main>
    </>
  )
}
```

### Event Pages with Structured Data

For pages about the festival itself (homepage, about, main event page):

```javascript
import Head from 'next/head'
import SEO from '../components/SEO'
import EventStructuredData from '../components/EventStructuredData'

export default function HomePage() {
  return (
    <>
      <SEO 
        title="Music Festival 2025 - Three Days of Amazing Music"
        description="Join us July 15-17 for unforgettable performances from top artists"
        keywords="music festival, summer festival, live music, concerts"
        canonicalUrl="https://yourfestival.com"
      />
      
      <Head>
        <EventStructuredData 
          name="Music Festival 2025"
          description="Three days of incredible music and unforgettable experiences"
          startDate="2025-07-15T10:00:00-05:00"
          endDate="2025-07-17T23:00:00-05:00"
          locationName="Festival Grounds"
          streetAddress="123 Festival Road"
          addressLocality="Austin"
          addressRegion="TX"
          postalCode="78701"
          country="US"
          ticketPrice="150"
          ticketUrl="https://yourfestival.com/tickets"
          imageUrl="https://yourfestival.com/images/festival-main.jpg"
          performers={[
            "The Headliners",
            "Amazing Rock Band",
            "DJ Superstar",
            "Indie Folk Group"
          ]}
          organizerName="Your Events Company"
          organizerUrl="https://yourfestival.com"
        />
      </Head>
      
      <main>
        {/* Your page content */}
      </main>
    </>
  )
}
```

---

## 🎯 Essential Pages to Create

Create these pages for maximum SEO impact:

### 1. Homepage (`pages/index.js`)
- ✅ Already updated with SEO
- Add EventStructuredData
- Hero section with festival name, dates, location
- Clear call-to-action for tickets

### 2. Lineup Page (`pages/lineup.js`)
```javascript
import SEO from '../components/SEO'

export default function Lineup() {
  return (
    <>
      <SEO 
        title="Lineup | Music Festival 2025"
        description="Check out our incredible 2025 lineup featuring [Artist Names]"
        keywords="festival lineup, artists, performers, music acts"
        canonicalUrl="https://yourfestival.com/lineup"
      />
      <main>
        {/* Artist listings with images and bios */}
      </main>
    </>
  )
}
```

### 3. Tickets Page (`pages/tickets.js`)
- Include ticket types, pricing, purchase options
- High priority for conversions
- Use schema.org/Offer structured data

### 4. Schedule Page (`pages/schedule.js`)
- Day-by-day performance schedule
- Helps with "festival schedule" searches

### 5. Venue/Location Page (`pages/venue.js`)
- Map and directions
- Parking information
- Accessibility info

### 6. FAQ Page (`pages/faq.js`)
- Use FAQPage structured data
- Answer common questions

---

## 🖼️ Image Optimization (Critical!)

Always use Next.js Image component:

```javascript
import Image from 'next/image'

// DON'T do this:
<img src="/artist.jpg" alt="Artist name" />

// DO this:
<Image
  src="/images/artist.jpg"
  alt="Artist Name performing at Festival 2024"
  width={800}
  height={600}
  priority // Only for above-the-fold images
  quality={85}
/>
```

**Image Guidelines:**
- Use descriptive alt text (helps SEO and accessibility)
- Optimize images before upload (use WebP/AVIF formats)
- Recommended sizes:
  - Hero images: 1920x1080
  - Artist photos: 800x800
  - Thumbnails: 400x400
- Add images to `/public/images/` directory

---

## 📋 SEO Checklist

### Before Launch:

#### Content
- [ ] Write unique, descriptive title for each page (50-60 characters)
- [ ] Write compelling meta descriptions (150-160 characters)
- [ ] Use heading hierarchy (H1 → H2 → H3) properly
- [ ] Add alt text to all images
- [ ] Create 1000+ words of quality content on main pages
- [ ] Include relevant keywords naturally (don't stuff!)

#### Technical
- [ ] Update `public/robots.txt` with production domain
- [ ] Update `pages/sitemap.xml.js` with all pages
- [ ] Set `NEXT_PUBLIC_SITE_URL` environment variable to production URL
- [ ] Add Open Graph images (`og-image.jpg`) to `/public/images/`
- [ ] Test site on mobile devices
- [ ] Verify all links work (no 404s)
- [ ] Add SSL certificate (HTTPS)

#### Structured Data
- [ ] Add EventStructuredData to homepage
- [ ] Add Organization structured data
- [ ] Add FAQPage structured data to FAQ page
- [ ] Test structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)

#### Performance
- [ ] Optimize all images
- [ ] Minimize JavaScript bundles
- [ ] Enable caching
- [ ] Test with [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Aim for Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 🚀 After Launch

### 1. Submit to Search Engines
- **Google Search Console:** https://search.google.com/search-console
  - Submit your sitemap: `https://yourfestival.com/sitemap.xml`
  - Monitor indexing status
  - Check for errors
  
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
  - Submit your sitemap
  - Monitor performance

### 2. Set Up Analytics
```bash
npm install --save @vercel/analytics
```

Add to `pages/_app.js`:
```javascript
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### 3. Monitor Performance
- Check Google Search Console weekly
- Monitor site speed with PageSpeed Insights
- Track keyword rankings
- Analyze user behavior with analytics

---

## 🔍 Testing Your SEO

### 1. Test Metadata
```bash
# View source of your page
curl http://localhost:3000 | grep -i "meta\|title"
```

### 2. Test Sitemap
Visit: http://localhost:3000/sitemap.xml

### 3. Test Robots.txt
Visit: http://localhost:3000/robots.txt

### 4. Test Structured Data
1. Go to https://search.google.com/test/rich-results
2. Enter your page URL
3. Verify no errors

### 5. Test Mobile Friendliness
Go to https://search.google.com/test/mobile-friendly

---

## 📱 Social Media Preview

Your SEO component automatically generates Open Graph tags for social sharing.

**Test your social previews:**
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

---

## 🎨 Creating Open Graph Images

Create images for social media sharing:

**Dimensions:**
- Open Graph: 1200x630 pixels
- Twitter Card: 1200x600 pixels

**Tips:**
- Include festival name and logo
- Use high contrast colors
- Add dates if relevant
- Keep text minimal and readable
- Save as `/public/images/og-image.jpg`

---

## ⚠️ Common SEO Mistakes to Avoid

1. ❌ Duplicate title tags
2. ❌ Missing or duplicate meta descriptions
3. ❌ Images without alt text
4. ❌ Broken links
5. ❌ Slow page load times
6. ❌ Not mobile responsive
7. ❌ Keyword stuffing
8. ❌ Duplicate content across pages
9. ❌ Missing H1 tags
10. ❌ Not submitting sitemap to Google

---

## 📊 Key Performance Indicators (KPIs)

Track these metrics:
- **Organic traffic** - Visitors from search engines
- **Keyword rankings** - Position in search results
- **Click-through rate (CTR)** - % who click your search result
- **Bounce rate** - % who leave immediately
- **Page load time** - Speed of your site
- **Core Web Vitals** - Google's performance metrics

---

## 🆘 Need Help?

### Useful Tools
- **Google Search Console:** Monitor search performance
- **PageSpeed Insights:** Check performance
- **Rich Results Test:** Validate structured data
- **Lighthouse:** Comprehensive site audit (in Chrome DevTools)

### Resources
- [Next.js SEO Documentation](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Event Documentation](https://schema.org/Event)

---

## 🎯 Next Steps

1. **Create your key pages** (lineup, tickets, schedule, venue)
2. **Add real content** and images
3. **Update sitemap** in `pages/sitemap.xml.js` with new pages
4. **Test everything** with the tools mentioned above
5. **Set production URL** in environment variables
6. **Submit to search engines** after launch

Your site is now SEO-ready! 🎉

