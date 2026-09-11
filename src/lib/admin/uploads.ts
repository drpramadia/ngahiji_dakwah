'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UploadBucket, UploadResult } from '@/lib/admin/upload-types';

const allowedMime = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

function slugifyName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const clean = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
  return `${clean}${ext}`;
}

export async function uploadAssetAction(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const bucketRaw = String(formData.get('bucket') ?? '');
  const folder = String(formData.get('folder') ?? '').replace(/^\/+|\/+$/g, '');
  const file = formData.get('file');

  const allowedBuckets: UploadBucket[] = ['public-assets', 'event-assets', 'media-assets', 'sponsor-assets', 'speaker-assets'];
  if (!allowedBuckets.includes(bucketRaw as UploadBucket)) {
    throw new Error(`Invalid bucket: ${bucketRaw}`);
  }
  const bucket = bucketRaw as UploadBucket;

  if (!(file instanceof File)) throw new Error('No file provided');
  if (file.size === 0) throw new Error('File is empty');
  if (file.size > maxSizeBytes) throw new Error(`File exceeds ${maxSizeBytes / 1024 / 1024} MB limit`);
  if (!allowedMime.has(file.type)) throw new Error(`File type not allowed: ${file.type}`);

  const supabase = await createSupabaseServerClient();
  const safeName = slugifyName(file.name || 'upload');
  const timestamp = Date.now();
  const storagePath = folder ? `${folder}/${timestamp}-${safeName}` : `${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false
  });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;

  // Record metadata (best-effort, does not fail upload if it errors)
  const { error: metaError } = await supabase.from('media_assets').insert({
    bucket_id: bucket,
    storage_path: storagePath,
    filename: safeName,
    mime_type: file.type,
    file_size: file.size,
    alt_text: ''
  });
  if (metaError) console.warn(`[uploads] media_assets metadata insert failed: ${metaError.message}`);

  return {
    publicUrl,
    storagePath,
    bucket,
    filename: safeName,
    mimeType: file.type,
    fileSize: file.size
  };
}