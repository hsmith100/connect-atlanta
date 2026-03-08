import React from 'react'
import { render } from '@testing-library/react'
import AboutHero from './AboutHero'

it('matches snapshot', () => {
  const { container } = render(<AboutHero />)
  expect(container).toMatchSnapshot()
})
