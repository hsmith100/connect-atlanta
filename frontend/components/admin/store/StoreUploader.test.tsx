import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Photographer, StoreCollection } from '@shared/types/store'
import { StoreUploader } from './StoreUploader'
import { hashFile } from '../../../lib/store/hashFile'
import { uploadStorePhoto } from '../../../lib/store/uploadStorePhoto'

jest.mock('../../../lib/store/hashFile')
jest.mock('../../../lib/store/uploadStorePhoto')

const jay: Photographer = {
  id: 'ph1', name: 'Jay', email: 'j@x.com', commissionPct: 40, active: true,
  stripeAccountId: null, payoutsReady: false, owedCents: 0, createdAt: '', updatedAt: '',
}
const collection = {
  id: 'c1', defaultPhotographerId: 'ph1', defaultPriceCents: 1500,
} as StoreCollection

function jpg(name: string) {
  return new File([name], name, { type: 'image/jpeg' })
}

function setup(existingHashes: string[] = []) {
  const onUploaded = jest.fn()
  render(
    <StoreUploader
      adminKey="k"
      collection={collection}
      photographers={[jay, { ...jay, id: 'ph2', name: 'Gone', active: false }]}
      existingHashes={new Set(existingHashes)}
      nextSortOrder={100}
      onUploaded={onUploaded}
    />,
  )
  const choose = (files: File[]) => fireEvent.change(screen.getByLabelText('Choose photos to upload'), { target: { files } })
  return { onUploaded, choose }
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(hashFile).mockImplementation(async (f) => `hash-${(f as File).name}`)
  jest.mocked(uploadStorePhoto).mockResolvedValue()
})

it('defaults to the collection photographer and only lists active photographers', () => {
  setup()
  const select = screen.getByLabelText('Photographer for this batch') as HTMLSelectElement
  expect(select.value).toBe('ph1')
  expect(screen.queryByRole('option', { name: /Gone/ })).not.toBeInTheDocument()
})

it('uploads each file with increasing sort order and reports progress', async () => {
  const { choose, onUploaded } = setup()
  choose([jpg('a.jpg'), jpg('b.jpg')])

  await waitFor(() => expect(screen.getByText(/2 \/ 2 uploaded/)).toBeInTheDocument())
  expect(screen.getAllByText('Done')).toHaveLength(2)
  const orders = jest.mocked(uploadStorePhoto).mock.calls.map((c) => c[2].sortOrder).sort()
  expect(orders).toEqual([110, 120])
  expect(jest.mocked(uploadStorePhoto).mock.calls[0][2]).toMatchObject({ adminKey: 'k', collectionId: 'c1', photographerId: 'ph1' })
  expect(onUploaded).toHaveBeenCalledTimes(1)
})

it('flags duplicates of existing photos and lets the admin upload anyway', async () => {
  const { choose } = setup(['hash-a.jpg'])
  choose([jpg('a.jpg')])

  expect(await screen.findByText('Duplicate')).toBeInTheDocument()
  expect(uploadStorePhoto).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Upload anyway' }))
  await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument())
  expect(uploadStorePhoto).toHaveBeenCalledTimes(1)
})

it('flags duplicates within the same batch', async () => {
  jest.mocked(hashFile).mockResolvedValue('same')
  const { choose } = setup()
  choose([jpg('a.jpg'), jpg('a-copy.jpg')])
  await waitFor(() => expect(screen.getByText('Duplicate')).toBeInTheDocument())
  expect(uploadStorePhoto).toHaveBeenCalledTimes(1)
})

it('shows the failure reason and retries just that file', async () => {
  jest.mocked(uploadStorePhoto).mockRejectedValueOnce(new Error('This file could not be read as an image'))
  const { choose, onUploaded } = setup()
  choose([jpg('bad.jpg')])

  expect(await screen.findByText('Failed')).toBeInTheDocument()
  expect(screen.getByText('This file could not be read as an image')).toBeInTheDocument()
  expect(onUploaded).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: /retry/i }))
  await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument())
  expect(onUploaded).toHaveBeenCalledTimes(1)
})

it('ignores files that are not JPEG or PNG', async () => {
  const { choose } = setup()
  choose([new File(['x'], 'notes.txt', { type: 'text/plain' })])
  await new Promise((r) => setTimeout(r, 0))
  expect(screen.queryByText(/uploaded/)).not.toBeInTheDocument()
  expect(hashFile).not.toHaveBeenCalled()
})

it('requires a photographer before accepting files', () => {
  render(
    <StoreUploader
      adminKey="k"
      collection={{ ...collection, defaultPhotographerId: null }}
      photographers={[jay]}
      existingHashes={new Set()}
      nextSortOrder={0}
      onUploaded={jest.fn()}
    />,
  )
  expect(screen.getByText('Choose a photographer first')).toBeInTheDocument()
  expect(screen.getByLabelText('Choose photos to upload')).toBeDisabled()
})
