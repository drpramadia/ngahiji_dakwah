export type StorageBucket = 'public-assets' | 'event-assets' | 'media-assets' | 'sponsor-assets' | 'speaker-assets';

export type MediaAssetRef = {
  bucket_id: StorageBucket;
  storage_path: string;
  alt_text?: string;
} | {
  url: string;
  alt_text?: string;
};

export function getAssetUrl(ref: MediaAssetRef, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if ('url' in ref) return ref.url;
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required to resolve Supabase Storage assets');
  const base = supabaseUrl.replace(/\/$/, '');
  const path = ref.storage_path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${ref.bucket_id}/${path}`;
}

export function resolveMedia(ref: MediaAssetRef) {
  return {
    src: getAssetUrl(ref),
    alt: ref.alt_text ?? ''
  };
}
