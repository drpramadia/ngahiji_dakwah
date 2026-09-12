import type { CmsLiveStream } from '@/lib/admin/live-streams';
import { createLiveStreamAction, updateLiveStreamAction } from './actions';

function dateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offset.toISOString().slice(0, 16);
}

export default function LiveStreamForm({ item }: { item?: CmsLiveStream }) {
  const action = item ? updateLiveStreamAction : createLiveStreamAction;
  const isEdit = Boolean(item);

  return (
    <form className="admin-form" action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="admin-form-grid">
        <label>Title<input name="title" required maxLength={220} defaultValue={item?.title ?? ''} placeholder="Kajian Jumat: Adab Sebelum Ilmu" /></label>
        <label>Category<input name="category" required defaultValue={item?.category ?? 'KAJIAN'} /></label>
        <label>Status<select name="status" defaultValue={item?.status ?? 'PUBLISHED'}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
        <label>Duration label<input name="duration_label" defaultValue={item?.duration_label ?? '45 menit'} placeholder="45 menit / LIVE now" /></label>
        <label>
          YouTube URL / Video ID
          <input
            name="youtube_video_id"
            required
            defaultValue={item?.youtube_url || item?.youtube_video_id || ''}
            placeholder="https://youtu.be/XXXXXXXX atau ID langsung"
          />
        </label>
        <label>Scheduled at<input name="scheduled_at" type="datetime-local" defaultValue={dateTimeLocal(item?.scheduled_at)} /></label>
      </div>

      <label>Description<textarea name="description" rows={4} defaultValue={item?.description ?? ''} placeholder="Ringkasan singkat kajian / topik yang dibahas" /></label>

      <label>Thumbnail URL (opsional — kosongkan untuk pakai default YouTube)<input name="thumbnail_url" defaultValue={item?.thumbnail_url ?? ''} placeholder="https://i.ytimg.com/vi/VIDEOID/hqdefault.jpg" /></label>

      <label className="admin-check">
        <input type="checkbox" name="is_live" defaultChecked={item?.is_live ?? false} />
        <span>Sedang LIVE sekarang (tampilkan sebagai featured di homepage)</span>
      </label>

      <p className="notice">Video ID akan otomatis diekstrak dari URL YouTube. Thumbnail default akan pakai <code>i.ytimg.com/vi/&lt;id&gt;/hqdefault.jpg</code> jika kosong.</p>

      <button className="btn" type="submit">{isEdit ? 'Save live stream' : 'Create live stream'} ↗</button>
    </form>
  );
}
