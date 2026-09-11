export type LiveStream = {
  id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  status: string;
  is_live: boolean;
  scheduled_at: string | null;
  duration_label: string;
};

export type LiveStreamFeed = {
  featured: LiveStream | null;
  sidebar: LiveStream[];
};