import React from 'react'
import { render } from '@testing-library/react'
import VolunteerSection from './VolunteerSection'

jest.mock('../../lib/gtag', () => ({ trackVolunteerApplication: jest.fn() }))

it('matches snapshot', () => {
  const { container } = render(<VolunteerSection />)
  expect(container).toMatchSnapshot()
})
