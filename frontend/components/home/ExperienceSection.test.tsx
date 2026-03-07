import React from 'react'
import { render } from '@testing-library/react'
import ExperienceSection from './ExperienceSection'

jest.mock('next/image', () => ({ __esModule: true, default: ({ src, alt }: any) => <img src={src} alt={alt} /> }))

global.IntersectionObserver = class {
  observe() {} unobserve() {} disconnect() {}
} as any

it('matches snapshot', () => {
  const { container } = render(<ExperienceSection />)
  expect(container).toMatchSnapshot()
})
