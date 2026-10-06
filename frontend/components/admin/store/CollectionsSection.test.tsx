import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Event } from '@shared/types/events'
import type { StoreCollection } from '@shared/types/store'
import { CollectionsSection } from './CollectionsSection'
import { createStoreCollection } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminStore')
jest.mock('./CollectionDetail', () => ({
  ...jest.requireActual('./CollectionDetail'),
  CollectionDetail: ({ collection, onBack }: { collection: StoreCollection; onBack: () => void }) => (
    <div>
      <p>detail:{collection.title}</p>
      <button onClick={onBack}>back</button>
    </div>
  ),
}))

const events = [
  { id: 'e1', title: 'Aug Fest', date: '2026-08-15' },
  { id: 'e2', title: 'June Fest', date: '2026-06-10' },
] as Event[]
const existing: StoreCollection = {
  id: 'c2', entity: 'COLLECTION', eventId: 'e2', title: 'June Fest', eventDate: '2026-06-10', status: 'published',
  defaultPriceCents: 1500, defaultPhotographerId: null, coverPhotoId: null, photoCount: 12, createdAt: '', updatedAt: '',
}

function Harness({ initial }: { initial: StoreCollection[] }) {
  const [collections, setCollections] = useState(initial)
  return (
    <CollectionsSection
      adminKey="k" events={events} photographers={[]} collections={collections}
      setCollections={setCollections} reloadCollections={jest.fn()}
    />
  )
}

beforeEach(() => jest.resetAllMocks())

it('shows an empty state', () => {
  render(<Harness initial={[]} />)
  expect(screen.getByText(/No photo collections yet/)).toBeInTheDocument()
})

it('lists collections with status, count and price', () => {
  render(<Harness initial={[existing]} />)
  expect(screen.getByText('June Fest')).toBeInTheDocument()
  expect(screen.getByText('12 for sale')).toBeInTheDocument()
  expect(screen.getByText('Published')).toBeInTheDocument()
  expect(screen.getByText(/\$15\.00 each/)).toBeInTheDocument()
})

it('only offers events without a collection', () => {
  render(<Harness initial={[existing]} />)
  expect(screen.getByRole('option', { name: /Aug Fest/ })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /June Fest/ })).not.toBeInTheDocument()
})

it('creates a collection and opens it', async () => {
  jest.mocked(createStoreCollection).mockResolvedValue({ ...existing, id: 'c1', eventId: 'e1', title: 'Aug Fest', status: 'draft' })
  render(<Harness initial={[existing]} />)
  fireEvent.change(screen.getByLabelText('Event'), { target: { value: 'e1' } })
  fireEvent.change(screen.getByLabelText('Default price ($)'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: /new collection/i }))
  expect(await screen.findByText('detail:Aug Fest')).toBeInTheDocument()
  expect(createStoreCollection).toHaveBeenCalledWith('k', { eventId: 'e1', defaultPriceCents: 2000 })
})

it('validates before creating', () => {
  render(<Harness initial={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /new collection/i }))
  expect(screen.getByRole('alert')).toHaveTextContent('Choose an event')
  expect(createStoreCollection).not.toHaveBeenCalled()
})

it('opens a collection and returns to the list', () => {
  render(<Harness initial={[existing]} />)
  fireEvent.click(screen.getByText('June Fest'))
  expect(screen.getByText('detail:June Fest')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'back' }))
  expect(screen.getByText('12 for sale')).toBeInTheDocument()
})
