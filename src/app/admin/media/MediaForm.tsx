import type { CmsMediaItem } from '@/lib/admin/media';
import MediaUploader from '@/components/admin/MediaUploader';
import { createMediaAction, updateMediaAction } from './actions';

function dateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function MediaForm({ item }: { item?: CmsMediaItem }) {
  const action = item ? updateMediaAction : createMediaAction;

  return (
    <form className="admin-form" action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="admin-form-grid">
        <label>Title<input name="title" required maxLength={220} defaultValue={item?.title ?? ''} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={item?.slug ?? ''} /></label>
        <label>Status<select name="status" defaultValue={item?.status ?? 'DRAFT'}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
        <label>Format<select name="format" defaultValue={item?.format ?? 'ARTICLE'}><option>ARTICLE</option><option>VIDEO</option><option>PODCAST</option><option>SHORT_STORY</option></select></label>
        <label>Category<input name="category" required defaultValue={item?.category ?? 'Kajian'} /></label>
        <label>Reading time<input name="reading_time" required defaultValue={item?.reading_time ?? '5 menit baca'} /></label>
                <label>Publish date<input name="published_at" type="datetime-local" required defaultValue={dateTimeLocal(item?.published_at) || dateTimeLocal(new Date().toISOString())} /></label>
      </div>
      <MediaUploader name="image_url" bucket="media-assets" folder="cover" label="Cover image" required defaultValue={item?.image_url ?? ''} />
      <label>Excerpt<textarea name="excerpt" rows={3} required defaultValue={item?.excerpt ?? ''} /></label>
      <label>Content<textarea name="body" rows={9} defaultValue={item?.body ?? ''} /></label>
      <div className="admin-form-grid">
        <label>SEO title<input name="seo_title" defaultValue={item?.seo_title ?? ''} /></label>
        <label>SEO description<input name="seo_description" defaultValue={item?.seo_description ?? ''} /></label>
      </div>
      <p className="notice">Upload gambar via CMS akan otomatis tersimpan di Supabase Storage bucket <code>media-assets</code>.</p>
      <button className="btn" type="submit">{item ? 'Save media' : 'Create media'} ↗</button>
    </form>
  );
}
