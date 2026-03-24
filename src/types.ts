export type BgAnimation = 'none' | 'light' | 'cloud' | 'wind' | 'water';

export interface Track {
  id: string;
  file: File;
  title: string;
  artist: string;
  duration: number;
  coverUrl?: string;
  audioUrl?: string;
  isVideo: boolean;
  bgAnimation?: BgAnimation;
}
