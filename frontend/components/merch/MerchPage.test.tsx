import React from 'react'
import { render, screen } from '@testing-library/react'
import Merch from '../../pages/merch'

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

// ── smoke ──────────────────────────────────────────────────────────────────────

it('renders without crashing', () => {
  const { container } = render(<Merch />)
  expect(container).toBeTruthy()
})

it('renders the Merch heading', () => {
  render(<Merch />)
  expect(screen.getByText('Merch')).toBeInTheDocument()
})

it('renders the header and footer', () => {
  render(<Merch />)
  expect(screen.getByTestId('header')).toBeInTheDocument()
  expect(screen.getByTestId('footer')).toBeInTheDocument()
})

it('renders both product cards', () => {
  render(<Merch />)
  expect(screen.getByText('BOTB 2026 Colorblast Tee')).toBeInTheDocument()
  expect(screen.getByText('BOTB 2026 Green Tee')).toBeInTheDocument()
})

it('renders the Shop All on Bonfire link', () => {
  render(<Merch />)
  expect(screen.getByText('Shop All on Bonfire')).toBeInTheDocument()
})

it('contains no links to the old Fourthwall store', () => {
  const { container } = render(<Merch />)
  expect(container.innerHTML).not.toContain('fourthwall.com')
})

// ── link targets ───────────────────────────────────────────────────────────────

it('all external links open in a new tab with noopener noreferrer', () => {
  render(<Merch />)
  const links = Array.from(document.querySelectorAll('a[href^="https"]')) as HTMLAnchorElement[]
  expect(links.length).toBeGreaterThan(0)
  links.forEach((link) => {
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
    expect(link.rel).toContain('noreferrer')
  })
})
