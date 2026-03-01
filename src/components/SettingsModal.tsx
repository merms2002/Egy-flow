import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, ImageIcon, Clock, Timer, BarChart2, MessageSquare, 
  MoreHorizontal, User, HelpCircle, X, Zap, Gift, Check, Volume2,
  Type, Layout, Moon, Sun, Music, Upload, ChevronDown, ChevronRight
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useMusicStore } from '../store/useMusicStore';

// Define the settings interface
export interface AppSettings {
  homeBackground: string;
  homeBlur: number;
  homeOverlay: number;
  focusBackground: 'solid' | 'gradient-morning' | 'gradient-afternoon' | 'gradient-evening' | 'gradient-night';
  focusMinimal: boolean;
  ambientSound: string;
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  focusWorkDuration: number;
  focusShortBreak: number;
  focusLongBreak: number;
  showQuotes: boolean;
  quoteCategory: string;
  customBackground: string | null;
  videoBackground: string | null;
}

export const defaultSettings: AppSettings = {
  homeBackground: 'default',
  homeBlur: 0,
  homeOverlay: 0,
  focusBackground: 'solid',
  focusMinimal: false,
  ambientSound: 'none',
  clockFormat: '24h',
  showSeconds: false,
  focusWorkDuration: 25,
  focusShortBreak: 5,
  focusLongBreak: 15,
  showQuotes: true,
  quoteCategory: 'motivational',
  customBackground: null,
  videoBackground: null,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  isStudent: boolean;
  setIsStudent: (value: boolean) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  appMode: string;
  setAppMode: (mode: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  isStudent, 
  setIsStudent,
  settings,
  updateSettings,
  appMode,
  setAppMode
}) => {
  const [activeTab, setActiveTab] = useState('Home Theme');
  const [isThemesExpanded, setIsThemesExpanded] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { spotifyConnected, setSpotifyConnected } = useMusicStore();

  const tabs = [
    { id: 'Themes', icon: Palette, isParent: true },
    { id: 'Home Theme', icon: ImageIcon, isChild: true },
    { id: 'Focus Theme', icon: Moon, isChild: true },
    { id: 'Ambient Theme', icon: Sun, isChild: true },
    { id: 'Clock', icon: Clock },
    { id: 'Focus Timer', icon: Timer, badge: 'NEW', badgeColor: 'bg-green-500' },
    { id: 'Music', icon: Music, badge: 'NEW', badgeColor: 'bg-indigo-500' },
    { id: 'Stats', icon: BarChart2 },
    { id: 'Quotes', icon: MessageSquare },
    { id: 'Extras', icon: MoreHorizontal },
    { id: 'Account', icon: User },
    { id: 'Support', icon: HelpCircle },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex flex-col md:flex-row h-full max-h-[800px] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f13]/95 text-white shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar */}
            <div className="flex w-full md:w-64 flex-shrink-0 flex-col border-b md:border-b-0 md:border-r border-white/10 bg-white/5 p-4">
              <div className="mb-4 md:mb-6 flex items-center justify-between md:justify-start">
                <div className="flex items-center">
                  <motion.button 
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={onClose}
                    className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </motion.button>
                  <span className="ml-2 font-semibold text-lg">Settings</span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto md:flex-1 gap-2 md:gap-0 md:space-y-1 custom-scrollbar pb-2 md:pb-0">
                {tabs.map((tab) => {
                  if (tab.isChild && !isThemesExpanded) return null;
                  
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isParent = tab.isParent;
                  const isChildActive = isParent && ['Home Theme', 'Focus Theme', 'Ambient Theme'].includes(activeTab);
                  
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        if (isParent) {
                          const willClose = isThemesExpanded;
                          setIsThemesExpanded(!isThemesExpanded);
                          if (willClose && ['Home Theme', 'Focus Theme', 'Ambient Theme'].includes(activeTab)) {
                            setActiveTab(tab.id);
                          } else if (!willClose && activeTab === 'Themes') {
                            // Optional: auto-select first child when opening
                            // setActiveTab('Home Theme');
                          } else if (activeTab !== 'Themes' && !['Home Theme', 'Focus Theme', 'Ambient Theme'].includes(activeTab)) {
                            setActiveTab(tab.id);
                          }
                        } else {
                          setActiveTab(tab.id);
                        }
                      }}
                      whileHover={{ x: 4 }}
                      className={`flex flex-shrink-0 md:w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? 'bg-white/15 text-white shadow-inner' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      } ${tab.isChild ? 'md:ml-4 md:w-[calc(100%-1rem)]' : ''}`}
                    >
                      <Icon size={16} className={isActive || isChildActive ? 'text-indigo-400' : ''} />
                      {tab.id}
                      {isParent && (
                        <div className="ml-auto">
                          {isThemesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      )}
                      {tab.badge && (
                        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="hidden md:block mt-4 space-y-2 pt-4 border-t border-white/10">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/20 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                  Upgrade to Plus
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10">
                  <Gift size={16} />
                  Share with friends
                </motion.button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'Themes' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Themes</h2>
                      <p className="mb-8 text-sm text-white/60">Select the active mode for your dashboard.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'home', label: 'Home', icon: Layout, desc: 'Your central dashboard' },
                          { id: 'focus', label: 'Focus', icon: Moon, desc: 'Distraction-free work' },
                          { id: 'ambient', label: 'Ambient', icon: Sun, desc: 'Relaxing atmosphere' }
                        ].map((mode) => (
                          <motion.button
                            key={mode.id}
                            onClick={() => setAppMode(mode.id as any)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col items-center p-6 rounded-2xl border transition-all ${
                              appMode === mode.id 
                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <mode.icon size={32} className="mb-4" />
                            <span className="font-semibold text-lg">{mode.label}</span>
                            <span className="text-xs text-white/60 mt-2">{mode.desc}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Home Theme' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Home Theme</h2>
                      <p className="mb-8 text-sm text-white/60">Pick your theme to appear in Home. To see a live preview, ensure your dashboard toggle is set to Home, then come back to this Settings tab.</p>
                      
                      <div className="space-y-8">
                        {/* Custom Background Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold">Custom Background</h3>
                            <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                              <Zap size={10} className="fill-indigo-300" /> PLUS
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mb-4">Upload your own theme image. All uploads must follow our <span className="underline decoration-white/30 hover:text-white cursor-pointer">guidelines</span>.</p>
                          
                          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer mb-4 group">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <Upload size={20} className="text-white/60" />
                            </div>
                            <p className="font-medium mb-1">Drop file here or <span className="underline">browse</span></p>
                            <p className="text-xs text-white/40">JPG, PNG, WEBP, HEIC (max 5MB, min 800px)</p>
                          </div>

                          <div className="flex gap-3 mb-6">
                            <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
                              Save upload
                            </button>
                            <button className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/20">
                              Remove image
                            </button>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="font-medium text-sm">Overlay</label>
                              <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded">{settings.homeOverlay}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="90" 
                              value={settings.homeOverlay}
                              onChange={(e) => updateSettings({ homeOverlay: parseInt(e.target.value) })}
                              className="w-full accent-white h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Video Background Section */}
                        <div className="pt-8 border-t border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold">Video Background</h3>
                            <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                              <Zap size={10} className="fill-indigo-300" /> PLUS
                            </span>
                            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 border border-green-500/30">
                              NEW
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mb-4">Paste YouTube URL below, adjust the opacity above.</p>
                          
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="https://youtube.com/watch?v=..." 
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button 
                              onClick={() => updateSettings({ videoBackground: youtubeUrl })}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Focus Theme' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Focus Theme</h2>
                      <p className="mb-8 text-sm text-white/60">Optimize your environment for deep work.</p>
                      
                      <div className="space-y-6">
                        <div className="mb-6">
                          <h3 className="font-semibold mb-4">Background Style</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { id: 'solid', label: 'Solid Dark', class: 'bg-neutral-900' },
                              { id: 'gradient-morning', label: 'Morning', class: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500' },
                              { id: 'gradient-afternoon', label: 'Afternoon', class: 'bg-gradient-to-br from-amber-200 via-orange-400 to-rose-500' },
                              { id: 'gradient-evening', label: 'Evening', class: 'bg-gradient-to-br from-violet-500 to-purple-900' },
                              { id: 'gradient-night', label: 'Night', class: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' }
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateSettings({ focusBackground: bg.id as any })}
                                className={`relative h-24 rounded-xl border-2 overflow-hidden transition-all ${
                                  settings.focusBackground === bg.id
                                    ? 'border-white shadow-lg shadow-white/20'
                                    : 'border-transparent hover:border-white/50'
                                }`}
                              >
                                <div className={`absolute inset-0 ${bg.class}`} />
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50 backdrop-blur-sm text-xs font-medium text-white text-center">
                                  {bg.label}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <h3 className="font-semibold">Minimal Mode</h3>
                            <p className="text-sm text-white/60">Hide all distractions and UI elements</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.focusMinimal}
                              onChange={(e) => updateSettings({ focusMinimal: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Ambient Theme' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Ambient Theme</h2>
                      <p className="mb-8 text-sm text-white/60">Set the mood for relaxation.</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {['none', 'rain', 'forest', 'cafe'].map((sound) => (
                          <button
                            key={sound}
                            onClick={() => updateSettings({ ambientSound: sound })}
                            className={`p-4 rounded-xl border text-left capitalize ${
                              settings.ambientSound === sound
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {sound === 'none' ? <Volume2 size={16} /> : <Music size={16} />}
                              <span className="font-semibold">{sound}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Clock' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Clock</h2>
                      <p className="mb-8 text-sm text-white/60">Customize how time is displayed.</p>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <h3 className="font-semibold">24-Hour Format</h3>
                            <p className="text-sm text-white/60">Use 24-hour time format (e.g. 14:00)</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.clockFormat === '24h'}
                              onChange={(e) => updateSettings({ clockFormat: e.target.checked ? '24h' : '12h' })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <h3 className="font-semibold">Show Seconds</h3>
                            <p className="text-sm text-white/60">Display seconds in the clock</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.showSeconds}
                              onChange={(e) => updateSettings({ showSeconds: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Focus Timer' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Focus Timer</h2>
                      <p className="mb-8 text-sm text-white/60">Configure your Pomodoro intervals.</p>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Work Duration (minutes)</h3>
                          <input 
                            type="range" 
                            min="5" 
                            max="60" 
                            step="5"
                            value={settings.focusWorkDuration}
                            onChange={(e) => updateSettings({ focusWorkDuration: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
                          />
                          <div className="mt-2 text-xs text-white/60 text-right">{settings.focusWorkDuration} min</div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Short Break (minutes)</h3>
                          <input 
                            type="range" 
                            min="1" 
                            max="15" 
                            value={settings.focusShortBreak}
                            onChange={(e) => updateSettings({ focusShortBreak: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
                          />
                          <div className="mt-2 text-xs text-white/60 text-right">{settings.focusShortBreak} min</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Music' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Music</h2>
                      <p className="mb-8 text-sm text-white/60">Connect your Spotify account and manage your playlist.</p>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                              <Music size={24} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Spotify Integration</h3>
                              <p className="text-sm text-white/60">{spotifyConnected ? 'Connected as User' : 'Connect to access your playlists'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSpotifyConnected(!spotifyConnected)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                              spotifyConnected 
                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                : 'bg-[#1DB954] text-black hover:bg-[#1ed760] shadow-lg shadow-[#1DB954]/20'
                            }`}
                          >
                            {spotifyConnected ? 'Disconnect' : 'Connect Spotify'}
                          </button>
                        </div>

                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                          <h3 className="font-semibold text-lg mb-4">Love Songs</h3>
                          <p className="text-sm text-white/60 mb-6">Upload your favorite tracks to create a personal collection.</p>
                          
                          <div className="flex items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload size={20} className="text-white/60" />
                              </div>
                              <p className="font-medium mb-1">Upload audio file</p>
                              <p className="text-xs text-white/40">MP3, WAV, OGG (max 10MB)</p>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 mt-4 text-center">
                            Note: Use the music player in the bottom right to manage your uploaded songs.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Stats' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Statistics</h2>
                      <p className="mb-8 text-sm text-white/60">Your productivity insights.</p>
                      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <BarChart2 size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-white/60">Detailed statistics will appear here after you complete your first focus session.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Quotes' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Quotes</h2>
                      <p className="mb-8 text-sm text-white/60">Inspiration for your day.</p>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <div>
                          <h3 className="font-semibold">Show Daily Quotes</h3>
                          <p className="text-sm text-white/60">Display a new quote every day</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.showQuotes}
                            onChange={(e) => updateSettings({ showQuotes: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Account' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Account Settings</h2>
                      <p className="mb-10 text-sm text-white/60 leading-relaxed">
                        Manage your profile and preferences.
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <h3 className="font-semibold text-lg">Student Mode</h3>
                            <p className="text-sm text-white/60">Enable features optimized for students (Dashboard, Schedule, etc.)</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isStudent}
                              onChange={async (e) => {
                                setIsStudent(e.target.checked);
                                if (user) {
                                  await setDoc(doc(db, 'users', user.uid), { isStudent: e.target.checked }, { merge: true });
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback for unimplemented tabs */}
                  {!['Themes', 'Home Theme', 'Focus Theme', 'Ambient Theme', 'Clock', 'Focus Timer', 'Stats', 'Quotes', 'Account', 'Music'].includes(activeTab) && (
                    <div className="flex h-full items-center justify-center text-white/40">
                      <p>Settings for {activeTab} will appear here.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
