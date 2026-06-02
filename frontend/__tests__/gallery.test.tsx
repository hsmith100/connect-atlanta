import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Gallery from '../pages/gallery'

jest.mock('../lib/api', () => ({
  getGallery: jest.fn(),
  getLatestYouTubeVideoId: jest.fn(),
}))
jest.mock('../components/layout/Header', () => ({ __esModule: true, default: () => <header data-testid="header" /> }))
jest.mock('../components/layout/Footer', () => ({ __esModule: true, default: () => <footer data-testid="footer" /> }))
jest.mock('../components/shared/SEO', () => ({ __esModule: true, default: () => null }))
jest.mock('../components/gallery/GalleryGrid', () => ({ __esModule: true, default: () => <div data-testid="gallery-grid" /> }))
jest.mock('../components/gallery/GalleryLightbox', () => ({ __esModule: true, default: () => null }))

const { getGallery, getLatestYouTubeVideoId } = jest.requireMock('../lib/api')

beforeEach(() => {
  getGallery.mockResolvedValue({ photos: [] })
  getLatestYouTubeVideoId.mockResolvedValue('abc123')
})

afterEach(() => jest.clearAllMocks())

// ── youtube embed ──────────────────────────────────────────────────────────────

describe('YouTube latest video embed', () => {
  it('renders an iframe with the video id when the API resolves', async () => {
    render(<Gallery />)
    const iframe = await screen.findByTitle('Latest Beats on the Block video')
    expect(iframe).toBeInTheDocument()
    expect((iframe as HTMLIFrameElement).src).toContain('abc123')
  })

  it('does not render an iframe when the API fails', async () => {
    getLatestYouTubeVideoId.mockRejectedValue(new Error('network error'))
    render(<Gallery />)
    await waitFor(() => expect(getLatestYouTubeVideoId).toHaveBeenCalled())
    expect(screen.queryByTitle('Latest Beats on the Block video')).not.toBeInTheDocument()
  })

  it('embed src uses the youtube embed URL format', async () => {
    render(<Gallery />)
    const iframe = await screen.findByTitle('Latest Beats on the Block video')
    expect((iframe as HTMLIFrameElement).src).toContain('youtube.com/embed/abc123')
  })
})
