import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubmissionsTab } from './SubmissionsTab'

// Mock all three section components so we can test tab switching in isolation
jest.mock('./submissions/ArtistsSection', () => ({
  ArtistsSection: () => <div data-testid="artists-section" />,
}))
jest.mock('./submissions/SponsorsSection', () => ({
  SponsorsSection: () => <div data-testid="sponsors-section" />,
}))
jest.mock('./submissions/EmailSignupsSection', () => ({
  EmailSignupsSection: () => <div data-testid="signups-section" />,
}))

const defaultProps = {
  adminKey: 'test-key',
  artists: [],
  sponsors: [],
  emailSignups: [],
}

it('renders all three sub-tab buttons', () => {
  render(<SubmissionsTab {...defaultProps} />)
  expect(screen.getByRole('button', { name: /dj applications/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sponsor inquiries/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /contacts & signups/i })).toBeInTheDocument()
})

it('shows ArtistsSection by default', () => {
  render(<SubmissionsTab {...defaultProps} />)
  expect(screen.getByTestId('artists-section')).toBeInTheDocument()
  expect(screen.queryByTestId('sponsors-section')).not.toBeInTheDocument()
  expect(screen.queryByTestId('signups-section')).not.toBeInTheDocument()
})

it('switches to SponsorsSection when Sponsor Inquiries is clicked', () => {
  render(<SubmissionsTab {...defaultProps} />)
  fireEvent.click(screen.getByRole('button', { name: /sponsor inquiries/i }))
  expect(screen.getByTestId('sponsors-section')).toBeInTheDocument()
  expect(screen.queryByTestId('artists-section')).not.toBeInTheDocument()
})

it('switches to EmailSignupsSection when Contacts & Signups is clicked', () => {
  render(<SubmissionsTab {...defaultProps} />)
  fireEvent.click(screen.getByRole('button', { name: /contacts & signups/i }))
  expect(screen.getByTestId('signups-section')).toBeInTheDocument()
  expect(screen.queryByTestId('artists-section')).not.toBeInTheDocument()
})

it('switches back to ArtistsSection when DJ Applications is clicked', () => {
  render(<SubmissionsTab {...defaultProps} />)
  fireEvent.click(screen.getByRole('button', { name: /sponsor inquiries/i }))
  fireEvent.click(screen.getByRole('button', { name: /dj applications/i }))
  expect(screen.getByTestId('artists-section')).toBeInTheDocument()
})
