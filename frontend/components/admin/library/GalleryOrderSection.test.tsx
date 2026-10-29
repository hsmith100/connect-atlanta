import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { LibraryPhoto, PhotoCollection } from '@shared/types/store'
import { GalleryOrderSection } from './GalleryOrderSection'
import { getGalleryPhotos, updateLibraryPhotos } from '../../../lib/api/adminLibrary'

jest.mock('../../../lib/api/adminLibrary')

const collections = [{ id: 'c1', title: 'Aug Fest' }, { id: 'c2', title: 'June Fest' }] as PhotoCollection[]
const photo = (id: string, collectionId: string) => ({ id, collectionId, originalFilename: `${id}.jpg`, webThumbUrl: `https://m/${id}.jpg` }) as LibraryPhoto

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(updateLibraryPhotos).mockResolvedValue()
})

it('shows gallery photos in order with their event titles', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  expect(await screen.findByText('1. Aug Fest')).toBeInTheDocument()
  expect(screen.getByText('2. June Fest')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Save order' })).toBeDisabled()
})

it('reorders and saves gallerySortOrder for every photo', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  fireEvent.click(screen.getByLabelText('Move a.jpg later'))
  expect(screen.getByText('1. June Fest')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save order' }))
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [
    { id: 'b', gallerySortOrder: 10 }, { id: 'a', gallerySortOrder: 20 },
  ]))
  expect(await screen.findByText('Gallery order saved.')).toBeInTheDocument()
})

it('removes a photo from the gallery', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
  await waitFor(() => expect(screen.queryByAltText('a.jpg')).not.toBeInTheDocument())
  expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'a', inGallery: false }])
})

it('shows an empty state', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  expect(await screen.findByText(/No photos are in the gallery/)).toBeInTheDocument()
})

it('shows a readable error when loading fails', async () => {
  jest.mocked(getGalleryPhotos).mockRejectedValue(new Error('HTTP 500'))
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the gallery')
})
