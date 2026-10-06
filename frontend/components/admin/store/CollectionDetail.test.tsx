import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { Photographer, StoreCollection, StorePhoto } from '@shared/types/store'
import { CollectionDetail, dollarsToCents } from './CollectionDetail'
import {
  getCollectionPhotos, updateStoreCollection, updateStorePhotos, deleteStorePhotos,
} from '../../../lib/api/adminStore'
import { ApiError } from '../../../lib/api/client'
import { replaceStorePhoto } from '../../../lib/store/uploadStorePhoto'

jest.mock('../../../lib/api/adminStore')
jest.mock('../../../lib/store/uploadStorePhoto')
jest.mock('./StoreUploader', () => ({
  StoreUploader: ({ onUploaded }: { onUploaded: () => void }) => <button onClick={onUploaded}>mock-upload-done</button>,
}))

const jay: Photographer = {
  id: 'ph1', name: 'Jay', email: 'j@x.com', commissionPct: 40, active: true,
  stripeAccountId: null, payoutsReady: false, owedCents: 0, createdAt: '', updatedAt: '',
}
const maria: Photographer = { ...jay, id: 'ph2', name: 'Maria' }
const collection: StoreCollection = {
  id: 'c1', entity: 'COLLECTION', eventId: 'e1', title: 'Aug 2026', eventDate: '2026-08-15', status: 'draft',
  defaultPriceCents: 1500, defaultPhotographerId: 'ph1', coverPhotoId: null, photoCount: 2, createdAt: '', updatedAt: '',
}
function photo(id: string, sortOrder: number, extra: Partial<StorePhoto> = {}): StorePhoto {
  return {
    id, collectionId: 'c1', sortOrder, originalKey: `originals/${id}.jpg`, originalFilename: `${id}.jpg`,
    originalBytes: 1, width: 1, height: 1, contentHash: `h-${id}`, previewUrl: '', thumbnailUrl: `https://m/${id}.jpg`,
    photographerId: 'ph1', priceOverrideCents: null, status: 'forSale', createdAt: '', updatedAt: '', ...extra,
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
  jest.mocked(updateStorePhotos).mockResolvedValue()
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
  setup([photo('a', 10), photo('gone', 20, { status: 'removed' })])
  await screen.findByText('a.jpg')
  expect(screen.queryByText('gone.jpg')).not.toBeInTheDocument()
})

it('lists publish problems from a 422', async () => {
  jest.mocked(updateStoreCollection).mockRejectedValue(new ApiError('Not ready', 422, { problems: ['Add at least one photo for sale'] }))
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  expect(await screen.findByText('Add at least one photo for sale')).toBeInTheDocument()
})

it('publishes and reports success', async () => {
  jest.mocked(updateStoreCollection).mockResolvedValue({ ...collection, status: 'published' })
  const { onChange } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' })))
  expect(updateStoreCollection).toHaveBeenCalledWith('k', 'c1', { status: 'published' })
})

it('saves settings with the price converted to cents', async () => {
  jest.mocked(updateStoreCollection).mockResolvedValue(collection)
  setup()
  await screen.findByText('a.jpg')
  fireEvent.change(screen.getByLabelText('Default price ($)'), { target: { value: '12.5' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  await waitFor(() => expect(updateStoreCollection).toHaveBeenCalledWith('k', 'c1', {
    title: 'Aug 2026', defaultPriceCents: 1250, defaultPhotographerId: 'ph1',
  }))
})

it('rejects a default price under $0.50 without calling the API', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.change(screen.getByLabelText('Default price ($)'), { target: { value: '0.10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  expect(screen.getByRole('alert')).toHaveTextContent('at least $0.50')
  expect(updateStoreCollection).not.toHaveBeenCalled()
})

it('applies a price override to the selected photos', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.change(screen.getByLabelText('Price override ($)'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: 'Set price' }))
  await waitFor(() => expect(updateStorePhotos).toHaveBeenCalledWith('k', [{ id: 'a', priceOverrideCents: 2000 }]))
})

it('hides selected photos and refreshes the collection count', async () => {
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByLabelText('Select b.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
  await waitFor(() => expect(updateStorePhotos).toHaveBeenCalledWith('k', [{ id: 'a', status: 'hidden' }, { id: 'b', status: 'hidden' }]))
  expect(onRefresh).toHaveBeenCalled()
})

it('assigns a photographer to selected photos', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.change(screen.getByLabelText('Assign photographer'), { target: { value: 'ph2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
  await waitFor(() => expect(updateStorePhotos).toHaveBeenCalledWith('k', [{ id: 'a', photographerId: 'ph2' }]))
})

it('sets a single selected photo as cover', async () => {
  jest.mocked(updateStoreCollection).mockResolvedValue({ ...collection, coverPhotoId: 'b' })
  const { onChange } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select b.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Set as cover' }))
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ coverPhotoId: 'b' })))
})

it('deletes selected photos after confirmation', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  jest.mocked(deleteStorePhotos).mockResolvedValue({ deleted: 1, skipped: [] })
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Select a.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(deleteStorePhotos).toHaveBeenCalledWith('k', ['a']))
  expect(onRefresh).toHaveBeenCalled()
})

it('swaps sort order when moving a photo later', async () => {
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByLabelText('Move a.jpg later'))
  await waitFor(() => expect(updateStorePhotos).toHaveBeenCalledWith('k', [{ id: 'a', sortOrder: 20 }, { id: 'b', sortOrder: 10 }]))
})

it('replaces a photo file', async () => {
  jest.mocked(replaceStorePhoto).mockResolvedValue(photo('a', 10, { originalFilename: 'new.jpg' }))
  setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getAllByRole('button', { name: 'Replace file' })[0])
  const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })
  fireEvent.change(screen.getByLabelText('Replacement file'), { target: { files: [file] } })
  expect(await screen.findByText('new.jpg')).toBeInTheDocument()
  expect(replaceStorePhoto).toHaveBeenCalledWith(file, 'a', 'k')
})

it('reloads photos and refreshes after an upload', async () => {
  const { onRefresh } = setup()
  await screen.findByText('a.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }))
  fireEvent.click(screen.getByRole('button', { name: 'mock-upload-done' }))
  await waitFor(() => expect(getCollectionPhotos).toHaveBeenCalledTimes(2))
  expect(onRefresh).toHaveBeenCalled()
})
