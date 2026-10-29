import { uploadLibraryPhoto, replaceLibraryPhoto } from './uploadLibraryPhoto'
import { presignLibraryPhotos, createLibraryPhotos, presignReplace, completeReplace } from '../api/adminLibrary'
import { generatePhotoVersions } from './generatePhotoVersions'
import { hashFile } from './hashFile'

jest.mock('../api/adminLibrary')
jest.mock('./generatePhotoVersions')
jest.mock('./hashFile')

const ctx = { adminKey: 'k', collectionId: 'c1', photographerId: 'ph1', sortOrder: 30, forSale: true, inGallery: false }
const blob = (n: string) => new Blob([n], { type: 'image/jpeg' })
const versions = { web: blob('w'), webThumb: blob('wt'), preview: blob('p'), thumbnail: blob('t'), width: 4000, height: 3000 }
const signed = {
  id: 'id-1', originalKey: 'originals/id-1.png',
  originalUploadUrl: 'https://s3/orig', webUploadUrl: 'https://s3/web', webThumbUploadUrl: 'https://s3/webthumb',
  previewUploadUrl: 'https://s3/prev', thumbUploadUrl: 'https://s3/thumb',
  webUrl: 'https://m/library/web/id-1-1.jpg', webThumbUrl: 'https://m/library/web-thumbs/id-1-1.jpg',
  previewUrl: 'https://m/library/previews/id-1-1.jpg', thumbnailUrl: 'https://m/library/thumbs/id-1-1.jpg',
}

function file(name: string, type: string) {
  return new File(['data'], name, { type })
}

beforeEach(() => {
  jest.resetAllMocks()
  Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'id-1' }, configurable: true })
  jest.mocked(generatePhotoVersions).mockResolvedValue(versions)
  jest.mocked(presignLibraryPhotos).mockResolvedValue([signed])
  jest.mocked(createLibraryPhotos).mockResolvedValue()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
})

it('uploads the original and all four versions, then creates the linked record with its switches', async () => {
  const f = file('IMG_1.png', 'image/png')
  await uploadLibraryPhoto(f, 'hash-1', { ...ctx, inGallery: true })

  expect(presignLibraryPhotos).toHaveBeenCalledWith('k', [{ id: 'id-1', filename: 'IMG_1.png', contentType: 'image/png', bytes: f.size }])
  expect(global.fetch).toHaveBeenCalledWith('https://s3/orig', { method: 'PUT', body: f, headers: { 'Content-Type': 'image/png' } })
  for (const [url, body] of [['https://s3/web', versions.web], ['https://s3/webthumb', versions.webThumb], ['https://s3/prev', versions.preview], ['https://s3/thumb', versions.thumbnail]] as const) {
    expect(global.fetch).toHaveBeenCalledWith(url, { method: 'PUT', body, headers: { 'Content-Type': 'image/jpeg' } })
  }
  expect(createLibraryPhotos).toHaveBeenCalledWith('k', [{
    id: 'id-1', collectionId: 'c1', originalKey: 'originals/id-1.png', originalFilename: 'IMG_1.png',
    originalBytes: f.size, width: 4000, height: 3000, contentHash: 'hash-1',
    webUrl: signed.webUrl, webThumbUrl: signed.webThumbUrl, previewUrl: signed.previewUrl, thumbnailUrl: signed.thumbnailUrl,
    photographerId: 'ph1', sortOrder: 30, forSale: true, inGallery: true,
  }])
})

it('supports gallery-only uploads without a photographer', async () => {
  await uploadLibraryPhoto(file('a.jpg', 'image/jpeg'), 'h', { ...ctx, photographerId: null, forSale: false, inGallery: true })
  expect(jest.mocked(createLibraryPhotos).mock.calls[0][1][0]).toMatchObject({ photographerId: null, forSale: false, inGallery: true })
})

it('treats unknown types as JPEG', async () => {
  await uploadLibraryPhoto(file('IMG.JPG', ''), 'h', ctx)
  expect(jest.mocked(presignLibraryPhotos).mock.calls[0][1][0].contentType).toBe('image/jpeg')
})

it('does not create a record when version generation fails', async () => {
  jest.mocked(generatePhotoVersions).mockRejectedValue(new Error('This file could not be read as an image'))
  await expect(uploadLibraryPhoto(file('bad.jpg', 'image/jpeg'), 'h', ctx)).rejects.toThrow('could not be read')
  expect(presignLibraryPhotos).not.toHaveBeenCalled()
  expect(createLibraryPhotos).not.toHaveBeenCalled()
})

it('does not create a record when an upload fails, and says which one', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve(url === 'https://s3/web' ? { ok: false, status: 403 } : { ok: true, status: 200 }))
  await expect(uploadLibraryPhoto(file('a.jpg', 'image/jpeg'), 'h', ctx)).rejects.toThrow('Uploading the web version failed (HTTP 403)')
  expect(createLibraryPhotos).not.toHaveBeenCalled()
})

describe('replaceLibraryPhoto', () => {
  beforeEach(() => {
    jest.mocked(hashFile).mockResolvedValue('new-hash')
    jest.mocked(presignReplace).mockResolvedValue({ ...signed, id: 'x1', originalKey: 'originals/x1.jpg' })
    jest.mocked(completeReplace).mockResolvedValue({ id: 'x1' } as never)
  })

  it('uploads new versions for the same photo id and completes the replace', async () => {
    const f = file('new.jpg', 'image/jpeg')
    await expect(replaceLibraryPhoto(f, 'x1', 'k')).resolves.toEqual({ id: 'x1' })
    expect(presignReplace).toHaveBeenCalledWith('k', 'x1', { filename: 'new.jpg', contentType: 'image/jpeg', bytes: f.size })
    expect(global.fetch).toHaveBeenCalledTimes(5)
    expect(completeReplace).toHaveBeenCalledWith('k', 'x1', {
      originalKey: 'originals/x1.jpg', originalFilename: 'new.jpg', originalBytes: f.size, width: 4000, height: 3000,
      contentHash: 'new-hash', webUrl: signed.webUrl, webThumbUrl: signed.webThumbUrl, previewUrl: signed.previewUrl, thumbnailUrl: signed.thumbnailUrl,
    })
  })

  it('does not complete when an upload fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
    await expect(replaceLibraryPhoto(file('n.jpg', 'image/jpeg'), 'x1', 'k')).rejects.toThrow('failed')
    expect(completeReplace).not.toHaveBeenCalled()
  })
})
