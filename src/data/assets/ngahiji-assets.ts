export type NgahijiAssetSection = 'HERO' | 'EVENTS' | 'LIVE' | 'MEDIA' | 'COMMUNITY';

export type NgahijiAsset = {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: string;
  section: NgahijiAssetSection;
  altText: string;
  aspectRatio: string;
  width: number;
  height: number;
  source: 'LOCAL_PUBLIC';
  status: 'PUBLISHED';
  publicPath: string;
};

export const ngahijiAssets = {
  heroKajian: {
    id: 'hero-kajian', filename: 'hero-kajian.png', title: 'Kajian NGAHIJI', description: 'Kajian kontemporer dengan audiens Muslim muda.', category: 'KAJIAN', section: 'HERO', altText: 'Kajian kontemporer dengan pembicara dan audiens Muslim muda', aspectRatio: '4:5', width: 1200, height: 1500, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/hero/hero-kajian.png'
  },
  heroCommunity: {
    id: 'hero-community', filename: 'hero-community.png', title: 'Komunitas Setelah Kajian', description: 'Anak muda Muslim berinteraksi setelah event.', category: 'COMMUNITY', section: 'HERO', altText: 'Komunitas Muslim muda berinteraksi setelah event', aspectRatio: '5:4', width: 1000, height: 800, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/hero/hero-community.png'
  },
  eventYouthKajian: {
    id: 'event-youth-kajian', filename: 'event-youth-kajian.png', title: 'Youth Kajian Event', description: 'Kajian anak muda Muslim dengan suasana modern.', category: 'KAJIAN', section: 'EVENTS', altText: 'Kajian anak muda Muslim dengan panggung dan audiens', aspectRatio: '4:3', width: 1200, height: 900, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/events/event-youth-kajian.png'
  },
  eventFamilyLearning: {
    id: 'event-family-learning', filename: 'event-family-learning.png', title: 'Family Learning Event', description: 'Acara pembelajaran keluarga Muslim yang hangat.', category: 'FAMILY', section: 'EVENTS', altText: 'Acara pembelajaran keluarga Muslim', aspectRatio: '4:3', width: 1200, height: 900, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/events/event-family-learning.png'
  },
  eventEntrepreneurForum: {
    id: 'event-entrepreneur-forum', filename: 'event-entrepreneur-forum.png', title: 'Muslim Entrepreneur Forum', description: 'Forum wirausaha Muslim dan diskusi komunitas.', category: 'ENTREPRENEUR', section: 'EVENTS', altText: 'Forum wirausaha Muslim dan diskusi komunitas', aspectRatio: '4:3', width: 1200, height: 900, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/events/event-entrepreneur-forum.png'
  },
  liveKajianStage: {
    id: 'live-kajian-stage', filename: 'live-kajian-stage.png', title: 'Ngahiji Live Kajian Stage', description: 'Panggung kajian profesional untuk konten live.', category: 'LIVE', section: 'LIVE', altText: 'Panggung kajian profesional untuk Ngahiji Live', aspectRatio: '16:9', width: 1280, height: 720, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/live/live-kajian-stage.png'
  },
  storyQuranStudy: {
    id: 'story-quran-study', filename: 'story-quran-study.png', title: 'Quran Study Story', description: 'Visual belajar Al Quran dan kajian.', category: 'KAJIAN', section: 'MEDIA', altText: 'Visual belajar Al Quran dan kajian Islam', aspectRatio: '9:7', width: 900, height: 700, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/media/story-quran-study.png'
  },
  storyCommunityDiscussion: {
    id: 'story-community-discussion', filename: 'story-community-discussion.png', title: 'Community Discussion Story', description: 'Diskusi Muslim muda dalam lingkar komunitas.', category: 'COMMUNITY', section: 'MEDIA', altText: 'Diskusi komunitas Muslim muda', aspectRatio: '9:7', width: 900, height: 700, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/media/story-community-discussion.png'
  },
  storyFamilyLearning: {
    id: 'story-family-learning', filename: 'story-family-learning.png', title: 'Family Learning Story', description: 'Pembelajaran keluarga Muslim.', category: 'FAMILY', section: 'MEDIA', altText: 'Keluarga Muslim belajar bersama', aspectRatio: '9:7', width: 900, height: 700, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/media/story-family-learning.png'
  },
  storyVolunteerImpact: {
    id: 'story-volunteer-impact', filename: 'story-volunteer-impact.svg', title: 'Volunteer Social Impact Story', description: 'Kegiatan relawan dan dampak sosial.', category: 'VOLUNTEER', section: 'MEDIA', altText: 'Kegiatan relawan dan dampak sosial komunitas', aspectRatio: '9:7', width: 900, height: 700, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/media/story-volunteer-impact.svg'
  },
  communityYouthCircle: {
    id: 'community-youth-circle', filename: 'community-youth-circle.svg', title: 'Youth Community', description: 'Komunitas anak muda Muslim.', category: 'YOUTH', section: 'COMMUNITY', altText: 'Komunitas anak muda Muslim', aspectRatio: '1:1', width: 600, height: 600, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/community/community-youth-circle.svg'
  },
  communityFamilyCircle: {
    id: 'community-family-circle', filename: 'community-family-circle.svg', title: 'Family Community', description: 'Komunitas keluarga Muslim.', category: 'FAMILY', section: 'COMMUNITY', altText: 'Komunitas keluarga Muslim', aspectRatio: '1:1', width: 600, height: 600, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/community/community-family-circle.svg'
  },
  communityVolunteerCircle: {
    id: 'community-volunteer-circle', filename: 'community-volunteer-circle.svg', title: 'Volunteer Community', description: 'Komunitas relawan dan dampak sosial.', category: 'VOLUNTEER', section: 'COMMUNITY', altText: 'Komunitas relawan Muslim', aspectRatio: '1:1', width: 600, height: 600, source: 'LOCAL_PUBLIC', status: 'PUBLISHED', publicPath: '/assets/ngahiji/community/community-volunteer-circle.svg'
  }
} satisfies Record<string, NgahijiAsset>;

export const allNgahijiAssets = Object.values(ngahijiAssets);
