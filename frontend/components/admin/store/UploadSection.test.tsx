import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { StoreCollection, StorePhoto } from '@shared/types/store'
import { UploadSection } from './UploadSection'
import { getCollectionPhotos } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminStore')
jest.mock('./StoreUploader', () => ({
  StoreUploader: (props: { existingHashes: Set<string>; nextSortOrder: number }) => (
    <div data-testid="uploader">{[...props.existingHashes].join(',')}|{props.nextSortOrder}</div>
  ),
}))

const collection = { id: 'c1', title: 'Aug 2026' } as StoreCollection

beforeEach(() => jest.resetAllMocks())

it('asks for a collection to be created first when there are none', () => {
  render(<UploadSection adminKey="k" collections={[]} photographers={[]} onUploaded={jest.fn()} />)
  expect(screen.getByText(/Create a collection first/)).toBeInTheDocument()
})

it('loads the chosen collection and passes its hashes and max sort order to the uploader', async () => {
  jest.mocked(getCollectionPhotos).mockResolvedValue([
    { contentHash: 'h1', sortOrder: 10 }, { contentHash: 'h2', sortOrder: 40 },
  ] as StorePhoto[])
  render(<UploadSection adminKey="k" collections={[collection]} photographers={[]} onUploaded={jest.fn()} />)
  fireEvent.change(screen.getByLabelText('Collection'), { target: { value: 'c1' } })
  expect(await screen.findByTestId('uploader')).toHaveTextContent('h1,h2|40')
  expect(getCollectionPhotos).toHaveBeenCalledWith('k', 'c1')
})

it('shows an error when loading fails', async () => {
  jest.mocked(getCollectionPhotos).mockRejectedValue(new Error('x'))
  render(<UploadSection adminKey="k" collections={[collection]} photographers={[]} onUploaded={jest.fn()} />)
  fireEvent.change(screen.getByLabelText('Collection'), { target: { value: 'c1' } })
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this collection')
})
