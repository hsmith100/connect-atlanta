import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthGate } from './AuthGate'

jest.mock('../../lib/api', () => ({
  getAdminPhotos: jest.fn(),
}))

const { getAdminPhotos } = require('../../lib/api')

afterEach(() => jest.clearAllMocks())

it('renders the admin login form', () => {
  render(<AuthGate onAuth={jest.fn()} />)
  expect(screen.getByText('Admin Login')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Admin key')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
})

it('submit button is disabled when the input is empty', () => {
  render(<AuthGate onAuth={jest.fn()} />)
  expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
})

it('enables the submit button after typing', () => {
  render(<AuthGate onAuth={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Admin key'), { target: { value: 'my-key' } })
  expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
})

it('calls onAuth with the entered key on successful verification', async () => {
  getAdminPhotos.mockResolvedValue({ photos: [] })
  const onAuth = jest.fn()
  render(<AuthGate onAuth={onAuth} />)
  fireEvent.change(screen.getByPlaceholderText('Admin key'), { target: { value: 'valid-key' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => expect(onAuth).toHaveBeenCalledWith('valid-key'))
})

it('shows an error message when verification fails', async () => {
  getAdminPhotos.mockRejectedValue(new Error('Unauthorized'))
  render(<AuthGate onAuth={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Admin key'), { target: { value: 'bad-key' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => expect(screen.getByText('Invalid admin key.')).toBeInTheDocument())
})

it('shows a loading state while checking', async () => {
  getAdminPhotos.mockReturnValue(new Promise(() => {})) // never resolves
  render(<AuthGate onAuth={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Admin key'), { target: { value: 'key' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(screen.getByText('Checking…')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /checking/i })).toBeDisabled()
})
