import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { Photographer, PhotoCollection, LibraryPhoto } from '@shared/types/store'
import { CollectionDetail, dollarsToCents } from './CollectionDetail'
import {
  getCollectionPhotos, updatePhotoCollection, updateLibraryPhotos, deleteLibraryPhotos,
} from '../../../lib/api/adminLibrary'
import { ApiError } from '../../../lib/api/client'
import { replaceLibraryPhoto } from '../../../lib/library/uploadLibraryPhoto'

jest.mock('../../../lib/api/adminLibrary')
jest.mock('../../../lib/library/uploadLibraryPhoto')
jest.mock('./PhotoUploader', () => ({
  PhotoUploader: ({ onUploaded }: { onUploaded: () => void }) => <button onClick={onUploaded}>mock-upload-done</button>,
}))

const jay: Photographer = {
  id: 'ph1', name: 'Jay', email: 'j@x.com', commissionPct: 40, active: true,
  stripeAccountId: null, payoutsReady: false, owedCents: 0, createdAt: '', updatedAt: '',
}
const maria: Photographer = { ...jay, id: 'ph2', name: 'Maria' }
const collection: PhotoCollection = {
  id: 'c1', entity: 'COLLECTION', eventId: 'e1', title: 'Aug 2026', eventDate: '2026-08-15', status: 'draft',
  defaultPriceCents: 1500, defaultPhotographerId: 'ph1', coverPhotoId: null, photoCount: 2, forSaleCount: 2, createdAt: '', updatedAt: '',
}
function photo(id: string, sortOrder: number, extra: Partial<LibraryPhoto> = {}): LibraryPhoto {
  return {
    id, collectionId: 'c1', sortOrder, originalKey: `originals/${id}.jpg`, originalFilename: `${id}.jpg`,
    originalBytes: 1, width: 1, height: 1, contentHash: `h-${id}`, webUrl: '', webThumbUrl: '', previewUrl: '', thumbnailUrl: `https://m/${id}.jpg`,
    photographerId: 'ph1', priceOverrideCents: null, forSale: true, inGallery: false, removed: false, gallerySortOrder: 0,
    createdAt: '', updatedAt: '', ...extra,
  }
}

function setup(photos = [photo('a', 10), photo('b', 20)], col = collection) {
  jest.mocked(getCollectionPhotos).mockResolvedValue(photos)
  const onChange = jest.fn()
  const onRefresh = jest.fn()
  const onBack = jest.fn()
  render(
    <CollectionDetail adminKey="k" collection={col} photographers={[jay, maria]} onChange={onChange} onRefresh={onRefresh} onBack={onBack} />,
  )
  return { onChange, onRefresh, onBack }
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(updateLibraryPhotos).mockResolvedValue()
})

describe('dollarsToCents', () => {
  it.each([['15', 1500], ['15.5', 1550], ['$0.50', 50], ['19.999', 2000]])('%s → %i', (v, c) => expect(dollarsToCents(v)).toBe(c))
  it.each(['', '0.49', 'abc', '-5'])('%s → null', (v) => expect(dollarsToCents(v)).toBeNull())
})

it('loads and shows photos with price and photographer', async () => {
  setup([photo('a', 10), photo('b', 20, { priceOverrideCents: 2500, photographerId: 'ph2' })])
  expect(await screen.findByText('a.jpg')).toBeInTheDocument()
  expect(screen.getByText(/\$15\.00/)).toBeInTheDocument()
  expect(screen.getByText(/\$25\.00/)).toBeInTheDocument()
  expect(screen.getByText('custom')).toBeInTheDocument()
  expect(within(screen.getByRole('list')).getByText(/Maria/)).toBeInTheDocument()
})

it('shows an empty state', async () => {
  setup([])
  expect(await screen.findByText(/No photos yet/)).toBeInTheDocument()
})

it('does not show removed photos', async () => {
  setup([photo('a', 10), photo('gone', 20, { removed: true })])
  await screen.findByText('a.jpg')
  expect(screen.queryByText('gone.jpg')).not.toBeInTheDocument()
})

it('lists publish problems from a 422', async () => {
  jest.mocked(updatePhotoCollection).mockRejectedValue(new ApiError('Not ready', 422, { problems: ['Add at least one photo for sale'] }))
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Publish store listing' }))
  expect(await screen.findByText('Add at least one photo for sale')).toBeInTheDocument()
})

it('publishes and reports success', async () => {
  jest.mocked(updatePhotoCollection).mockResolvedValue({ ...collection, status: 'published' })
  const { onChange } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Publish store listing' }))
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' })))
  expect(updatePhotoCollection).toHaveBeenCalledWith('k', 'c1', { status: 'published' })
})

it('saves settings with the price converted to cents', async () => {
  jest.mocked(updatePhotoCollection).mockResolvedValue(collection)
  setup()
  await screen.findByText('a.jpg')
  fireEvent.change(screen.getByLabelText('Default price ($)'), { target: { value: '12.5' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  await waitFor(() => expect(updatePhotoCollection).toHaveBeenCalledWith('k', 'c1', {
    title: 'Aug 2026', defaultPriceCents: 1250, defaultPhotographerId: 'ph1',
  }))
})

it('rejects a default price under $0.50 without calling the API', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.change(screen.getByLabelText('Default price ($)'), { target: { value: '0.10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  expect(screen.getByRole('alert')).toHaveTextContent('at least $0.50')
  expect(updatePhotoCollection).not.toHaveBeenCalled()
})

it('applies a price override to the selected photos', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.change(screen.getByLabelText('Price override ($)'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: 'Set price' }))
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'a', priceOverrideCents: 2000 }]))
})

it('takes selected photos off sale and refreshes the collection counts', async () => {
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByLabelText('Select b.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Take off sale' }))
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'a', forSale: false }, { id: 'b', forSale: false }]))
  expect(onRefresh).toHaveBeenCalled()
})

it('adds selected photos to the gallery and shows the badge', async () => {
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Show in gallery' }))
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'a', inGallery: true }]))
  expect(await screen.findByText('In gallery')).toBeInTheDocument()
  expect(onRefresh).not.toHaveBeenCalled()
})

it('shows the API reason when putting a photo without a photographer on sale', async () => {
  jest.mocked(updateLibraryPhotos).mockRejectedValue(new Error('Assign a photographer to a.jpg before putting it on sale'))
  setup([photo('a', 10, { forSale: false, photographerId: null })])
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Put on sale' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Assign a photographer to a.jpg')
})

it('shows badges and dims photos that are neither for sale nor in the gallery', async () => {
  setup([photo('a', 10, { inGallery: true }), photo('b', 20, { forSale: false })])
  await screen.findByText('a.jpg')
  expect(screen.getByText('In gallery')).toBeInTheDocument()
  expect(screen.getAllByText('For sale')).toHaveLength(1)
  expect(screen.getByAltText('b.jpg')).toHaveClass('opacity-40')
})

it('assigns a photographer to selected photos', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.change(screen.getByLabelText('Assign photographer'), { target: { value: 'ph2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'a', photographerId: 'ph2' }]))
})

it('sets a single selected photo as cover', async () => {
  jest.mocked(updatePhotoCollection).mockResolvedValue({ ...collection, coverPhotoId: 'b' })
  const { onChange } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select b.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Set as cover' }))
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ coverPhotoId: 'b' })))
})

it('deletes selected photos after confirmation', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  jest.mocked(deleteLibraryPhotos).mockResolvedValue({ deleted: 1, skipped: [] })
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(deleteLibraryPhotos).toHaveBeenCalledWith('k', ['a']))
  expect(onRefresh).toHaveBeenCalled()
})

function dragPhoto(fromId: string, overIds: string[]) {
  const dt = { setData: jest.fn(), effectAllowed: '' }
  fireEvent.dragStart(screen.getByTestId(`collection-item-${fromId}`), { dataTransfer: dt })
  for (const id of overIds) fireEvent.dragOver(screen.getByTestId(`collection-item-${id}`), { dataTransfer: dt })
  fireEvent.dragEnd(screen.getByTestId(`collection-item-${fromId}`), { dataTransfer: dt })
}
const gridOrder = () => screen.getAllByTestId(/^collection-item-/).map((el) => el.dataset.testid!.replace('collection-item-', ''))

it('has no reorder arrows', async () => {
  setup()
  await screen.findByText('a.jpg')
  expect(screen.queryByLabelText(/Move a.jpg/)).not.toBeInTheDocument()
})

it('reorders by dragging and saves the new order once, on drop', async () => {
  setup([photo('a', 10), photo('b', 20), photo('c', 30)])
  await screen.findByText('a.jpg')
  dragPhoto('c', ['b', 'a'])
  expect(gridOrder()).toEqual(['c', 'a', 'b'])
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledTimes(1))
  expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [
    { id: 'c', sortOrder: 10 }, { id: 'a', sortOrder: 20 }, { id: 'b', sortOrder: 30 },
  ])
  expect(await screen.findByText('Order saved.')).toBeInTheDocument()
})

it('does not save when a photo is dropped where it started', async () => {
  setup()
  await screen.findByText('a.jpg')
  dragPhoto('a', ['a'])
  expect(updateLibraryPhotos).not.toHaveBeenCalled()
})

it('restores the previous order when saving fails', async () => {
  jest.mocked(updateLibraryPhotos).mockRejectedValue(new Error('HTTP 500'))
  setup()
  await screen.findByText('a.jpg')
  dragPhoto('a', ['b'])
  expect(await screen.findByRole('alert')).toHaveTextContent('The previous order was restored.')
  expect(gridOrder()).toEqual(['a', 'b'])
})

it('keeps removed photos out of the renumbering', async () => {
  setup([photo('a', 10), photo('gone', 15, { removed: true }), photo('b', 20)])
  await screen.findByText('a.jpg')
  dragPhoto('b', ['a'])
  await waitFor(() => expect(updateLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'b', sortOrder: 10 }, { id: 'a', sortOrder: 20 }]))
})

it('replaces a photo file', async () => {
  jest.mocked(replaceLibraryPhoto).mockResolvedValue(photo('a', 10, { originalFilename: 'new.jpg' }))
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getAllByRole('button', { name: 'Replace file' })[0])
  const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })
  fireEvent.change(screen.getByLabelText('Replacement file'), { target: { files: [file] } })
  expect(await screen.findByText('new.jpg')).toBeInTheDocument()
  expect(replaceLibraryPhoto).toHaveBeenCalledWith(file, 'a', 'k')
})

it('reloads photos and refreshes after an upload', async () => {
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }))
  fireEvent.click(screen.getByRole('button', { name: 'mock-upload-done' }))
  await waitFor(() => expect(getCollectionPhotos).toHaveBeenCalledTimes(2))
  expect(onRefresh).toHaveBeenCalled()
})
