export interface ViboxQueueItem {
  id: string;
  track_id: string;
  track_title: string;
  track_artist: string;
  track_url: string;
  track_genre: string | null;
  track_duration: number | null;
  primary_vibe: string | null;
  secondary_vibe: string | null;
  position: number | null;
  is_played: boolean;
  played_at: string | null;
  added_by: string;
  added_by_user_id: string | null;
  added_at: string;
  device_type: string | null;
  user_agent: string | null;
  ip_address: string | null;
  session_id: string | null;
  time_in_queue: number | null;
  skip_count: number;
  was_skipped: boolean;
  play_duration: number | null;
  completion_percentage: number | null;
  queue_length_when_added: number | null;
  time_of_day: string | null;
  day_of_week: number | null;
  created_at: string;
  updated_at: string;
}

export interface ViboxQueueInsert {
  track_id: string;
  track_title: string;
  track_artist: string;
  track_url: string;
  track_genre?: string;
  track_duration?: number;
  primary_vibe?: string;
  secondary_vibe?: string;
  added_by: string;
  added_by_user_id?: string;
  device_type?: string;
  user_agent?: string;
  session_id?: string;
  team_uid?: string;
}

export interface ViboxQueueUpdate {
  is_played?: boolean;
  was_skipped?: boolean;
  play_duration?: number;
  completion_percentage?: number;
  skip_count?: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  file?: File;
  url: string;
  isPreloaded?: boolean;
  genre?: string;
  primaryVibe?: string;
  secondaryVibe?: string;
}

export interface TrackMetadata {
  file: string;
  title: string;
  artist: string;
  primaryVibe: string;
  secondaryVibe: string;
  genre: string;
}

export interface VibeHierarchy {
  vibes: {
    [primaryVibe: string]: {
      total: number;
      secondaryVibes: {
        [secondaryVibe: string]: Array<{
          file: string;
          genre: string;
        }>;
      };
    };
  };
}
