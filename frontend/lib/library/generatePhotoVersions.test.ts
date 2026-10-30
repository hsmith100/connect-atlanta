import { generatePhotoVersions } from './generatePhotoVersions'

type Ctx = Record<string, jest.Mock | string | number>

const contexts: Ctx[] = []
const canvases: { width: number; height: number; toBlob: jest.Mock }[] = []

function makeCtx(): Ctx {
  return {
    save: jest.fn(), restore: jest.fn(), translate: jest.fn(), rotate: jest.fn(),
    drawImage: jest.fn(), fillText: jest.fn(), strokeText: jest.fn(),
    font: '', textAlign: '', textBaseline: '', lineWidth: 0, fillStyle: '', strokeStyle: '',
  }
}

const realCreateElement = document.createElement.bind(document)

beforeEach(() => {
  contexts.length = 0
  canvases.length = 0
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag !== 'canvas') return realCreateElement(tag)
    const ctx = makeCtx()
    contexts.push(ctx)
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: jest.fn((cb: (b: Blob | null) => void, type: string) => cb(new Blob(['x'], { type }))),
    }
    canvases.push(canvas)
    return canvas as unknown as HTMLElement
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap
})

function mockBitmap(width: number, height: number) {
  const close = jest.fn()
  ;(globalThis as { createImageBitmap?: unknown }).createImageBitmap = jest.fn().mockResolvedValue({ width, height, close })
  return close
}

it('creates clean web (2000px) + thumb and watermarked preview (1600px) + thumb, all JPEG', async () => {
  const close = mockBitmap(6000, 4000)
  const result = await generatePhotoVersions(new Blob(['img']))

  expect(result.width).toBe(6000)
  expect(result.height).toBe(4000)
  expect(canvases.map((c) => [c.width, c.height])).toEqual([[2000, 1333], [600, 400], [1600, 1067], [600, 400]])
  for (const blob of [result.web, result.webThumb, result.preview, result.thumbnail]) expect(blob.type).toBe('image/jpeg')
  expect(close).toHaveBeenCalled()
})

it('watermarks only the store versions', async () => {
  mockBitmap(6000, 4000)
  await generatePhotoVersions(new Blob(['img']))
  const [web, webThumb, preview, thumb] = contexts
  expect(web.fillText).not.toHaveBeenCalled()
  expect(webThumb.fillText).not.toHaveBeenCalled()
  expect((preview.fillText as jest.Mock).mock.calls.length).toBeGreaterThan(4)
  expect((thumb.fillText as jest.Mock).mock.calls.length).toBeGreaterThan(4)
})

it('uses the long edge for portrait photos and never upscales small images', async () => {
  mockBitmap(4000, 6000)
  await generatePhotoVersions(new Blob(['img']))
  expect(canvases[0]).toMatchObject({ width: 1333, height: 2000 })
  expect(canvases[2]).toMatchObject({ width: 1067, height: 1600 })

  canvases.length = 0
  mockBitmap(500, 300)
  await generatePhotoVersions(new Blob(['img']))
  expect(canvases.map((c) => [c.width, c.height])).toEqual([[500, 300], [500, 300], [500, 300], [500, 300]])
})

it('tiles the watermark text many times on each store image', async () => {
  mockBitmap(6000, 4000)
  await generatePhotoVersions(new Blob(['img']))
  for (const ctx of contexts.slice(2)) {
    const fillText = ctx.fillText as jest.Mock
    expect(fillText.mock.calls.length).toBeGreaterThan(4)
    expect(fillText).toHaveBeenCalledWith('BEATS ON THE BLOCK', expect.any(Number), expect.any(Number))
    expect(ctx.strokeText).toHaveBeenCalled()
  }
})

it('rejects with a readable error when the file is not an image', async () => {
  ;(globalThis as { createImageBitmap?: unknown }).createImageBitmap = jest.fn().mockRejectedValue(new Error('decode'))
  await expect(generatePhotoVersions(new Blob(['nope']))).rejects.toThrow('This file could not be read as an image')
})

it('closes the bitmap even when encoding fails', async () => {
  const close = mockBitmap(800, 600)
  canvases.length = 0
  jest.spyOn(document, 'createElement').mockImplementation(() => ({
    width: 0, height: 0, getContext: () => makeCtx(), toBlob: (cb: (b: Blob | null) => void) => cb(null),
  }) as unknown as HTMLElement)
  await expect(generatePhotoVersions(new Blob(['img']))).rejects.toThrow('Could not encode the image')
  expect(close).toHaveBeenCalled()
})
