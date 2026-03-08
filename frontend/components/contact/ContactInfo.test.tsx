import React from 'react'
import { render } from '@testing-library/react'
import ContactInfo from './ContactInfo'

it('matches snapshot', () => {
  const { container } = render(<ContactInfo />)
  expect(container).toMatchSnapshot()
})
