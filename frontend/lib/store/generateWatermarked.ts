// Builds the public versions of a store photo in the admin's browser: a 1600px (long edge)
// preview and a 600px-wide thumbnail, both covered by a tiled "BEATS ON THE BLOCK" watermark.
// The full-quality original is uploaded untouched to the private bucket.

const PREVIEW_LONG_EDGE = 1600
const THUMB_WIDTH = 600
const WATERMARK_TEXT = 'BEATS ON THE BLOCK'
const WATERMARK_FONT = '"Anton", Impact, "Arial Black", sans-serif'

export interface WatermarkedImages {
  preview: Blob
  thumbnail: Blob
  width: number
  height: number
}

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const fontSize = Math.max(14, Math.round(width * 0.06))
  const stepX = Math.max(300, fontSize * 10)
  const stepY = Math.max(150, fontSize * 4)
  const diagonal = Math.ceil(Math.hypot(width, height))

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.font = `bold ${fontSize}px ${WATERMARK_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = Math.max(1, fontSize / 20)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.30)'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'

  for (let y = -diagonal; y <= diagonal; y += stepY) {
    // Offset alternate rows so the pattern can't be cropped around.
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2)
    for (let x = -diagonal; x <= diagonal; x += stepX) {
      ctx.fillText(WATERMARK_TEXT, x + offset, y)
      ctx.strokeText(WATERMARK_TEXT, x + offset, y)
    }
  }
  ctx.restore()
}

function render(bitmap: ImageBitmap, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Your browser could not create an image canvas'))
  ctx.drawImage(bitmap, 0, 0, width, height)
  drawWatermark(ctx, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the watermarked image'))),
      'image/jpeg',
      quality,
    )
  })
}

export async function generateWatermarked(file: Blob): Promise<WatermarkedImages> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This file could not be read as an image')
  }

  try {
    const { width, height } = bitmap
    const previewScale = Math.min(1, PREVIEW_LONG_EDGE / Math.max(width, height))
    const thumbScale = Math.min(1, THUMB_WIDTH / width)
    const [preview, thumbnail] = await Promise.all([
      render(bitmap, Math.round(width * previewScale), Math.round(height * previewScale), 0.82),
      render(bitmap, Math.round(width * thumbScale), Math.round(height * thumbScale), 0.8),
    ])
    return { preview, thumbnail, width, height }
  } finally {
    bitmap.close()
  }
}
