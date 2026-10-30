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
  expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument()
})

const dataTransfer = () => ({ setData: jest.fn(), effectAllowed: '' })

function drag(fromId: string, overId: string) {
  const dt = dataTransfer()
  fireEvent.dragStart(screen.getByTestId(`gallery-item-${fromId}`), { dataTransfer: dt })
  fireEvent.dragOver(screen.getByTestId(`gallery-item-${overId}`), { dataTransfer: dt })
  fireEvent.drop(screen.getByTestId(`gallery-item-${overId}`), { dataTransfer: dt })
  fireEvent.dragEnd(screen.getByTestId(`gallery-item-${fromId}`), { dataTransfer: dt })
  return dt
}

function order() {
  return screen.getAllByTestId(/^gallery-item-/).map((el) => el.dataset.testid!.replace('gallery-item-', ''))
}

it('saves the new order automatically when a photo is dropped', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  const dt = drag('a', 'b')
  expect(dt.setData).toHaveBeenCalledWith('text/plain', 'a')
  expect(screen.getByText('1. June Fest')).toBeInTheDocument()
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [
    { id: 'b', gallerySortOrder: 10 }, { id: 'a', gallerySortOrder: 20 },
  ]))
  expect(await screen.findByText('Gallery order saved.')).toBeInTheDocument()
})

it('moves a photo from the end to the front through the items in between', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c1'), photo('c', 'c1')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  const dt = dataTransfer()
  fireEvent.dragStart(screen.getByTestId('gallery-item-c'), { dataTransfer: dt })
  fireEvent.dragOver(screen.getByTestId('gallery-item-b'), { dataTransfer: dt })
  fireEvent.dragOver(screen.getByTestId('gallery-item-a'), { dataTransfer: dt })
  // Hovering over items mid-drag doesn't save; only the drop does, once.
  expect(updateLibraryPhotos).not.toHaveBeenCalled()
  fireEvent.dragEnd(screen.getByTestId('gallery-item-c'), { dataTransfer: dt })
  expect(order()).toEqual(['c', 'a', 'b'])
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledTimes(1))
  expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [
    { id: 'c', gallerySortOrder: 10 }, { id: 'a', gallerySortOrder: 20 }, { id: 'b', gallerySortOrder: 30 },
  ])
})

it('restores the previous order and explains when saving fails', async () => {
  jest.mocked(updateLibraryPhotos).mockRejectedValue(new Error('HTTP 500'))
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  drag('a', 'b')
  expect(await screen.findByRole('alert')).toHaveTextContent('The previous order was restored.')
  expect(order()).toEqual(['a', 'b'])
})

it('does nothing when a photo is dropped on itself', async () => {
  jest.mocked(getGalleryPhotos).mockResolvedValue([photo('a', 'c1'), photo('b', 'c2')])
  render(<GalleryOrderSection adminKey="k" collections={collections} />)
  await screen.findByText('1. Aug Fest')
  drag('a', 'a')
  expect(order()).toEqual(['a', 'b'])
  expect(updateLibraryPhotos).not.toHaveBeenCalled()
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
