import React from 'react'
import { render } from '@testing-library/react'
import SEO from './SEO'

// Render Head children into the document body so we can query them
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function getMeta(name: string) {
  return document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
}

function getMetaProp(property: string) {
  return document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
}

afterEach(() => {
  // Clean up injected head elements between tests
  document.head.innerHTML = ''
})

// ── defaults ───────────────────────────────────────────────────────────────────

describe('defaults', () => {
  it('renders the default title', () => {
    render(<SEO />)
    expect(document.title).toContain('Connect Events')
  })

  it('renders the default description meta tag', () => {
    render(<SEO />)
    expect(getMeta('description')?.content).toContain("Atlanta's premier FREE")
  })

  it('renders robots as index/follow by default', () => {
    render(<SEO />)
    expect(getMeta('robots')?.content).toContain('index, follow')
  })
})

// ── custom props ───────────────────────────────────────────────────────────────

describe('custom props', () => {
  it('uses the provided title', () => {
    render(<SEO title="Custom Page Title" />)
    expect(document.title).toBe('Custom Page Title')
  })

  it('uses the provided description', () => {
    render(<SEO description="My custom description" />)
    expect(getMeta('description')?.content).toBe('My custom description')
  })

  it('uses the provided canonical URL', () => {
    render(<SEO canonicalUrl="https://connectevents.co/about" />)
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    expect(canonical?.href).toBe('https://connectevents.co/about')
  })
})

// ── noindex ────────────────────────────────────────────────────────────────────

describe('noindex', () => {
  it('renders noindex meta when noindex=true', () => {
    render(<SEO noindex />)
    expect(getMeta('robots')?.content).toBe('noindex, nofollow')
  })
})

// ── open graph ─────────────────────────────────────────────────────────────────

describe('open graph', () => {
  it('sets og:title from the title prop', () => {
    render(<SEO title="OG Title Test" />)
    expect(getMetaProp('og:title')?.content).toBe('OG Title Test')
  })

  it('sets og:description from the description prop', () => {
    render(<SEO description="OG desc" />)
    expect(getMetaProp('og:description')?.content).toBe('OG desc')
  })
})

// ── structured data ────────────────────────────────────────────────────────────

describe('structured data', () => {
  it('renders a JSON-LD script tag when structuredData is provided', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Test' }
    render(<SEO structuredData={data} />)
    const script = document.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    expect(JSON.parse(script!.innerHTML)).toMatchObject({ name: 'Test' })
  })

  it('does not render a JSON-LD script when structuredData is null', () => {
    render(<SEO structuredData={null} />)
    expect(document.querySelector('script[type="application/ld+json"]')).not.toBeInTheDocument()
  })
})
