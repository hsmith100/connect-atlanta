import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { PublicPhoto } from '@shared/types/store'
import PhotoGrid from './PhotoGrid'
import { StoreCartProvider } from '../../lib/store/cartContext'

const photo = (id: string): PublicPhoto => ({
  id, thumbnailUrl: `https://m/thumbs/${id}.jpg`, previewUrl: `https://m/previews/${id}.jpg`, width: 6, height: 4, priceCents: 1500, photographerName: 'Jay',
})

let observerCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null
const disconnect = jest.fn()

beforeEach(() => {
  window.localStorage.clear()
  observerCallback = null
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = jest.fn((cb) => {
    observerCallback = cb
    return { observe: jest.fn(), disconnect }
  })
})

function renderGrid(props: Partial<React.ComponentProps<typeof PhotoGrid>> = {}) {
  const onSelect = jest.fn()
  const loadMore = jest.fn()
  render(
    <StoreCartProvider>
      <PhotoGrid photos={[photo('a'), photo('b')]} onSelect={onSelect} hasMore={false} loadMore={loadMore} loading={false} {...props} />
    </StoreCartProvider>,
  )
  return { onSelect, loadMore }
}

it('renders thumbnails and selects a photo by index', () => {
  const { onSelect } = renderGrid()
  fireEvent.click(screen.getByLabelText('View photo 2'))
  expect(onSelect).toHaveBeenCalledWith(1)
})

it('marks photos already in the cart', () => {
  window.localStorage.setItem('bob_photo_cart', JSON.stringify([{ photoId: 'b', collectionId: 'c1', thumbnailUrl: 't' }]))
  renderGrid()
  expect(screen.getByLabelText('View photo 2 (in cart)')).toBeInTheDocument()
  expect(screen.getByLabelText('View photo 1')).toBeInTheDocument()
})

it('loads more when the end of the grid scrolls into view', () => {
  const { loadMore } = renderGrid({ hasMore: true })
  observerCallback!([{ isIntersecting: true }])
  expect(loadMore).toHaveBeenCalledTimes(1)
})

it('does not load more while a page is already loading', () => {
  const { loadMore } = renderGrid({ hasMore: true, loading: true })
  expect(screen.getByLabelText('Loading more photos')).toBeInTheDocument()
  observerCallback?.([{ isIntersecting: true }])
  expect(loadMore).not.toHaveBeenCalled()
})

it('offers a Load more button as a fallback', () => {
  const { loadMore } = renderGrid({ hasMore: true })
  fireEvent.click(screen.getByRole('button', { name: 'Load more photos' }))
  expect(loadMore).toHaveBeenCalled()
})

it('does not observe when there is nothing more to load', () => {
  renderGrid({ hasMore: false })
  expect(globalThis.IntersectionObserver).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', { name: 'Load more photos' })).not.toBeInTheDocument()
})
