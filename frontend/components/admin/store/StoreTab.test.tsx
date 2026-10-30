import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StoreTab } from './StoreTab'
import { getPhotographers } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminStore')
jest.mock('./PhotographersSection', () => ({ PhotographersSection: () => <div data-testid="store-photographers" /> }))

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getPhotographers).mockResolvedValue([])
})

it('shows only the selling sub-tabs', () => {
  render(<StoreTab adminKey="k" />)
  for (const name of ['Orders', 'Photographers', 'Settings']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  }
  expect(screen.queryByRole('button', { name: 'Collections' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
})

it('loads photographers and shows Orders by default', async () => {
  render(<StoreTab adminKey="k" />)
  expect(await screen.findByTestId('store-orders')).toBeInTheDocument()
  expect(getPhotographers).toHaveBeenCalledWith('k')
})

it('switches to Photographers', async () => {
  render(<StoreTab adminKey="k" />)
  await screen.findByTestId('store-orders')
  fireEvent.click(screen.getByRole('button', { name: 'Photographers' }))
  expect(screen.getByTestId('store-photographers')).toBeInTheDocument()
})

it('shows a readable error when loading fails', async () => {
  jest.mocked(getPhotographers).mockRejectedValue(new Error('HTTP 500'))
  render(<StoreTab adminKey="k" />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the store')
})
