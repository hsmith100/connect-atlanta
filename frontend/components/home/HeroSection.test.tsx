import React from 'react'
import { render } from '@testing-library/react'
import HeroSection from './HeroSection'
import type { HeroCard } from '@shared/types/heroCards'

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
jest.mock('../shared/HeroCardVisual', () => ({ __esModule: true, HeroCardVisual: ({ card }: any) => <div data-testid="hero-card">{card.title}</div> }))

function makeCard(id: string, title: string, linkUrl: string): HeroCard {
  return { id, title, linkUrl } as HeroCard
}

it('matches snapshot with no cards', () => {
  const { container } = render(<HeroSection heroCards={[]} loading={false} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot with internal and external cards', () => {
  const cards = [
    makeCard('1', 'Internal Card', '/events'),
    makeCard('2', 'External Card', 'https://example.com'),
  ]
  const { container } = render(<HeroSection heroCards={cards} loading={false} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot while loading', () => {
  const { container } = render(<HeroSection heroCards={[]} loading={true} />)
  expect(container).toMatchSnapshot()
})
