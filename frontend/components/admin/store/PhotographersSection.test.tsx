import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Photographer } from '@shared/types/store'
import { PhotographersSection } from './PhotographersSection'
import { createPhotographer, updatePhotographer } from '../../../lib/api/adminStore'

jest.mock('../../../lib/api/adminStore')

const jay: Photographer = {
  id: 'p1', name: 'Jay', email: 'jay@x.com', commissionPct: 40, active: true,
  stripeAccountId: null, payoutsReady: false, owedCents: 0, createdAt: '', updatedAt: '',
}

function Harness({ initial }: { initial: Photographer[] }) {
  const [photographers, setPhotographers] = useState(initial)
  return <PhotographersSection adminKey="k" photographers={photographers} setPhotographers={setPhotographers} />
}

beforeEach(() => jest.resetAllMocks())

it('shows an empty state', () => {
  render(<Harness initial={[]} />)
  expect(screen.getByText(/No photographers yet/)).toBeInTheDocument()
})

it('adds a photographer and shows it in the list', async () => {
  jest.mocked(createPhotographer).mockResolvedValue({ ...jay, id: 'p2', name: 'Maria', commissionPct: 50 })
  render(<Harness initial={[jay]} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Maria' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria@x.com' } })
  fireEvent.change(screen.getByLabelText('Commission %'), { target: { value: '50' } })
  fireEvent.click(screen.getByRole('button', { name: /add photographer/i }))

  expect(await screen.findByText('Maria')).toBeInTheDocument()
  expect(createPhotographer).toHaveBeenCalledWith('k', { name: 'Maria', email: 'maria@x.com', commissionPct: 50 })
})

it('validates input before calling the API', () => {
  render(<Harness initial={[]} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'A' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText('Commission %'), { target: { value: '150' } })
  fireEvent.click(screen.getByRole('button', { name: /add photographer/i }))
  expect(screen.getByRole('alert')).toHaveTextContent(/between 0 and 100/)
  expect(createPhotographer).not.toHaveBeenCalled()
})

it('shows the API error message when adding fails', async () => {
  jest.mocked(createPhotographer).mockRejectedValue(new Error('A valid email is required'))
  render(<Harness initial={[]} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'A' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText('Commission %'), { target: { value: '40' } })
  fireEvent.click(screen.getByRole('button', { name: /add photographer/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent('A valid email is required')
})

it('edits commission inline', async () => {
  jest.mocked(updatePhotographer).mockResolvedValue({ ...jay, commissionPct: 45 })
  render(<Harness initial={[jay]} />)
  fireEvent.click(screen.getByRole('button', { name: '40%' }))
  fireEvent.change(screen.getByLabelText('Commission for Jay'), { target: { value: '45' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByRole('button', { name: '45%' })).toBeInTheDocument()
  expect(updatePhotographer).toHaveBeenCalledWith('k', 'p1', { commissionPct: 45 })
})

it('deactivates a photographer', async () => {
  jest.mocked(updatePhotographer).mockResolvedValue({ ...jay, active: false })
  render(<Harness initial={[jay]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }))
  await waitFor(() => expect(screen.getByText('Inactive')).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument()
})
