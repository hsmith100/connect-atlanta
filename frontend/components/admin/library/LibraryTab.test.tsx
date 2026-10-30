import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LibraryTab } from './LibraryTab'
import { getPhotoCollections } from '../../../lib/api/adminLibrary'
import { getPhotographers } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminLibrary')
jest.mock('../../../lib/api/adminStore')
jest.mock('./CollectionsSection', () => ({ CollectionsSection: () => <div data-testid="collections" /> }))
jest.mock('./GalleryOrderSection', () => ({ GalleryOrderSection: () => <div data-testid="gallery-order" /> }))

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getPhotographers).mockResolvedValue([])
  jest.mocked(getPhotoCollections).mockResolvedValue([])
})

it('loads collections and photographers, then shows Collections', async () => {
  render(<LibraryTab adminKey="k" events={[]} />)
  expect(screen.getByText(/Loading photos/)).toBeInTheDocument()
  expect(await screen.findByTestId('collections')).toBeInTheDocument()
  expect(getPhotoCollections).toHaveBeenCalledWith('k')
  expect(getPhotographers).toHaveBeenCalledWith('k')
})

it('switches to Gallery order', async () => {
  render(<LibraryTab adminKey="k" events={[]} />)
  await screen.findByTestId('collections')
  fireEvent.click(screen.getByRole('button', { name: 'Gallery order' }))
  expect(screen.getByTestId('gallery-order')).toBeInTheDocument()
})

it('shows a readable error when loading fails', async () => {
  jest.mocked(getPhotoCollections).mockRejectedValue(new Error('HTTP 500'))
  render(<LibraryTab adminKey="k" events={[]} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load photos')
})
