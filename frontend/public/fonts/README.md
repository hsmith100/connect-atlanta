# Custom Fonts Directory

This directory contains custom font files for the Beats on the Block website.

## 📁 Directory Structure

```
/public/fonts/
  ├── README.md (this file)
  ├── [font-name].woff2
  ├── [font-name].woff
  └── [font-name].ttf
```

## 📦 Font File Formats

**Recommended format priority:**
1. **WOFF2** (.woff2) - Best compression, modern browsers
2. **WOFF** (.woff) - Good compression, wider browser support
3. **TTF/OTF** (.ttf/.otf) - Fallback for older browsers

## 🎨 Current Custom Fonts

### Title Font
- **Name:** [To be added]
- **Files:** [To be added]
- **Usage:** Main titles, headings
- **Location:** Hero title, section headings

## 📝 How to Add Custom Fonts

### Option 1: Using CSS @font-face (For this project)

1. **Add font files to this directory:**
```bash
/public/fonts/
  └── your-font-name.woff2
  └── your-font-name.woff
```

2. **Update `styles/globals.css`:**
```css
@font-face {
  font-family: 'YourFontName';
  src: url('/fonts/your-font-name.woff2') format('woff2'),
       url('/fonts/your-font-name.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

3. **Update `tailwind.config.js`:**
```javascript
theme: {
  extend: {
    fontFamily: {
      'title': ['YourFontName', 'sans-serif'],
    }
  }
}
```

4. **Use in components:**
```javascript
<h1 className="font-title">Your Title</h1>
```

### Option 2: Using next/font (Alternative)

If font is from Google Fonts or has variable font support:

```javascript
// In a component or layout
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

<div className={inter.className}>
  Your content
</div>
```

## 🚀 Quick Setup Guide

### Step 1: Add Font Files
Drop your font files into `/public/fonts/`

### Step 2: We'll configure the CSS
The fonts will be loaded in `globals.css`

### Step 3: Update Tailwind
Add to `tailwind.config.js` for easy usage

### Step 4: Apply to titles
Use the custom font class on hero and headings

## 📊 Font Loading Best Practices

1. **Use `font-display: swap`** - Shows fallback text immediately
2. **Subset fonts** - Only include characters you need
3. **Preload critical fonts** - Add to `_document.js` for hero fonts
4. **WOFF2 first** - Best compression for modern browsers
5. **Limit font weights** - Only load weights you actually use

## 🎯 Font Performance Tips

- Keep font files under 100KB if possible
- Use WOFF2 format (50% smaller than WOFF)
- Only load necessary font weights (e.g., 400 and 700)
- Consider variable fonts for multiple weights
- Use system fonts as fallbacks

## ⚠️ Font License Reminder

Make sure you have proper licensing for any custom fonts used on the website. Commercial use often requires a web font license.

---

**Status:** Ready for font files  
**Next:** Add your custom font files to this directory

