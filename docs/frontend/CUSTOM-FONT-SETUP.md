# Custom Font Setup Guide

## 📦 Font Directory Created

✅ **Location:** `/public/fonts/`

The fonts directory is ready for your custom title font files.

---

## 🎯 Quick Implementation Steps

### Step 1: Add Your Font Files

Place your font files in `/public/fonts/`:

```bash
/public/fonts/
  └── [your-font-name].woff2  # Best format
  └── [your-font-name].woff   # Fallback
  └── [your-font-name].ttf    # Optional backup
```

**Supported formats:**
- `.woff2` (recommended - best compression)
- `.woff` (good browser support)
- `.ttf` or `.otf` (fallback)

---

### Step 2: Configure Font in CSS

I'll add the `@font-face` declaration to `styles/globals.css`:

```css
@font-face {
  font-family: 'FestivalTitle';  /* Or your font name */
  src: url('/fonts/your-font.woff2') format('woff2'),
       url('/fonts/your-font.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

---

### Step 3: Add to Tailwind Config

I'll update `tailwind.config.js`:

```javascript
theme: {
  extend: {
    fontFamily: {
      'festival': ['FestivalTitle', 'Impact', 'sans-serif'],
    }
  }
}
```

---

### Step 4: Apply to Titles

Update the hero title and section headings:

```javascript
<h1 className="font-festival text-9xl">
  BEATS
</h1>
```

---

## 🎨 Where the Custom Font Will Be Used

### Primary Usage (Bold Titles):
- ✅ Hero: "BEATS on the BELTLINE"
- ✅ Section titles: "CONTENT", "PAST EVENTS", "SPONSORS", "MERCH", "JOIN US"

### Keep Current Font:
- Body text (paragraphs)
- Buttons
- Navigation
- Footer links

---

## 📋 Font Information Needed

Please provide:
1. **Font files** (WOFF2/WOFF/TTF format)
2. **Font name** (what should we call it?)
3. **Font weights** (if multiple: Light 300, Regular 400, Bold 700, etc.)
4. **License confirmation** (is it licensed for web use?)

---

## 🚀 Automatic Setup Script

Once you provide the font files, I can automatically:
1. ✅ Add `@font-face` to `globals.css`
2. ✅ Update `tailwind.config.js` with font family
3. ✅ Apply to all title elements
4. ✅ Set proper fallback fonts
5. ✅ Add preload link for performance

---

## 💡 Font Conversion (If Needed)

If you only have a TTF/OTF file, you can convert to WOFF2:

**Online Tools:**
- https://cloudconvert.com/ttf-to-woff2
- https://transfonter.org/

**Or let me know and I can help with conversion!**

---

## 🎯 Current Font Stack (Before Custom Font)

**Titles:** System default (sans-serif)
**Body:** System default (sans-serif)

**After adding custom font:**
**Titles:** Your custom font + Impact (fallback) + sans-serif
**Body:** Stays system default

---

## ⚡ Performance Optimization

Once font is added, I'll implement:
- ✅ `font-display: swap` (shows text immediately)
- ✅ Preload tag for faster loading
- ✅ Subset font if possible (reduce file size)
- ✅ WOFF2 format for 50% size reduction

---

## 📝 Example Implementation

Here's how it will look in the hero section:

**Before:**
```javascript
<h1 className="text-9xl font-black">
  BEATS
</h1>
```

**After:**
```javascript
<h1 className="font-festival text-9xl font-black tracking-tight">
  BEATS
</h1>
```

---

## 🔧 Testing Checklist

After font is added:
- [ ] Font loads on all pages
- [ ] Fallback font works if custom font fails
- [ ] No layout shift during font load
- [ ] Titles look crisp and clear
- [ ] Works on mobile devices
- [ ] No console errors

---

**Status:** ✅ Ready for font files  
**Next Step:** Please provide the font files or let me know the font name!

---

**Tips:**
- If it's a Google Font, I can implement it even faster
- If you have a font file but it's too large, I can help optimize it
- We can test multiple fonts to see which looks best

