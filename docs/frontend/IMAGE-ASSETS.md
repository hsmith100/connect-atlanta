# Image Assets Reference

**Date Organized:** November 6, 2025

---

## 📁 Directory Structure

```
/public/images/
  ├── ConnectBig-White.svg (3.0MB)
  ├── ConnectLogoBIG-Black.svg (4.5MB)
  ├── /events/
  │   ├── april-2024.png (1.8MB)
  │   ├── july-2024.png (1.6MB)
  │   ├── september-2024.png (1.3MB)
  │   ├── event-photo-1.png (1.5MB)
  │   ├── event-photo-2.png (3.6MB)
  │   ├── event-photo-3.png (1.6MB)
  │   └── event-photo-4.png (2.2MB)
  └── /sponsors/
      ├── 4ever-young.svg (436KB)
      ├── amiqo.svg (88KB)
      ├── coke-zero.svg (80KB)
      ├── deep-eddy.svg (405KB)
      ├── evdy.svg (15KB)
      ├── lunazul.svg (257KB)
      ├── nine-dot.svg (108KB)
      ├── simply-pop.svg (75KB)
      └── sub-riot.svg (131KB)
```

---

## 🎨 Main Logos

### Connect Logo - White Version
- **File:** `/images/ConnectBig-White.svg`
- **Size:** 3.0MB
- **Use:** Dark backgrounds (header, footer, join us section)
- **Format:** SVG

### Connect Logo - Black Version
- **File:** `/images/ConnectLogoBIG-Black.svg`
- **Size:** 4.5MB
- **Use:** Light backgrounds (content sections)
- **Format:** SVG

---

## 📅 Event Flyers

### April 2024 Event
- **File:** `/images/events/april-2024.png`
- **Size:** 1.8MB
- **Original:** "April Flyer 1.png"

### July 2024 Event
- **File:** `/images/events/july-2024.png`
- **Size:** 1.6MB
- **Original:** "July Flyer 4.png"

### September 2024 Event
- **File:** `/images/events/september-2024.png`
- **Size:** 1.3MB
- **Original:** "September Flyer 1.png"

---

## 📸 Additional Event Photos

### Event Photo 1
- **File:** `/images/events/event-photo-1.png`
- **Size:** 1.5MB
- **Original:** "image 8.png"

### Event Photo 2
- **File:** `/images/events/event-photo-2.png`
- **Size:** 3.6MB
- **Original:** "image 9.png"

### Event Photo 3
- **File:** `/images/events/event-photo-3.png`
- **Size:** 1.6MB
- **Original:** "800ab286-4c25-409f-9fe5-228d1b1aca6a 1.png"

### Event Photo 4
- **File:** `/images/events/event-photo-4.png`
- **Size:** 2.2MB
- **Original:** "effc19e0-318e-40d8-a24c-75b61fd5f250 1.png"

---

## 🤝 Sponsor Logos

All sponsor logos are in SVG format for crisp scaling.

### 4Ever Young
- **File:** `/images/sponsors/4ever-young.svg`
- **Size:** 436KB

### Amiqo
- **File:** `/images/sponsors/amiqo.svg`
- **Size:** 88KB

### Coke Zero
- **File:** `/images/sponsors/coke-zero.svg`
- **Size:** 80KB

### Deep Eddy
- **File:** `/images/sponsors/deep-eddy.svg`
- **Size:** 405KB

### EVDY
- **File:** `/images/sponsors/evdy.svg`
- **Size:** 15KB

### Lunazul
- **File:** `/images/sponsors/lunazul.svg`
- **Size:** 257KB

### Nine Dot
- **File:** `/images/sponsors/nine-dot.svg`
- **Size:** 108KB

### Simply Pop
- **File:** `/images/sponsors/simply-pop.svg`
- **Size:** 75KB

### Sub Riot
- **File:** `/images/sponsors/sub-riot.svg`
- **Size:** 131KB

---

## 📊 Total Assets

- **Main Logos:** 2 files (7.5MB total)
- **Event Flyers:** 3 files (4.7MB total)
- **Event Photos:** 4 files (8.9MB total)
- **Sponsor Logos:** 9 files (1.6MB total)
- **Grand Total:** 18 files (22.7MB)

---

## ⚠️ Optimization Recommendations

### High Priority:

#### 1. Optimize Connect Logos (3-4.5MB each)
**Issue:** SVG files should typically be < 100KB. These are unusually large.

**Solutions:**
- Run through SVGO (SVG optimizer)
- Remove unnecessary metadata
- Simplify paths if possible
- Consider converting to optimized PNG for web use

**Command:**
```bash
npm install -g svgo
svgo images/ConnectBig-White.svg -o images/ConnectBig-White-optimized.svg
```

**Expected Result:** 70-90% size reduction

---

#### 2. Optimize Event Photos (1.5-3.6MB each)
**Issue:** Large PNG files will slow page load.

**Solutions:**
- Convert to WebP format (60-80% smaller)
- Compress with tools like TinyPNG
- Use Next.js Image component for automatic optimization
- Consider lazy loading

**Expected Result:** 50-70% size reduction per image

---

### Medium Priority:

#### 3. Optimize Large Sponsor Logos
**Files:** 4ever-young.svg (436KB), deep-eddy.svg (405KB)

**Solution:** Run through SVGO

---

## 🚀 Implementation Guide

### Using Images in Components

#### Header Logo Example
```javascript
import Image from 'next/image'

<Image 
  src="/images/ConnectBig-White.svg"
  alt="Connect"
  width={150}
  height={45}
  priority
/>
```

#### Event Flyer Example
```javascript
<Image 
  src="/images/events/april-2024.png"
  alt="Beats on the Beltline - April 2024"
  width={1080}
  height={1080}
  className="rounded-xl"
/>
```

#### Sponsor Logo Example
```javascript
<Image 
  src="/images/sponsors/coke-zero.svg"
  alt="Coke Zero"
  width={150}
  height={150}
  className="object-contain"
/>
```

---

## 📋 Next Steps

### Immediate:
- [ ] Test Connect logo in header
- [ ] Test event flyers in Past Events section
- [ ] Test sponsor logos in Sponsors section
- [ ] Verify all images load correctly

### Optimization:
- [ ] Run SVGO on Connect logos
- [ ] Convert event photos to WebP
- [ ] Test load times with real images
- [ ] Implement lazy loading for below-fold images

### Additional Assets Needed:
- [ ] OG image for social sharing (1200x630px)
- [ ] Favicon (32x32px, 16x16px)
- [ ] Hero video or high-res hero image

---

## 🔗 File Naming Convention

**Pattern Used:**
- Lowercase letters
- Hyphens instead of spaces
- Descriptive names
- No special characters or UUIDs

**Examples:**
- ✅ `april-2024.png`
- ✅ `coke-zero.svg`
- ✅ `event-photo-1.png`
- ❌ `April Flyer 1.png`
- ❌ `800ab286-4c25-409f-9fe5-228d1b1aca6a 1.png`

---

## ✅ Organization Complete

All assets from `/public/Images/` have been:
- ✅ Moved to appropriate folders
- ✅ Renamed with clean, web-friendly names
- ✅ Organized by type (logos, events, sponsors)
- ✅ Ready for implementation in components

**Old folder removed:** `/public/Images/` ✓

---

**Status:** Ready to integrate into homepage components!

