# Typography Guide

## Font Usage Guidelines

### Festival Font (Rig Solid Bold Reverse)
**Class**: `font-festival`  
**Usage**: **COLLATERAL & PRINT ONLY**
- Event flyers
- Posters
- Print materials
- Social media graphics
- **NOT for website titles**

### Title Font (Montserrat/Inter)
**Class**: `font-title`  
**Usage**: **ALL WEB TITLES**
- Page headings (H1, H2, H3)
- Section titles
- Card titles
- Any uppercase bold titles on website

**Why**: Clean, readable, professional appearance that works well in bold and capitalized format

---

## Font Recommendations

### Current Setup (System Fonts)
The site currently uses a system font stack for titles:
```
'Montserrat', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'
```

### Recommended Google Fonts to Add

For the best appearance, consider adding one of these Google Fonts:

#### **Option 1: Montserrat (Recommended)**
- Clean, modern, geometric
- Excellent in bold and uppercase
- Professional and impactful
- Very readable at all sizes

```html
<!-- Add to _document.js -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
```

#### **Option 2: Space Grotesk**
- Modern, geometric design
- Tech-forward aesthetic
- Great for music/events
- Unique character

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
```

#### **Option 3: Work Sans**
- Professional, clean
- Excellent readability
- Modern without being trendy
- Safe choice

```html
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@700;800;900&display=swap" rel="stylesheet">
```

---

## Implementation

### Step 1: Add Google Font (Recommended)

Edit `frontend/pages/_document.js` and add the font link in the `<Head>` section:

```jsx
<link 
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" 
  rel="stylesheet" 
/>
```

### Step 2: Update Tailwind Config

Already done in `tailwind.config.js`:
```javascript
fontFamily: {
  'title': ['Montserrat', 'Inter', /* fallbacks */],
}
```

### Step 3: Replace font-festival with font-title

Search and replace across all pages:
- Change: `className="font-festival ..."`
- To: `className="font-title ..."`

---

## Current Font Classes

### Body Text
- Default system fonts
- Clean, readable
- Good for paragraphs and descriptions

### Title Text (font-title)
- **Font Weight**: 700-900 (bold to black)
- **Text Transform**: Uppercase recommended
- **Use Cases**: H1, H2, H3, section titles, card titles

### Festival Font (font-festival) 
- **DEPRECATED FOR WEB USE**
- Keep for reference to collateral designs
- Only use in print/graphic design

---

## Examples

### ✅ Correct Usage
```jsx
<h1 className="font-title text-5xl font-black uppercase">
  Beats on the Block
</h1>
```

### ❌ Incorrect Usage
```jsx
<!-- Don't use festival font on web -->
<h1 className="font-festival text-5xl font-black uppercase">
  Beats on the Block
</h1>
```

---

## Migration Checklist

- [ ] Add Montserrat Google Font to _document.js
- [ ] Test font rendering across browsers
- [ ] Replace all font-festival with font-title on web pages
- [ ] Keep font-festival reference in config for collateral design reference
- [ ] Update any custom CSS using festival font
- [ ] Test responsive text sizing
- [ ] Verify bold weights (700, 800, 900) load correctly

---

## Font Weights Reference

When using `font-title` (Montserrat):
- `font-bold` = 700
- `font-extrabold` = 800  
- `font-black` = 900

Recommended for titles: `font-black` (900) or `font-extrabold` (800)

