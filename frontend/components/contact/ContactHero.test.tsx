import React from 'react'
import { render } from '@testing-library/react'
import ContactHero from './ContactHero'

it('matches snapshot', () => {
  const { container } = render(<ContactHero />)
  expect(container).toMatchSnapshot()
})
