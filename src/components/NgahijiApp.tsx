'use client';

import { CalendarDays, Home, Newspaper, Play, Search, Ticket, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ngahijiAssets } from '@/data/assets/ngahiji-assets';
import PublicAuthPanel from '@/components/PublicAuthPanel';
import LiveSection from '@/components/LiveSection';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { resolveMedia } from '@/lib/assets';
import type { EventRecord, TicketType } from '@/lib/ngahiji-catalog';
import type { CommunityRecord, StoryRecord } from '@/lib/ngahiji-content';
import type { LiveStreamFeed } from '@/lib/live-streams/types';

export type CatalogEvent = EventRecord & { tickets: TicketType[] };
type Modal =
  | { type: 'event'; event: CatalogEvent }
  | { type: 'register'; event: CatalogEvent }
  | { type: 'payment'; event: CatalogEvent; names: string[] }
  | { type: 'confirm'; event: CatalogEvent; names: string[] }
  | { type: 'story'; story: StoryRecord }
  | { type: 'community'; community: CommunityRecord }
  | { type: 'live' }
  | { type: 'about' }
  | { type: 'search' }
  | { type: 'auth'; mode: 'login' | 'join' }
  | null;

type Viewer = {
  name: string;
  role: string;
  isAdmin: boolean;
  homeHref: string;
};

type Props = {
  communities: CommunityRecord[];
  events: CatalogEvent[];
  stories: StoryRecord[];
  catalogError: string | null;
  contentError: string | null;
  liveFeed?: LiveStreamFeed | null;
  viewer?: Viewer | null;
};

const logoUrl = '/NGAHIJI_LOGO.png';
const instagramUrl = 'https://www.instagram.com/ngahiji_dakwah/';
const heroMainImage = resolveMedia({ url: ngahijiAssets.heroKajian.publicPath, alt_text: ngahijiAssets.heroKajian.altText });
const heroCommunityImage = resolveMedia({ url: ngahijiAssets.heroCommunity.publicPath, alt_text: ngahijiAssets.heroCommunity.altText });
const liveImage = resolveMedia({ url: ngahijiAssets.liveKajianStage.publicPath, alt_text: ngahijiAssets.liveKajianStage.altText });
const proofImages = [ngahijiAssets.communityYouthCircle, ngahijiAssets.communityFamilyCircle, ngahijiAssets.communityVolunteerCircle].map((asset) => resolveMedia({ url: asset.publicPath, alt_text: asset.altText }));
const momentImages = proofImages;

function money(value: number) {
  return value ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : 'Gratis';
}

function dateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' }).format(date),
    month: new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' }).format(date).toUpperCase(),
    long: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date)
  };
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

function lowestTicket(event: CatalogEvent) {
  return [...event.tickets].sort((a, b) => a.price_idr - b.price_idr)[0];
}

function mediaImage(src: string, alt: string) {
  return resolveMedia({ url: src, alt_text: alt });
}

export default function NgahijiApp({ communities, events, stories, catalogError, contentError, liveFeed, viewer }: Props) {
    const [modal, setModal] = useState<Modal>(null);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState('');
  const visibleStories = useMemo(() => filter === 'All' ? stories.slice(0, 3) : stories.filter((story) => story.category === filter), [filter, stories]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  return (
    <>
      <a className="skip" href="#main">Langsung ke konten</a>
      <header className="top">
        <div className="wrap nav">
          <a className="logo" href="#home" aria-label="Ngahiji Dakwah Organizer - Beranda"><img src={logoUrl} alt="Logo resmi Ngahiji Dakwah Organizer" /></a>
          <nav className="navlinks" aria-label="Navigasi utama">
            <a className="active" href="#home">Home</a><a href="#events">Events</a><a href="#media">Media</a><a href="#live">Live</a><a href="#community">Community</a><button onClick={() => setModal({ type: 'about' })}>About</button>
          </nav>
          <div className="navright">
            <button className="iconbtn" aria-label="Cari event dan cerita" onClick={() => setModal({ type: 'search' })}><Search /></button>
                        {viewer ? (
              <>
                <a className="btn" href={viewer.homeHref}>
                  <UserRound size={14} /> {viewer.isAdmin ? 'Admin' : 'My Ngahiji'} <span>↗</span>
                </a>
                <form action="/api/logout" method="POST">
                  <button className="btn light desktop" type="submit" title="Keluar">Keluar</button>
                </form>
              </>
            ) : (
              <>
                <button className="btn light desktop" onClick={() => setModal({ type: 'auth', mode: 'login' })}>Masuk</button>
                <button className="btn" onClick={() => setModal({ type: 'auth', mode: 'join' })}>Join Ngahiji <span>↗</span></button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main">
        <section className="wrap hero" id="home">
          <div><div className="eyebrow">Event · Kajian · Cerita · Komunitas</div><h1>TEMPAT<br />KEBAIKAN<br /><span className="marked">BERTEMU.</span></h1><p className="intro">Ngahiji adalah ruang untuk kamu yang ingin terhubung, bertumbuh, dan berdampak bersama melalui event, kajian, media dan komunitas.</p><div className="heroactions"><a className="btn" href="#events">EXPLORE EVENTS <span>↗</span></a><button className="btn light" onClick={() => setModal({ type: 'about' })}><Play size={14} /> TENTANG KAMI</button></div><div className="proof"><div className="avatars">{proofImages.map((image) => <img alt="" src={image.src} key={image.src} />)}</div><div>Beda cerita. Satu kebaikan.<strong>Perjalananmu bisa mulai di sini. ↗</strong></div></div></div>
          <div className="heroart" aria-label="Kolase suasana pertemuan komunitas"><div className="scribble">Let's<br />Ngahiji!</div><span className="spark">✳</span><div className="photo-main"><img alt={heroMainImage.alt} src={heroMainImage.src} /></div><div className="photo-second"><img alt={heroCommunityImage.alt} src={heroCommunityImage.src} /></div><span className="sticker white">✦ &nbsp; Good people.</span><span className="sticker violet">↗ &nbsp; Meaningful moments</span><span className="sticker orange">☺ &nbsp; Better together</span><span className="artnote">A LITTLE GOOD GOES A LONG WAY. ↗</span></div>
        </section>
        <div className="ticker"><div className="wrap tickerline"><span>COME AS YOU ARE</span><b>✳</b><span>LEARN SOMETHING GOOD</span><b>✳</b><span>MEET YOUR PEOPLE</span><b>✳</b><span>LET'S NGAHIJI</span></div></div>
        <section className="wrap" id="events"><div className="sectionhead"><div><div className="eyebrow">Make time for something good</div><h2>What's happening?<span className="dot" /></h2><p>Jangan sampai ketinggalan event dan kajian terbaru dari Ngahiji.</p></div><button className="smalllink" onClick={() => setModal({ type: 'search' })}>Lihat semua event <span>↗</span></button></div>{catalogError ? <div className="serviceerror"><h3>Catalog service error</h3><p>{catalogError}</p><small>Koneksi katalog sedang tidak tersedia. Coba lagi beberapa saat.</small></div> : <div className="events" aria-label="Event pilihan">{events.map((event) => { const parts = dateParts(event.starts_at); const ticket = lowestTicket(event); const image = mediaImage(event.image_url, `Ilustrasi ${event.category}`); return <button className="event" key={event.id} onClick={() => setModal({ type: 'event', event })}><img src={image.src} alt={image.alt} /><span className="date"><b>{parts.day}</b>{parts.month}<br />2026</span><span className="status">{ticket?.price_idr ? 'REGISTRATION OPEN' : 'FREE REGISTRATION'}</span><div className="eventtext"><span className="eventtag">{event.category}</span><span className="location">⌖ {event.city}</span><h3>{event.title}</h3><p>{event.format}</p><div className="eventfoot"><span>{ticket ? (ticket.price_idr ? 'Mulai dari ' + money(ticket.price_idr) : 'Gratis · Daftar dulu, ya!') : 'Tiket belum tersedia'}</span><span className="roundarrow">↗</span></div></div></button>; })}</div>}<p className="viewlabel">CURATED FOR YOU</p></section>
        <LiveSection initialFeed={liveFeed ?? null} />
        <section className="wrap media" id="media"><div className="sectionhead"><div><div className="eyebrow">A little perspective</div><h2>Stories worth sharing.<span className="dot orange-dot" /></h2><p>Insight baru. Cerita dekat. Bekal untuk perjalananmu.</p></div><button className="smalllink" onClick={() => setModal({ type: 'search' })}>Explore media ↗</button></div>{contentError ? <div className="serviceerror"><h3>Content service error</h3><p>{contentError}</p><small>Konten media sedang tidak tersedia. Coba lagi beberapa saat.</small></div> : <><div className="filters" role="group" aria-label="Kategori media">{['All', 'Kajian', 'Lifestyle', 'Youth', 'Family', 'Community'].map((name) => <button key={name} className={filter === name ? 'filter selected' : 'filter'} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name === 'All' ? 'Semua' : name}</button>)}</div><div className="mediagrid">{visibleStories.map((story) => { const image = mediaImage(story.image_url, `Ilustrasi ${story.category}`); return <button className="story" key={story.slug} onClick={() => setModal({ type: 'story', story })}><div className="storyimage"><img src={image.src} alt={image.alt} /><span className="pill">{story.category}</span></div><span className="storymeta">{displayDate(story.published_at)} / {story.reading_time}</span><h3>{story.title}</h3><p>{story.format.replace('_', ' ')} ↗</p></button>; })}</div></>}</section>
        <section className="wrap community" id="community"><div><div className="eyebrow">You belong here</div><h2>Find your people.<span className="dot blue-dot" /></h2><p>Bertemu yang satu frekuensi. Bertumbuh dengan cara kamu sendiri.</p></div><div className="communitylist">{communities.map((community) => <button className="communityitem" key={community.slug} onClick={() => setModal({ type: 'community', community })}><span className="communityicon" style={{ background: community.color }}>{community.mark}</span>{community.name}</button>)}</div></section>
        <section className="wrap moments" id="moments"><div className="sectionhead"><div><div className="eyebrow">Real people. Real connections.</div><h2>Ngahiji moment.</h2><p>Bukan sekadar datang. Tapi jadi bagian.</p></div><span className="script">Small moments,<br />big meaning. ↙</span></div><div className="momentgrid"><div className="moment"><img alt={momentImages[0].alt} src={momentImages[0].src} /><span>Good company ☺</span></div><div className="moment"><img alt={momentImages[1].alt} src={momentImages[1].src} /><span>A table for everyone.</span></div><div className="moment"><img alt={momentImages[2].alt} src={momentImages[2].src} /><span>More than an event ↗</span></div><div className="moment quote"><b>“Datang untuk acaranya.<br />Pulang dengan rasa keluarga.”</b><small>THE FEELING WE WANT TO CREATE.<br /><br />Let's Ngahiji.</small></div></div></section>
        <div className="wrap organizer"><div><h3>Punya event? Let's make it happen. ↗</h3><p>Bawa ide baikmu lebih jauh, bersama Ngahiji.</p></div><button className="btn light" onClick={() => setModal({ type: 'about' })}>SUBMIT YOUR EVENT <span>↗</span></button></div>
        <section className="wrap closing" id="join"><div className="eyebrow">Your next chapter starts here</div><h2>LET&apos;S NGAHIJI.</h2><p>Temukan event, cerita dan orang-orang yang membuat perjalananmu lebih berarti.</p>{viewer ? <a className="btn" href={viewer.homeHref}>Lanjut ke {viewer.isAdmin ? 'Admin' : 'Member Area'} <span>↗</span></a> : <button className="btn" onClick={() => setModal({ type: 'auth', mode: 'join' })}>JOIN NGAHIJI <span>↗</span></button>}</section>
      </main>
      <footer className="wrap" id="about"><div className="footergrid"><div className="footerbrand"><a className="logo" href="#home"><img src={logoUrl} alt="Logo resmi Ngahiji Dakwah Organizer" /></a><p>Tempat kebaikan bertemu.<br />Ngahiji Dakwah Organizer.<br />Rooted in faith. Connected by good.</p></div><div className="footerlinks"><div><h4>EXPLORE</h4><a href="#events">Events</a><a href="#media">Media</a><a href="#live">Live</a><a href="#community">Community</a></div><div><h4>FIND US</h4><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram @ngahiji_dakwah ↗</a><span>TikTok</span><span>YouTube</span><span>WhatsApp</span></div></div><form className="newsletter" onSubmit={(event) => { event.preventDefault(); showToast('Terima kasih. Kamu sudah masuk daftar kabar Ngahiji.'); }}><h3>Stay in the loop.</h3><p>Hal baik layak sampai ke inbox kamu.</p><label htmlFor="newsEmail">Email kamu</label><div className="emailrow"><input id="newsEmail" type="email" required placeholder="hello@you.com" /><button type="submit">SUBSCRIBE ↗</button></div></form></div><div className="legal"><span>© 2026 Ngahiji. A little good, together.</span><span>Developed by Mahakarya Arunika Creative</span></div></footer>
      <nav className="dock" aria-label="Navigasi seluler"><a className="active" href="#home"><Home />Home</a><a href="#events"><CalendarDays />Events</a><a href="#live"><Play />Live</a><a href="#media"><Newspaper />Media</a>{viewer && <a href="/member"><Ticket />Tiket Saya</a>}<a href="/profile"><UserRound />Profile</a></nav>
      {modal && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="dialog" role="dialog" aria-modal="true"><button className="iconbtn close" aria-label="Tutup dialog" onClick={() => setModal(null)}><X /></button>{modal.type === 'event' && <EventModal event={modal.event} onRegister={() => setModal({ type: 'register', event: modal.event })} />}{modal.type === 'register' && (() => { const t = lowestTicket(modal.event); return t ? <EventRegistrationForm eventId={modal.event.id} eventTitle={modal.event.title} ticket={{ id: t.id, name: t.name, price_idr: t.price_idr }} defaultBuyer={viewer ? { full_name: viewer.name } : undefined} /> : <p>Tiket belum tersedia.</p>; })()}{modal.type === 'payment' && <PaymentModal event={modal.event} names={modal.names} onConfirm={() => setModal({ type: 'confirm', event: modal.event, names: modal.names })} />}{modal.type === 'confirm' && <ConfirmModal event={modal.event} names={modal.names} />}{modal.type === 'story' && <InfoModal eyebrow={`${modal.story.category} / ${modal.story.format.replace('_', ' ')}`} title={modal.story.title} image={modal.story.image_url} notice="Konten editorial dikelola oleh Ngahiji.">{modal.story.body}</InfoModal>}{modal.type === 'community' && <InfoModal eyebrow="Find your people" title={`Ngahiji ${modal.community.name}.`} notice="Jadwal komunitas diumumkan melalui kanal resmi Ngahiji.">{modal.community.description}</InfoModal>}{modal.type === 'live' && <InfoModal eyebrow="Ngahiji Live / Preview" title="Good conversations. Wherever you are." image={liveImage.src} notice="Siaran live akan tersedia sesuai jadwal dan sumber streaming resmi.">Ini adalah area pratinjau Ngahiji Live.</InfoModal>}{modal.type === 'about' && <InfoModal eyebrow="Ngahiji Dakwah Organizer" title="Bertemu. Bertumbuh. Berdampak." notice="Platform Ngahiji terus dikembangkan bersama Mahakarya Arunika Creative.">Ngahiji adalah ruang untuk kamu yang ingin terhubung melalui event, kajian, media, dan komunitas.</InfoModal>}{modal.type === 'search' && <SearchModal events={events} stories={stories} openEvent={(event) => setModal({ type: 'event', event })} openStory={(story) => setModal({ type: 'story', story })} />}{modal.type === 'auth' && <AuthModal mode={modal.mode} />}</div></div>}
      {toast && <div className="toast show" role="status">{toast}</div>}
    </>
  );
}

function EventModal({ event, onRegister }: { event: CatalogEvent; onRegister: () => void }) {
  const ticket = lowestTicket(event);
  const parts = dateParts(event.starts_at);
  const image = mediaImage(event.image_url, 'Ilustrasi acara');
  return <><div className="eyebrow">{event.category} / Event preview</div><h2>{event.title}</h2><div className="dialogimage"><img src={image.src} alt={image.alt} /></div><p>{event.description}</p><div className="detailgrid"><div><small>TANGGAL</small>{parts.long}</div><div><small>LOKASI</small>{event.city}</div><div><small>WAKTU</small>09.00-17.00 WIB</div><div><small>TIKET</small>{ticket ? money(ticket.price_idr) : 'Belum tersedia'}</div></div><h3>A day worth showing up for.</h3><p>{event.format}. Temukan percakapan yang dekat dengan hidupmu dan pengalaman yang bisa kamu bawa pulang.</p><p className="notice">Alur tiket dan pembayaran masih simulasi. Tidak ada transaksi nyata yang dibuat.</p><div className="modalcta"><strong>{ticket ? money(ticket.price_idr) : 'Simulasi'}</strong><button className="btn lime" onClick={onRegister}>{ticket?.price_idr ? 'GET YOUR TICKET' : 'REGISTER NOW'} ↗</button></div></>;
}



function PaymentModal({ event, names, onConfirm }: { event: CatalogEvent; names: string[]; onConfirm: () => void }) {
  const ticket = lowestTicket(event);
  const total = (ticket?.price_idr ?? 0) * names.length;
  return (
    <>
      <div className="eyebrow">Order summary</div>
      <h2>Order summary.</h2>
      <p>{event.title}</p>
      <div className="ticket">
        <div className="orderline"><span>{names.length} × {ticket?.name ?? 'Registration'}</span><strong>{money(total)}</strong></div>
        <div className="orderline"><span>Biaya layanan</span><strong>Rp0</strong></div>
        <div className="orderline total"><span>Total</span><strong>{money(total)}</strong></div>
      </div>
      {ticket && (
        <form action="/api/checkout" method="POST">
          <input type="hidden" name="event_id" value={event.id} />
          <input type="hidden" name="ticket_type_id" value={ticket.id} />
          <input type="hidden" name="quantity" value={names.length} />
          <button className="btn lime" type="submit">Bayar dengan QRIS ↗</button>
        </form>
      )}
      <p className="notice">Anda akan diarahkan ke halaman pembayaran QRIS. Login diperlukan.</p>
      <button className="btn light" type="button" onClick={onConfirm} style={{ marginTop: 10 }}>Lihat pratinjau tiket (simulasi) ↗</button>
    </>
  );
}

function SimulatedQr({ label }: { label: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => (label.charCodeAt(index % label.length) + index * 7) % 3 !== 0);
  return <div className="qrpreview" aria-label="QR simulasi tiket">{cells.map((active, index) => <span key={index} className={active ? 'on' : ''} />)}</div>;
}

function ConfirmModal({ event, names }: { event: CatalogEvent; names: string[] }) {
  const parts = dateParts(event.starts_at);
  return <><div className="eyebrow">Ticket preview / Simulasi</div><h2>A good beginning.</h2><p>Ini pratinjau tiket dan QR. Tidak ada pesanan, pembayaran, email, WhatsApp, atau tiket resmi yang dibuat.</p>{names.map((name, index) => <div className="ticket" key={name + index}><span className="stamp">SIMULASI · TIDAK BERLAKU UNTUK MASUK</span><h3>{event.title}</h3><p>{name}<br />{parts.long} · {event.city}</p><SimulatedQr label={`${event.slug}-${name}-${index}`} /><div className="ticketcode">PESERTA {String(index + 1).padStart(2, '0')}<br /><small>QR resmi diterbitkan oleh server ticketing</small></div></div>)}</>;
}

function InfoModal({ eyebrow, title, image, notice, children }: { eyebrow: string; title: string; image?: string; notice: string; children: React.ReactNode }) {
  return <><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{image && <div className="dialogimage"><img src={image} alt="Ilustrasi" /></div>}<p>{children}</p><p className="notice">{notice}</p></>;
}

function AuthModal({ mode }: { mode: 'login' | 'join' }) {
  return <><div className="eyebrow">MY NGAHIJI</div><h2>{mode === 'join' ? "Let's Ngahiji." : 'Masuk.'}</h2><p>{mode === 'join' ? 'Buat akun atau masuk untuk mengikuti event, media, dan komunitas Ngahiji.' : 'Masuk ke akun Ngahiji untuk melanjutkan perjalananmu.'}</p><PublicAuthPanel mode={mode} /></>;
}

function SearchModal({ events, stories, openEvent, openStory }: { events: CatalogEvent[]; stories: StoryRecord[]; openEvent: (event: CatalogEvent) => void; openStory: (story: StoryRecord) => void }) {
  const [query, setQuery] = useState('');
  const normalized = query.toLowerCase();
  const foundEvents = events.filter((event) => `${event.title} ${event.city} ${event.category}`.toLowerCase().includes(normalized));
  const foundStories = stories.filter((story) => `${story.title} ${story.category}`.toLowerCase().includes(normalized));
  return <><div className="eyebrow">Discover something good</div><h2>Lagi cari apa?</h2><label htmlFor="searchInput">Cari event atau cerita</label><input id="searchInput" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Coba: Youth, Family, ketenangan" /><div className="searchresults">{foundEvents.map((event) => <button key={event.id} onClick={() => openEvent(event)}>{event.title}<small>EVENT · {dateParts(event.starts_at).long}</small></button>)}{foundStories.map((story) => <button key={story.slug} onClick={() => openStory(story)}>{story.title}<small>{story.format.replace('_', ' ')} · {story.category}</small></button>)}</div></>;
}
