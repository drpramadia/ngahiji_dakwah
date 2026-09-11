'use client';

import type { LiveStream } from '@/lib/live-streams/types';

type Props = {
  videos: LiveStream[];
  activeId?: string | null;
  onSelect: (video: LiveStream) => void;
};

function thumbnailFor(video: LiveStream): string {
  if (video.thumbnail_url) return video.thumbnail_url;
  return `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
}

export default function RecommendedVideos({ videos, activeId, onSelect }: Props) {
  return (
    <div className="schedule">
      <div className="recommend-heading">Kajian Pilihan</div>
      {videos.length === 0 ? (
        <button type="button" disabled>
          Belum ada video pendukung
          <small>Tambahkan kajian baru melalui CMS</small>
        </button>
      ) : (
        videos.map((video) => {
          const active = video.id === activeId;
          return (
            <button
              type="button"
              key={video.id}
              onClick={() => onSelect(video)}
              className={active ? 'recommend-card active' : 'recommend-card'}
              aria-pressed={active}
            >
              <span
                className="recommend-thumb"
                style={{ backgroundImage: `url(${thumbnailFor(video)})` }}
                aria-hidden
              >
                {video.is_live && <span className="recommend-live">LIVE</span>}
                {video.duration_label && !video.is_live && (
                  <span className="recommend-duration">{video.duration_label}</span>
                )}
              </span>
              <span className="recommend-meta">
                <span className="recommend-title">{video.title}</span>
                <small>{video.category}</small>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}