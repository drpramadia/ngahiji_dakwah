import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogService } from '@/lib/catalog-runtime';

function money(value: number) {
  return value ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : 'Gratis';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getCatalogService().getEventBySlug(slug);
  if (!event) return { title: 'Event tidak ditemukan - Ngahiji' };
  return {
    title: `${event.title} - Ngahiji`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.image_url ? [event.image_url] : []
    }
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const catalog = getCatalogService();
  const event = await catalog.getEventBySlug(slug);
  if (!event) notFound();
  const tickets = await catalog.getTicketTypes(event.id);

  return (
    <main className="public-detail">
      <section className="wrap detail-page">
        <Link className="pageback" href="/#events">← Kembali ke events</Link>
        <div className="detailhero">
          <img src={event.image_url} alt={`Ilustrasi ${event.category}`} />
          <div className="detailherocopy">
            <span className="detailpill">{event.status}</span>
            <h1>{event.title}</h1>
            <p>{event.description}</p>
          </div>
        </div>
        <div className="detailbody">
          <article className="detailcontent">
            <div className="detailfacts">
              <div><small>TANGGAL</small>{formatDate(event.starts_at)}</div>
              <div><small>WAKTU</small>09.00-17.00 WIB</div>
              <div><small>KOTA</small>{event.city}</div>
              <div><small>VENUE</small>{event.venue ?? 'Diumumkan kemudian'}</div>
            </div>
            <section>
              <div className="eyebrow">Show up. Connect. Grow.</div>
              <h2>Bukan sekadar datang.</h2>
              <p>{event.description} {event.format}. Luangkan waktu untuk belajar, bertukar cerita, dan membawa pulang sesuatu yang berarti.</p>
            </section>
          </article>
          <aside className="detailsidebar">
            <h2>Ticket types</h2>
            {tickets.map((ticket) => <div className="ticket" key={ticket.id}><span className="stamp">{ticket.active ? 'AVAILABLE' : 'INACTIVE'}</span><h3>{ticket.name}</h3><p>{money(ticket.price_idr)}<br />Quota {ticket.quota}</p></div>)}
            {!tickets.length && <p className="notice">Ticket type belum tersedia untuk event ini.</p>}
            <p className="notice">Checkout production akan memakai server-side pricing dan inventory transaction pada fase ticketing.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
