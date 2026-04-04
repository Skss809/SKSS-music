import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Image as ImageIcon, Plus, Music, Video, Trash2, Shuffle, Repeat, Repeat1, Disc3, Cloud, Wind, Droplets, Sun, Monitor, X, ChevronDown, ListMusic, Search, Globe, Library, Loader2, Download, Check, Rewind, FastForward, Home, TrendingUp, History, Youtube, Sparkles, RefreshCw } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { formatTime, cn } from './lib/utils';
import { Track, BgAnimation, Playlist } from './types';

const BackgroundEffects = ({ type }: { type: BgAnimation }) => {
  if (type === 'none' || !type) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {type === 'light' && (
        <>
          <motion.div 
            animate={{ y: [0, -50, 0], scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/30 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ y: [0, 50, 0], scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-500/30 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ x: [0, 50, 0], scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/30 rounded-full blur-[150px]" 
          />
        </>
      )}
      {type === 'cloud' && (
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[10%] -left-[20%] w-[40%] h-[20%] bg-white/50 blur-[60px] rounded-full animate-[drift_25s_linear_infinite]" />
          <div className="absolute top-[40%] -left-[30%] w-[50%] h-[25%] bg-white/40 blur-[70px] rounded-full animate-[drift_40s_linear_infinite_5s]" />
          <div className="absolute top-[70%] -left-[20%] w-[30%] h-[15%] bg-white/50 blur-[50px] rounded-full animate-[drift_30s_linear_infinite_2s]" />
        </div>
      )}
      {type === 'wind' && (
        <div className="absolute inset-0 opacity-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full animate-[wind_3s_linear_infinite]"
              style={{
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 300 + 100}px`,
                animationDuration: `${Math.random() * 2 + 1.5}s`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}
      {type === 'water' && (
        <div className="absolute inset-0 opacity-40 bg-gradient-to-b from-transparent to-blue-500/20">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-blue-600/40 to-transparent blur-[30px]"
          />
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] w-full h-[50%] bg-gradient-to-t from-cyan-500/30 to-transparent blur-[40px]"
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [globalWallpaper, setGlobalWallpaper] = useState<string | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'home' | 'local' | 'online'>('home');
  const [onlineSource, setOnlineSource] = useState<'audius' | 'jamendo' | 'youtube'>('audius');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const [playHistory, setPlayHistory] = useState<Track[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [playlistMenuTrack, setPlaylistMenuTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isQueueMode, setIsQueueMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const activeTracks = isQueueMode ? queue : tracks;
  const currentTrack = activeTracks[currentIndex];

  useEffect(() => {
    get('global-wallpaper').then((val) => {
      if (val) setGlobalWallpaper(val);
    });
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    get('play-history').then((history: any[]) => {
      if (history) {
        const restoredHistory = history.map(t => ({
          ...t,
          audioUrl: t.isOnline ? t.audioUrl : (t.file ? URL.createObjectURL(t.file) : undefined),
          coverUrl: t.isOnline ? t.coverUrl : (t.coverFile ? URL.createObjectURL(t.coverFile) : undefined)
        }));
        setPlayHistory(restoredHistory);
      }
    });

    get('saved-tracks').then((savedTracks: any[]) => {
      if (savedTracks && savedTracks.length > 0) {
        const restored = savedTracks.map(t => ({
          ...t,
          audioUrl: t.isOnline ? t.audioUrl : (t.file ? URL.createObjectURL(t.file) : undefined),
          coverUrl: t.isOnline ? t.coverUrl : (t.coverFile ? URL.createObjectURL(t.coverFile) : undefined)
        }));
        setTracks(restored);
      }
      setIsLoaded(true);
    });

    get('playlists').then((savedPlaylists: any[]) => {
      if (savedPlaylists) {
        const restoredPlaylists = savedPlaylists.map(p => ({
          ...p,
          tracks: p.tracks.map((t: any) => ({
            ...t,
            audioUrl: t.isOnline ? t.audioUrl : (t.file ? URL.createObjectURL(t.file) : undefined),
            coverUrl: t.isOnline ? t.coverUrl : (t.coverFile ? URL.createObjectURL(t.coverFile) : undefined)
          }))
        }));
        setPlaylists(restoredPlaylists);
      }
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const tracksToSave = tracks.map(t => ({
      id: t.id,
      file: t.file,
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      coverFile: t.coverFile,
      coverUrl: t.isOnline ? t.coverUrl : undefined,
      audioUrl: t.isOnline ? t.audioUrl : undefined,
      isVideo: t.isVideo,
      bgAnimation: t.bgAnimation,
      isOnline: t.isOnline
    }));
    set('saved-tracks', tracksToSave);
  }, [tracks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const playlistsToSave = playlists.map(p => ({
      ...p,
      tracks: p.tracks.map(t => ({
        id: t.id,
        file: t.file,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        coverFile: t.coverFile,
        coverUrl: t.isOnline ? t.coverUrl : undefined,
        audioUrl: t.isOnline ? t.audioUrl : undefined,
        isVideo: t.isVideo,
        bgAnimation: t.bgAnimation,
        isOnline: t.isOnline
      }))
    }));
    set('playlists', playlistsToSave);
  }, [playlists, isLoaded]);

  const [isRefreshingTrending, setIsRefreshingTrending] = useState(false);

  const addToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
    setPlaylistMenuTrack(null);
  };

  const fetchTrending = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshingTrending(true);
    try {
      const offset = isRefresh ? Math.floor(Math.random() * 50) : 0;
      const trendRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=c9cb2a0a&format=json&limit=10&order=popularity_total&offset=${offset}`);
      const trendData = await trendRes.json();
      const trending: Track[] = trendData.results.map((t: any) => ({
        id: `jamendo-${t.id}`,
        title: t.name,
        artist: t.artist_name,
        duration: t.duration,
        audioUrl: t.audio,
        coverUrl: t.image,
        isVideo: false,
        isOnline: true,
        bgAnimation: 'none'
      }));
      setTrendingTracks(trending);
    } catch (e) {
      console.error("Failed to fetch trending data", e);
    } finally {
      if (isRefresh) setIsRefreshingTrending(false);
    }
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoadingHome(true);
      try {
        await fetchTrending();

        const sugRes = await fetch('https://api.jamendo.com/v3.0/tracks/?client_id=c9cb2a0a&format=json&limit=10&tags=electronic|indie|pop&order=popularity_month');
        const sugData = await sugRes.json();
        const suggestions: Track[] = sugData.results.map((t: any) => ({
          id: `jamendo-${t.id}`,
          title: t.name,
          artist: t.artist_name,
          duration: t.duration,
          audioUrl: t.audio,
          coverUrl: t.image,
          isVideo: false,
          isOnline: true,
          bgAnimation: 'none'
        }));
        setSuggestedTracks(suggestions);
      } catch (e) {
        console.error("Failed to fetch home data", e);
      } finally {
        setIsLoadingHome(false);
      }
    };
    fetchHomeData();
  }, []);

  const addToHistory = (track: Track) => {
    setPlayHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const newHistory = [track, ...filtered].slice(0, 20);
      set('play-history', newHistory);
      return newHistory;
    });
  };

  useEffect(() => {
    if (currentTrack && isPlaying) {
      addToHistory(currentTrack);
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentTrack?.audioUrl) {
      // Only update src if it's different to prevent interrupting playback
      if (audioRef.current.getAttribute('src') !== currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.setAttribute('src', currentTrack.audioUrl);
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const getDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(url);
      });
    });
  };

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newTracks: Track[] = await Promise.all(
      files.map(async (file: File) => {
        const duration = await getDuration(file);
        return {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          duration,
          file,
          audioUrl: URL.createObjectURL(file),
          isVideo: file.type.startsWith('video/'),
          bgAnimation: 'none'
        };
      })
    );

    setTracks(prev => [...prev, ...newTracks]);
    if (tracks.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsPlayerOpen(true);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTrack) return;

    const url = URL.createObjectURL(file);
    const updatedTracks = [...tracks];
    updatedTracks[currentIndex] = { ...currentTrack, coverUrl: url, coverFile: file };
    setTracks(updatedTracks);
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setGlobalWallpaper(base64);
      await set('global-wallpaper', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeWallpaper = async () => {
    setGlobalWallpaper(null);
    await set('global-wallpaper', null);
  };

  const changeTrackAnimation = (animation: BgAnimation) => {
    if (!currentTrack) return;
    const updatedTracks = [...tracks];
    updatedTracks[currentIndex] = { ...currentTrack, bgAnimation: animation };
    setTracks(updatedTracks);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (activeTracks.length === 0) return;
    let nextIndex = currentIndex;
    if (shuffle) {
      let next = Math.floor(Math.random() * activeTracks.length);
      while (next === currentIndex && activeTracks.length > 1) {
        next = Math.floor(Math.random() * activeTracks.length);
      }
      nextIndex = next;
    } else {
      if (currentIndex < activeTracks.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeat === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    
    setCurrentIndex(nextIndex);
    
    // Force immediate playback for background execution
    if (audioRef.current && activeTracks[nextIndex]?.audioUrl) {
      audioRef.current.src = activeTracks[nextIndex].audioUrl!;
      audioRef.current.setAttribute('src', activeTracks[nextIndex].audioUrl!);
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (progress > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      let prevIndex = currentIndex;
      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      } else if (repeat === 'all') {
        prevIndex = activeTracks.length - 1;
      }
      
      setCurrentIndex(prevIndex);
      
      // Force immediate playback for background execution
      if (audioRef.current && activeTracks[prevIndex]?.audioUrl) {
        audioRef.current.src = activeTracks[prevIndex].audioUrl!;
        audioRef.current.setAttribute('src', activeTracks[prevIndex].audioUrl!);
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: currentTrack.coverUrl ? [
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/png' },
          { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/png' }
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(details.seekTime);
          updatePositionState();
        }
      });
    }
  }, [currentTrack, tracks.length, currentIndex, shuffle, repeat]);

  const updatePositionState = () => {
    if ('mediaSession' in navigator && audioRef.current) {
      try {
        navigator.mediaSession.setPositionState({
          duration: currentTrack?.duration || audioRef.current.duration || 0,
          playbackRate: audioRef.current.playbackRate || 1,
          position: audioRef.current.currentTime || 0
        });
      } catch (e) {
        // Ignore errors if duration is not valid yet
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      updatePositionState();
    }
  }, [isPlaying, currentTrack]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * currentTrack.duration;
    updatePositionState();
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
    if (percent > 0) setIsMuted(false);
  };

  const removeTrack = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newTracks = tracks.filter((_, i) => i !== index);
    setTracks(newTracks);
    
    if (!isQueueMode) {
      if (currentIndex === index) {
        if (newTracks.length === 0) {
          setIsPlaying(false);
          setProgress(0);
          setIsPlayerOpen(false);
        } else {
          setCurrentIndex(Math.min(index, newTracks.length - 1));
        }
      } else if (currentIndex > index) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const playTrack = (index: number) => {
    setIsQueueMode(false);
    setCurrentIndex(index);
    setIsPlaying(true);
    setIsPlayerOpen(true);
  };

  const playPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setQueue(playlist.tracks);
      setIsQueueMode(true);
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsPlayerOpen(true);
    }
  };

  const searchOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      if (onlineSource === 'audius') {
        const hostRes = await fetch('https://api.audius.co');
        const hostData = await hostRes.json();
        const host = hostData.data[0];

        const res = await fetch(`${host}/v1/tracks/search?query=${encodeURIComponent(searchQuery)}&app_name=SKSSMusic`);
        const data = await res.json();

        const results: Track[] = data.data.map((t: any) => ({
          id: `audius-${t.id}`,
          title: t.title,
          artist: t.user.name,
          duration: t.duration,
          audioUrl: `${host}/v1/tracks/${t.id}/stream?app_name=SKSSMusic`,
          coverUrl: t.artwork ? t.artwork['480x480'] || t.artwork['150x150'] : undefined,
          isVideo: false,
          isOnline: true,
          bgAnimation: 'none'
        }));
        setSearchResults(results);
      } else {
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=c9cb2a0a&format=json&limit=20&search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();

        const results: Track[] = data.results.map((t: any) => ({
          id: `jamendo-${t.id}`,
          title: t.name,
          artist: t.artist_name,
          duration: t.duration,
          audioUrl: t.audio,
          coverUrl: t.image,
          isVideo: false,
          isOnline: true,
          bgAnimation: 'none'
        }));
        setSearchResults(results);
      }
    } catch (e) {
      console.error(`${onlineSource} search failed`, e);
    } finally {
      setIsSearching(false);
    }
  };

  const addOnlineTrack = (track: Track) => {
    setTracks(prev => {
      const exists = prev.findIndex(t => t.id === track.id);
      if (exists >= 0) {
        setTimeout(() => playTrack(exists), 0);
        return prev;
      }
      const newTracks = [...prev, track];
      setTimeout(() => playTrack(newTracks.length - 1), 0);
      return newTracks;
    });
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.currentTime = Math.min(currentTrack.duration, audioRef.current.currentTime + 10);
      setProgress(audioRef.current.currentTime);
    }
  };

  const downloadTrack = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (downloadingIds.has(track.id)) return;
    
    setDownloadingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(track.id);
      return newSet;
    });

    try {
      const audioRes = await fetch(track.audioUrl!);
      const audioBlob = await audioRes.blob();
      const audioFile = new File([audioBlob], `${track.title}.mp3`, { type: audioBlob.type || 'audio/mpeg' });

      let coverFile;
      if (track.coverUrl) {
        try {
          const coverRes = await fetch(track.coverUrl);
          const coverBlob = await coverRes.blob();
          coverFile = new File([coverBlob], 'cover.jpg', { type: coverBlob.type || 'image/jpeg' });
        } catch (ce) {
          console.error("Failed to download cover", ce);
        }
      }

      const newTrack: Track = {
        ...track,
        id: crypto.randomUUID(),
        file: audioFile,
        coverFile,
        isOnline: false,
        audioUrl: URL.createObjectURL(audioFile),
        coverUrl: coverFile ? URL.createObjectURL(coverFile) : undefined
      };

      setTracks(prev => [...prev, newTrack]);
    } catch (error) {
      console.error("Failed to download track", error);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(track.id);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'SKSS Music',
        artwork: currentTrack.coverUrl ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }] : []
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [currentTrack, handleNext, handlePrev]);

  return (
    <div className="h-[100dvh] bg-[#030303] text-white flex flex-col font-sans selection:bg-red-500/30 relative overflow-hidden">
      {/* Global Wallpaper */}
      {globalWallpaper && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img src={globalWallpaper} alt="Wallpaper" className="w-full h-full object-cover opacity-50 blur-md scale-110" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Track Background Effects */}
      <BackgroundEffects type={currentTrack?.bgAnimation || 'none'} />

      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFilesAdded} accept="audio/*,video/*" multiple className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={updatePositionState}
      />

      {/* Header */}
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md z-10 relative shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">SKSS Music</h1>
        </div>
        <div className="flex items-center gap-2">
          {globalWallpaper ? (
            <button onClick={removeWallpaper} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Remove Wallpaper">
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => wallpaperInputRef.current?.click()} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Set Wallpaper">
              <Monitor className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Player View (Left on Desktop, Bottom Sheet on Mobile) */}
        <div className={cn(
          "fixed inset-0 z-50 flex flex-col bg-[#030303]/95 backdrop-blur-3xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative md:translate-y-0 md:w-1/2 md:bg-transparent md:backdrop-blur-none md:border-r md:border-white/10",
          isPlayerOpen ? "translate-y-0" : "translate-y-full"
        )}>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsPlayerOpen(false)}
            className="md:hidden absolute top-6 left-4 p-2 text-white/60 hover:text-white z-50 bg-white/10 rounded-full backdrop-blur-md"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-y-auto">
            {currentTrack ? (
              <div className="w-full max-w-md flex flex-col gap-8 mt-auto mb-auto">
                {/* Cover Art */}
                <div className="relative group w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                  {currentTrack.coverUrl ? (
                    <motion.img 
                      key={currentTrack.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: isPlaying ? 1.02 : 1 }}
                      transition={{ duration: 0.5 }}
                      src={currentTrack.coverUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10"
                    >
                      <Disc3 className={cn("w-32 h-32 text-white/20", isPlaying && "animate-spin-slow")} />
                    </motion.div>
                  )}
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-white"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Info */}
                <div className="flex flex-col items-start w-full gap-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-white line-clamp-1 w-full">{currentTrack.title}</h2>
                  <p className="text-lg text-white/60 line-clamp-1 w-full">{currentTrack.artist}</p>
                </div>

                {/* Progress */}
                <div className="w-full flex flex-col gap-3">
                  <div 
                    className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group relative"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-red-500 transition-colors"
                      style={{ width: `${currentTrack ? (progress / currentTrack.duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-white/50 font-mono font-medium">
                    <span>{formatTime(progress)}</span>
                    <span>{currentTrack ? formatTime(currentTrack.duration) : "0:00"}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between w-full px-0 sm:px-2">
                  <button onClick={() => setShuffle(!shuffle)} className={cn("p-2 sm:p-3 rounded-full transition-colors", shuffle ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white hover:bg-white/5")}>
                    <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
                    <button onClick={handleSkipBackward} className="text-white/80 hover:text-white p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors" title="Skip 10s Backward">
                      <Rewind className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </button>
                    <button onClick={handlePrev} className="text-white/80 hover:text-white p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors">
                      <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)} 
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] shrink-0 mx-1 sm:mx-0"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
                    </button>
                    <button onClick={handleNext} className="text-white/80 hover:text-white p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors">
                      <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                    </button>
                    <button onClick={handleSkipForward} className="text-white/80 hover:text-white p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors" title="Skip 10s Forward">
                      <FastForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </button>
                  </div>
                  <button onClick={() => setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')} className={cn("p-2 sm:p-3 rounded-full transition-colors", repeat !== 'off' ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white hover:bg-white/5")}>
                    {repeat === 'one' ? <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>

                {/* Volume & Effects */}
                <div className="flex items-center justify-between w-full gap-4 sm:gap-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group" onClick={handleVolumeClick}>
                      <div className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-red-500 transition-colors" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button onClick={() => changeTrackAnimation('none')} className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'none' ? "bg-white/20 text-white" : "text-white/40 hover:text-white")} title="No Effect">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('light')} className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'light' ? "bg-yellow-500/20 text-yellow-400" : "text-white/40 hover:text-white")} title="Light Effect">
                      <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('cloud')} className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'cloud' ? "bg-white/20 text-white" : "text-white/40 hover:text-white")} title="Cloud Effect">
                      <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('wind')} className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'wind' ? "bg-gray-400/20 text-gray-300" : "text-white/40 hover:text-white")} title="Wind Effect">
                      <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('water')} className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'water' ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white")} title="Water Effect">
                      <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/40 gap-4">
                <Music className="w-16 h-16 opacity-50" />
                <p>Select a track to play</p>
              </div>
            )}
          </div>
        </div>

        {/* Playlist View (Right on Desktop, Main on Mobile) */}
        <div className="w-full md:w-1/2 flex flex-col bg-black/20 backdrop-blur-sm relative z-10 pb-24 md:pb-0">
          <div className="p-4 md:p-6 flex flex-col gap-4 border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-xl z-20">
            <div className="flex items-center justify-between">
              <div className="flex bg-white/10 p-1 rounded-full overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => { setActiveTab('home'); setSelectedPlaylist(null); }}
                  className={cn("flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap", activeTab === 'home' && !selectedPlaylist ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white")}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('local'); setSelectedPlaylist(null); }}
                  className={cn("flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap", activeTab === 'local' && !selectedPlaylist ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white")}
                >
                  <Library className="w-4 h-4" />
                  <span className="hidden sm:inline">Library</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('online'); setSelectedPlaylist(null); }}
                  className={cn("flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap", activeTab === 'online' && !selectedPlaylist ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white")}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Discover</span>
                </button>
              </div>
              
              {activeTab === 'local' && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-1.5 rounded-full transition-colors font-medium text-sm whitespace-nowrap ml-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Local</span>
                </button>
              )}
            </div>

            {activeTab === 'online' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1 overflow-x-auto hide-scrollbar pb-1">
                  <button 
                    onClick={() => setOnlineSource('audius')}
                    className={cn("px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap", onlineSource === 'audius' ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/60 hover:text-white")}
                  >
                    Audius
                  </button>
                  <button 
                    onClick={() => setOnlineSource('jamendo')}
                    className={cn("px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap", onlineSource === 'jamendo' ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-white/60 hover:text-white")}
                  >
                    Jamendo
                  </button>
                  <button 
                    onClick={() => setOnlineSource('youtube')}
                    className={cn("px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap flex items-center gap-1", onlineSource === 'youtube' ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/60 hover:text-white")}
                  >
                    <Youtube className="w-3 h-3" /> YouTube
                  </button>
                </div>
                {onlineSource === 'youtube' ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <Youtube className="w-8 h-8 text-red-500 mx-auto mb-2 opacity-80" />
                    <h3 className="text-sm font-medium text-white mb-1">YouTube Integration</h3>
                    <p className="text-xs text-white/60">YouTube search requires a dedicated API key or backend proxy to bypass CORS restrictions. This feature is a placeholder.</p>
                  </div>
                ) : (
                  <form onSubmit={searchOnline} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      placeholder={`Search on ${onlineSource === 'audius' ? 'Audius' : 'Jamendo'}...`} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </form>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1">
            {selectedPlaylist ? (
              <div className="flex flex-col gap-6 pb-8">
                <div className="flex items-center gap-4 px-2">
                  <button onClick={() => setSelectedPlaylist(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronDown className="w-6 h-6 rotate-90" />
                  </button>
                  <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedPlaylist.tracks.length > 0 && selectedPlaylist.tracks[0].coverUrl ? (
                      <img src={selectedPlaylist.tracks[0].coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ListMusic className="w-8 h-8 text-white/40" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                    <p className="text-white/60">{selectedPlaylist.tracks.length} tracks</p>
                  </div>
                  <button 
                    onClick={() => playPlaylist(selectedPlaylist)}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                  >
                    <Play className="w-6 h-6 fill-black text-black ml-1" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 mt-4">
                  <h3 className="text-lg font-semibold">Tracks</h3>
                  <button 
                    onClick={() => setIsAddingSongs(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Songs
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {selectedPlaylist.tracks.length === 0 ? (
                    <div className="text-center py-10 text-white/40">
                      <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>This playlist is empty</p>
                      <button onClick={() => setIsAddingSongs(true)} className="mt-4 text-white hover:underline">Add songs from your library</button>
                    </div>
                  ) : (
                    selectedPlaylist.tracks.map((track, index) => (
                      <div key={`pl-track-${track.id}-${index}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 group transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-white truncate">{track.title}</span>
                          <span className="text-xs text-white/50 truncate">{track.artist}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = { ...selectedPlaylist, tracks: selectedPlaylist.tracks.filter((_, i) => i !== index) };
                            setPlaylists(prev => prev.map(p => p.id === updated.id ? updated : p));
                            setSelectedPlaylist(updated);
                          }}
                          className="p-2 text-white/0 group-hover:text-white/40 hover:!text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'home' ? (
              <div className="flex flex-col gap-8 pb-8">
                {/* Playlists */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ListMusic className="w-5 h-5 text-white/60" /> Your Playlists
                    </h3>
                    <button 
                      onClick={() => setIsCreatingPlaylist(true)}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                      title="Create Playlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {isCreatingPlaylist && (
                    <div className="px-2 mb-2 flex gap-2">
                      <input 
                        type="text" 
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPlaylistName.trim()) {
                            setPlaylists(prev => [...prev, { id: `pl-${Date.now()}`, name: newPlaylistName.trim(), tracks: [] }]);
                            setNewPlaylistName('');
                            setIsCreatingPlaylist(false);
                          } else if (e.key === 'Escape') {
                            setIsCreatingPlaylist(false);
                            setNewPlaylistName('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (newPlaylistName.trim()) {
                            setPlaylists(prev => [...prev, { id: `pl-${Date.now()}`, name: newPlaylistName.trim(), tracks: [] }]);
                            setNewPlaylistName('');
                            setIsCreatingPlaylist(false);
                          }
                        }}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => {
                          setIsCreatingPlaylist(false);
                          setNewPlaylistName('');
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {playlists.length === 0 && !isCreatingPlaylist ? (
                    <div className="px-2 py-4 text-sm text-white/40 text-center bg-white/5 rounded-xl border border-white/5">
                      No playlists yet. Create one to get started!
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                      {playlists.map((playlist) => (
                        <div 
                          key={playlist.id} 
                          onClick={() => setSelectedPlaylist(playlist)}
                          className="flex flex-col gap-2 w-32 shrink-0 cursor-pointer group"
                        >
                          <div className="w-32 h-32 rounded-xl overflow-hidden bg-white/10 relative flex items-center justify-center border border-white/5">
                            {playlist.tracks.length > 0 && playlist.tracks[0].coverUrl ? (
                              <img src={playlist.tracks[0].coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-80" />
                            ) : (
                              <ListMusic className="w-10 h-10 text-white/40" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 fill-white" onClick={(e) => {
                                e.stopPropagation();
                                playPlaylist(playlist);
                              }} />
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:bg-red-500/20 hover:text-red-300"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate group-hover:text-white transition-colors">{playlist.name}</span>
                            <span className="text-xs text-white/50 truncate">{playlist.tracks.length} tracks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Play History */}
                {playHistory.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-lg font-semibold px-2 flex items-center gap-2">
                      <History className="w-5 h-5 text-white/60" /> Recently Played
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                      {playHistory.map((track, idx) => (
                        <div key={`history-${track.id}-${idx}`} onClick={() => addOnlineTrack(track)} className="flex flex-col gap-2 w-32 shrink-0 cursor-pointer group">
                          <div className="w-32 h-32 rounded-xl overflow-hidden bg-white/5 relative">
                            {track.coverUrl ? (
                              <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music className="w-8 h-8 text-white/40" /></div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 fill-white" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate group-hover:text-white transition-colors">{track.title}</span>
                            <span className="text-xs text-white/50 truncate">{track.artist}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-white/60" /> Trending Now
                    </h3>
                    <button 
                      onClick={() => fetchTrending(true)}
                      disabled={isRefreshingTrending || isLoadingHome}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white disabled:opacity-50"
                      title="Refresh Trending"
                    >
                      <RefreshCw className={cn("w-4 h-4", (isRefreshingTrending || isLoadingHome) && "animate-spin")} />
                    </button>
                  </div>
                  {isLoadingHome && trendingTracks.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                      {trendingTracks.map((track, idx) => {
                        const isDownloaded = tracks.some(t => t.title === track.title && t.artist === track.artist && !t.isOnline);
                        return (
                          <div key={`trend-${track.id}-${idx}`} className="flex flex-col gap-2 w-32 shrink-0 group relative">
                            <div 
                              onClick={() => addOnlineTrack(track)}
                              className="w-32 h-32 rounded-xl overflow-hidden bg-white/5 relative cursor-pointer"
                            >
                              {track.coverUrl ? (
                                <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music className="w-8 h-8 text-white/40" /></div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 fill-white" />
                              </div>
                            </div>
                            <div className="flex flex-col cursor-pointer" onClick={() => addOnlineTrack(track)}>
                              <span className="text-sm font-medium truncate group-hover:text-white transition-colors">{track.title}</span>
                              <span className="text-xs text-white/50 truncate">{track.artist}</span>
                            </div>
                            <button 
                              onClick={(e) => !isDownloaded && downloadTrack(e, track)}
                              disabled={downloadingIds.has(track.id) || isDownloaded}
                              className={cn(
                                "absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all",
                                isDownloaded 
                                  ? "text-green-400 opacity-100" 
                                  : "text-white hover:bg-black/60 disabled:opacity-100 disabled:text-white"
                              )}
                              title={isDownloaded ? "Downloaded" : "Download Offline"}
                            >
                              {downloadingIds.has(track.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              ) : isDownloaded ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold px-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-white/60" /> Suggested for You
                  </h3>
                  {isLoadingHome ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 px-2 hide-scrollbar">
                      {suggestedTracks.map((track, idx) => {
                        const isDownloaded = tracks.some(t => t.title === track.title && t.artist === track.artist && !t.isOnline);
                        return (
                          <div key={`sug-${track.id}-${idx}`} className="flex flex-col gap-2 w-32 shrink-0 group relative">
                            <div 
                              onClick={() => addOnlineTrack(track)}
                              className="w-32 h-32 rounded-xl overflow-hidden bg-white/5 relative cursor-pointer"
                            >
                              {track.coverUrl ? (
                                <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music className="w-8 h-8 text-white/40" /></div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 fill-white" />
                              </div>
                            </div>
                            <div className="flex flex-col cursor-pointer" onClick={() => addOnlineTrack(track)}>
                              <span className="text-sm font-medium truncate group-hover:text-white transition-colors">{track.title}</span>
                              <span className="text-xs text-white/50 truncate">{track.artist}</span>
                            </div>
                            <button 
                              onClick={(e) => !isDownloaded && downloadTrack(e, track)}
                              disabled={downloadingIds.has(track.id) || isDownloaded}
                              className={cn(
                                "absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all",
                                isDownloaded 
                                  ? "text-green-400 opacity-100" 
                                  : "text-white hover:bg-black/60 disabled:opacity-100 disabled:text-white"
                              )}
                              title={isDownloaded ? "Downloaded" : "Download Offline"}
                            >
                              {downloadingIds.has(track.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              ) : isDownloaded ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'local' ? (
              <>
                <AnimatePresence>
                  {tracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => playTrack(index)}
                      className={cn(
                        "group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all",
                        currentIndex === index 
                          ? "bg-white/10 border border-white/10 shadow-lg" 
                          : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-white/40" />
                        )}
                        {currentIndex === index && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5 backdrop-blur-[2px]">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={cn("font-medium truncate", currentIndex === index ? "text-white" : "text-white/90")}>
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-white/50">
                          {track.isVideo ? <Video className="w-3 h-3" /> : track.isOnline ? <Globe className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                          <span className="truncate">{track.artist}</span>
                          <span>•</span>
                          <span>{formatTime(track.duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPlaylistMenuTrack(track); }}
                          className="p-2 text-white/0 group-hover:text-white/40 hover:!text-white transition-colors"
                          title="Add to Playlist"
                        >
                          <ListMusic className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => removeTrack(e, index)}
                          className="p-2 text-white/0 group-hover:text-white/40 hover:!text-red-400 transition-colors"
                          title="Remove from Library"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {tracks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-3">
                    <ListMusic className="w-10 h-10 opacity-50" />
                    <p>Your playlist is empty</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                    <p>Searching {onlineSource === 'audius' ? 'Audius' : 'Jamendo'}...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <AnimatePresence>
                    {searchResults.map((track) => {
                      const isDownloaded = tracks.some(t => t.title === track.title && t.artist === track.artist && !t.isOnline);
                      return (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => addOnlineTrack(track)}
                          className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                            {track.coverUrl ? (
                              <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-white/90 group-hover:text-white">
                              {track.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-white/50">
                              <Globe className="w-3 h-3" />
                              <span className="truncate">{track.artist}</span>
                              <span>•</span>
                              <span>{formatTime(track.duration)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPlaylistMenuTrack(track); }}
                              className="p-2 text-white/0 group-hover:text-white/40 hover:!text-white transition-colors"
                              title="Add to Playlist"
                            >
                              <ListMusic className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); addOnlineTrack(track); }}
                              className="p-2 text-white/0 group-hover:text-white/40 hover:!text-white transition-colors"
                              title="Add to Queue"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => !isDownloaded && downloadTrack(e, track)}
                              disabled={downloadingIds.has(track.id) || isDownloaded}
                              className={cn(
                                "p-2 transition-colors",
                                isDownloaded 
                                  ? "text-green-400 opacity-100" 
                                  : "text-white/0 group-hover:text-white/40 hover:!text-white disabled:opacity-100 disabled:text-white"
                              )}
                              title={isDownloaded ? "Downloaded" : "Download Offline"}
                            >
                              {downloadingIds.has(track.id) ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                              ) : isDownloaded ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-3">
                    <Search className="w-10 h-10 opacity-50" />
                    <p>Search for free music online</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini Player (Mobile Only) */}
      <AnimatePresence>
        {!isPlayerOpen && currentTrack && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={() => setIsPlayerOpen(true)}
            className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl z-40 flex items-center px-3 gap-3 shadow-2xl cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
              {currentTrack.coverUrl ? (
                <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-5 h-5 text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{currentTrack.title}</h4>
              <p className="text-white/60 text-xs truncate">{currentTrack.artist}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Songs Modal */}
      <AnimatePresence>
        {isAddingSongs && selectedPlaylist && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsAddingSongs(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl max-h-[80vh]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add from Library</h3>
                <button onClick={() => setIsAddingSongs(false)} className="p-1 text-white/60 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar flex-1">
                {tracks.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">Your library is empty.</p>
                ) : (
                  tracks.map(track => {
                    const isAdded = selectedPlaylist.tracks.some(t => t.id === track.id);
                    return (
                      <div key={`lib-${track.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-white truncate">{track.title}</span>
                          <span className="text-xs text-white/50 truncate">{track.artist}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (!isAdded) {
                              const updated = { ...selectedPlaylist, tracks: [...selectedPlaylist.tracks, track] };
                              setPlaylists(prev => prev.map(p => p.id === updated.id ? updated : p));
                              setSelectedPlaylist(updated);
                            }
                          }}
                          disabled={isAdded}
                          className={cn("p-2 rounded-full transition-colors", isAdded ? "text-green-400" : "text-white/60 hover:text-white hover:bg-white/10")}
                        >
                          {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Menu Modal */}
      <AnimatePresence>
        {playlistMenuTrack && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPlaylistMenuTrack(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add to Playlist</h3>
                <button onClick={() => setPlaylistMenuTrack(null)} className="p-1 text-white/60 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto hide-scrollbar">
                {playlists.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">No playlists available. Create one in the Home tab.</p>
                ) : (
                  playlists.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addToPlaylist(p.id, playlistMenuTrack)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {p.tracks.length > 0 && p.tracks[0].coverUrl ? (
                          <img src={p.tracks[0].coverUrl} alt="" className="w-full h-full object-cover rounded-lg opacity-80" />
                        ) : (
                          <ListMusic className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate">{p.name}</span>
                        <span className="text-xs text-white/50 truncate">{p.tracks.length} tracks</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
