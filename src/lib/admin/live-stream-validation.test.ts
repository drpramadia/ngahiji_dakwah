import { describe, it, expect } from 'vitest';
import { extractYoutubeVideoId, parseLiveStreamForm } from './live-stream-validation';

describe('extractYoutubeVideoId', () => {
  it('extracts from watch url', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from youtu.be short link', () => {
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from /live/ url', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('extracts from /embed/ url', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('accepts bare id', () => {
    expect(extractYoutubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('rejects garbage', () => {
    expect(extractYoutubeVideoId('not a url')).toBeNull();
    expect(extractYoutubeVideoId('')).toBeNull();
  });
});

describe('parseLiveStreamForm', () => {
  function fd(entries: Record<string, string>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  }

  it('parses valid form and derives urls', () => {
    const input = parseLiveStreamForm(fd({
      title: 'Kajian Jumat',
      youtube_video_id: 'https://youtu.be/dQw4w9WgXcQ',
      status: 'PUBLISHED',
      category: 'KAJIAN',
      duration_label: '45 menit',
      description: 'Ringkasan'
    }));
    expect(input.youtube_video_id).toBe('dQw4w9WgXcQ');
    expect(input.youtube_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(input.thumbnail_url).toContain('dQw4w9WgXcQ');
    expect(input.is_live).toBe(false);
  });

  it('rejects missing title', () => {
    expect(() => parseLiveStreamForm(fd({
      title: '',
      youtube_video_id: 'dQw4w9WgXcQ',
      status: 'PUBLISHED'
    }))).toThrow(/Judul/);
  });

  it('rejects invalid video id', () => {
    expect(() => parseLiveStreamForm(fd({
      title: 'x',
      youtube_video_id: 'nope!',
      status: 'PUBLISHED'
    }))).toThrow(/YouTube/);
  });
});
