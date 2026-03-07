import React from 'react'
import { render } from '@testing-library/react'
import SponsorsSection from './SponsorsSection'

it('matches snapshot', () => {
  const { container } = render(<SponsorsSection />)
  expect(container).toMatchSnapshot()
})
