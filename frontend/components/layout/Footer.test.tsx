import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

it('renders the logo image', () => {
  render(<Footer />)
  expect(screen.getByAltText('Connect')).toBeInTheDocument()
})

it('renders all social media links', () => {
  render(<Footer />)
  expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', expect.stringContaining('instagram.com'))
  expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', expect.stringContaining('facebook.com'))
  expect(screen.getByLabelText('YouTube')).toHaveAttribute('href', expect.stringContaining('youtube.com'))
  expect(screen.getByLabelText('TikTok')).toHaveAttribute('href', expect.stringContaining('tiktok.com'))
})

it('renders footer nav links', () => {
  render(<Footer />)
  expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  expect(screen.getByText('Terms & Conditions')).toBeInTheDocument()
  expect(screen.getByText('Cookie Policy')).toBeInTheDocument()
  expect(screen.getByText('Contact')).toBeInTheDocument()
})

it('renders copyright text', () => {
  render(<Footer />)
  expect(screen.getByText(/Copyright 2025 Connect Events/)).toBeInTheDocument()
})

it('social links open in a new tab', () => {
  render(<Footer />)
  const instagramLink = screen.getByLabelText('Instagram')
  expect(instagramLink).toHaveAttribute('target', '_blank')
  expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer')
})
