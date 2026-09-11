import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicContentService } from '@/lib/content-runtime';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublicContentService().getStoryBySlug(slug);
  if (!story) return { title: 'Media tidak ditemukan - Ngahiji' };
  return {
    title: `${story.title} - Ngahiji`,
    description: story.excerpt,
    openGraph: {
      title: story.title,
      description: story.excerpt,
      images: story.image_url ? [story.image_url] : []
    }
  };
}

export default async function MediaDetailPage({ params }: Props) {
  const { slug } = await params;
  const story = await getPublicContentService().getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <main className="public-detail">
      <article className="wrap media-detail-page">
        <Link className="pageback" href="/#media">← Kembali ke media</Link>
        <div className="detailhero media-detail-hero">
          <img src={story.image_url} alt={`Ilustrasi ${story.category}`} />
          <div className="detailherocopy">
            <span className="detailpill">{story.category} · {story.format.replace('_', ' ')}</span>
            <h1>{story.title}</h1>
            <p>{formatDate(story.published_at)} · {story.reading_time}</p>
          </div>
        </div>
        <section className="detailcontent articlebody">
          <p className="intro">{story.excerpt}</p>
          <p>{story.body}</p>
        </section>
      </article>
    </main>
  );
}
