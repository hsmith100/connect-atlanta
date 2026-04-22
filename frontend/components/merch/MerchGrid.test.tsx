import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MerchGrid from './MerchGrid'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

it('matches snapshot', () => {
  const { container } = render(<MerchGrid />)
  expect(container).toMatchSnapshot()
})

it('renders all merch items', () => {
  render(<MerchGrid />)
  expect(screen.getByText('BOTB 2026 Colorblast Tee')).toBeInTheDocument()
  expect(screen.getByText('BOTB 2026 Green Tee')).toBeInTheDocument()
})

it('each item links to bonfire.com and opens in a new tab', () => {
  render(<MerchGrid />)
  const links = screen.getAllByRole('link') as HTMLAnchorElement[]
  const productLinks = links.filter(l => l.href.includes('bonfire.com'))
  expect(productLinks.length).toBeGreaterThan(0)
  expect(productLinks.every(l => l.target === '_blank')).toBe(true)
})

it('includes a Shop All link to the Bonfire store', () => {
  render(<MerchGrid />)
  const shopAllLink = screen.getByText('Shop All on Bonfire').closest('a') as HTMLAnchorElement
  expect(shopAllLink.href).toContain('bonfire.com/store/beats-on-the-block')
  expect(shopAllLink.target).toBe('_blank')
})

// ── per-link click tests ───────────────────────────────────────────────────────

it('clicking the Colorblast Tee card opens the correct Bonfire product page in a new tab', () => {
  render(<MerchGrid />)
  const link = screen.getByText('BOTB 2026 Colorblast Tee').closest('a') as HTMLAnchorElement
  fireEvent.click(link)
  expect(link.href).toBe('https://www.bonfire.com/botb-2026-colorblast-tee/')
  expect(link.target).toBe('_blank')
  expect(link.rel).toContain('noopener')
  expect(link.rel).toContain('noreferrer')
})

it('clicking the Green Tee card opens the correct Bonfire product page in a new tab', () => {
  render(<MerchGrid />)
  const link = screen.getByText('BOTB 2026 Green Tee').closest('a') as HTMLAnchorElement
  fireEvent.click(link)
  expect(link.href).toBe('https://www.bonfire.com/botb-2026-green-tee/')
  expect(link.target).toBe('_blank')
  expect(link.rel).toContain('noopener')
  expect(link.rel).toContain('noreferrer')
})

it('clicking Shop All on Bonfire opens the store page in a new tab', () => {
  render(<MerchGrid />)
  const link = screen.getByText('Shop All on Bonfire').closest('a') as HTMLAnchorElement
  fireEvent.click(link)
  expect(link.href).toBe('https://www.bonfire.com/store/beats-on-the-block/')
  expect(link.target).toBe('_blank')
  expect(link.rel).toContain('noopener')
  expect(link.rel).toContain('noreferrer')
})
