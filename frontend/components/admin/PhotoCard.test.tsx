import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@shared/types/photos'

const BASE_PHOTO: Photo = {
  id: 'ph-1',
  entity: 'PHOTO',
  url: 'https://example.com/photo.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  eventId: null,
  sortOrder: 10,
  visible: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const defaultProps = {
  photo: BASE_PHOTO,
  selected: false,
  onSelect: jest.fn(),
  onToggleVisible: jest.fn(),
  onDragStart: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
  index: 0,
}

afterEach(() => jest.clearAllMocks())

it('renders the photo thumbnail', () => {
  const { container } = render(<PhotoCard {...defaultProps} />)
  // alt="" makes the img role "presentation" — query directly
  const img = container.querySelector('img')!
  expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
})

it('checkbox is unchecked when selected=false', () => {
  render(<PhotoCard {...defaultProps} selected={false} />)
  expect(screen.getByRole('checkbox')).not.toBeChecked()
})

it('checkbox is checked when selected=true', () => {
  render(<PhotoCard {...defaultProps} selected={true} />)
  expect(screen.getByRole('checkbox')).toBeChecked()
})

it('calls onSelect with the photo id when the checkbox changes', () => {
  const onSelect = jest.fn()
  render(<PhotoCard {...defaultProps} onSelect={onSelect} />)
  fireEvent.click(screen.getByRole('checkbox'))
  expect(onSelect).toHaveBeenCalledWith('ph-1')
})

it('shows the hide button title when photo is visible', () => {
  render(<PhotoCard {...defaultProps} />)
  expect(screen.getByTitle('Hide photo')).toBeInTheDocument()
})

it('shows the show button title when photo is hidden', () => {
  render(<PhotoCard {...defaultProps} photo={{ ...BASE_PHOTO, visible: false }} />)
  expect(screen.getByTitle('Show photo')).toBeInTheDocument()
})

it('calls onToggleVisible with id and false when visible photo toggle is clicked', () => {
  const onToggleVisible = jest.fn()
  render(<PhotoCard {...defaultProps} onToggleVisible={onToggleVisible} />)
  fireEvent.click(screen.getByTitle('Hide photo'))
  expect(onToggleVisible).toHaveBeenCalledWith('ph-1', false)
})

it('calls onToggleVisible with id and true when hidden photo toggle is clicked', () => {
  const onToggleVisible = jest.fn()
  render(<PhotoCard {...defaultProps} photo={{ ...BASE_PHOTO, visible: false }} onToggleVisible={onToggleVisible} />)
  fireEvent.click(screen.getByTitle('Show photo'))
  expect(onToggleVisible).toHaveBeenCalledWith('ph-1', true)
})

it('calls onDragStart with the index when drag starts', () => {
  const onDragStart = jest.fn()
  const { container } = render(<PhotoCard {...defaultProps} onDragStart={onDragStart} index={3} />)
  const card = container.firstChild as HTMLElement
  fireEvent.dragStart(card)
  expect(onDragStart).toHaveBeenCalledWith(3)
})

it('calls onDrop with the index when dropped on', () => {
  const onDrop = jest.fn()
  const { container } = render(<PhotoCard {...defaultProps} onDrop={onDrop} index={2} />)
  const card = container.firstChild as HTMLElement
  fireEvent.drop(card)
  expect(onDrop).toHaveBeenCalledWith(2)
})
