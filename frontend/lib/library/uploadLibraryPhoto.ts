import type { LibraryPhoto, LibraryPhotoCreatePayload, LibraryPresignResponse } from '@shared/types/store'
import { presignLibraryPhotos, createLibraryPhotos, presignReplace, completeReplace } from '../api/adminLibrary'
import { generatePhotoVersions, type PhotoVersions } from './generatePhotoVersions'
import { hashFile } from './hashFile'

export interface UploadContext {
  adminKey: string
  collectionId: string
  photographerId: string | null
  sortOrder: number
  forSale: boolean
  inGallery: boolean
}

function contentTypeOf(file: File): 'image/png' | 'image/jpeg' {
  return file.type === 'image/png' ? 'image/png' : 'image/jpeg'
}

async function put(url: string, body: Blob, contentType: string, what: string): Promise<void> {
  const res = await fetch(url, { method: 'PUT', body, headers: { 'Content-Type': contentType } })
  if (!res.ok) throw new Error(`Uploading the ${what} failed (HTTP ${res.status})`)
}

async function putAll(signed: LibraryPresignResponse, file: File, versions: PhotoVersions): Promise<void> {
  await Promise.all([
    put(signed.originalUploadUrl, file, contentTypeOf(file), 'original'),
    put(signed.webUploadUrl, versions.web, 'image/jpeg', 'web version'),
    put(signed.webThumbUploadUrl, versions.webThumb, 'image/jpeg', 'web thumbnail'),
    put(signed.previewUploadUrl, versions.preview, 'image/jpeg', 'preview'),
    put(signed.thumbUploadUrl, versions.thumbnail, 'image/jpeg', 'thumbnail'),
  ])
}

// One photo end to end: generate versions in the browser → presign → upload the original
// (private bucket) and four public versions (media bucket) → create the record that links
// them. The record is created last, so a failure never leaves a photo without its versions.
export async function uploadLibraryPhoto(file: File, contentHash: string, ctx: UploadContext): Promise<void> {
  const versions = await generatePhotoVersions(file)

  const id = crypto.randomUUID()
  const [signed] = await presignLibraryPhotos(ctx.adminKey, [
    { id, filename: file.name, contentType: contentTypeOf(file), bytes: file.size },
  ])
  await putAll(signed, file, versions)

  const payload: LibraryPhotoCreatePayload = {
    id,
    collectionId: ctx.collectionId,
    originalKey: signed.originalKey,
    originalFilename: file.name,
    originalBytes: file.size,
    width: versions.width,
    height: versions.height,
    contentHash,
    webUrl: signed.webUrl,
    webThumbUrl: signed.webThumbUrl,
    previewUrl: signed.previewUrl,
    thumbnailUrl: signed.thumbnailUrl,
    photographerId: ctx.photographerId,
    sortOrder: ctx.sortOrder,
    forSale: ctx.forSale,
    inGallery: ctx.inGallery,
  }
  await createLibraryPhotos(ctx.adminKey, [payload])
}

// Swaps in a new full-quality file for an existing photo, regenerating all public versions.
// The photo keeps its id, switches, price, photographer and sales history.
export async function replaceLibraryPhoto(file: File, photoId: string, adminKey: string): Promise<LibraryPhoto> {
  const [versions, contentHash] = await Promise.all([generatePhotoVersions(file), hashFile(file)])
  const signed = await presignReplace(adminKey, photoId, { filename: file.name, contentType: contentTypeOf(file), bytes: file.size })
  await putAll(signed, file, versions)

  return completeReplace(adminKey, photoId, {
    originalKey: signed.originalKey,
    originalFilename: file.name,
    originalBytes: file.size,
    width: versions.width,
    height: versions.height,
    contentHash,
    webUrl: signed.webUrl,
    webThumbUrl: signed.webThumbUrl,
    previewUrl: signed.previewUrl,
    thumbnailUrl: signed.thumbnailUrl,
  })
}
