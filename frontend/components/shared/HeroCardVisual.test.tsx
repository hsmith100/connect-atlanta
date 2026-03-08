import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroCardVisual } from './HeroCardVisual'
import type { HeroCard } from '@shared/types/heroCards'

const BASE_CARD: HeroCard = {
  id: '1',
  entity: 'home',
  title: 'Live Music',
  description: 'Experience incredible artists',
  ctaText: 'Get Tickets',
  linkUrl: '/tickets',
  imageUrl: 'https://example.com/photo.jpg',
  icon: 'Headphones',
  sortOrder: 1,
  visible: true,
}

// ── public mode ────────────────────────────────────────────────────────────────

describe('public mode', () => {
  it('renders title and description', () => {
    render(<HeroCardVisual card={BASE_CARD} />)
    expect(screen.getByText('Live Music')).toBeInTheDocument()
    expect(screen.getByText('Experience incredible artists')).toBeInTheDocument()
  })

  it('renders the ctaText', () => {
    render(<HeroCardVisual card={BASE_CARD} />)
    expect(screen.getByText('Get Tickets')).toBeInTheDocument()
  })

  it('renders the image with correct src and alt', () => {
    render(<HeroCardVisual card={BASE_CARD} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('alt', 'Live Music')
  })

  it('renders an icon when the icon prop is a known key', () => {
    const { container } = render(<HeroCardVisual card={BASE_CARD} />)
    // Lucide renders an <svg> for the icon
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('does not render an image element when imageUrl is null', () => {
    render(<HeroCardVisual card={{ ...BASE_CARD, imageUrl: null }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('does not render edit or delete buttons', () => {
    render(<HeroCardVisual card={BASE_CARD} />)
    expect(screen.queryByTitle('Edit card')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete card')).not.toBeInTheDocument()
  })

  it('does not show a hidden badge', () => {
    render(<HeroCardVisual card={{ ...BASE_CARD, visible: false }} />)
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })
})

// ── admin mode ─────────────────────────────────────────────────────────────────

describe('admin mode', () => {
  it('renders the edit button and calls onEdit when clicked', () => {
    const onEdit = jest.fn()
    render(<HeroCardVisual card={BASE_CARD} onEdit={onEdit} onDelete={jest.fn()} />)
    const editBtn = screen.getByTitle('Edit card')
    expect(editBtn).toBeInTheDocument()
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('renders the delete button and calls onDelete when clicked', () => {
    const onDelete = jest.fn()
    render(<HeroCardVisual card={BASE_CARD} onEdit={jest.fn()} onDelete={onDelete} />)
    const deleteBtn = screen.getByTitle('Delete card')
    expect(deleteBtn).toBeInTheDocument()
    fireEvent.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows the Hidden badge when visible=false', () => {
    render(<HeroCardVisual card={{ ...BASE_CARD, visible: false }} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Hidden')).toBeInTheDocument()
  })

  it('does not show the Hidden badge when visible=true', () => {
    render(<HeroCardVisual card={BASE_CARD} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('disables the delete button and shows a spinner when deleting=true', () => {
    render(<HeroCardVisual card={BASE_CARD} onEdit={jest.fn()} onDelete={jest.fn()} deleting />)
    const deleteBtn = screen.getByTitle('Delete card')
    expect(deleteBtn).toBeDisabled()
    // Spinner svg is present (Loader2 replaces Trash2)
    expect(deleteBtn.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without the ImageIcon placeholder when imageUrl is provided', () => {
    const { container } = render(<HeroCardVisual card={BASE_CARD} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(container.querySelector('img')).toBeInTheDocument()
  })
})
