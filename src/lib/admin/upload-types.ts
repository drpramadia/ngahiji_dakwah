export type UploadBucket = 'public-assets' | 'event-assets' | 'media-assets' | 'sponsor-assets' | 'speaker-assets';

export type UploadResult = {
  publicUrl: string;
  storagePath: string;
  bucket: UploadBucket;
  filename: string;
  mimeType: string;
  fileSize: number;
};