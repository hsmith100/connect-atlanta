# SEO Quick Reference Card

## 🚀 Copy-Paste Templates

### Standard Page Template
```javascript
import SEO from '../components/SEO'

export default function PageName() {
  return (
    <>
      <SEO 
        title="Page Title | Music Festival 2025"
        description="Your 150-160 character description here"
        keywords="keyword1, keyword2, keyword3"
        canonicalUrl="https://yourfestival.com/page-url"
      />
      <main>
        <h1>Page Title</h1>
        {/* Content */}
      </main>
    </>
  )
}
```

### Event Page with Structured Data
```javascript
import Head from 'next/head'
import SEO from '../components/SEO'
import EventStructuredData from '../components/EventStructuredData'

export default function EventPage() {
  return (
    <>
      <SEO 
        title="Festival Name 2025"
        description="Festival description"
        canonicalUrl="https://yourfestival.com"
      />
      <Head>
        <EventStructuredData 
          name="Festival Name 2025"
          startDate="2025-07-15T10:00:00-05:00"
          endDate="2025-07-17T23:00:00-05:00"
          performers={["Artist 1", "Artist 2"]}
        />
      </Head>
      <main>
        {/* Content */}
      </main>
    </>
  )
}
```

### Optimized Image
```javascript
import Image from 'next/image'

<Image
  src="/images/photo.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  priority // only for above-fold images
/>
```

---

## 📋 Title & Description Guidelines

### Title Tags (50-60 characters)
✅ **Good:** "Summer Music Fest 2025 | July 15-17 | Austin, TX"
❌ **Bad:** "Music Festival"

### Meta Descriptions (150-160 characters)
✅ **Good:** "Join us for 3 days of incredible music at Summer Music Fest 2025. Top artists, great vibes, and unforgettable memories. Get your tickets now!"
❌ **Bad:** "Music festival tickets"

---

## 🔧 Essential URLs to Test

After starting your dev server:
- Homepage: http://localhost:3000
- Sitemap: http://localhost:3000/sitemap.xml
- Robots: http://localhost:3000/robots.txt

---

## ✅ Pre-Launch Checklist

- [ ] All pages have unique titles
- [ ] All pages have meta descriptions
- [ ] All images have alt text
- [ ] Sitemap includes all pages
- [ ] Robots.txt updated with production URL
- [ ] NEXT_PUBLIC_SITE_URL set to production domain
- [ ] Tested on mobile
- [ ] No broken links
- [ ] Core Web Vitals passing

---

## 🌐 Post-Launch Actions

1. Submit sitemap to [Google Search Console](https://search.google.com/search-console)
2. Submit sitemap to [Bing Webmaster Tools](https://www.bing.com/webmasters)
3. Test with [Rich Results Test](https://search.google.com/test/rich-results)
4. Check [PageSpeed Insights](https://pagespeed.web.dev/)
5. Validate social cards at [Facebook Debugger](https://developers.facebook.com/tools/debug/)

---

## 🎯 Page Priority for Festival Sites

1. **Homepage** (Priority: 1.0) - Main event info, dates, CTA
2. **Tickets** (Priority: 0.9) - Purchase options
3. **Lineup** (Priority: 0.9) - Artist roster
4. **Schedule** (Priority: 0.8) - Performance times
5. **Venue** (Priority: 0.7) - Location & directions
6. **About** (Priority: 0.7) - Festival history
7. **FAQ** (Priority: 0.6) - Common questions
8. **Contact** (Priority: 0.6) - Support info

Add these to your sitemap as you create them!

---

## 📸 Image Optimization Checklist

- [ ] Use Next.js `<Image>` component (not `<img>`)
- [ ] Descriptive alt text on every image
- [ ] Hero images: 1920x1080
- [ ] Artist photos: 800x800  
- [ ] OG images: 1200x630
- [ ] Use WebP/AVIF formats when possible
- [ ] Compress images before upload

---

## 🆘 Quick Troubleshooting

**Sitemap not showing?**
- Visit http://localhost:3000/sitemap.xml
- Check `pages/sitemap.xml.js` exists
- Restart dev server

**Images not optimizing?**
- Verify using `next/image` component
- Check `next.config.js` has images config
- Images must be in `/public/` directory

**SEO component not working?**
- Check import path: `import SEO from '../components/SEO'`
- Verify component is inside the return statement
- Check browser's "View Source" for meta tags

**Structured data errors?**
- Test at https://search.google.com/test/rich-results
- Verify dates are in ISO 8601 format
- Check all required fields are provided

---

**For detailed info, see: `SEO-IMPLEMENTATION-GUIDE.md`**

