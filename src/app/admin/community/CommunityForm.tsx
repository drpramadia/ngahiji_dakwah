import type { CmsCommunity } from '@/lib/admin/communities';
import { createCommunityAction, updateCommunityAction } from './actions';

export default function CommunityForm({ community }: { community?: CmsCommunity }) {
  const action = community ? updateCommunityAction : createCommunityAction;

  return (
    <form className="admin-form" action={action}>
      {community && <input type="hidden" name="id" value={community.id} />}
      <div className="admin-form-grid">
        <label>Name<input name="name" required maxLength={120} defaultValue={community?.name ?? ''} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={community?.slug ?? ''} /></label>
        <label>Status<select name="status" defaultValue={community?.status ?? 'DRAFT'}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
        <label>Sort order<input name="sort_order" type="number" min={0} step={1} required defaultValue={community?.sort_order ?? 100} /></label>
        <label>Mark<input name="mark" required maxLength={12} defaultValue={community?.mark ?? '✳'} /></label>
        <label>Color<input name="color" required pattern="#[0-9a-fA-F]{6}" defaultValue={community?.color ?? '#d5fa47'} /></label>
      </div>
      <label>Description<textarea name="description" rows={5} required defaultValue={community?.description ?? ''} /></label>
      <p className="notice">CMS mengatur konten komunitas, bukan desain section. Warna dan mark mengikuti visual language existing.</p>
      <button className="btn" type="submit">{community ? 'Save community' : 'Create community'} ↗</button>
    </form>
  );
}
