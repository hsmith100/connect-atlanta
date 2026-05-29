import React from 'react'
import { render, screen } from '@testing-library/react'
import SecretLineup from './secret-lineup'

const mockSEO = jest.fn(() => null)

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, ...rest }: any) => <a href={href} onClick={onClick} {...rest}>{children}</a>,
}))

jest.mock('../components/layout/Header', () => ({ __esModule: true, default: () => <header data-testid="header" /> }))
jest.mock('../components/layout/Footer', () => ({ __esModule: true, default: () => <footer data-testid="footer" /> }))
jest.mock('../components/shared/SEO', () => ({
  __esModule: true,
  default: (props: any) => { mockSEO(props); return null },
}))

beforeEach(() => mockSEO.mockClear())

// ── smoke ──────────────────────────────────────────────────────────────────────

it('renders without crashing', () => {
  const { container } = render(<SecretLineup />)
  expect(container).toBeTruthy()
})

it('renders the header and footer', () => {
  render(<SecretLineup />)
  expect(screen.getByTestId('header')).toBeInTheDocument()
  expect(screen.getByTestId('footer')).toBeInTheDocument()
})

// ── title ──────────────────────────────────────────────────────────────────────

it('renders the Secret Lineup heading', () => {
  render(<SecretLineup />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Secret Lineup')
})

// ── seo ────────────────────────────────────────────────────────────────────────

describe('SEO', () => {
  it('passes noindex=true to the SEO component', () => {
    render(<SecretLineup />)
    expect(mockSEO).toHaveBeenCalledWith(
      expect.objectContaining({ noindex: true }),
    )
  })

  it('sets the correct page title', () => {
    render(<SecretLineup />)
    expect(mockSEO).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Secret Lineup | Beats on the Block' }),
    )
  })
})

// ── ahs sponsor section ────────────────────────────────────────────────────────

describe('AHS sponsor section', () => {
  it('renders the AHS logo with correct alt text', () => {
    render(<SecretLineup />)
    expect(screen.getByAltText('Presented by Advanced Health Solutions')).toBeInTheDocument()
  })

  it('AHS logo src points to the correct asset', () => {
    render(<SecretLineup />)
    const logo = screen.getByAltText('Presented by Advanced Health Solutions') as HTMLImageElement
    expect(logo.src).toContain('Sponsor%20Logos%202026/2.png')
  })

  it('renders the opening blurb paragraph', () => {
    render(<SecretLineup />)
    expect(screen.getByText(/thrilled to partner with Advanced Health Solutions/i)).toBeInTheDocument()
  })

  it('renders the zero out of pocket costs paragraph', () => {
    render(<SecretLineup />)
    expect(screen.getByText(/zero out of pocket costs/i)).toBeInTheDocument()
  })

  it('renders the closing line', () => {
    render(<SecretLineup />)
    expect(screen.getByText(/pretty cool if you ask us/i)).toBeInTheDocument()
  })
})

// ── ahs link ───────────────────────────────────────────────────────────────────

describe('AHS external link', () => {
  it('renders a link to ahsdoctors.com', () => {
    render(<SecretLineup />)
    const link = screen.getByRole('link', { name: /visit advanced health solutions/i }) as HTMLAnchorElement
    expect(link.href).toBe('https://ahsdoctors.com/')
  })

  it('opens in a new tab', () => {
    render(<SecretLineup />)
    const link = screen.getByRole('link', { name: /visit advanced health solutions/i }) as HTMLAnchorElement
    expect(link.target).toBe('_blank')
  })

  it('has noopener noreferrer rel attribute', () => {
    render(<SecretLineup />)
    const link = screen.getByRole('link', { name: /visit advanced health solutions/i }) as HTMLAnchorElement
    expect(link.rel).toContain('noopener')
    expect(link.rel).toContain('noreferrer')
  })
})

// ── lineup image ───────────────────────────────────────────────────────────────

describe('lineup image', () => {
  it('renders the lineup image', () => {
    render(<SecretLineup />)
    expect(screen.getByAltText(/official beats on the block.*performer lineup/i)).toBeInTheDocument()
  })

  it('lineup image src points to the correct asset', () => {
    render(<SecretLineup />)
    const img = screen.getByAltText(/official beats on the block.*performer lineup/i) as HTMLImageElement
    expect(img.src).toContain('Final%20Lineup.png')
  })
})

// ── nav exclusion ──────────────────────────────────────────────────────────────

it('does not contain any link to /secret-lineup within the page content', () => {
  const { container } = render(<SecretLineup />)
  const allLinks = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[]
  const secretLinks = allLinks.filter(a => a.href.includes('secret-lineup'))
  expect(secretLinks).toHaveLength(0)
})
