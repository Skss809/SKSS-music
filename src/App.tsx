import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Image as ImageIcon, Plus, Music, Video, Trash2, Shuffle, Repeat, Repeat1, Disc3, Cloud, Wind, Droplets, Sun, Monitor, X, ChevronDown, ListMusic } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { formatTime, cn } from './lib/utils';
import { Track, BgAnimation } from './types';

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const currentTrack = tracks[currentIndex];

  useEffect(() => {
    get('global-wallpaper').then((val) => {
      if (val) setGlobalWallpaper(val);
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

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
    updatedTracks[currentIndex] = { ...currentTrack, coverUrl: url };
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
    if (tracks.length === 0) return;
    if (shuffle) {
      let next = Math.floor(Math.random() * tracks.length);
      while (next === currentIndex && tracks.length > 1) {
        next = Math.floor(Math.random() * tracks.length);
      }
      setCurrentIndex(next);
    } else {
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (repeat === 'all') {
        setCurrentIndex(0);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handlePrev = () => {
    if (progress > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (repeat === 'all') {
      setCurrentIndex(tracks.length - 1);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * currentTrack.duration;
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
  };

  const playTrack = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
    setIsPlayerOpen(true);
  };

  return (
    <div className="h-[100dvh] bg-[#030303] text-white flex flex-col font-sans selection:bg-red-500/30 relative overflow-hidden">
      {/* Global Wallpaper */}
      {globalWallpaper && (
        <div className="absolute inset-0 z-0">
          <img src={globalWallpaper} alt="Wallpaper" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
        </div>
      )}

      {/* Track Background Effects */}
      <BackgroundEffects type={currentTrack?.bgAnimation || 'none'} />

      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFilesAdded} accept="audio/*,video/*" multiple className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />

      {/* Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

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
                <div className="flex items-center justify-between w-full px-2">
                  <button onClick={() => setShuffle(!shuffle)} className={cn("p-3 rounded-full transition-colors", shuffle ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white hover:bg-white/5")}>
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button onClick={handlePrev} className="text-white/80 hover:text-white p-3 hover:bg-white/5 rounded-full transition-colors">
                    <SkipBack className="w-8 h-8 fill-current" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                  <button onClick={handleNext} className="text-white/80 hover:text-white p-3 hover:bg-white/5 rounded-full transition-colors">
                    <SkipForward className="w-8 h-8 fill-current" />
                  </button>
                  <button onClick={() => setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')} className={cn("p-3 rounded-full transition-colors", repeat !== 'off' ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white hover:bg-white/5")}>
                    {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>

                {/* Volume & Effects */}
                <div className="flex items-center justify-between w-full gap-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group" onClick={handleVolumeClick}>
                      <div className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-red-500 transition-colors" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button onClick={() => changeTrackAnimation('none')} className={cn("p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'none' ? "bg-white/20 text-white" : "text-white/40 hover:text-white")} title="No Effect">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('light')} className={cn("p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'light' ? "bg-yellow-500/20 text-yellow-400" : "text-white/40 hover:text-white")} title="Light Effect">
                      <Sun className="w-4 h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('cloud')} className={cn("p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'cloud' ? "bg-white/20 text-white" : "text-white/40 hover:text-white")} title="Cloud Effect">
                      <Cloud className="w-4 h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('wind')} className={cn("p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'wind' ? "bg-gray-400/20 text-gray-300" : "text-white/40 hover:text-white")} title="Wind Effect">
                      <Wind className="w-4 h-4" />
                    </button>
                    <button onClick={() => changeTrackAnimation('water')} className={cn("p-2 rounded-lg transition-colors", currentTrack.bgAnimation === 'water' ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white")} title="Water Effect">
                      <Droplets className="w-4 h-4" />
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
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-xl z-20">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-white/60" />
              Up Next
            </h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white text-black hover:bg-white/90 px-4 py-2 rounded-full transition-colors font-medium shadow-lg shadow-white/10 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1">
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
                      {track.isVideo ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                      <span className="truncate">{track.artist}</span>
                      <span>•</span>
                      <span>{formatTime(track.duration)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => removeTrack(e, index)}
                    className="p-2 text-white/0 group-hover:text-white/40 hover:!text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {tracks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-3">
                <ListMusic className="w-10 h-10 opacity-50" />
                <p>Your playlist is empty</p>
              </div>
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
    </div>
  );
}
