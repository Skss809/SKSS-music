export type BgAnimation = 'none' | 'light' | 'cloud' | 'wind' | 'water';

export interface Track {
  id: string;
  file?: File;
  title: string;
  artist: string;
  duration: number;
  coverFile?: File;
  coverUrl?: string;
  audioUrl?: string;
  isVideo: boolean;
  bgAnimation?: BgAnimation;
  isOnline?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}
