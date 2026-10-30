import React from 'react'
import { render, screen } from '@testing-library/react'
import Shop from '../../pages/shop'
import MerchRedirect from '../../pages/merch'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, ...rest }: any) => <a href={href} onClick={onClick} {...rest}>{children}</a>,
}))

jest.mock('../../components/layout/Header', () => ({ __esModule: true, default: () => <header data-testid="header" /> }))
jest.mock('../../components/layout/Footer', () => ({ __esModule: true, default: () => <footer data-testid="footer" /> }))
jest.mock('../../components/shared/SEO', () => ({ __esModule: true, default: () => null }))
jest.mock('./EventPhotosSection', () => ({ __esModule: true, default: () => <section data-testid="event-photos" /> }))

const replace = jest.fn()
jest.mock('next/router', () => ({ useRouter: () => ({ replace }) }))
jest.mock('next/head', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

// ── smoke ──────────────────────────────────────────────────────────────────────

it('renders without crashing', () => {
  const { container } = render(<Shop />)
  expect(container).toBeTruthy()
})

it('renders the Shop heading with Merch and Event Photos sections', () => {
  render(<Shop />)
  expect(screen.getByRole('heading', { level: 1, name: 'Shop' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Merch' })).toBeInTheDocument()
  expect(screen.getByText(/Checkout on our merch store/)).toBeInTheDocument()
  expect(screen.getByTestId('event-photos')).toBeInTheDocument()
})

it('renders the header and footer', () => {
  render(<Shop />)
  expect(screen.getByTestId('header')).toBeInTheDocument()
  expect(screen.getByTestId('footer')).toBeInTheDocument()
})

it('renders both product cards', () => {
  render(<Shop />)
  expect(screen.getByText('BOTB 2026 Colorblast Tee')).toBeInTheDocument()
  expect(screen.getByText('BOTB 2026 Green Tee')).toBeInTheDocument()
})

it('renders the Shop All on Bonfire link', () => {
  render(<Shop />)
  expect(screen.getByText('Shop All on Bonfire')).toBeInTheDocument()
})

it('contains no links to the old Fourthwall store', () => {
  const { container } = render(<Shop />)
  expect(container.innerHTML).not.toContain('fourthwall.com')
})

// ── link targets ───────────────────────────────────────────────────────────────

it('all external links open in a new tab with noopener noreferrer', () => {
  render(<Shop />)
  const links = Array.from(document.querySelectorAll('a[href^="https"]')) as HTMLAnchorElement[]
  expect(links.length).toBeGreaterThan(0)
  links.forEach((link) => {
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
    expect(link.rel).toContain('noreferrer')
  })
})

// ── /merch redirect ────────────────────────────────────────────────────────────

describe('/merch', () => {
  beforeEach(() => replace.mockClear())

  it('redirects to /shop', () => {
    render(<MerchRedirect />)
    expect(replace).toHaveBeenCalledWith('/shop')
  })

  it('shows a link to the Shop in case the redirect does not run', () => {
    render(<MerchRedirect />)
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop')
  })
})
