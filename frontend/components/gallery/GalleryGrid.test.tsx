import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GalleryGrid from './GalleryGrid'
import type { Photo } from '@shared/types/photos'

function makePhoto(id: string): Photo {
  return { id, url: `https://cdn.example.com/photos/${id}.jpg`, thumbnailUrl: `https://cdn.example.com/photos/thumbs/${id}.jpg` } as Photo
}

const photos = [makePhoto('a'), makePhoto('b'), makePhoto('c')]

// ── loading ────────────────────────────────────────────────────────────────────

it('shows loading spinner when loading', () => {
  render(<GalleryGrid photos={[]} loading={true} error={null} onImageClick={jest.fn()} />)
  expect(screen.getByText(/loading gallery/i)).toBeInTheDocument()
})

// ── error ──────────────────────────────────────────────────────────────────────

it('shows error message when error is set', () => {
  render(<GalleryGrid photos={[]} loading={false} error="Could not load gallery." onImageClick={jest.fn()} />)
  expect(screen.getByText('Could not load gallery.')).toBeInTheDocument()
})

// ── empty ──────────────────────────────────────────────────────────────────────

it('shows empty state when photos array is empty', () => {
  render(<GalleryGrid photos={[]} loading={false} error={null} onImageClick={jest.fn()} />)
  expect(screen.getByText(/no photos available yet/i)).toBeInTheDocument()
})

// ── grid ───────────────────────────────────────────────────────────────────────

it('renders an image for each photo', () => {
  render(<GalleryGrid photos={photos} loading={false} error={null} onImageClick={jest.fn()} />)
  expect(screen.getAllByRole('img')).toHaveLength(3)
})

it('calls onImageClick with the correct index when a photo is clicked', () => {
  const onImageClick = jest.fn()
  render(<GalleryGrid photos={photos} loading={false} error={null} onImageClick={onImageClick} />)
  fireEvent.click(screen.getAllByRole('img')[1].parentElement!)
  expect(onImageClick).toHaveBeenCalledWith(1)
})

it('uses thumbnailUrl when available', () => {
  render(<GalleryGrid photos={photos} loading={false} error={null} onImageClick={jest.fn()} />)
  const imgs = screen.getAllByRole('img') as HTMLImageElement[]
  expect(imgs[0].src).toContain('thumbs/a.jpg')
})
