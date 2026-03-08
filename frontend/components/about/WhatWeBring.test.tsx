import React from 'react'
import { render, screen } from '@testing-library/react'
import WhatWeBring from './WhatWeBring'

it('matches snapshot', () => {
  const { container } = render(<WhatWeBring />)
  expect(container).toMatchSnapshot()
})

it('renders all three pillar headings', () => {
  render(<WhatWeBring />)
  expect(screen.getByText('Festival-Grade Music')).toBeInTheDocument()
  expect(screen.getByText('Community Focus')).toBeInTheDocument()
  expect(screen.getByText('The Experience')).toBeInTheDocument()
})
