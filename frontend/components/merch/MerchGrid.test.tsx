import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MerchGrid from './MerchGrid'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

function getLinkByText(text: string) {
  return screen.getByText(text).closest('a') as HTMLAnchorElement
}

function assertExternalLink(link: HTMLAnchorElement, expectedHref: string) {
  expect(link.href).toBe(expectedHref)
  expect(link.target).toBe('_blank')
  expect(link.rel).toContain('noopener')
  expect(link.rel).toContain('noreferrer')
}

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
  const shopAllLink = getLinkByText('Shop All on Bonfire')
  expect(shopAllLink.href).toContain('bonfire.com/store/beats-on-the-block')
  expect(shopAllLink.target).toBe('_blank')
})

// ── per-link click tests ───────────────────────────────────────────────────────

const LINK_CASES: [string, string][] = [
  ['BOTB 2026 Colorblast Tee', 'https://www.bonfire.com/botb-2026-colorblast-tee/'],
  ['BOTB 2026 Green Tee',      'https://www.bonfire.com/botb-2026-green-tee/'],
  ['Shop All on Bonfire',      'https://www.bonfire.com/store/beats-on-the-block/'],
]

it.each(LINK_CASES)('clicking "%s" opens the correct Bonfire page in a new tab', (label, expectedHref) => {
  render(<MerchGrid />)
  const link = getLinkByText(label)
  fireEvent.click(link)
  assertExternalLink(link, expectedHref)
})
