import React from 'react'
import { render, screen } from '@testing-library/react'
import ContactFAQ from './ContactFAQ'

it('matches snapshot', () => {
  const { container } = render(<ContactFAQ />)
  expect(container).toMatchSnapshot()
})

it('renders all four FAQ questions', () => {
  render(<ContactFAQ />)
  expect(screen.getByText(/how can I perform/i)).toBeInTheDocument()
  expect(screen.getByText(/how can I become a vendor/i)).toBeInTheDocument()
  expect(screen.getByText(/available for partnerships/i)).toBeInTheDocument()
  expect(screen.getByText(/when is the next event/i)).toBeInTheDocument()
})
