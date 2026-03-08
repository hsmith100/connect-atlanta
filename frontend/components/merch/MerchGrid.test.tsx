import React from 'react'
import { render, screen } from '@testing-library/react'
import MerchGrid from './MerchGrid'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

it('matches snapshot', () => {
  const { container } = render(<MerchGrid />)
  expect(container).toMatchSnapshot()
})

it('renders all five merch items', () => {
  render(<MerchGrid />)
  expect(screen.getByText('Beats on the Beltline 2025 White Tee')).toBeInTheDocument()
  expect(screen.getByText('Beats on the Beltline 2025 Black Retro Tee')).toBeInTheDocument()
  expect(screen.getByText('Beats on the Beltline 2025 Disco Tee')).toBeInTheDocument()
  expect(screen.getByText('Beats on the Beltline Circle Sticker')).toBeInTheDocument()
  expect(screen.getByText('Beats on the Beltline Block Sticker')).toBeInTheDocument()
})

it('each item links to the correct external URL', () => {
  render(<MerchGrid />)
  const links = screen.getAllByRole('link') as HTMLAnchorElement[]
  expect(links.every(l => l.href.includes('fourthwall.com'))).toBe(true)
  expect(links.every(l => l.target === '_blank')).toBe(true)
})
