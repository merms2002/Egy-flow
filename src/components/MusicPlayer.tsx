import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, Music, X, Upload, ExternalLink, RefreshCw } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MusicPlayer = ({ onClose, onOpenManager }: { onClose?: () => void, onOpenManager?: () => void }) => {
  const { 
    playlist, 
    currentSongIndex, 
    isPlaying, 
    volume, 
    addSong, 
    removeSong, 
    playSong, 
    togglePlay, 
    nextSong, 
    prevSong, 
    setVolume,
    spotifyConnected,
    spotifyToken,
    spotifyUser,
    setSpotifyConnected
  } = useMusicStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        const token = event.data.token;
        setIsConnecting(false);
        
        try {
          // Fetch user profile
          const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const userData = await userResponse.json();
          
          setSpotifyConnected(true, token, userData);
          fetchSpotifyPlaylists(token);
        } catch (error) {
          console.error("Failed to fetch Spotify user:", error);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchSpotifyPlaylists = async (token: string) => {
    setIsLoadingPlaylists(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // For this example, we'll just add the first playlist's tracks
      if (data.items && data.items.length > 0) {
        const playlistId = data.items[0].id;
        const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tracksData = await tracksResponse.json();
        
        tracksData.items.forEach((item: any) => {
          if (item.track && item.track.preview_url) {
            addSong({
              id: item.track.id,
              title: item.track.name,
              artist: item.track.artists.map((a: any) => a.name).join(', '),
              url: item.track.preview_url,
              duration: item.track.duration_ms / 1000,
              source: 'spotify'
            });
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleConnectSpotify = async () => {
    if (spotifyConnected) {
      if (onOpenManager) {
        onOpenManager();
      }
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/spotify/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `music/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      addSong({
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        url,
        duration: 0, // Duration will be set when loaded
        source: 'upload'
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const currentSong = playlist[currentSongIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="w-80 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 p-4 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Music size={18} className="text-indigo-400" /> My Playlist
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {spotifyConnected && spotifyUser && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-white/5 rounded-xl border border-white/10">
          {spotifyUser.images?.[0]?.url ? (
            <img src={spotifyUser.images[0].url} alt={spotifyUser.display_name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-white font-bold text-xs">
              {spotifyUser.display_name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/60">Connected as</div>
            <div className="text-sm text-white font-medium truncate">{spotifyUser.display_name}</div>
          </div>
          {isLoadingPlaylists && <RefreshCw size={14} className="text-white/40 animate-spin" />}
        </div>
      )}

      <div className="max-h-60 overflow-y-auto custom-scrollbar mb-4 space-y-2">
        {playlist.length === 0 ? (
          <div className="text-center text-white/40 py-8 text-sm">
            No songs yet. Upload your favorites or connect Spotify!
          </div>
        ) : (
          playlist.map((song, index) => (
            <div 
              key={song.id}
              onClick={() => playSong(index)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                index === currentSongIndex ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-white/80'
              }`}
            >
              <div className="truncate text-sm font-medium flex-1 pr-2">{song.title}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeSong(song.id); }}
                className="text-white/20 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <label className={`flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-xl cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload size={16} />
          {isUploading ? 'Uploading...' : 'Upload Song'}
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileUpload} 
            className="hidden" 
            disabled={isUploading}
          />
        </label>
        <button 
          onClick={handleConnectSpotify}
          disabled={isConnecting}
          className={`flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-xl transition-colors ${
            spotifyConnected 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954]'
          } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isConnecting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <ExternalLink size={16} />
          )}
          {spotifyConnected ? 'Manage' : 'Spotify'}
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl mt-auto">
        <div 
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
        >
          {isPlaying ? (
            <div className="flex gap-0.5 items-end h-4">
              <motion.div animate={{ height: [4, 12, 6, 14, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
              <motion.div animate={{ height: [10, 4, 14, 6, 10] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white rounded-full" />
              <motion.div animate={{ height: [6, 14, 4, 10, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
            </div>
          ) : (
            <Music size={20} className="text-white" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-white truncate">
            {currentSong ? currentSong.title : 'No song playing'}
          </span>
          <span className="text-[10px] text-white/60 truncate">
            {currentSong ? currentSong.artist : 'Select a track'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={prevSong} className="text-white/60 hover:text-white transition-colors">
            <SkipBack size={16} />
          </button>
          <button 
            onClick={togglePlay}
            className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
          <button onClick={nextSong} className="text-white/60 hover:text-white transition-colors">
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentSong?.url}
        onEnded={nextSong}
      />
    </motion.div>
  );
};

export default MusicPlayer;
