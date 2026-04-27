# Color Migration Summary - Connect Brand

## Date: December 11, 2025

Major brand direction change: from Beats on the Block-focused to Connect-focused branding.

---

## ✅ CHANGES COMPLETED

### 1. **Brand Strategy Shift**

#### Before:
- Site branded around Beats on the Block
- Purple/pink/rainbow color scheme
- Festival-first approach

#### After:
- Site branded around **Connect** (parent organization)
- **Beats on the Block is a product/offering of Connect**
- Gold + warm neutrals color scheme
- Professional, sophisticated approach
- Festival imagery provides the vibrant colors

---

## 🎨 NEW COLOR PALETTE

### Primary Brand Color
**Gold: `#D99B2A`** (from Connect logo)
- All CTAs and buttons
- Primary brand accent
- Links and important elements
- Hover state: `#B8860B` (dark gold)

### Text Colors
- **Headers**: `#1A1A1A` (near black / charcoal)
- **Body Text**: `#4A4A4A` (medium gray)
- **Light Text**: `#6B6B6B` (light gray)

### Background Colors (Warm Neutrals)
- **Pure White**: `#FFFFFF` (primary background)
- **Warm Cream**: `#F9F7F4` (section backgrounds)
- **Light Sand**: `#F2EDE6` (alternate sections)
- **Warm Taupe**: `#E8E3DB` (borders, cards)
- **Dark Charcoal**: `#2C2C2C` (footer, hero sections)

### Legacy Colors (Kept for Festival Content)
- **Cyan**: `#18B4DD` (optional secondary accent)
- **Pink**: `#F81889` (Beats-specific branding only)
- **Peach**: `#FEB95F` (Beats-specific branding only)

---

## 📊 Color Strategy

### Philosophy
1. **Gold = Premium & Connect Brand**
   - Sparingly used for maximum impact
   - CTAs stand out
   - Professional, high-quality feel

2. **Warm Neutrals = Sophistication**
   - Cream and warm grays feel premium
   - More sophisticated than cool grays
   - Complements gold without competing
   - Creates welcoming atmosphere

3. **Dark Text = Readability**
   - High contrast on light backgrounds
   - Professional appearance
   - Excellent accessibility

4. **Festival Images Provide Color**
   - Event photos are naturally vibrant
   - Gallery provides "rainbow effect"
   - No need for colorful backgrounds
   - White space lets images pop

---

## 🔧 TECHNICAL UPDATES

### Files Modified:
1. **`tailwind.config.js`**
   - Complete color palette overhaul
   - New `brand-primary` = gold
   - Added warm neutral backgrounds
   - Updated text colors to dark
   - Created `connect` theme (replaced `festival` theme)

2. **`_document.js`**
   - Added `data-theme="connect"` to HTML tag
   - Added Montserrat Google Font
   - Updated theme-color meta to gold
   - Kept Rig Solid for reference only

3. **Color Naming Convention:**
```javascript
brand-primary        → #D99B2A (gold)
brand-primary-dark   → #B8860B (dark gold)
brand-header         → #1A1A1A (charcoal)
brand-text           → #4A4A4A (medium gray)
brand-bg             → #FFFFFF (white)
brand-bg-cream       → #F9F7F4 (warm cream)
brand-bg-sand        → #F2EDE6 (light sand)
brand-bg-taupe       → #E8E3DB (warm taupe)
brand-bg-dark        → #2C2C2C (charcoal)
```

---

## 📝 USAGE GUIDELINES

### Buttons & CTAs
```jsx
// Primary CTA (gold button, dark text)
<button className="bg-brand-primary text-brand-header hover:bg-brand-primary-dark">
  Get Started
</button>

// Secondary CTA (outline)
<button className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-brand-header">
  Learn More
</button>
```

### Section Backgrounds (Alternating Neutrals)
```jsx
<section className="bg-white">...</section>
<section className="bg-brand-bg-cream">...</section>
<section className="bg-brand-bg-sand">...</section>
<section className="bg-white">...</section>
```

### Typography
```jsx
// Headings
<h1 className="font-title font-black text-brand-header">Title</h1>

// Body text
<p className="text-brand-text">Body content</p>

// Secondary text
<span className="text-brand-text-light">Caption</span>
```

### Cards
```jsx
<div className="bg-white border-2 border-brand-bg-taupe hover:border-brand-primary">
  // Card content
</div>
```

---

## ⚠️ IMPORTANT NOTES

### 1. **Contrast Considerations**
- Gold (`#D99B2A`) on white has ~5.8:1 contrast ratio
- **Use dark text on gold buttons** for best accessibility
- Never use gold text on white backgrounds (poor contrast)
- Always use white or dark text, never gold on light backgrounds

### 2. **Gold Usage - Less is More**
- **DO**: Use for CTAs, important links, key accents
- **DON'T**: Use for large backgrounds or body text
- **DO**: Reserve for actions and highlights
- **DON'T**: Overuse - maintain premium feel

### 3. **Warm Neutrals are Key**
- Create depth without heavy colors
- Warmer than standard grays
- Professional and inviting
- Let festival images provide the color pop

### 4. **Brand Hierarchy**
```
Connect (Parent Brand - Gold & Professional)
  └── Beats on the Block (Product - Vibrant Imagery)
  └── Future Events/Products (Same Gold Brand)
```

---

## 🎯 NEXT STEPS

### Immediate:
1. ✅ Color palette defined
2. ✅ Tailwind config updated
3. ✅ Theme set to 'connect'
4. ✅ Montserrat font added
5. ⏳ Test all pages with new colors
6. ⏳ Update any hard-coded purple/pink to gold
7. ⏳ Review all CTAs use gold
8. ⏳ Verify text contrast throughout site

### Content Updates Needed:
1. Update homepage to emphasize Connect brand
2. Beats on the Block becomes "featured event/product"
3. Consider "Our Events" section vs single event focus
4. Add Connect brand messaging
5. Update copy to reflect parent brand

### Visual Updates:
1. Ensure Connect logo is prominent
2. Gold CTAs throughout
3. Warm neutral section backgrounds
4. Let event galleries provide color
5. Clean, professional appearance

---

## 📈 BEFORE vs AFTER

### Color Scheme
| Element | Before | After |
|---------|--------|-------|
| **Primary** | Purple #8C52FF | Gold #D99B2A |
| **Backgrounds** | Cool grays #F6F7FB | Warm neutrals #F9F7F4 |
| **Text** | Purple #291058 | Charcoal #1A1A1A |
| **Accent** | Pink/Peach/Cyan | Gold (primary), Cyan (optional) |
| **Buttons** | Purple/Cyan | Gold #D99B2A |
| **Overall Feel** | Festival/Party | Professional/Premium |

### Brand Focus
| Aspect | Before | After |
|--------|--------|-------|
| **Primary Brand** | Beats on the Block | Connect |
| **Color Source** | Site background/design | Event imagery |
| **Aesthetic** | Colorful, energetic | Clean, sophisticated |
| **Target Feel** | Festival-focused | Professional org with exciting events |

---

## ✅ SUCCESS METRICS

The rebrand is successful when:
- [ ] Connect logo is prominent and recognizable
- [ ] Gold is used consistently for all CTAs
- [ ] Site feels professional and premium
- [ ] Festival imagery provides the vibrant color
- [ ] All text is highly readable (high contrast)
- [ ] Warm neutrals create sophisticated feel
- [ ] Beats on the Block is clearly a Connect product
- [ ] Brand is scalable for future Connect events

---

**Design Philosophy**: Connect is the premium parent brand (represented by gold and professional design), while Beats on the Block and future events are exciting products/offerings that provide natural vibrancy through their imagery. The website should be clean, sophisticated, and let the festival content shine.

