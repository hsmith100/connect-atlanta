import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StoreTab } from './StoreTab'
import { getPhotographers, getStoreCollections } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminStore')
jest.mock('./CollectionsSection', () => ({ CollectionsSection: () => <div data-testid="store-collections" /> }))
jest.mock('./UploadSection', () => ({ UploadSection: () => <div data-testid="store-upload" /> }))
jest.mock('./PhotographersSection', () => ({ PhotographersSection: () => <div data-testid="store-photographers" /> }))

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getPhotographers).mockResolvedValue([])
  jest.mocked(getStoreCollections).mockResolvedValue([])
})

it('renders all five sub-tab buttons', () => {
  render(<StoreTab adminKey="k" events={[]} />)
  for (const name of ['Collections', 'Upload', 'Orders', 'Photographers', 'Settings']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  }
})

it('loads photographers and collections, then shows Collections by default', async () => {
  render(<StoreTab adminKey="k" events={[]} />)
  expect(screen.getByText(/Loading store/)).toBeInTheDocument()
  expect(await screen.findByTestId('store-collections')).toBeInTheDocument()
  expect(getPhotographers).toHaveBeenCalledWith('k')
  expect(getStoreCollections).toHaveBeenCalledWith('k')
})

it('switches sub-sections when a sub-tab is clicked', async () => {
  render(<StoreTab adminKey="k" events={[]} />)
  await screen.findByTestId('store-collections')
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
  expect(screen.getByTestId('store-upload')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Photographers' }))
  expect(screen.getByTestId('store-photographers')).toBeInTheDocument()
  expect(screen.queryByTestId('store-collections')).not.toBeInTheDocument()
})

it('shows a readable error when loading fails', async () => {
  jest.mocked(getStoreCollections).mockRejectedValue(new Error('HTTP 500'))
  render(<StoreTab adminKey="k" events={[]} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the store')
})
