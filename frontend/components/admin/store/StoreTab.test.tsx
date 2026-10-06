import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StoreTab } from './StoreTab'

it('renders all five sub-tab buttons', () => {
  render(<StoreTab adminKey="test-key" />)
  for (const name of ['Collections', 'Upload', 'Orders', 'Photographers', 'Settings']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  }
})

it('shows Collections by default', () => {
  render(<StoreTab adminKey="test-key" />)
  expect(screen.getByTestId('store-collections')).toBeInTheDocument()
})

it('switches sub-sections when a sub-tab is clicked', () => {
  render(<StoreTab adminKey="test-key" />)
  fireEvent.click(screen.getByRole('button', { name: 'Orders' }))
  expect(screen.getByTestId('store-orders')).toBeInTheDocument()
  expect(screen.queryByTestId('store-collections')).not.toBeInTheDocument()
})
