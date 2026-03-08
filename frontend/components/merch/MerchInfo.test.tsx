import React from 'react'
import { render, screen } from '@testing-library/react'
import MerchInfo from './MerchInfo'

it('matches snapshot', () => {
  const { container } = render(<MerchInfo />)
  expect(container).toMatchSnapshot()
})

it('renders all three pillars', () => {
  render(<MerchInfo />)
  expect(screen.getByText('Quality Materials')).toBeInTheDocument()
  expect(screen.getByText('Fast Shipping')).toBeInTheDocument()
  expect(screen.getByText('Support the Scene')).toBeInTheDocument()
})
