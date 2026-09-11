import type { EventRecord, TicketType } from '@/lib/ngahiji-catalog';
import type { CommunityRecord, StoryRecord } from '@/lib/ngahiji-content';

const organizerId = '11111111-1111-4111-8111-111111111111';

export const demoEvents: EventRecord[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    organizer_id: organizerId,
    slug: 'ngahiji-youth-day-2026',
    title: 'Ngahiji Youth Day 2026',
    description: 'Satu hari untuk menemukan perspektif baru, teman satu frekuensi, dan versi terbaik dirimu.',
    status: 'PUBLISHED',
    starts_at: '2026-09-28T02:00:00.000Z',
    ends_at: '2026-09-28T10:00:00.000Z',
    timezone: 'Asia/Jakarta',
    city: 'Bandung, Jawa Barat',
    venue: 'Venue diumumkan kemudian',
    hero_storage_path: null,
    category: 'Youth & culture',
    format: 'Talkshow · Workshop · Music',
    image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&auto=format&fit=crop&q=85'
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    organizer_id: organizerId,
    slug: 'ngahiji-family-gathering',
    title: 'Ngahiji Family Gathering',
    description: 'Waktu berkualitas, cerita hangat, dan ruang bertumbuh bersama keluarga.',
    status: 'PUBLISHED',
    starts_at: '2026-10-12T02:00:00.000Z',
    ends_at: '2026-10-12T09:30:00.000Z',
    timezone: 'Asia/Jakarta',
    city: 'Jakarta',
    venue: 'Community Hall Jakarta',
    hero_storage_path: null,
    category: 'Family & connection',
    format: 'Kajian · Community · Sharing',
    image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1000&auto=format&fit=crop&q=85'
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    organizer_id: organizerId,
    slug: 'ngahiji-entrepreneur-forum',
    title: 'Ngahiji Entrepreneur Forum',
    description: 'Temukan ide, koneksi, dan cara membangun usaha yang membawa manfaat.',
    status: 'PUBLISHED',
    starts_at: '2026-11-05T02:00:00.000Z',
    ends_at: '2026-11-05T10:00:00.000Z',
    timezone: 'Asia/Jakarta',
    city: 'Bandung, Jawa Barat',
    venue: 'Bandung Creative Center',
    hero_storage_path: null,
    category: 'Ideas & impact',
    format: 'Business · Inspiration · Networking',
    image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=85'
  }
];

export const demoTicketTypes: TicketType[] = [
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', event_id: demoEvents[0].id, name: 'Regular', currency: 'IDR', price_idr: 75000, quota: 300, active: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', event_id: demoEvents[0].id, name: 'VIP', currency: 'IDR', price_idr: 150000, quota: 80, active: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', event_id: demoEvents[1].id, name: 'Free Registration', currency: 'IDR', price_idr: 0, quota: 200, active: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', event_id: demoEvents[2].id, name: 'Regular', currency: 'IDR', price_idr: 100000, quota: 180, active: true }
];

export const demoStories: StoryRecord[] = [
  { slug: 'ruang-bertumbuh-anak-muda', title: 'Kenapa Anak Muda Butuh Ruang untuk Bertumbuh Bersama?', category: 'Kajian', format: 'ARTICLE', published_at: '2026-09-10T02:00:00.000Z', reading_time: '5 menit baca', image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&auto=format&fit=crop&q=80', excerpt: 'Bertumbuh tidak selalu berarti punya semua jawaban.', body: 'Bertumbuh tidak selalu berarti punya semua jawaban. Kadang, langkah pertamanya adalah menemukan ruang aman untuk bertanya.', status: 'PUBLISHED' },
  { slug: 'ngahiji-gerakan-bersama', title: 'Ngahiji: Lebih dari Sekadar Event, Tapi Gerakan Bersama', category: 'Community', format: 'VIDEO', published_at: '2026-09-08T02:00:00.000Z', reading_time: '4 menit', image_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=700&auto=format&fit=crop&q=80', excerpt: 'Pertemuan yang bermakna bisa menjadi awal perjalanan baru.', body: 'Sebuah acara selesai ketika lampu panggung padam. Tapi pertemuan yang bermakna bisa menjadi awal perjalanan baru.', status: 'PUBLISHED' },
  { slug: 'ketenangan-dalam-kesibukan', title: 'Menemukan Ketenangan dalam Kesibukan', category: 'Lifestyle', format: 'PODCAST', published_at: '2026-09-05T02:00:00.000Z', reading_time: '32 menit', image_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700&auto=format&fit=crop&q=80', excerpt: 'Memberi ruang untuk refleksi membantu kita kembali hadir.', body: 'Tidak setiap jeda perlu diisi. Memberi ruang untuk refleksi membantu kita kembali hadir.', status: 'PUBLISHED' },
  { slug: 'hal-kecil-berdampak-bersama', title: 'Mulai dari Hal Kecil, Berdampak Bersama', category: 'Youth', format: 'SHORT_STORY', published_at: '2026-09-03T02:00:00.000Z', reading_time: '3 menit baca', image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=700&auto=format&fit=crop&q=80', excerpt: 'Kebaikan tidak harus menunggu rencana besar.', body: 'Kebaikan tidak harus menunggu rencana besar. Langkah kecil bisa dimulai hari ini.', status: 'PUBLISHED' }
];

export const demoCommunities: CommunityRecord[] = [
  { slug: 'youth', name: 'Youth', mark: '☺', color: '#d5fa47', description: 'Ruang anak muda untuk belajar, berkarya, dan saling mendukung.', status: 'PUBLISHED' },
  { slug: 'family', name: 'Family', mark: '♡', color: '#dcc9f5', description: 'Cerita parenting, waktu bersama, dan pertemanan antar keluarga.', status: 'PUBLISHED' },
  { slug: 'entrepreneur', name: 'Entrepreneur', mark: '↗', color: '#ff926c', description: 'Bangun usaha yang bertumbuh bersama nilai dan manfaat.', status: 'PUBLISHED' },
  { slug: 'creative', name: 'Creative', mark: '✳', color: '#bdd5ff', description: 'Pertemuan ide, desain, seni, dan ekspresi yang bermakna.', status: 'PUBLISHED' },
  { slug: 'volunteer', name: 'Volunteer', mark: '❋', color: '#f5c7dc', description: 'Ubah kepedulian menjadi aksi kecil yang nyata.', status: 'PUBLISHED' },
  { slug: 'education', name: 'Education', mark: '⌂', color: '#d5fa47', description: 'Belajar sepanjang perjalanan, berbagi sepanjang kesempatan.', status: 'PUBLISHED' }
];
