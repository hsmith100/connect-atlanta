import React from 'react'
import { render } from '@testing-library/react'
import VendorSection from './VendorSection'

jest.mock('../../lib/gtag', () => ({ trackVendorApplication: jest.fn() }))

it('matches snapshot', () => {
  const { container } = render(<VendorSection />)
  expect(container).toMatchSnapshot()
})
