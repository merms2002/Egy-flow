import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string; // URL to the audio file (Firebase Storage or external)
  duration: number;
  coverUrl?: string;
  source: 'upload' | 'spotify';
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
}

interface MusicState {
  playlist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  volume: number;
  spotifyConnected: boolean;
  spotifyToken: string | null;
  spotifyUser: SpotifyUser | null;
  
  addSong: (song: Song) => void;
  removeSong: (id: string) => void;
  playSong: (index: number) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  setSpotifyConnected: (connected: boolean, token?: string, user?: SpotifyUser) => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      playlist: [],
      currentSongIndex: 0,
      isPlaying: false,
      volume: 0.5,
      spotifyConnected: false,
      spotifyToken: null,
      spotifyUser: null,

      addSong: (song) => set((state) => ({ playlist: [...state.playlist, song] })),
      removeSong: (id) => set((state) => ({ 
        playlist: state.playlist.filter((s) => s.id !== id),
        currentSongIndex: state.currentSongIndex >= state.playlist.length - 1 ? Math.max(0, state.playlist.length - 2) : state.currentSongIndex
      })),
      playSong: (index) => set({ currentSongIndex: index, isPlaying: true }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      nextSong: () => set((state) => {
        const nextIndex = (state.currentSongIndex + 1) % state.playlist.length;
        return { currentSongIndex: nextIndex };
      }),
      prevSong: () => set((state) => {
        const prevIndex = (state.currentSongIndex - 1 + state.playlist.length) % state.playlist.length;
        return { currentSongIndex: prevIndex };
      }),
      setVolume: (volume) => set({ volume }),
      setSpotifyConnected: (connected, token, user) => set({ spotifyConnected: connected, spotifyToken: token || null, spotifyUser: user || null }),
    }),
    {
      name: 'music-storage',
      partialize: (state) => ({ 
        playlist: state.playlist, 
        volume: state.volume, 
        spotifyConnected: state.spotifyConnected,
        spotifyUser: state.spotifyUser
      }), // Don't persist isPlaying or currentSongIndex if you want fresh start
    }
  )
);
