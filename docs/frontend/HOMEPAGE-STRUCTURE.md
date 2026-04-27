# Homepage Structure - Beats on the Block

## 🎨 Live Homepage
**URL:** http://localhost:3000

---

## 📐 Page Sections (In Order)

### 1. **Header Navigation** (Fixed)
- **Component:** `components/layout/Header.js`
- **Content:**
  - Logo: "CONNECT"
  - Navigation: Home, About us, Events, Join Us
- **Styling:** Dark purple background with backdrop blur, fixed to top
- **Mobile:** Hamburger menu (to be implemented)

---

### 2. **Hero Section**
- **Content:**
  - Main title: "BEATS on the BELTLINE"
  - Video placeholder with play button
  - CTA button: "CONNECT WITH US"
- **Background:** Animated gradient with floating circles
- **Colors:** Pink, peach, cyan accents
- **Features:** 
  - Text shadows for readability
  - Animated floating circles
  - Hover effects on video/play button

---

### 3. **About Section** (Content)
- **ID:** `#about`
- **Title:** "CONTENT"
- **Content:**
  - Headline: "Atlanta's premier free outdoor electronic music experience"
  - Three paragraphs about the festival
  - Info badges: Attendance, Free Entry, All Ages, Location
- **Background:** White
- **Features:**
  - Gradient text title
  - DaisyUI badges for key info
  - Centered, max-width content

---

### 4. **Upcoming Events Section**
- **ID:** `#events`
- **Title:** "UPCOMING EVENTS"
- **Content:**
  - Grid of 3 event cards (placeholders)
  - Each card: Date, title, description, CTA
- **Background:** Gradient from brand-bg to white
- **Cards:** 
  - Hover scale effect
  - "FREE" badge
  - "Learn More" button

---

### 5. **Past Events Section**
- **Title:** "PAST EVENTS"
- **Content:**
  - Grid of 3 past event cards
  - Dates: APR 2024, MAY 2024, JUL 2024
  - Each with gradient backgrounds
- **Background:** Gradient from white to neutral
- **Features:**
  - Hover scale effect
  - Clickable cards for galleries

---

### 6. **Sponsors Section**
- **Title:** "SPONSORS"
- **Content:**
  - 12 sponsor logo placeholders
  - Core partners text list
- **Background:** White
- **Layout:** 
  - Responsive grid (2 → 3 → 6 columns)
  - Hover effects on logo containers

---

### 7. **Merch Section**
- **Title:** "MERCH"
- **Content:**
  - 3 product cards
  - Each: Image, name, price, "Shop Now" button
  - "SHOP" button at bottom
- **Background:** Gradient peach/cyan tint
- **Features:**
  - Product cards with hover effects
  - Price display
  - Shop CTAs

---

### 8. **Join Us Section**
- **ID:** `#join`
- **Title:** "JOIN US"
- **Content:**
  - Two paragraphs about joining community
  - "CONNECT WITH US" button
- **Background:** Gradient purple/pink (matches brand)
- **Text:** White with text shadows
- **Features:**
  - Animated pulse-glow button
  - Centered content

---

### 9. **Footer**
- **Component:** `components/layout/Footer.js`
- **Content:**
  - Logo: "CONNECT"
  - Links: Privacy Policy, Terms & Conditions, Cookie Policy, Contact
  - Copyright: "Copyright 2025 Company Name"
- **Background:** Dark purple
- **Text:** White with accent color on hover

---

## 🎨 Design Features Used

### Colors:
- **Header Purple:** `#291058` (`bg-brand-header`)
- **Primary Purple:** `#8C52FF` (`bg-brand-primary`)
- **Cyan Accent:** `#5CE1E6` (`bg-brand-accent`)
- **Pink Accent:** `#F81889` (`bg-brand-pink`)
- **Peach Accent:** `#FEB95F` (`bg-brand-peach`)
- **Background:** `#F6F7FB` (`bg-brand-bg`)

### Custom Components:
- `.btn-festival` - Custom festival button
- `.btn-festival-outline` - Outline variant
- `.card-festival` - Custom card styling
- `.gradient-text` - Multi-color gradient text
- `.text-shadow` - Text shadow for readability
- `.animate-float` - Floating animation
- `.animate-pulse-glow` - Pulsing glow effect

### DaisyUI Components:
- `btn btn-primary` - Primary buttons
- `badge` - Info badges
- `card` - Card components

---

## 📁 File Structure

```
frontend/
  /components/
    /layout/
      Header.js       ✅ Created
      Footer.js       ✅ Created
    SEO.js           ✅ Existing
    EventStructuredData.js  ✅ Existing
  /pages/
    index.js         ✅ Updated (New homepage)
    design-system.js ✅ Existing (style guide)
  /public/
    /images/
      /sponsors/     ✅ Created (empty)
      /events/       ✅ Created (empty)
      /merch/        ✅ Created (empty)
      /og/           ✅ Created (empty)
```

---

## 🖼️ Image Assets Needed

### High Priority:
1. **Logo:**
   - `/public/images/logo.png` or `/public/images/logo.svg`
   - White version for dark backgrounds
   - Suggested size: 200x60px

2. **Hero Video/Image:**
   - `/public/images/hero-video-thumbnail.jpg`
   - Suggested size: 1920x1080px
   - Festival crowd or stage shot

3. **Event Posters:**
   - `/public/images/events/april-2024.jpg`
   - `/public/images/events/may-2024.jpg`
   - `/public/images/events/july-2024.jpg`
   - Suggested size: 1080x1080px (square)

4. **Sponsor Logos:**
   - Place in `/public/images/sponsors/`
   - Suggested format: PNG with transparency
   - Suggested size: 300x300px max

5. **Merch Photos:**
   - Place in `/public/images/merch/`
   - Suggested size: 800x800px (square)

6. **OG Image:**
   - `/public/images/og/og-image.jpg`
   - Size: 1200x630px
   - For social media sharing

---

## 🔧 How to Add Images

### Example: Adding a logo

1. **Add image file:**
```bash
# Copy to: frontend/public/images/logo.png
```

2. **Update Header.js:**
```javascript
import Image from 'next/image'

<Image 
  src="/images/logo.png"
  alt="Connect Logo"
  width={150}
  height={45}
  priority
/>
```

### Example: Adding sponsor logos

1. **Add logo files to:** `/public/images/sponsors/`

2. **Update homepage (index.js):**
```javascript
const sponsors = [
  { name: 'Coca-Cola', logo: '/images/sponsors/coca-cola.png' },
  { name: 'Simply Pop', logo: '/images/sponsors/simply-pop.png' },
  // ... more sponsors
]

sponsors.map((sponsor) => (
  <Image
    src={sponsor.logo}
    alt={sponsor.name}
    width={150}
    height={150}
    className="object-contain"
  />
))
```

---

## ✅ Current Status

- [x] Header component with navigation
- [x] Hero section with video placeholder
- [x] About/Content section with real copy
- [x] Upcoming events section (placeholders)
- [x] Past events section (placeholders)
- [x] Sponsors section (placeholders)
- [x] Merch section (placeholders)
- [x] Join Us CTA section
- [x] Footer with links
- [x] Responsive design (mobile-first)
- [x] SEO meta tags
- [x] Smooth scroll anchors

---

## 🚀 Next Steps

### Immediate:
1. **Add Real Images:**
   - [ ] Logo (header & footer)
   - [ ] Hero video/image
   - [ ] Event posters (3 upcoming, 3 past)
   - [ ] Sponsor logos (12)
   - [ ] Merch product photos (3)

2. **Content Updates:**
   - [ ] Update event card details with real dates/info
   - [ ] Add real sponsor logos and links
   - [ ] Add real merch products with prices
   - [ ] Update footer copyright with correct company name

3. **Functionality:**
   - [ ] Implement video player in hero
   - [ ] Add mobile hamburger menu
   - [ ] Link "Connect With Us" buttons to form/email
   - [ ] Link event cards to detail pages
   - [ ] Link merch cards to shop
   - [ ] Add smooth scroll behavior to anchor links

### Future Enhancements:
1. **Interactive Features:**
   - [ ] Newsletter signup form
   - [ ] Event registration/RSVP
   - [ ] Photo gallery lightbox
   - [ ] Social media integration

2. **Additional Pages:**
   - [ ] Individual event detail pages
   - [ ] Shop/merch page with cart
   - [ ] About page (team, mission, history)
   - [ ] Contact page with form
   - [ ] Gallery page for past events

3. **Performance:**
   - [ ] Lazy load images below fold
   - [ ] Add loading states
   - [ ] Implement image optimization
   - [ ] Add page transitions

---

## 📊 SEO Optimizations

Already implemented:
- ✅ Semantic HTML (header, nav, section, footer)
- ✅ H1, H2 heading hierarchy
- ✅ Meta title and description
- ✅ Open Graph tags
- ✅ Canonical URL
- ✅ ID anchors for navigation

To add when images are ready:
- [ ] Alt text on all images
- [ ] EventStructuredData component in hero
- [ ] Update sitemap with new sections

---

## 🎯 Mobile Responsiveness

Current breakpoints used:
- **sm:** 640px - Mobile landscape
- **md:** 768px - Tablet (2-column grids)
- **lg:** 1024px - Desktop (3-column grids)

All sections are fully responsive with:
- Fluid typography (text-6xl → text-9xl)
- Responsive grids (grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3)
- Mobile-optimized spacing
- Touch-friendly buttons (min 44x44px)

---

**Status:** ✅ Homepage structure complete, ready for assets!
**Last Updated:** November 6, 2025

