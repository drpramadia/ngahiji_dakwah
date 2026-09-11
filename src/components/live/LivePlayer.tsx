'use client';

import YouTubePlayer from '@/components/YouTubePlayer';
import { resolveMedia } from '@/lib/assets';
import { ngahijiAssets } from '@/data/assets/ngahiji-assets';
import type { LiveStream } from '@/lib/live-streams/types';

type Props = {
  video: LiveStream | null;
};

const fallbackImage = resolveMedia({
  url: ngahijiAssets.liveKajianStage.publicPath,
  alt_text: ngahijiAssets.liveKajianStage.altText
});

function badgeLabel(stream: LiveStream) {
  if (stream.is_live) return '● LIVE NOW';
  if (stream.scheduled_at && new Date(stream.scheduled_at).getTime() > Date.now()) return '◐ UPCOMING';
  return '▷ KAJIAN';
}

function badgeStyle(stream: LiveStream): React.CSSProperties {
  return stream.is_live
    ? { background: '#ffebe7', color: '#a93222' }
    : { background: '#ffffffee', color: '#20221e' };
}

export default function LivePlayer({ video }: Props) {
  return (
    <div className="player">
      {video ? (
        <YouTubePlayer videoId={video.youtube_video_id} title={video.title} />
      ) : (
        <>
          <img alt={fallbackImage.alt} src={fallbackImage.src} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              textShadow: '0 2px 8px #000a'
            }}
          >
            Belum ada siaran
          </div>
        </>
      )}
      {video && <span className="livebadge" style={badgeStyle(video)}>{badgeLabel(video)}</span>}
      {video && (
        <div className="caption">
          <strong>{video.title}</strong>
          {video.description || video.category}
        </div>
      )}
    </div>
  );
}