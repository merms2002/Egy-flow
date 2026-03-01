import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, X, Search, Heart, ListMusic, Clock, ExternalLink, RefreshCw, Smartphone, Plus } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

interface SpotifyManagerProps {
  onClose: () => void;
}

const SpotifyManager: React.FC<SpotifyManagerProps> = ({ onClose }) => {
  const { spotifyToken, spotifyUser, setSpotifyConnected } = useMusicStore();
  const [activeTab, setActiveTab] = useState<'playlists' | 'saved' | 'recent' | 'search'>('playlists');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player state
  const [currentPlayback, setCurrentPlayback] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<any>(null);

  useEffect(() => {
    if (spotifyToken) {
      fetchPlaylists();
      fetchPlaybackState();
      fetchDevices();
      
      const interval = setInterval(fetchPlaybackState, 5000);
      return () => clearInterval(interval);
    }
  }, [spotifyToken]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setPlaylists(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setTracks(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setTracks(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setTracks(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=50`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      // Map search results to match the structure of playlist/saved tracks
      const mappedTracks = (data.tracks?.items || []).map((track: any) => ({ track }));
      setTracks(mappedTracks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaybackState = async () => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (res.status === 200) {
        const data = await res.json();
        setCurrentPlayback(data);
        if (data.device) setActiveDevice(data.device);
      } else if (res.status === 204) {
        setCurrentPlayback(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setDevices(data.devices || []);
      const active = data.devices?.find((d: any) => d.is_active);
      if (active) setActiveDevice(active);
    } catch (e) {
      console.error(e);
    }
  };

  const playTrack = async (uri: string, contextUri?: string) => {
    try {
      const body: any = {};
      if (contextUri) {
        body.context_uri = contextUri;
        body.offset = { uri };
      } else {
        body.uris = [uri];
      }

      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      setTimeout(fetchPlaybackState, 1000);
    } catch (e) {
      console.error(e);
      alert("Could not play track. Make sure you have an active Spotify device (like your phone or desktop app open).");
    }
  };

  const togglePlay = async () => {
    if (!currentPlayback) return;
    try {
      const endpoint = currentPlayback.is_playing ? 'pause' : 'play';
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      setTimeout(fetchPlaybackState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const skipToNext = async () => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      setTimeout(fetchPlaybackState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const skipToPrevious = async () => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      setTimeout(fetchPlaybackState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = (tab: 'playlists' | 'saved' | 'recent' | 'search') => {
    setActiveTab(tab);
    setSelectedPlaylist(null);
    setTracks([]);
    if (tab === 'playlists') fetchPlaylists();
    else if (tab === 'saved') fetchSavedTracks();
    else if (tab === 'recent') fetchRecentTracks();
  };

  const handlePlaylistClick = (playlist: any) => {
    setSelectedPlaylist(playlist);
    fetchPlaylistTracks(playlist.id);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  if (!spotifyToken) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#121212] rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
          <Music size={48} className="mx-auto mb-4 text-[#1DB954]" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Spotify</h2>
          <p className="text-white/60 mb-6">You need to connect your Spotify account to use the full manager.</p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#121212] rounded-2xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
              <Music size={16} className="text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Spotify Manager</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {spotifyUser && (
              <div className="flex items-center gap-2">
                {spotifyUser.images?.[0]?.url ? (
                  <img src={spotifyUser.images[0].url} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                    {spotifyUser.display_name?.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-white hidden md:block">{spotifyUser.display_name}</span>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 bg-black/10 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar hidden md:flex">
            <button 
              onClick={() => handleTabChange('playlists')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'playlists' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <ListMusic size={18} /> Playlists
            </button>
            <button 
              onClick={() => handleTabChange('saved')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'saved' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Heart size={18} /> Liked Songs
            </button>
            <button 
              onClick={() => handleTabChange('recent')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'recent' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Clock size={18} /> Recently Played
            </button>
            <button 
              onClick={() => handleTabChange('search')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Search size={18} /> Search
            </button>

            {/* Devices */}
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-2">Devices</div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-white/60">Active Device</span>
                <button onClick={fetchDevices} className="text-white/40 hover:text-white"><RefreshCw size={12} /></button>
              </div>
              {devices.length > 0 ? (
                devices.map(device => (
                  <div key={device.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${device.is_active ? 'text-[#1DB954]' : 'text-white/60'}`}>
                    <Smartphone size={14} />
                    <span className="truncate flex-1">{device.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/40 px-2">No active devices. Open Spotify on any device.</div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
            {/* Search Bar (if search tab) */}
            {activeTab === 'search' && (
              <div className="p-6 pb-0">
                <form onSubmit={handleSearch} className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs..."
                    className="w-full bg-white/10 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50"
                  />
                </form>
              </div>
            )}

            {/* Header for current view */}
            <div className="p-6 pb-4 flex items-end gap-6">
              {activeTab === 'playlists' && !selectedPlaylist && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Your Playlists</h1>
                  <p className="text-white/60">{playlists.length} playlists</p>
                </div>
              )}
              {selectedPlaylist && (
                <>
                  {selectedPlaylist.images?.[0]?.url ? (
                    <img src={selectedPlaylist.images[0].url} alt={selectedPlaylist.name} className="w-48 h-48 shadow-2xl rounded-lg object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-48 h-48 bg-white/10 flex items-center justify-center rounded-lg shadow-2xl">
                      <Music size={48} className="text-white/20" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">Playlist</span>
                    <h1 className="text-5xl font-black text-white mb-4 line-clamp-2">{selectedPlaylist.name}</h1>
                    <p className="text-white/60 text-sm">{selectedPlaylist.description}</p>
                    <p className="text-white/40 text-sm mt-2">{selectedPlaylist.tracks?.total || 0} songs</p>
                  </div>
                </>
              )}
              {activeTab === 'saved' && (
                <>
                  <div className="w-48 h-48 bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center rounded-lg shadow-2xl">
                    <Heart size={64} className="text-white" fill="white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">Playlist</span>
                    <h1 className="text-5xl font-black text-white mb-4">Liked Songs</h1>
                  </div>
                </>
              )}
              {activeTab === 'recent' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Recently Played</h1>
                </div>
              )}
            </div>

            {/* Track List or Playlists Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={32} className="text-[#1DB954] animate-spin" />
                </div>
              ) : (
                <>
                  {activeTab === 'playlists' && !selectedPlaylist ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {playlists.map(playlist => (
                        <div 
                          key={playlist.id} 
                          onClick={() => handlePlaylistClick(playlist)}
                          className="bg-white/5 hover:bg-white/10 p-4 rounded-xl cursor-pointer transition-colors group"
                        >
                          <div className="aspect-square mb-4 relative rounded-md overflow-hidden bg-white/5">
                            {playlist.images?.[0]?.url ? (
                              <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music size={32} className="text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                <Play size={24} className="text-black ml-1" fill="black" />
                              </div>
                            </div>
                          </div>
                          <h3 className="font-bold text-white truncate text-sm">{playlist.name}</h3>
                          <p className="text-xs text-white/60 truncate mt-1">By {playlist.owner?.display_name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-xs text-white/60 uppercase tracking-wider mb-2">
                        <div className="w-8 text-center">#</div>
                        <div>Title</div>
                        <div className="hidden sm:block">Album</div>
                        <div className="w-12 text-right"><Clock size={14} className="inline" /></div>
                      </div>
                      
                      {tracks.map((item, index) => {
                        const track = item.track;
                        if (!track) return null;
                        const isPlaying = currentPlayback?.item?.id === track.id;
                        
                        return (
                          <div 
                            key={`${track.id}-${index}`}
                            onClick={() => playTrack(track.uri, selectedPlaylist?.uri)}
                            className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors group ${isPlaying ? 'bg-white/10' : 'hover:bg-white/5'}`}
                          >
                            <div className="w-8 flex items-center justify-center text-white/40 text-sm">
                              {isPlaying ? (
                                <Music size={14} className="text-[#1DB954]" />
                              ) : (
                                <span className="group-hover:hidden">{index + 1}</span>
                              )}
                              {!isPlaying && <Play size={14} className="hidden group-hover:block text-white" fill="white" />}
                            </div>
                            <div className="flex items-center gap-3 min-w-0">
                              {track.album?.images?.[0]?.url && (
                                <img src={track.album.images[0].url} alt="" className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className={`truncate text-sm font-medium ${isPlaying ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</span>
                                <span className="truncate text-xs text-white/60">{track.artists?.map((a: any) => a.name).join(', ')}</span>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center text-xs text-white/60 truncate">
                              {track.album?.name}
                            </div>
                              <div className="flex items-center justify-end text-xs text-white/60 w-12 gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (track.preview_url) {
                                      useMusicStore.getState().addSong({
                                        id: track.id,
                                        title: track.name,
                                        artist: track.artists?.map((a: any) => a.name).join(', '),
                                        url: track.preview_url,
                                        duration: track.duration_ms / 1000,
                                        source: 'spotify'
                                      });
                                      alert(`Added ${track.name} to app playlist!`);
                                    } else {
                                      alert("No preview available for this track to add to app playlist.");
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-full transition-all"
                                  title="Add to App Playlist"
                                >
                                  <Plus size={14} />
                                </button>
                                {formatDuration(track.duration_ms)}
                              </div>
                          </div>
                        );
                      })}
                      {tracks.length === 0 && !isLoading && (
                        <div className="text-center text-white/40 py-12">No tracks found.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Player Bar */}
        <div className="h-24 bg-[#181818] border-t border-white/10 px-4 flex items-center justify-between">
          {/* Now Playing Info */}
          <div className="w-1/3 flex items-center gap-4 min-w-0">
            {currentPlayback?.item ? (
              <>
                {currentPlayback.item.album?.images?.[0]?.url && (
                  <img src={currentPlayback.item.album.images[0].url} alt="" className="w-14 h-14 rounded-md object-cover shadow-lg" referrerPolicy="no-referrer" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate hover:underline cursor-pointer">{currentPlayback.item.name}</span>
                  <span className="text-xs text-white/60 truncate hover:underline cursor-pointer">{currentPlayback.item.artists?.map((a: any) => a.name).join(', ')}</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-white/40">No track playing on Spotify</div>
            )}
          </div>

          {/* Controls */}
          <div className="w-1/3 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-6">
              <button onClick={skipToPrevious} className="text-white/60 hover:text-white transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform text-black"
              >
                {currentPlayback?.is_playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={skipToNext} className="text-white/60 hover:text-white transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            {/* Progress bar (visual only, not interactive for simplicity) */}
            <div className="w-full max-w-md flex items-center gap-2 text-[10px] text-white/40">
              <span>{currentPlayback ? formatDuration(currentPlayback.progress_ms) : '0:00'}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: currentPlayback ? `${(currentPlayback.progress_ms / currentPlayback.item.duration_ms) * 100}%` : '0%' }}
                />
              </div>
              <span>{currentPlayback?.item ? formatDuration(currentPlayback.item.duration_ms) : '0:00'}</span>
            </div>
          </div>

          {/* Extra Controls */}
          <div className="w-1/3 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2 text-white/60">
              <Volume2 size={18} />
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpotifyManager;
