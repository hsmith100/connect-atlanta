import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import JoinMovementCTA from './JoinMovementCTA'

jest.mock('../shared/ConnectModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="connect-modal"><button onClick={onClose}>Close</button></div> : null,
}))

it('does not show the modal initially', () => {
  render(<JoinMovementCTA />)
  expect(screen.queryByTestId('connect-modal')).not.toBeInTheDocument()
})

it('opens the modal when the CTA button is clicked', () => {
  render(<JoinMovementCTA />)
  fireEvent.click(screen.getByRole('button', { name: /connect with us/i }))
  expect(screen.getByTestId('connect-modal')).toBeInTheDocument()
})

it('closes the modal when onClose is called', () => {
  render(<JoinMovementCTA />)
  fireEvent.click(screen.getByRole('button', { name: /connect with us/i }))
  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  expect(screen.queryByTestId('connect-modal')).not.toBeInTheDocument()
})
