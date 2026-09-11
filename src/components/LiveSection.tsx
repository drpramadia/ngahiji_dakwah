'use client';

import { useEffect, useState } from 'react';
import type { LiveFeed, YouTubeVideo } from '@/lib/youtube/client';

type Props = {
  initialFeed?: LiveFeed | null;
};

const staticFallback = {
  featured: null,
  sidebar: [] as YouTubeVideo[],
  source: 'recent' as const,
  query: ''
};

function labelForSource(source: LiveFeed['source']) {
  if (source === 'live') return '● LIVE NOW';
  if (source === 'upcoming') return '◐ UPCOMING';
  return '▷ REPLAY';
}

export default function LiveSection({ initialFeed }: Props) {
  const [feed, setFeed] = useState<LiveFeed | null>(initialFeed ?? null);
  const [selected, setSelected] = useState<YouTubeVideo | null>(initialFeed?.featured ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialFeed);

  useEffect(() => {
    if (initialFeed) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/youtube/live', { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError(data.error || 'Gagal memuat live feed');
          setFeed(staticFallback);
        } else {
          setFeed(data as LiveFeed);
          setSelected((data as LiveFeed).featured);
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat live feed');
        setFeed(staticFallback);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialFeed]);

  const active = selected ?? feed?.featured ?? null;
  const sidebar = feed?.sidebar ?? [];

  return (
    <section className="wrap live" id="live">
      <div>
        <div className="eyebrow">The good is on air</div>
        <h2>NGAHIJI<br />LIVE.</h2>
        <p>Saksikan kajian, talkshow, dan momen spesial. Di mana pun kamu berada.</p>
        {active && (
          <a
            className="btn white"
            href={`https://www.youtube.com/watch?v=${active.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            Buka di YouTube <span>↗</span>
          </a>
        )}
      </div>

      <div className="player">
        {active ? (
          <iframe
            key={active.videoId}
            src={`https://www.youtube.com/embed/${active.videoId}?autoplay=0&rel=0&modestbranding=1`}
            title={active.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#deded7', fontSize: 13 }}>
            {loading ? 'Memuat siaran…' : error ? 'Live feed tidak tersedia' : 'Belum ada siaran.'}
          </div>
        )}
        {feed && active && (
          <span className="livebadge" style={feed.source === 'live' ? { background: '#ffebe7', color: '#a93222' } : { background: '#ffffffee', color: '#20221e' }}>
            {labelForSource(feed.source)}
          </span>
        )}
        {active && (
          <div className="caption">
            <strong>{active.title}</strong>
            {active.channelTitle}
          </div>
        )}
      </div>

      <div className="schedule">
        {sidebar.length === 0 && !loading && (
          <button type="button" disabled>
            Belum ada video pendukung
            <small>Silakan cek kembali sebentar lagi</small>
          </button>
        )}
        {sidebar.map((video) => (
          <button
            type="button"
            key={video.videoId}
            onClick={() => setSelected(video)}
            style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 12, alignItems: 'center', padding: 8 }}
          >
            <span
              style={{
                width: 96,
                height: 56,
                borderRadius: 10,
                overflow: 'hidden',
                backgroundImage: `url(${video.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              aria-hidden
            />
            <span style={{ display: 'block', minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                {video.title}
              </span>
              <small style={{ display: 'block', color: '#deded7', marginTop: 4 }}>
                {video.isLive ? 'LIVE' : video.isUpcoming ? 'UPCOMING' : video.channelTitle}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}