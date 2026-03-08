import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HeroCardsTab } from './HeroCardsTab'
import type { HeroCard } from '@shared/types/heroCards'

jest.mock('../../lib/api', () => ({
  createHeroCard: jest.fn().mockResolvedValue({}),
  updateHeroCard: jest.fn().mockResolvedValue({}),
  deleteHeroCard: jest.fn().mockResolvedValue({}),
  presignHeroCardImage: jest.fn(),
}))

// HeroCardFormModal is complex — mock it so we can focus on HeroCardsTab logic
jest.mock('./HeroCardFormModal', () => ({
  HeroCardFormModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="hero-card-form-modal"><button onClick={onClose}>Close form</button></div> : null,
  EMPTY_HERO_CARD_FORM: { title: '', description: '', ctaText: '', linkUrl: '', icon: '', visible: true },
}))

window.confirm = jest.fn(() => true)

Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn(() => 'new-card-uuid'),
  configurable: true,
})

const { updateHeroCard, deleteHeroCard } = require('../../lib/api')

const makeCard = (id: string, overrides?: Partial<HeroCard>): HeroCard => ({
  id,
  entity: 'CARD',
  title: `Card ${id}`,
  description: `Description for ${id}`,
  ctaText: 'Learn More',
  linkUrl: '/page',
  imageUrl: null,
  icon: null,
  sortOrder: 10,
  visible: true,
  ...overrides,
})

const setHeroCards = jest.fn()
const adminKey = 'test-key'

afterEach(() => jest.clearAllMocks())

// ── empty state ────────────────────────────────────────────────────────────────

it('shows empty state when no cards exist', () => {
  render(<HeroCardsTab adminKey={adminKey} heroCards={[]} setHeroCards={setHeroCards} />)
  expect(screen.getByText('No hero cards yet.')).toBeInTheDocument()
})

// ── toolbar ────────────────────────────────────────────────────────────────────

it('renders card count in toolbar', () => {
  const cards = [makeCard('1'), makeCard('2')]
  render(<HeroCardsTab adminKey={adminKey} heroCards={cards} setHeroCards={setHeroCards} />)
  expect(screen.getByText('2 cards')).toBeInTheDocument()
})

it('renders singular "card" for one card', () => {
  render(<HeroCardsTab adminKey={adminKey} heroCards={[makeCard('1')]} setHeroCards={setHeroCards} />)
  expect(screen.getByText('1 card')).toBeInTheDocument()
})

it('disables Save order when there are no cards', () => {
  render(<HeroCardsTab adminKey={adminKey} heroCards={[]} setHeroCards={setHeroCards} />)
  expect(screen.getByText('Save order')).toBeDisabled()
})

// ── add card form ──────────────────────────────────────────────────────────────

it('opens the form modal when Add Card is clicked', () => {
  render(<HeroCardsTab adminKey={adminKey} heroCards={[]} setHeroCards={setHeroCards} />)
  expect(screen.queryByTestId('hero-card-form-modal')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText('Add Card'))
  expect(screen.getByTestId('hero-card-form-modal')).toBeInTheDocument()
})

it('closes the form modal when onClose is called', () => {
  render(<HeroCardsTab adminKey={adminKey} heroCards={[]} setHeroCards={setHeroCards} />)
  fireEvent.click(screen.getByText('Add Card'))
  fireEvent.click(screen.getByText('Close form'))
  expect(screen.queryByTestId('hero-card-form-modal')).not.toBeInTheDocument()
})

// ── renders cards ──────────────────────────────────────────────────────────────

it('renders card titles', () => {
  const cards = [makeCard('1'), makeCard('2')]
  render(<HeroCardsTab adminKey={adminKey} heroCards={cards} setHeroCards={setHeroCards} />)
  expect(screen.getByText('Card 1')).toBeInTheDocument()
  expect(screen.getByText('Card 2')).toBeInTheDocument()
})

// ── delete ─────────────────────────────────────────────────────────────────────

it('calls deleteHeroCard and updates state when delete is confirmed', async () => {
  const cards = [makeCard('abc')]
  render(<HeroCardsTab adminKey={adminKey} heroCards={cards} setHeroCards={setHeroCards} />)
  fireEvent.click(screen.getByTitle('Delete card'))
  await waitFor(() => expect(deleteHeroCard).toHaveBeenCalledWith(adminKey, 'abc'))
  expect(setHeroCards).toHaveBeenCalled()
})

it('does not call deleteHeroCard when confirm is cancelled', async () => {
  ;(window.confirm as jest.Mock).mockReturnValueOnce(false)
  render(<HeroCardsTab adminKey={adminKey} heroCards={[makeCard('abc')]} setHeroCards={setHeroCards} />)
  fireEvent.click(screen.getByTitle('Delete card'))
  await waitFor(() => expect(deleteHeroCard).not.toHaveBeenCalled())
})

// ── save order ─────────────────────────────────────────────────────────────────

it('calls updateHeroCard for each card when Save order is clicked', async () => {
  const cards = [makeCard('c1'), makeCard('c2')]
  render(<HeroCardsTab adminKey={adminKey} heroCards={cards} setHeroCards={setHeroCards} />)
  fireEvent.click(screen.getByText('Save order'))
  await waitFor(() => {
    expect(updateHeroCard).toHaveBeenCalledWith(adminKey, 'c1', { sortOrder: 0 })
    expect(updateHeroCard).toHaveBeenCalledWith(adminKey, 'c2', { sortOrder: 10 })
  })
})
