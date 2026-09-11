-- NGAHIJI initial production content seed.
-- Idempotent inserts/updates. No deletes.
begin;

insert into public.organizers (id, name)
values ('11111111-1111-4111-8111-111111111111', 'Ngahiji Dakwah Organizer')
on conflict (id) do update set name = excluded.name;

insert into public.events (id, organizer_id, slug, title, description, status, starts_at, ends_at, timezone, city, venue, hero_storage_path, category, format, image_url)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','11111111-1111-4111-8111-111111111111','ngahiji-youth-day-2026','Ngahiji Youth Day 2026','Satu hari untuk menemukan perspektif baru, teman satu frekuensi, dan versi terbaik dirimu.','PUBLISHED','2026-09-28T02:00:00.000Z','2026-09-28T10:00:00.000Z','Asia/Jakarta','Bandung, Jawa Barat','Venue diumumkan kemudian',null,'Youth & culture','Talkshow · Workshop · Music','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&auto=format&fit=crop&q=85'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','11111111-1111-4111-8111-111111111111','ngahiji-family-gathering','Ngahiji Family Gathering','Waktu berkualitas, cerita hangat, dan ruang bertumbuh bersama keluarga.','PUBLISHED','2026-10-12T02:00:00.000Z','2026-10-12T09:30:00.000Z','Asia/Jakarta','Jakarta','Community Hall Jakarta',null,'Family & connection','Kajian · Community · Sharing','https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1000&auto=format&fit=crop&q=85'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','11111111-1111-4111-8111-111111111111','ngahiji-entrepreneur-forum','Ngahiji Entrepreneur Forum','Temukan ide, koneksi, dan cara membangun usaha yang membawa manfaat.','PUBLISHED','2026-11-05T02:00:00.000Z','2026-11-05T10:00:00.000Z','Asia/Jakarta','Bandung, Jawa Barat','Bandung Creative Center',null,'Ideas & impact','Business · Inspiration · Networking','https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=85')
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  timezone = excluded.timezone,
  city = excluded.city,
  venue = excluded.venue,
  category = excluded.category,
  format = excluded.format,
  image_url = excluded.image_url;

insert into public.ticket_types (id, event_id, name, currency, price_idr, quota, active)
values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Regular','IDR',75000,300,true),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','VIP','IDR',150000,80,true),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Free Registration','IDR',0,200,true),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Regular','IDR',100000,180,true)
on conflict (id) do update set
  event_id = excluded.event_id,
  name = excluded.name,
  currency = excluded.currency,
  price_idr = excluded.price_idr,
  quota = excluded.quota,
  active = excluded.active;

insert into public.media_items (slug, title, category, format, published_at, reading_time, image_url, excerpt, body, status)
values
('ruang-bertumbuh-anak-muda','Kenapa Anak Muda Butuh Ruang untuk Bertumbuh Bersama?','Kajian','ARTICLE','2026-09-10T02:00:00.000Z','5 menit baca','https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&auto=format&fit=crop&q=80','Bertumbuh tidak selalu berarti punya semua jawaban.','Bertumbuh tidak selalu berarti punya semua jawaban. Kadang, langkah pertamanya adalah menemukan ruang aman untuk bertanya.','PUBLISHED'),
('ngahiji-gerakan-bersama','Ngahiji: Lebih dari Sekadar Event, Tapi Gerakan Bersama','Community','VIDEO','2026-09-08T02:00:00.000Z','4 menit','https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=700&auto=format&fit=crop&q=80','Pertemuan yang bermakna bisa menjadi awal perjalanan baru.','Sebuah acara selesai ketika lampu panggung padam. Tapi pertemuan yang bermakna bisa menjadi awal perjalanan baru.','PUBLISHED'),
('ketenangan-dalam-kesibukan','Menemukan Ketenangan dalam Kesibukan','Lifestyle','PODCAST','2026-09-05T02:00:00.000Z','32 menit','https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700&auto=format&fit=crop&q=80','Memberi ruang untuk refleksi membantu kita kembali hadir.','Tidak setiap jeda perlu diisi. Memberi ruang untuk refleksi membantu kita kembali hadir.','PUBLISHED'),
('hal-kecil-berdampak-bersama','Mulai dari Hal Kecil, Berdampak Bersama','Youth','SHORT_STORY','2026-09-03T02:00:00.000Z','3 menit baca','https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=700&auto=format&fit=crop&q=80','Kebaikan tidak harus menunggu rencana besar.','Kebaikan tidak harus menunggu rencana besar. Langkah kecil bisa dimulai hari ini.','PUBLISHED')
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  format = excluded.format,
  published_at = excluded.published_at,
  reading_time = excluded.reading_time,
  image_url = excluded.image_url,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status;

insert into public.communities (slug, name, mark, color, description, status, sort_order)
values
('youth','Youth','☺','#d5fa47','Ruang anak muda untuk belajar, berkarya, dan saling mendukung.','PUBLISHED',10),
('family','Family','♡','#dcc9f5','Cerita parenting, waktu bersama, dan pertemanan antar keluarga.','PUBLISHED',20),
('entrepreneur','Entrepreneur','↗','#ff926c','Bangun usaha yang bertumbuh bersama nilai dan manfaat.','PUBLISHED',30),
('creative','Creative','✳','#bdd5ff','Pertemuan ide, desain, seni, dan ekspresi yang bermakna.','PUBLISHED',40),
('volunteer','Volunteer','❋','#f5c7dc','Ubah kepedulian menjadi aksi kecil yang nyata.','PUBLISHED',50),
('education','Education','⌂','#d5fa47','Belajar sepanjang perjalanan, berbagi sepanjang kesempatan.','PUBLISHED',60)
on conflict (slug) do update set
  name = excluded.name,
  mark = excluded.mark,
  color = excluded.color,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
commit;
