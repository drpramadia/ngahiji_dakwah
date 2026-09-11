'use client';

import { useState } from 'react';
import LivePlayer from '@/components/live/LivePlayer';
import RecommendedVideos from '@/components/live/RecommendedVideos';
import type { LiveStream, LiveStreamFeed } from '@/lib/live-streams/types';

type Props = {
  initialFeed?: LiveStreamFeed | null;
};

export default function LiveSection({ initialFeed }: Props) {
  const feed = initialFeed ?? { featured: null, sidebar: [] };
  const [selected, setSelected] = useState<LiveStream | null>(feed.featured);

  const active = selected ?? feed.featured;

  return (
    <section className="wrap live" id="live">
      <div>
        <div className="eyebrow">The good is on air</div>
        <h2>NGAHIJI<br />LIVE.</h2>
        <p>Saksikan kajian, talkshow, dan momen spesial. Di mana pun kamu berada.</p>
        {active ? (
          <a
            className="btn white"
            href={active.youtube_url || `https://www.youtube.com/watch?v=${active.youtube_video_id}`}
            target="_blank"
            rel="noreferrer"
          >
            Buka di YouTube <span>↗</span>
          </a>
        ) : (
          <button className="btn white" type="button" disabled>Belum ada siaran</button>
        )}
      </div>

      <LivePlayer video={active} />

      <RecommendedVideos
        videos={feed.sidebar}
        activeId={active?.id}
        onSelect={setSelected}
      />
    </section>
  );
}