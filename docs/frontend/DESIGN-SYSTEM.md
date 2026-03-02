# Festival Design System

## 🎨 Brand Colors

Your festival has a vibrant, modern electronic aesthetic with the following color palette:

### Color Palette

| Color | Hex | Usage | Tailwind Class |
|-------|-----|-------|----------------|
| **Header** | `#291058` | Dark purple for headers and main text | `bg-brand-header` `text-brand-header` |
| **Primary** | `#8C52FF` | Purple for buttons and CTAs | `bg-brand-primary` `text-brand-primary` |
| **Cyan Accent** | `#5CE1E6` | Cyan for accents and highlights | `bg-brand-accent` `text-brand-accent` |
| **Pink** | `#F81889` | Hot pink for titles and emphasis | `bg-brand-pink` `text-brand-pink` |
| **Peach** | `#FEB95F` | Warm peach for secondary accents | `bg-brand-peach` `text-brand-peach` |
| **Neutral 100** | `#CCD0E1` | Light neutral | `bg-brand-neutral-100` |
| **Neutral 200** | `#D9DCE8` | Neutral | `bg-brand-neutral-200` |
| **Neutral 300** | `#E5E7F0` | Lighter neutral | `bg-brand-neutral-300` |
| **Neutral 400** | `#F2F3F7` | Very light neutral | `bg-brand-neutral-400` |
| **Background** | `#F6F7FB` | Main site background | `bg-brand-bg` |

---

## 🚀 Quick Start

Visit **http://localhost:3000/design-system** to see all components and colors in action!

---

## 📦 Installed Packages

```json
{
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x",
  "daisyui": "latest",
  "@tailwindcss/typography": "latest",
  "@tailwindcss/forms": "latest"
}
```

---

## 🎯 DaisyUI Theme Configuration

Your custom "festival" theme is configured in `tailwind.config.js`:

```javascript
daisyui: {
  themes: [
    {
      festival: {
        "primary": "#8C52FF",        // Purple buttons
        "secondary": "#5CE1E6",      // Cyan accent
        "accent": "#FEB95F",         // Peach accent
        "neutral": "#291058",        // Dark header
        "base-100": "#F6F7FB",       // Main background
        // ... semantic colors
      },
    },
    "dark", // Dark mode available
  ],
}
```

---

## 💡 Usage Examples

### Buttons

```jsx
// DaisyUI Buttons
<button className="btn btn-primary">Buy Tickets</button>
<button className="btn btn-secondary">Learn More</button>
<button className="btn btn-accent">Sign Up</button>

// Custom Festival Buttons
<button className="btn-festival">Get Tickets Now!</button>
<button className="btn-festival-outline">More Info</button>
```

### Cards

```jsx
// DaisyUI Card
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Artist Name</h2>
    <p>Performance details...</p>
  </div>
</div>

// Custom Festival Card
<div className="card-festival">
  <h3 className="text-brand-primary">VIP Tickets</h3>
  <p>Premium experience...</p>
</div>
```

### Typography

```jsx
// Headings (automatically styled with pink)
<h1>Main Festival Title</h1>
<h2>Section Heading</h2>

// Gradient Text
<h1 className="gradient-text text-5xl">
  Summer Music Fest 2025
</h1>

// Accent Colors
<p className="text-brand-accent">Cyan highlight text</p>
<p className="text-brand-pink">Pink emphasis text</p>
```

### Layout

```jsx
// Section Container (max-width + padding)
<section className="section-container">
  <h2>Lineup</h2>
  {/* Content */}
</section>

// Gradient Background
<div className="gradient-bg p-12 text-white">
  <h2>Hero Section</h2>
</div>
```

### Forms

```jsx
<div className="form-control">
  <label className="label">
    <span className="label-text">Email</span>
  </label>
  <input 
    type="email" 
    className="input input-bordered input-primary" 
    placeholder="your@email.com" 
  />
</div>
```

### Badges & Tags

```jsx
<span className="badge badge-primary">Early Bird</span>
<span className="badge badge-secondary">Sold Out</span>
<span className="badge badge-accent">Limited</span>
```

### Alerts

```jsx
<div className="alert alert-info">
  <span>New lineup announcement!</span>
</div>

<div className="alert alert-warning">
  <span>Only 50 tickets remaining!</span>
</div>
```

---

## 🎨 Custom Utility Classes

### Glow Effects
```jsx
<div className="glow">Cyan glow effect</div>
<div className="glow-pink">Pink glow effect</div>
<div className="glow-purple">Purple glow effect</div>
```

### Glassmorphism
```jsx
<div className="glass p-6">
  Frosted glass effect
</div>
```

### Animations
```jsx
<div className="animate-float">Floating animation</div>
<button className="animate-pulse-glow">Pulsing glow</button>
```

### Text Effects
```jsx
<h1 className="text-shadow">Text with shadow</h1>
<h2 className="gradient-text">Gradient text</h2>
<h3 className="accent-underline">With accent underline</h3>
```

---

## 🏗️ Component Structure

```
frontend/
  /components/
    /ui/              # Reusable UI components
      Button.js
      Card.js
      Badge.js
    /festival/        # Festival-specific components
      ArtistCard.js
      TicketCard.js
      SponsorGrid.js
      LineupSection.js
    /layout/          # Layout components
      Header.js
      Footer.js
      Container.js
  /styles/
    globals.css       # Tailwind + custom styles
```

---

## 🎯 Design Principles

### 1. **Vibrant & Energetic**
- Use bold colors (pink, purple, cyan)
- Animated elements for engagement
- Glow effects for emphasis

### 2. **Modern & Clean**
- Ample white space
- Soft shadows and rounded corners
- Glassmorphism for overlays

### 3. **Mobile-First**
- Responsive by default
- Touch-friendly buttons (min 44x44px)
- Optimized images with Next.js Image

### 4. **Accessible**
- Sufficient color contrast
- ARIA labels on interactive elements
- Keyboard navigation support

---

## 📱 Responsive Breakpoints

```javascript
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px', // Extra large
```

**Usage:**
```jsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>
```

---

## 🎨 Color Usage Guidelines

### Header & Navigation
- Background: `bg-brand-header` (dark purple)
- Text: `text-white` or `text-brand-accent`

### Body Content
- Background: `bg-brand-bg` (light purple-white)
- Text: `text-brand-header` (dark purple)
- Headings: `text-brand-pink` (hot pink)

### Call-to-Actions
- Primary button: `btn btn-primary` (purple)
- Secondary button: `btn btn-secondary` (cyan)
- Accent button: `btn btn-accent` (peach)

### Highlights & Accents
- Important text: `text-brand-pink`
- Links: `text-brand-primary hover:text-brand-accent`
- Badges: Use semantic DaisyUI classes

---

## 🔧 Customization

### Adding New Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'brand': {
        // Add new colors here
        'custom': '#HEXCODE',
      }
    }
  }
}
```

### Creating Custom Components

Add to `styles/globals.css`:

```css
@layer components {
  .your-component {
    @apply bg-brand-primary text-white px-4 py-2 rounded-lg;
  }
}
```

---

## 📚 Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **DaisyUI Components**: https://daisyui.com/components/
- **Design System Page**: http://localhost:3000/design-system
- **Tailwind Cheat Sheet**: https://nerdcave.com/tailwind-cheat-sheet

---

## ✅ Best Practices

1. **Use Semantic Classes**: Prefer `btn btn-primary` over custom utilities
2. **Consistent Spacing**: Use Tailwind spacing scale (4px increments)
3. **Color Consistency**: Stick to brand colors, use semantic names
4. **Component Reusability**: Create components for repeated patterns
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Performance**: Use Next.js Image for all images
7. **Accessibility**: Test with keyboard and screen readers

---

## 🎉 Quick Component Recipes

### Artist Card
```jsx
<div className="card-festival">
  <Image src="/artists/name.jpg" width={400} height={400} alt="Artist" />
  <h3 className="text-brand-primary text-xl font-bold mt-4">Artist Name</h3>
  <p className="text-brand-header">Genre • Time</p>
  <button className="btn-festival mt-4">View Details</button>
</div>
```

### Ticket Card
```jsx
<div className="card-festival hover:scale-105 transition-transform">
  <span className="badge badge-accent mb-2">Popular</span>
  <h3 className="text-2xl font-bold text-brand-pink">General Admission</h3>
  <p className="text-4xl font-bold text-brand-primary my-4">$150</p>
  <ul className="text-brand-header space-y-2 mb-6">
    <li>✓ 3-Day Access</li>
    <li>✓ All Stages</li>
    <li>✓ Festival Merch</li>
  </ul>
  <button className="btn-festival w-full">Buy Now</button>
</div>
```

### Hero Section
```jsx
<section className="gradient-bg min-h-screen flex items-center">
  <div className="section-container text-center text-white">
    <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-float">
      Summer Fest 2025
    </h1>
    <p className="text-2xl text-brand-accent mb-8">
      July 15-17 • City, State
    </p>
    <button className="btn-festival btn-lg animate-pulse-glow">
      Get Tickets
    </button>
  </div>
</section>
```

---

**Design System Version:** 1.0  
**Last Updated:** November 6, 2025  
**Status:** ✅ Production Ready

