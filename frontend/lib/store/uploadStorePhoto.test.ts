import { uploadStorePhoto, replaceStorePhoto } from './uploadStorePhoto'
import { presignStorePhotos, createStorePhotos, presignReplace, completeReplace } from '../api/adminStore'
import { generateWatermarked } from './generateWatermarked'
import { hashFile } from './hashFile'

jest.mock('../api/adminStore')
jest.mock('./generateWatermarked')
jest.mock('./hashFile')

const ctx = { adminKey: 'k', collectionId: 'c1', photographerId: 'ph1', sortOrder: 30 }
const preview = new Blob(['p'], { type: 'image/jpeg' })
const thumbnail = new Blob(['t'], { type: 'image/jpeg' })
const signed = {
  id: 'id-1',
  originalUploadUrl: 'https://s3/orig', previewUploadUrl: 'https://s3/prev', thumbUploadUrl: 'https://s3/thumb',
  previewUrl: 'https://media/store/previews/id-1-1.jpg', thumbnailUrl: 'https://media/store/thumbs/id-1-1.jpg',
  originalKey: 'originals/id-1.png',
}

function file(name: string, type: string) {
  return new File(['data'], name, { type })
}

beforeEach(() => {
  jest.resetAllMocks()
  Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'id-1' }, configurable: true })
  jest.mocked(generateWatermarked).mockResolvedValue({ preview, thumbnail, width: 4000, height: 3000 })
  jest.mocked(presignStorePhotos).mockResolvedValue([signed])
  jest.mocked(createStorePhotos).mockResolvedValue()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
})

it('uploads all three versions and then creates the linked record', async () => {
  const f = file('IMG_1.png', 'image/png')
  await uploadStorePhoto(f, 'hash-1', ctx)

  expect(presignStorePhotos).toHaveBeenCalledWith('k', [{ id: 'id-1', filename: 'IMG_1.png', contentType: 'image/png', bytes: f.size }])
  expect(global.fetch).toHaveBeenCalledWith('https://s3/orig', { method: 'PUT', body: f, headers: { 'Content-Type': 'image/png' } })
  expect(global.fetch).toHaveBeenCalledWith('https://s3/prev', { method: 'PUT', body: preview, headers: { 'Content-Type': 'image/jpeg' } })
  expect(global.fetch).toHaveBeenCalledWith('https://s3/thumb', { method: 'PUT', body: thumbnail, headers: { 'Content-Type': 'image/jpeg' } })
  expect(createStorePhotos).toHaveBeenCalledWith('k', [{
    id: 'id-1', collectionId: 'c1', originalKey: 'originals/id-1.png', originalFilename: 'IMG_1.png',
    originalBytes: f.size, width: 4000, height: 3000, contentHash: 'hash-1',
    previewUrl: signed.previewUrl, thumbnailUrl: signed.thumbnailUrl, photographerId: 'ph1', sortOrder: 30,
  }])
})

it('treats unknown types as JPEG', async () => {
  await uploadStorePhoto(file('IMG.JPG', ''), 'h', ctx)
  expect(jest.mocked(presignStorePhotos).mock.calls[0][1][0].contentType).toBe('image/jpeg')
})

it('does not create a record when watermarking fails', async () => {
  jest.mocked(generateWatermarked).mockRejectedValue(new Error('This file could not be read as an image'))
  await expect(uploadStorePhoto(file('bad.jpg', 'image/jpeg'), 'h', ctx)).rejects.toThrow('could not be read')
  expect(presignStorePhotos).not.toHaveBeenCalled()
  expect(createStorePhotos).not.toHaveBeenCalled()
})

it('does not create a record when an upload fails, and says which one', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve(url === 'https://s3/prev' ? { ok: false, status: 403 } : { ok: true, status: 200 }))
  await expect(uploadStorePhoto(file('a.jpg', 'image/jpeg'), 'h', ctx)).rejects.toThrow('Uploading the preview failed (HTTP 403)')
  expect(createStorePhotos).not.toHaveBeenCalled()
})

describe('replaceStorePhoto', () => {
  beforeEach(() => {
    jest.mocked(hashFile).mockResolvedValue('new-hash')
    jest.mocked(presignReplace).mockResolvedValue({ ...signed, id: 'x1', originalKey: 'originals/x1.jpg' })
    jest.mocked(completeReplace).mockResolvedValue({ id: 'x1' } as never)
  })

  it('uploads new versions for the same photo id and completes the replace', async () => {
    const f = file('new.jpg', 'image/jpeg')
    await expect(replaceStorePhoto(f, 'x1', 'k')).resolves.toEqual({ id: 'x1' })
    expect(presignReplace).toHaveBeenCalledWith('k', 'x1', { filename: 'new.jpg', contentType: 'image/jpeg', bytes: f.size })
    expect(global.fetch).toHaveBeenCalledTimes(3)
    expect(completeReplace).toHaveBeenCalledWith('k', 'x1', {
      originalKey: 'originals/x1.jpg', originalFilename: 'new.jpg', originalBytes: f.size, width: 4000, height: 3000,
      contentHash: 'new-hash', previewUrl: signed.previewUrl, thumbnailUrl: signed.thumbnailUrl,
    })
  })

  it('does not complete when an upload fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
    await expect(replaceStorePhoto(file('n.jpg', 'image/jpeg'), 'x1', 'k')).rejects.toThrow('failed')
    expect(completeReplace).not.toHaveBeenCalled()
  })
})
