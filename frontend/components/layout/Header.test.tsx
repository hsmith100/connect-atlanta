import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'
import { StoreCartProvider } from '../../lib/store/cartContext'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, ...rest }: any) => (
    <a href={href} onClick={onClick} {...rest}>{children}</a>
  ),
}))

// ── nav links ──────────────────────────────────────────────────────────────────

describe('desktop nav', () => {
  it('renders all navigation links', () => {
    render(<Header />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('Apply')).toBeInTheDocument()
    expect(screen.getByText('Shop')).toBeInTheDocument()
    expect(screen.getByText('Shop').closest('a')).toHaveAttribute('href', '/shop')
    expect(screen.queryByText('Merch')).not.toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders the logo image', () => {
    render(<Header />)
    expect(screen.getByAltText('Beats on the Block')).toBeInTheDocument()
  })
})

// ── mobile menu ────────────────────────────────────────────────────────────────

describe('mobile menu', () => {
  it('is hidden initially', () => {
    render(<Header />)
    // Mobile dropdown renders a duplicate set of links only when open
    const homeLinks = screen.getAllByText('Home')
    // Only the desktop link is visible (mobile menu is not mounted)
    expect(homeLinks).toHaveLength(1)
  })

  it('opens when the hamburger button is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Toggle mobile menu'))
    // Both desktop and mobile duplicate links appear
    expect(screen.getAllByText('Home')).toHaveLength(2)
  })

  it('closes when the hamburger button is clicked again', () => {
    render(<Header />)
    const toggle = screen.getByLabelText('Toggle mobile menu')
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(screen.getAllByText('Home')).toHaveLength(1)
  })

  it('closes when a mobile menu link is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Toggle mobile menu'))
    // Click one of the mobile menu links (getAllByText returns [desktop, mobile])
    const aboutLinks = screen.getAllByText('About')
    fireEvent.click(aboutLinks[1]) // mobile link
    expect(screen.getAllByText('Home')).toHaveLength(1)
  })
})

// ── mobile dual logo ───────────────────────────────────────────────────────────

describe('mobile dual logo', () => {
  it('renders the BOTB pulse icon alongside the connect logo', () => {
    render(<Header />)
    expect(screen.getByAltText('Beats on the Block icon')).toBeInTheDocument()
  })

  it('BOTB icon has md:hidden so it is only shown on mobile', () => {
    render(<Header />)
    const icon = screen.getByAltText('Beats on the Block icon')
    expect(icon.className).toContain('md:hidden')
  })

  it('renders a divider element between the two logos', () => {
    const { container } = render(<Header />)
    const divider = container.querySelector('span.md\\:hidden.w-px')
    expect(divider).toBeInTheDocument()
  })
})

// ── photo cart ─────────────────────────────────────────────────────────────────

describe('photo cart icon', () => {
  beforeEach(() => window.localStorage.clear())

  it('is hidden when the cart is empty', () => {
    render(<StoreCartProvider><Header /></StoreCartProvider>)
    expect(screen.queryByLabelText(/Photo cart/)).not.toBeInTheDocument()
  })

  it('shows the count and links to the cart when photos are in it', () => {
    window.localStorage.setItem('bob_photo_cart', JSON.stringify([
      { photoId: 'a', collectionId: 'c1', thumbnailUrl: 't' },
      { photoId: 'b', collectionId: 'c1', thumbnailUrl: 't' },
    ]))
    render(<StoreCartProvider><Header /></StoreCartProvider>)
    const links = screen.getAllByLabelText('Photo cart, 2 photos')
    expect(links.length).toBeGreaterThan(0)
    links.forEach((l) => expect(l).toHaveAttribute('href', '/shop/cart'))
  })
})
