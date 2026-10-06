import type { StorePhoto, StorePhotoCreatePayload, StorePresignResponse } from '@shared/types/store'
import { presignStorePhotos, createStorePhotos, presignReplace, completeReplace } from '../api/adminStore'
import { generateWatermarked } from './generateWatermarked'
import { hashFile } from './hashFile'

export interface UploadContext {
  adminKey: string
  collectionId: string
  photographerId: string
  sortOrder: number
}

async function put(url: string, body: Blob, contentType: string, what: string): Promise<void> {
  const res = await fetch(url, { method: 'PUT', body, headers: { 'Content-Type': contentType } })
  if (!res.ok) throw new Error(`Uploading the ${what} failed (HTTP ${res.status})`)
}

// One photo end to end: watermark in the browser → presign → upload original (private bucket)
// plus preview and thumbnail (media bucket) → create the record that links them. The record
// is created last, so a failure at any step never leaves a photo without its preview.
export async function uploadStorePhoto(file: File, contentHash: string, ctx: UploadContext): Promise<void> {
  const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const { preview, thumbnail, width, height } = await generateWatermarked(file)

  const id = crypto.randomUUID()
  const [signed]: StorePresignResponse[] = await presignStorePhotos(ctx.adminKey, [
    { id, filename: file.name, contentType, bytes: file.size },
  ])

  await Promise.all([
    put(signed.originalUploadUrl, file, contentType, 'original'),
    put(signed.previewUploadUrl, preview, 'image/jpeg', 'preview'),
    put(signed.thumbUploadUrl, thumbnail, 'image/jpeg', 'thumbnail'),
  ])

  const payload: StorePhotoCreatePayload = {
    id,
    collectionId: ctx.collectionId,
    originalKey: signed.originalKey,
    originalFilename: file.name,
    originalBytes: file.size,
    width,
    height,
    contentHash,
    previewUrl: signed.previewUrl,
    thumbnailUrl: signed.thumbnailUrl,
    photographerId: ctx.photographerId,
    sortOrder: ctx.sortOrder,
  }
  await createStorePhotos(ctx.adminKey, [payload])
}

// Swaps in a new full-quality file for an existing photo, regenerating its watermarked
// versions. The photo keeps its id, price, photographer and sales history.
export async function replaceStorePhoto(file: File, photoId: string, adminKey: string): Promise<StorePhoto> {
  const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const [{ preview, thumbnail, width, height }, contentHash] = await Promise.all([generateWatermarked(file), hashFile(file)])
  const signed = await presignReplace(adminKey, photoId, { filename: file.name, contentType, bytes: file.size })

  await Promise.all([
    put(signed.originalUploadUrl, file, contentType, 'original'),
    put(signed.previewUploadUrl, preview, 'image/jpeg', 'preview'),
    put(signed.thumbUploadUrl, thumbnail, 'image/jpeg', 'thumbnail'),
  ])

  return completeReplace(adminKey, photoId, {
    originalKey: signed.originalKey,
    originalFilename: file.name,
    originalBytes: file.size,
    width,
    height,
    contentHash,
    previewUrl: signed.previewUrl,
    thumbnailUrl: signed.thumbnailUrl,
  })
}
