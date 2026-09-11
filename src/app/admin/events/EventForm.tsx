import type { CmsEvent } from '@/lib/admin/events';
import { createEventAction, updateEventAction } from './actions';

function dateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function EventForm({ event }: { event?: CmsEvent }) {
  const ticket = event?.ticket_types?.[0];
  const action = event ? updateEventAction : createEventAction;

  return (
    <form className="admin-form" action={action}>
      {event && <input type="hidden" name="id" value={event.id} />}
      {event && <input type="hidden" name="organizer_id" value={event.organizer_id} />}
      <div className="admin-form-grid">
        <label>Title<input name="title" required maxLength={200} defaultValue={event?.title ?? ''} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={event?.slug ?? ''} /></label>
        <label>Status<select name="status" defaultValue={event?.status ?? 'DRAFT'}><option>DRAFT</option><option>REVIEW</option><option>APPROVED</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
        <label>Category<input name="category" required defaultValue={event?.category ?? 'Event'} /></label>
        <label>Starts at<input name="starts_at" type="datetime-local" required defaultValue={dateTimeLocal(event?.starts_at)} /></label>
        <label>Ends at<input name="ends_at" type="datetime-local" required defaultValue={dateTimeLocal(event?.ends_at)} /></label>
        <label>Timezone<input name="timezone" required defaultValue={event?.timezone ?? 'Asia/Jakarta'} /></label>
        <label>City<input name="city" required defaultValue={event?.city ?? ''} /></label>
        <label>Venue<input name="venue" defaultValue={event?.venue ?? ''} /></label>
        <label>Hero image URL<input name="image_url" type="url" required defaultValue={event?.image_url ?? ''} /></label>
      </div>
      <label>Description<textarea name="description" rows={5} defaultValue={event?.description ?? ''} /></label>
      <label>Format<input name="format" required defaultValue={event?.format ?? ''} /></label>
      <fieldset className="admin-fieldset">
        <legend>Primary ticket type</legend>
        <div className="admin-form-grid">
          <label>Name<input name="ticket_name" required defaultValue={ticket?.name ?? 'Regular'} /></label>
          <label>Price IDR<input name="ticket_price_idr" type="number" min={0} step={1} required defaultValue={ticket?.price_idr ?? 0} /></label>
          <label>Quota<input name="ticket_quota" type="number" min={0} step={1} required defaultValue={ticket?.quota ?? 100} /></label>
          <label className="admin-check"><input name="ticket_active" type="checkbox" defaultChecked={ticket?.active ?? true} /> Active</label>
        </div>
        <p className="notice">Quota adalah kapasitas konfigurasi, bukan stok tersisa. Inventory transaksi aman dibuat pada fase orders/ticketing.</p>
      </fieldset>
      <button className="btn" type="submit">{event ? 'Save event' : 'Create event'} ↗</button>
    </form>
  );
}
