export type LiveStreamFormInput = {
  id?: string;
  title: string;
  description: string;
  youtube_video_id: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  is_live: boolean;
  scheduled_at: string | null;
  duration_label: string;
};

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * Extract a YouTube video ID from a URL or return the input if it already
 * looks like a video ID. Supports:
 *   - https://www.youtube.com/watch?v=VIDEOID
 *   - https://youtu.be/VIDEOID
 *   - https://www.youtube.com/live/VIDEOID
 *   - https://www.youtube.com/embed/VIDEOID
 *   - bare VIDEOID (11 chars typical)
 */
export function extractYoutubeVideoId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (VIDEO_ID_RE.test(value) && !value.includes('/') && !value.includes('?') && !value.includes(':')) {
    return value;
  }
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return VIDEO_ID_RE.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && VIDEO_ID_RE.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      // /live/VIDEOID or /embed/VIDEOID or /shorts/VIDEOID
      if (parts.length >= 2 && ['live', 'embed', 'shorts', 'v'].includes(parts[0])) {
        const id = parts[1];
        return VIDEO_ID_RE.test(id) ? id : null;
      }
    }
  } catch {
    // Not a valid URL; fall through.
  }
  return null;
}

function str(fd: FormData, key: string, max = 500): string {
  const raw = fd.get(key);
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length > max) throw new Error(`${key} melebihi ${max} karakter`);
  return value;
}

export function parseLiveStreamForm(fd: FormData): LiveStreamFormInput {
  const id = str(fd, 'id', 40) || undefined;
  const title = str(fd, 'title', 220);
  const description = str(fd, 'description', 2000);
  const rawVideo = str(fd, 'youtube_video_id', 500);
  const category = str(fd, 'category', 40) || 'KAJIAN';
  const status = str(fd, 'status', 20) as LiveStreamFormInput['status'];
  const is_live = fd.get('is_live') === 'on' || fd.get('is_live') === 'true';
  const scheduledRaw = str(fd, 'scheduled_at', 40);
  const duration_label = str(fd, 'duration_label', 40);
  const thumbnailInput = str(fd, 'thumbnail_url', 500);

  if (!title) throw new Error('Judul wajib diisi');
  if (!rawVideo) throw new Error('YouTube URL / Video ID wajib diisi');
  const videoId = extractYoutubeVideoId(rawVideo);
  if (!videoId) throw new Error('YouTube URL / Video ID tidak valid');

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    throw new Error('Status tidak valid');
  }

  const youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail_url = thumbnailInput || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let scheduled_at: string | null = null;
  if (scheduledRaw) {
    const d = new Date(scheduledRaw);
    if (isNaN(d.getTime())) throw new Error('Tanggal jadwal tidak valid');
    scheduled_at = d.toISOString();
  }

  return {
    id,
    title,
    description,
    youtube_video_id: videoId,
    youtube_url,
    thumbnail_url,
    category,
    status,
    is_live,
    scheduled_at,
    duration_label
  };
}
