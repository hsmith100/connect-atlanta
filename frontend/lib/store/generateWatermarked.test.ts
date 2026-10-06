import { generateWatermarked } from './generateWatermarked'

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

it('creates a 1600px long-edge preview and a 600px-wide thumbnail, both JPEG', async () => {
  const close = mockBitmap(6000, 4000)
  const result = await generateWatermarked(new Blob(['img']))

  expect(result.width).toBe(6000)
  expect(result.height).toBe(4000)
  expect(canvases.map((c) => [c.width, c.height])).toEqual([[1600, 1067], [600, 400]])
  expect(result.preview.type).toBe('image/jpeg')
  expect(result.thumbnail.type).toBe('image/jpeg')
  expect(close).toHaveBeenCalled()
})

it('uses the long edge for portrait photos and never upscales small images', async () => {
  mockBitmap(4000, 6000)
  await generateWatermarked(new Blob(['img']))
  expect(canvases[0]).toMatchObject({ width: 1067, height: 1600 })

  canvases.length = 0
  mockBitmap(500, 300)
  await generateWatermarked(new Blob(['img']))
  expect(canvases.map((c) => [c.width, c.height])).toEqual([[500, 300], [500, 300]])
})

it('tiles the watermark text many times on each image', async () => {
  mockBitmap(6000, 4000)
  await generateWatermarked(new Blob(['img']))
  for (const ctx of contexts) {
    const fillText = ctx.fillText as jest.Mock
    expect(fillText.mock.calls.length).toBeGreaterThan(4)
    expect(fillText).toHaveBeenCalledWith('BEATS ON THE BLOCK', expect.any(Number), expect.any(Number))
    expect(ctx.strokeText).toHaveBeenCalled()
  }
})

it('rejects with a readable error when the file is not an image', async () => {
  ;(globalThis as { createImageBitmap?: unknown }).createImageBitmap = jest.fn().mockRejectedValue(new Error('decode'))
  await expect(generateWatermarked(new Blob(['nope']))).rejects.toThrow('This file could not be read as an image')
})

it('closes the bitmap even when encoding fails', async () => {
  const close = mockBitmap(800, 600)
  canvases.length = 0
  jest.spyOn(document, 'createElement').mockImplementation(() => ({
    width: 0, height: 0, getContext: () => makeCtx(), toBlob: (cb: (b: Blob | null) => void) => cb(null),
  }) as unknown as HTMLElement)
  await expect(generateWatermarked(new Blob(['img']))).rejects.toThrow('Could not encode the watermarked image')
  expect(close).toHaveBeenCalled()
})
