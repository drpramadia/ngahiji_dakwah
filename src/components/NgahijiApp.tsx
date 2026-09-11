'use client';

import { CalendarDays, Home, Newspaper, Play, Search, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EventRecord, TicketType } from '@/lib/ngahiji-catalog';

export type CatalogEvent = EventRecord & { tickets: TicketType[] };
type Story = { title: string; category: string; format: string; date: string; time: string; image: string; text: string };
type Community = { name: string; mark: string; color: string; text: string };
type Modal =
  | { type: 'event'; event: CatalogEvent }
  | { type: 'register'; event: CatalogEvent }
  | { type: 'confirm'; event: CatalogEvent; names: string[] }
  | { type: 'story'; story: Story }
  | { type: 'community'; community: Community }
  | { type: 'live' }
  | { type: 'join' }
  | { type: 'about' }
  | { type: 'search' }
  | null;

type Props = {
  communities: Community[];
  demoMode: boolean;
  events: CatalogEvent[];
  stories: Story[];
  catalogError: string | null;
};

const logoUrl = '/NGAHIJI_LOGO.png';
const instagramUrl = 'https://www.instagram.com/ngahiji_dakwah/';

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

function lowestTicket(event: CatalogEvent) {
  return [...event.tickets].sort((a, b) => a.price_idr - b.price_idr)[0];
}

export default function NgahijiApp({ communities, demoMode, events, stories, catalogError }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [filter, setFilter] = useState('All');
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState('');
  const visibleStories = useMemo(() => filter === 'All' ? stories.slice(0, 3) : stories.filter((story) => story.category === filter), [filter, stories]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  function submitRegistration(formData: FormData, event: CatalogEvent) {
    const names = Array.from({ length: quantity }, (_, index) => String(formData.get(`attendee-${index}`) || `Peserta ${index + 1}`));
    setModal({ type: 'confirm', event, names });
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
          <div className="navright"><button className="iconbtn" aria-label="Cari event dan cerita" onClick={() => setModal({ type: 'search' })}><Search /></button><button className="btn light desktop" onClick={() => setModal({ type: 'join' })}>Masuk</button><button className="btn" onClick={() => setModal({ type: 'join' })}>Join Ngahiji <span>↗</span></button></div>
        </div>
      </header>
      {demoMode && <div className="demobar">DEMO MODE · Layanan disimulasikan · Gunakan data contoh · Tidak ada pembayaran, email, WhatsApp, tiket resmi, atau QR check-in produksi.</div>}
      <main id="main">
        <section className="wrap hero" id="home">
          <div><div className="eyebrow">Event · Kajian · Cerita · Komunitas</div><h1>TEMPAT<br />KEBAIKAN<br /><span className="marked">BERTEMU.</span></h1><p className="intro">Ngahiji adalah ruang untuk kamu yang ingin terhubung, bertumbuh, dan berdampak bersama melalui event, kajian, media dan komunitas.</p><div className="heroactions"><a className="btn" href="#events">EXPLORE EVENTS <span>↗</span></a><button className="btn light" onClick={() => setModal({ type: 'about' })}><Play size={14} /> TENTANG KAMI</button></div><div className="proof"><div className="avatars"><img alt="" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format" /><img alt="" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format" /><img alt="" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format" /></div><div>Beda cerita. Satu kebaikan.<strong>Perjalananmu bisa mulai di sini. ↗</strong></div></div></div>
          <div className="heroart" aria-label="Kolase suasana pertemuan komunitas"><div className="scribble">Let's<br />Ngahiji!</div><span className="spark">✳</span><div className="photo-main"><img alt="Orang-orang berkumpul dalam sebuah acara kreatif" src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&auto=format&fit=crop&q=85" /></div><div className="photo-second"><img alt="Energi penonton di sebuah festival" src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=550&auto=format&fit=crop&q=80" /></div><span className="sticker white">✦ &nbsp; Good people.</span><span className="sticker violet">↗ &nbsp; Meaningful moments</span><span className="sticker orange">☺ &nbsp; Better together</span><span className="artnote">A LITTLE GOOD GOES A LONG WAY. ↗</span></div>
        </section>
        <div className="ticker"><div className="wrap tickerline"><span>COME AS YOU ARE</span><b>✳</b><span>LEARN SOMETHING GOOD</span><b>✳</b><span>MEET YOUR PEOPLE</span><b>✳</b><span>LET'S NGAHIJI</span></div></div>
        <section className="wrap" id="events"><div className="sectionhead"><div><div className="eyebrow">Make time for something good</div><h2>What's happening?<span className="dot" /></h2><p>Jangan sampai ketinggalan event dan kajian terbaru dari Ngahiji.</p></div><button className="smalllink" onClick={() => setModal({ type: 'search' })}>Lihat semua event <span>↗</span></button></div>{catalogError ? <div className="serviceerror"><h3>Catalog service error</h3><p>{catalogError}</p><small>Production mode tidak fallback ke data demo. Aktifkan NEXT_PUBLIC_DEMO_MODE=true untuk lokal.</small></div> : <div className="events" aria-label="Event pilihan">{events.map((event) => { const parts = dateParts(event.starts_at); const ticket = lowestTicket(event); return <button className="event" key={event.id} onClick={() => setModal({ type: 'event', event })}><img src={event.image_url} alt={`Ilustrasi ${event.category}`} /><span className="date"><b>{parts.day}</b>{parts.month}<br />2026</span><span className="status">{ticket?.price_idr ? 'REGISTRATION OPEN · DEMO' : 'FREE REGISTRATION · DEMO'}</span><div className="eventtext"><span className="eventtag">{event.category}</span><span className="location">⌖ {event.city}</span><h3>{event.title}</h3><p>{event.format}</p><div className="eventfoot"><span>{ticket ? (ticket.price_idr ? 'Mulai dari ' + money(ticket.price_idr) : 'Gratis · Daftar dulu, ya!') : 'Tiket belum tersedia'}</span><span className="roundarrow">↗</span></div></div></button>; })}</div>}<p className="viewlabel">CURATED FOR YOU / Data demo eksplisit saat mode demo aktif.</p></section>
        <section className="wrap live" id="live"><div><div className="eyebrow">The good is on air</div><h2>NGAHIJI<br />LIVE.</h2><p>Saksikan kajian, talkshow, dan momen spesial. Di mana pun kamu berada.</p><button className="btn white" onClick={() => setModal({ type: 'live' })}>Tonton sekarang <span>↗</span></button></div><div className="player"><img alt="Panggung talkshow dengan audiens" src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=850&auto=format&fit=crop&q=80" /><span className="livebadge">● LIVE · DEMO PREVIEW</span><button className="play" aria-label="Buka pratinjau Ngahiji Live" onClick={() => setModal({ type: 'live' })}>▷</button><div className="caption"><strong>Menjadi Baik, Tanpa Merasa Paling Baik.</strong>Ngahiji Talks · Pratinjau siaran</div></div><div className="schedule"><button onClick={() => setModal({ type: 'live' })}>Ruang untuk bertumbuh <small>LIVE PREVIEW</small></button><button onClick={() => setModal({ type: 'live' })}>Ngobrol tentang pulang <small>Jadwal contoh · 19.00 WIB</small></button><button onClick={() => setModal({ type: 'live' })}>Ngahiji Podcast / 012 <small>Replay · 32 menit</small></button></div></section>
        <section className="wrap media" id="media"><div className="sectionhead"><div><div className="eyebrow">A little perspective</div><h2>Stories worth sharing.<span className="dot orange-dot" /></h2><p>Insight baru. Cerita dekat. Bekal untuk perjalananmu.</p></div><button className="smalllink" onClick={() => setModal({ type: 'search' })}>Explore media ↗</button></div><div className="filters" role="group" aria-label="Kategori media">{['All', 'Kajian', 'Lifestyle', 'Youth', 'Family', 'Community'].map((name) => <button key={name} className={filter === name ? 'filter selected' : 'filter'} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name === 'All' ? 'Semua' : name}</button>)}</div><div className="mediagrid">{visibleStories.map((story) => <button className="story" key={story.title} onClick={() => setModal({ type: 'story', story })}><div className="storyimage"><img src={story.image} alt={`Ilustrasi ${story.category}`} /><span className="pill">{story.category}</span></div><span className="storymeta">{story.date} / {story.time}</span><h3>{story.title}</h3><p>{story.format} ↗</p></button>)}</div></section>
        <section className="wrap community" id="community"><div><div className="eyebrow">You belong here</div><h2>Find your people.<span className="dot blue-dot" /></h2><p>Bertemu yang satu frekuensi. Bertumbuh dengan cara kamu sendiri.</p></div><div className="communitylist">{communities.map((community) => <button className="communityitem" key={community.name} onClick={() => setModal({ type: 'community', community })}><span className="communityicon" style={{ background: community.color }}>{community.mark}</span>{community.name}</button>)}</div></section>
        <section className="wrap moments" id="moments"><div className="sectionhead"><div><div className="eyebrow">Real people. Real connections.</div><h2>Ngahiji moment.</h2><p>Bukan sekadar datang. Tapi jadi bagian.</p></div><span className="script">Small moments,<br />big meaning. ↙</span></div><div className="momentgrid"><div className="moment"><img alt="Pertemuan hangat bersama teman" src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop" /><span>Good company ☺</span></div><div className="moment"><img alt="Orang berbincang" src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop" /><span>A table for everyone.</span></div><div className="moment"><img alt="Audiens menikmati acara" src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&auto=format&fit=crop" /><span>More than an event ↗</span></div><div className="moment quote"><b>“Datang untuk acaranya.<br />Pulang dengan rasa keluarga.”</b><small>THE FEELING WE WANT TO CREATE.<br /><br />Let's Ngahiji.</small></div></div></section>
        <div className="wrap organizer"><div><h3>Punya event? Let's make it happen. ↗</h3><p>Bawa ide baikmu lebih jauh, bersama Ngahiji.</p></div><button className="btn light" onClick={() => setModal({ type: 'about' })}>SUBMIT YOUR EVENT <span>↗</span></button></div>
        <section className="wrap closing" id="join"><div className="eyebrow">Your next chapter starts here</div><h2>LET'S NGAHIJI.</h2><p>Temukan event, cerita dan orang-orang yang membuat perjalananmu lebih berarti.</p><button className="btn" onClick={() => setModal({ type: 'join' })}>JOIN NGAHIJI <span>↗</span></button></section>
      </main>
      <footer className="wrap" id="about"><div className="footergrid"><div className="footerbrand"><a className="logo" href="#home"><img src={logoUrl} alt="Logo resmi Ngahiji Dakwah Organizer" /></a><p>Tempat kebaikan bertemu.<br />Ngahiji Dakwah Organizer.<br />Rooted in faith. Connected by good.</p></div><div className="footerlinks"><div><h4>EXPLORE</h4><a href="#events">Events</a><a href="#media">Media</a><a href="#live">Live</a><a href="#community">Community</a></div><div><h4>FIND US</h4><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram @ngahiji_dakwah ↗</a><span>TikTok <small>Tautan resmi segera hadir</small></span><span>YouTube <small>Tautan resmi segera hadir</small></span><span>WhatsApp <small>Tautan resmi segera hadir</small></span></div></div><form className="newsletter" onSubmit={(event) => { event.preventDefault(); showToast('DEMO: email tidak dikirim atau didaftarkan.'); }}><h3>Stay in the loop.</h3><p>Hal baik layak sampai ke inbox kamu.</p><label htmlFor="newsEmail">Email kamu</label><div className="emailrow"><input id="newsEmail" type="email" required placeholder="hello@you.com" /><button type="submit">SUBSCRIBE ↗</button></div><p className="viewlabel">DEMO: Email tidak dikirim atau disimpan.</p></form></div><div className="legal"><span>© 2026 Ngahiji. A little good, together.</span><span>PRODUCT CONCEPT / PHOTOGRAPHY IS ILLUSTRATIVE</span></div></footer>
      <nav className="dock" aria-label="Navigasi seluler"><a className="active" href="#home"><Home />Home</a><a href="#events"><CalendarDays />Events</a><a href="#live"><Play />Live</a><a href="#media"><Newspaper />Media</a><button onClick={() => setModal({ type: 'join' })}><UserRound />Profile</button></nav>
      {modal && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="dialog" role="dialog" aria-modal="true"><button className="iconbtn close" aria-label="Tutup dialog" onClick={() => setModal(null)}><X /></button>{modal.type === 'event' && <EventModal event={modal.event} onRegister={() => { setQuantity(1); setModal({ type: 'register', event: modal.event }); }} />}{modal.type === 'register' && <RegistrationModal event={modal.event} quantity={quantity} setQuantity={setQuantity} onSubmit={(formData) => submitRegistration(formData, modal.event)} />}{modal.type === 'confirm' && <ConfirmModal event={modal.event} names={modal.names} />}{modal.type === 'story' && <InfoModal eyebrow={`${modal.story.category} / ${modal.story.format}`} title={modal.story.title} image={modal.story.image} notice="DEMO: Naskah editorial contoh, bukan artikel atau rekaman resmi Ngahiji.">{modal.story.text}</InfoModal>}{modal.type === 'community' && <InfoModal eyebrow="Find your people" title={`Ngahiji ${modal.community.name}.`} notice="DEMO: Jadwal komunitas dan fasilitator belum diumumkan.">{modal.community.text}</InfoModal>}{modal.type === 'live' && <InfoModal eyebrow="Ngahiji Live / Demo Preview" title="Good conversations. Wherever you are." image="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=850&auto=format&fit=crop&q=80" notice="DEMO: Tidak ada video live, jumlah penonton, replay, email, atau WhatsApp yang dibuat sungguhan.">Ini adalah konsep area siaran langsung, bukan siaran aktif.</InfoModal>}{modal.type === 'join' && <JoinModal />}{modal.type === 'about' && <InfoModal eyebrow="Ngahiji Dakwah Organizer" title="Bertemu. Bertumbuh. Berdampak." notice="Platform ini masih fondasi aplikasi. Auth, order, payment, dan ticketing produksi belum diaktifkan.">Ngahiji adalah ruang untuk kamu yang ingin terhubung melalui event, kajian, media, dan komunitas.</InfoModal>}{modal.type === 'search' && <SearchModal events={events} stories={stories} openEvent={(event) => setModal({ type: 'event', event })} openStory={(story) => setModal({ type: 'story', story })} />}</div></div>}
      {toast && <div className="toast show" role="status">{toast}</div>}
    </>
  );
}

function EventModal({ event, onRegister }: { event: CatalogEvent; onRegister: () => void }) {
  const ticket = lowestTicket(event);
  const parts = dateParts(event.starts_at);
  return <><div className="eyebrow">{event.category} / Event preview / DEMO</div><h2>{event.title}</h2><div className="dialogimage"><img src={event.image_url} alt="Ilustrasi acara" /></div><p>{event.description}</p><div className="detailgrid"><div><small>TANGGAL</small>{parts.long}</div><div><small>LOKASI</small>{event.city}</div><div><small>WAKTU CONTOH</small>09.00-17.00 WIB</div><div><small>TIKET CONTOH</small>{ticket ? money(ticket.price_idr) : 'Belum tersedia'}</div></div><h3>A day worth showing up for.</h3><p>{event.format}. Temukan percakapan yang dekat dengan hidupmu dan pengalaman yang bisa kamu bawa pulang.</p><p className="notice">DEMO: Event, harga, jadwal dan registrasi adalah data contoh. Tidak ada transaksi nyata.</p><div className="modalcta"><strong>{ticket ? money(ticket.price_idr) : 'Demo'}</strong><button className="btn lime" onClick={onRegister}>{ticket?.price_idr ? 'GET YOUR TICKET' : 'REGISTER NOW'} ↗</button></div></>;
}

function RegistrationModal({ event, quantity, setQuantity, onSubmit }: { event: CatalogEvent; quantity: number; setQuantity: (value: number) => void; onSubmit: (formData: FormData) => void }) {
  const ticket = lowestTicket(event);
  return <><div className="eyebrow">Registration / Demo</div><h2>Good things start with a hello.</h2><p>{event.title} · {quantity} peserta · {money((ticket?.price_idr ?? 0) * quantity)}</p><form action={onSubmit} className="demoform"><label htmlFor="quantity">Jumlah peserta (maks. 5)</label><input id="quantity" type="number" min={1} max={5} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /> <h3>Data pembeli</h3><label htmlFor="buyerName">Nama lengkap</label><input id="buyerName" name="buyerName" required maxLength={90} defaultValue="Dio Prama" /><label htmlFor="buyerEmail">Email</label><input id="buyerEmail" name="buyerEmail" type="email" required defaultValue="dio@example.com" /><h3>Data peserta</h3>{Array.from({ length: quantity }, (_, index) => <fieldset key={index}><legend>Peserta {index + 1}</legend><label htmlFor={`attendee-${index}`}>Nama lengkap</label><input id={`attendee-${index}`} name={`attendee-${index}`} required defaultValue={index === 0 ? 'Dio Prama' : ''} /><label htmlFor={`attendee-email-${index}`}>Email peserta</label><input id={`attendee-email-${index}`} name={`attendee-email-${index}`} type="email" required defaultValue={index === 0 ? 'dio@example.com' : ''} /></fieldset>)}<p className="notice">DEMO: Data hanya diproses di memori halaman ini, tidak dikirim atau disimpan. QR tiket resmi memerlukan server penerbit tiket.</p><label className="checkrow"><input type="checkbox" required /> Saya memahami ini simulasi, bukan pembelian atau registrasi nyata.</label><button className="btn" type="submit">Tinjau registrasi demo ↗</button></form></>;
}

function ConfirmModal({ event, names }: { event: CatalogEvent; names: string[] }) {
  const parts = dateParts(event.starts_at);
  return <><div className="eyebrow">Confirmation preview / DEMO</div><h2>A good beginning.</h2><p>Ini contoh tampilan setelah proses registrasi. Tidak ada pesanan, pembayaran, email, WhatsApp, atau tiket resmi yang dibuat.</p>{names.map((name, index) => <div className="ticket" key={name + index}><span className="stamp">DEMO · NOT VALID FOR ENTRY</span><h3>{event.title}</h3><p>{name}<br />{parts.long} · {event.city}</p><div className="ticketcode">PESERTA {String(index + 1).padStart(2, '0')}<br /><small>QR terverifikasi hanya diterbitkan server</small></div></div>)}</>;
}

function InfoModal({ eyebrow, title, image, notice, children }: { eyebrow: string; title: string; image?: string; notice: string; children: React.ReactNode }) {
  return <><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{image && <div className="dialogimage"><img src={image} alt="Ilustrasi" /></div>}<p>{children}</p><p className="notice">{notice}</p></>;
}

function JoinModal() {
  return <><div className="eyebrow">DEMO MODE / My Ngahiji</div><h2>Senang kamu di sini.</h2><form className="demoform"><label htmlFor="joinName">Nama kamu</label><input id="joinName" required defaultValue="Dio Prama" /><label htmlFor="joinEmail">Email</label><input id="joinEmail" type="email" required defaultValue="dio@example.com" /><p className="notice">DEMO: Belum membuat akun, login Google, email OTP, atau keanggotaan nyata.</p><button className="btn" type="button">Lihat profil demo ↗</button></form></>;
}

function SearchModal({ events, stories, openEvent, openStory }: { events: CatalogEvent[]; stories: Story[]; openEvent: (event: CatalogEvent) => void; openStory: (story: Story) => void }) {
  const [query, setQuery] = useState('');
  const normalized = query.toLowerCase();
  const foundEvents = events.filter((event) => `${event.title} ${event.city} ${event.category}`.toLowerCase().includes(normalized));
  const foundStories = stories.filter((story) => `${story.title} ${story.category}`.toLowerCase().includes(normalized));
  return <><div className="eyebrow">Discover something good</div><h2>Lagi cari apa?</h2><label htmlFor="searchInput">Cari event atau cerita</label><input id="searchInput" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Coba: Youth, Family, ketenangan" /><div className="searchresults">{foundEvents.map((event) => <button key={event.id} onClick={() => openEvent(event)}>{event.title}<small>EVENT · {dateParts(event.starts_at).long}</small></button>)}{foundStories.map((story) => <button key={story.title} onClick={() => openStory(story)}>{story.title}<small>{story.format} · {story.category}</small></button>)}</div></>;
}
