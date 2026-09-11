-- NGAHIJI image asset seed and content remap.
-- Idempotent. No deletes. No storage uploads.
begin;

insert into public.media_assets (bucket_id, storage_path, filename, mime_type, file_size, width, height, alt_text, title, description, category, section, aspect_ratio, source, public_path, status)
values
('public-assets','assets/ngahiji/hero/hero-kajian.png','hero-kajian.png','image/png',null,1200,1500,'Kajian kontemporer dengan pembicara dan audiens Muslim muda','Kajian NGAHIJI','Kajian kontemporer dengan audiens Muslim muda.','KAJIAN','HERO','4:5','LOCAL_PUBLIC','/assets/ngahiji/hero/hero-kajian.png','PUBLISHED'),
('public-assets','assets/ngahiji/hero/hero-community.png','hero-community.png','image/png',null,1000,800,'Komunitas Muslim muda berinteraksi setelah event','Komunitas Setelah Kajian','Anak muda Muslim berinteraksi setelah event.','COMMUNITY','HERO','5:4','LOCAL_PUBLIC','/assets/ngahiji/hero/hero-community.png','PUBLISHED'),
('public-assets','assets/ngahiji/events/event-youth-kajian.svg','event-youth-kajian.svg','image/svg+xml',null,1200,900,'Kajian anak muda Muslim dengan panggung dan audiens','Youth Kajian Event','Kajian anak muda Muslim dengan suasana modern.','KAJIAN','EVENTS','4:3','LOCAL_PUBLIC','/assets/ngahiji/events/event-youth-kajian.svg','PUBLISHED'),
('public-assets','assets/ngahiji/events/event-family-learning.svg','event-family-learning.svg','image/svg+xml',null,1200,900,'Acara pembelajaran keluarga Muslim','Family Learning Event','Acara pembelajaran keluarga Muslim yang hangat.','FAMILY','EVENTS','4:3','LOCAL_PUBLIC','/assets/ngahiji/events/event-family-learning.svg','PUBLISHED'),
('public-assets','assets/ngahiji/events/event-entrepreneur-forum.svg','event-entrepreneur-forum.svg','image/svg+xml',null,1200,900,'Forum wirausaha Muslim dan diskusi komunitas','Muslim Entrepreneur Forum','Forum wirausaha Muslim dan diskusi komunitas.','ENTREPRENEUR','EVENTS','4:3','LOCAL_PUBLIC','/assets/ngahiji/events/event-entrepreneur-forum.svg','PUBLISHED'),
('public-assets','assets/ngahiji/live/live-kajian-stage.png','live-kajian-stage.png','image/svg+xml',null,1280,720,'Panggung kajian profesional untuk Ngahiji Live','Ngahiji Live Kajian Stage','Panggung kajian profesional untuk konten live.','LIVE','LIVE','16:9','LOCAL_PUBLIC','/assets/ngahiji/live/live-kajian-stage.png','PUBLISHED'),
('public-assets','assets/ngahiji/media/story-quran-study.svg','story-quran-study.svg','image/svg+xml',null,900,700,'Visual belajar Al Quran dan kajian Islam','Quran Study Story','Visual belajar Al Quran dan kajian.','KAJIAN','MEDIA','9:7','LOCAL_PUBLIC','/assets/ngahiji/media/story-quran-study.svg','PUBLISHED'),
('public-assets','assets/ngahiji/media/story-community-discussion.svg','story-community-discussion.svg','image/svg+xml',null,900,700,'Diskusi komunitas Muslim muda','Community Discussion Story','Diskusi Muslim muda dalam lingkar komunitas.','COMMUNITY','MEDIA','9:7','LOCAL_PUBLIC','/assets/ngahiji/media/story-community-discussion.svg','PUBLISHED'),
('public-assets','assets/ngahiji/media/story-family-learning.svg','story-family-learning.svg','image/svg+xml',null,900,700,'Keluarga Muslim belajar bersama','Family Learning Story','Pembelajaran keluarga Muslim.','FAMILY','MEDIA','9:7','LOCAL_PUBLIC','/assets/ngahiji/media/story-family-learning.svg','PUBLISHED'),
('public-assets','assets/ngahiji/media/story-volunteer-impact.svg','story-volunteer-impact.svg','image/svg+xml',null,900,700,'Kegiatan relawan dan dampak sosial komunitas','Volunteer Social Impact Story','Kegiatan relawan dan dampak sosial.','VOLUNTEER','MEDIA','9:7','LOCAL_PUBLIC','/assets/ngahiji/media/story-volunteer-impact.svg','PUBLISHED'),
('public-assets','assets/ngahiji/media/story-entrepreneur-community.svg','story-entrepreneur-community.svg','image/svg+xml',null,900,700,'Diskusi komunitas wirausaha Muslim','Muslim Entrepreneur Story','Diskusi komunitas wirausaha Muslim.','ENTREPRENEUR','MEDIA','9:7','LOCAL_PUBLIC','/assets/ngahiji/media/story-entrepreneur-community.svg','PUBLISHED'),
('public-assets','assets/ngahiji/community/community-youth-circle.svg','community-youth-circle.svg','image/svg+xml',null,600,600,'Komunitas anak muda Muslim','Youth Community','Komunitas anak muda Muslim.','YOUTH','COMMUNITY','1:1','LOCAL_PUBLIC','/assets/ngahiji/community/community-youth-circle.svg','PUBLISHED'),
('public-assets','assets/ngahiji/community/community-family-circle.svg','community-family-circle.svg','image/svg+xml',null,600,600,'Komunitas keluarga Muslim','Family Community','Komunitas keluarga Muslim.','FAMILY','COMMUNITY','1:1','LOCAL_PUBLIC','/assets/ngahiji/community/community-family-circle.svg','PUBLISHED'),
('public-assets','assets/ngahiji/community/community-volunteer-circle.svg','community-volunteer-circle.svg','image/svg+xml',null,600,600,'Komunitas relawan Muslim','Volunteer Community','Komunitas relawan dan dampak sosial.','VOLUNTEER','COMMUNITY','1:1','LOCAL_PUBLIC','/assets/ngahiji/community/community-volunteer-circle.svg','PUBLISHED')
on conflict (bucket_id, storage_path) do update set
  filename = excluded.filename,
  mime_type = excluded.mime_type,
  width = excluded.width,
  height = excluded.height,
  alt_text = excluded.alt_text,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  section = excluded.section,
  aspect_ratio = excluded.aspect_ratio,
  source = excluded.source,
  public_path = excluded.public_path,
  status = excluded.status;

update public.events set image_url = '/assets/ngahiji/events/event-youth-kajian.svg' where slug = 'ngahiji-youth-day-2026';
update public.events set image_url = '/assets/ngahiji/events/event-family-learning.svg' where slug = 'ngahiji-family-gathering';
update public.events set image_url = '/assets/ngahiji/events/event-entrepreneur-forum.svg' where slug = 'ngahiji-entrepreneur-forum';

update public.media_items set image_url = '/assets/ngahiji/media/story-quran-study.svg' where slug = 'ruang-bertumbuh-anak-muda';
update public.media_items set image_url = '/assets/ngahiji/media/story-community-discussion.svg' where slug = 'ngahiji-gerakan-bersama';
update public.media_items set image_url = '/assets/ngahiji/media/story-family-learning.svg' where slug = 'ketenangan-dalam-kesibukan';
update public.media_items set image_url = '/assets/ngahiji/media/story-volunteer-impact.svg' where slug = 'hal-kecil-berdampak-bersama';

update public.media_assets
set status = 'ARCHIVED'
where source = 'LOCAL_PUBLIC'
  and public_path in ('/assets/ngahiji/hero/hero-kajian.svg', '/assets/ngahiji/hero/hero-community.svg');

notify pgrst, 'reload schema';
commit;
