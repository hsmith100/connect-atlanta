export interface Photo {
  id: string;
  entity: string;
  url: string;
  thumbnailUrl: string;
  visible: boolean;
  sortOrder: number;
  eventId?: string | null;
  createdAt: string;
}

export interface PresignRequest {
  id: string;
  filename: string;
  contentType: string;
}

export interface PresignResponse {
  id: string;
  uploadUrl: string;
  thumbUploadUrl: string;
  url: string;
  thumbnailUrl: string;
}

export interface PhotoCreatePayload {
  id: string;
  url: string;
  thumbnailUrl: string;
  eventId?: string | null;
  sortOrder: number;
}

export interface PhotoUpdatePayload {
  id: string;
  visible?: boolean;
  sortOrder?: number;
}
