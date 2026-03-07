import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, ImageIcon, Clock, Timer, BarChart2, MessageSquare, 
  MoreHorizontal, User, HelpCircle, X, Zap, Gift, Check, Volume2,
  Type, Layout, Moon, Sun, Music, Upload, ChevronDown, ChevronRight,
  Monitor, Focus, Coffee
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useMusicStore } from '../store/useMusicStore';

// Define the theme configuration interface
export interface ThemeConfig {
  type: 'image' | 'video' | 'gradient' | 'solid';
  value: string;
  blur: number;
  overlay: number;
  minimal?: boolean; // For focus mode
  sound?: string; // For ambient mode
}

// Define the settings interface
export interface AppSettings {
  home: ThemeConfig;
  focus: ThemeConfig;
  ambient: ThemeConfig;
  
  // Global settings
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  clockTheme: 'modern' | 'minimal' | 'retro' | 'neon';
  clockColor: string;
  showDate: boolean;
  showGreeting: boolean;
  focusWorkDuration: number;
  focusShortBreak: number;
  focusLongBreak: number;
  showQuotes: boolean;
  quoteCategory: string;
  
  // Theme Customization
  primaryColor: string;
  fontStyle: 'sans' | 'serif' | 'mono';
}

export const defaultSettings: AppSettings = {
  home: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop',
    blur: 0,
    overlay: 20
  },
  focus: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2560&auto=format&fit=crop',
    blur: 0,
    overlay: 40,
    minimal: false
  },
  ambient: {
    type: 'video',
    value: 'https://www.youtube.com/watch?v=5wRWniH7rt8', // Cherry Blossoms
    blur: 0,
    overlay: 10,
    sound: 'none'
  },
  
  clockFormat: '24h',
  showSeconds: false,
  clockTheme: 'modern',
  clockColor: '#ffffff',
  showDate: true,
  showGreeting: true,
  focusWorkDuration: 25,
  focusShortBreak: 5,
  focusLongBreak: 15,
  showQuotes: true,
  quoteCategory: 'motivational',
  
  primaryColor: 'indigo',
  fontStyle: 'sans',
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

// Reusable Theme Editor Component
const ThemeEditor = ({ config, onChange, title, description, showMinimal, showSound }: { 
  config: ThemeConfig, 
  onChange: (c: ThemeConfig) => void,
  title: string,
  description: string,
  showMinimal?: boolean,
  showSound?: boolean
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    onChange({ ...config, ...updates });
  };

  const animePresets = [
    { title: 'Cherry Blossoms', url: 'https://www.youtube.com/watch?v=5wRWniH7rt8', img: 'https://img.youtube.com/vi/5wRWniH7rt8/mqdefault.jpg' },
    { title: 'Night Street', url: 'https://www.youtube.com/watch?v=9FvvbVI5rYA', img: 'https://img.youtube.com/vi/9FvvbVI5rYA/mqdefault.jpg' },
    { title: 'Rainy Garden', url: 'https://www.youtube.com/watch?v=J41qT0_iH0I', img: 'https://img.youtube.com/vi/J41qT0_iH0I/mqdefault.jpg' },
    { title: 'Cozy Room', url: 'https://www.youtube.com/watch?v=lgVrqaHQOTU', img: 'https://img.youtube.com/vi/lgVrqaHQOTU/mqdefault.jpg' },
    { title: 'Ghibli Nature', url: 'https://www.youtube.com/watch?v=0pCDR4h12ig', img: 'https://img.youtube.com/vi/0pCDR4h12ig/mqdefault.jpg' },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="mb-2 text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mb-8 text-sm text-white/60">{description}</p>
      
      <div className="space-y-8">
        {/* Type Selector */}
        <div className="grid grid-cols-4 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {['image', 'video', 'gradient', 'solid'].map((type) => (
            <button
              key={type}
              onClick={() => updateConfig({ type: type as any })}
              className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                config.type === type
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {config.type === 'video' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <h3 className="text-lg font-bold mb-2">YouTube Background</h3>
              <div className="flex gap-3 mb-4">
                <input 
                  type="text" 
                  placeholder="Paste YouTube URL..." 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  onClick={() => updateConfig({ value: youtubeUrl })}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Set
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                Anime Scenery Presets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {animePresets.map((preset) => (
                  <button
                    key={preset.url}
                    onClick={() => updateConfig({ value: preset.url })}
                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                      config.value === preset.url
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'border-transparent hover:border-white/30'
                    }`}
                  >
                    <img src={preset.img} alt={preset.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-bold text-sm">{preset.title}</span>
                    </div>
                    {config.value === preset.url && (
                      <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {config.type === 'image' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={20} className="text-white/60" />
                </div>
                <p className="font-medium mb-1">Upload Custom Image</p>
                <p className="text-xs text-white/40">JPG, PNG, WEBP (max 5MB)</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => updateConfig({ value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' })}
                  className="aspect-video rounded-xl bg-cover bg-center border-2 border-transparent hover:border-white/30"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop)' }}
                />
                <button 
                  onClick={() => updateConfig({ value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2560&auto=format&fit=crop' })}
                  className="aspect-video rounded-xl bg-cover bg-center border-2 border-transparent hover:border-white/30"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2560&auto=format&fit=crop)' }}
                />
                <button 
                  onClick={() => updateConfig({ value: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2560&auto=format&fit=crop' })}
                  className="aspect-video rounded-xl bg-cover bg-center border-2 border-transparent hover:border-white/30"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2560&auto=format&fit=crop)' }}
                />
              </div>
          </div>
        )}

        {config.type === 'gradient' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {[
                { id: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500', label: 'Morning' },
                { id: 'bg-gradient-to-br from-amber-200 via-orange-400 to-rose-500', label: 'Afternoon' },
                { id: 'bg-gradient-to-br from-violet-500 to-purple-900', label: 'Evening' },
                { id: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900', label: 'Night' }
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => updateConfig({ value: bg.id })}
                  className={`relative h-24 rounded-xl border-2 overflow-hidden transition-all ${
                    config.value === bg.id
                      ? 'border-white shadow-lg shadow-white/20'
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <div className={`absolute inset-0 ${bg.id}`} />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50 backdrop-blur-sm text-xs font-medium text-white text-center">
                    {bg.label}
                  </div>
                </button>
              ))}
            </div>
        )}

        {/* Common Sliders */}
        <div className="pt-6 border-t border-white/10 space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium text-sm">Blur Effect</label>
              <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded">{config.blur}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={config.blur}
              onChange={(e) => updateConfig({ blur: parseInt(e.target.value) })}
              className="w-full accent-white h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-medium text-sm">Dark Overlay</label>
              <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded">{config.overlay}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="90" 
              value={config.overlay}
              onChange={(e) => updateConfig({ overlay: parseInt(e.target.value) })}
              className="w-full accent-white h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {showMinimal && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="font-semibold">Minimal Mode</h3>
                <p className="text-sm text-white/60">Hide extra elements for better focus</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.minimal}
                  onChange={(e) => updateConfig({ minimal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          )}

          {showSound && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Ambient Sound</label>
              <div className="grid grid-cols-2 gap-2">
                {['none', 'rain', 'forest', 'cafe'].map((sound) => (
                  <button
                    key={sound}
                    onClick={() => updateConfig({ sound })}
                    className={`p-3 rounded-lg border text-left capitalize transition-all ${
                      config.sound === sound
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {sound === 'none' ? <Volume2 size={16} /> : <Music size={16} />}
                      <span>{sound}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState('Themes');
  const { spotifyConnected, setSpotifyConnected } = useMusicStore();

  const tabs = [
    { id: 'Themes', icon: Palette },
    { id: 'Home Theme', icon: Monitor, indent: true },
    { id: 'Focus Theme', icon: Focus, indent: true },
    { id: 'Ambient Theme', icon: Coffee, indent: true },
    { id: 'Appearance', icon: Layout },
    { id: 'Clock', icon: Clock },
    { id: 'Focus Timer', icon: Timer },
    { id: 'Music', icon: Music, badge: 'NEW', badgeColor: 'bg-indigo-500' },
    { id: 'Stats', icon: BarChart2 },
    { id: 'Quotes', icon: MessageSquare },
    { id: 'Account', icon: User },
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
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ x: 4 }}
                      className={`flex flex-shrink-0 md:w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? 'bg-white/15 text-white shadow-inner' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      } ${tab.indent ? 'md:ml-4' : ''}`}
                    >
                      <Icon size={16} className={isActive ? 'text-indigo-400' : ''} />
                      {tab.id}
                      {tab.badge && (
                        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
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
                      <p className="mb-8 text-sm text-white/60">Manage themes for different modes.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {['home', 'focus', 'ambient'].map((mode) => (
                           <button
                             key={mode}
                             onClick={() => setActiveTab(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Theme`)}
                             className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                           >
                             <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                                {mode === 'home' && <Monitor size={24} />}
                                {mode === 'focus' && <Focus size={24} />}
                                {mode === 'ambient' && <Coffee size={24} />}
                             </div>
                             <h3 className="text-lg font-bold capitalize mb-1">{mode} Theme</h3>
                             <p className="text-sm text-white/40">Customize background & settings</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Home Theme' && (
                    <ThemeEditor 
                      config={settings.home} 
                      onChange={(newConfig) => updateSettings({ home: newConfig })}
                      title="Home Theme"
                      description="Customize the look of your home dashboard."
                    />
                  )}

                  {activeTab === 'Focus Theme' && (
                    <ThemeEditor 
                      config={settings.focus} 
                      onChange={(newConfig) => updateSettings({ focus: newConfig })}
                      title="Focus Theme"
                      description="Set up your distraction-free environment."
                      showMinimal={true}
                    />
                  )}

                  {activeTab === 'Ambient Theme' && (
                    <ThemeEditor 
                      config={settings.ambient} 
                      onChange={(newConfig) => updateSettings({ ambient: newConfig })}
                      title="Ambient Theme"
                      description="Configure your relaxation space."
                      showSound={true}
                    />
                  )}

                  {activeTab === 'Appearance' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Appearance</h2>
                      <p className="mb-8 text-sm text-white/60">Customize the look and feel of the application.</p>
                      
                      <div className="space-y-8">
                        {/* Primary Color */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Primary Color</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { id: 'indigo', color: 'bg-indigo-500', label: 'Indigo' },
                              { id: 'violet', color: 'bg-violet-500', label: 'Violet' },
                              { id: 'fuchsia', color: 'bg-fuchsia-500', label: 'Fuchsia' },
                              { id: 'rose', color: 'bg-rose-500', label: 'Rose' },
                              { id: 'orange', color: 'bg-orange-500', label: 'Orange' },
                              { id: 'amber', color: 'bg-amber-500', label: 'Amber' },
                              { id: 'emerald', color: 'bg-emerald-500', label: 'Emerald' },
                              { id: 'cyan', color: 'bg-cyan-500', label: 'Cyan' },
                            ].map((c) => (
                              <button
                                key={c.id}
                                onClick={() => updateSettings({ primaryColor: c.id })}
                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                                  settings.primaryColor === c.id
                                    ? 'bg-white/10 border-white text-white shadow-lg'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full ${c.color}`} />
                                <span className="font-medium">{c.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Style */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Font Style</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: 'sans', label: 'Modern Sans', class: 'font-sans' },
                              { id: 'serif', label: 'Elegant Serif', class: 'font-serif' },
                              { id: 'mono', label: 'Tech Mono', class: 'font-mono' },
                            ].map((font) => (
                              <button
                                key={font.id}
                                onClick={() => updateSettings({ fontStyle: font.id as any })}
                                className={`p-4 rounded-xl border text-center transition-all ${
                                  settings.fontStyle === font.id
                                    ? 'bg-white/10 border-white text-white shadow-lg'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <div className={`text-2xl mb-2 ${font.class}`}>Aa</div>
                                <span className="text-sm font-medium">{font.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Clock' && (
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-3xl font-bold tracking-tight">Clock</h2>
                      <p className="mb-8 text-sm text-white/60">Customize how time is displayed.</p>
                      
                      <div className="space-y-6">
                        {/* Theme Selector */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Clock Theme</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['modern', 'minimal', 'retro', 'neon'].map((theme) => (
                              <button
                                key={theme}
                                onClick={() => updateSettings({ clockTheme: theme as any })}
                                className={`p-4 rounded-xl border text-center capitalize transition-all ${
                                  settings.clockTheme === theme
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <div className={`text-2xl font-bold mb-2 ${
                                  theme === 'retro' ? 'font-mono' : 
                                  theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 
                                  theme === 'minimal' ? 'font-light' : ''
                                }`}>
                                  12:00
                                </div>
                                <span className="text-xs font-medium opacity-60">{theme}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Clock Color</h3>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { color: '#ffffff', label: 'White' },
                              { color: '#06b6d4', label: 'Cyan' },
                              { color: '#a855f7', label: 'Purple' },
                              { color: '#22c55e', label: 'Green' },
                              { color: '#f97316', label: 'Orange' },
                              { color: '#ec4899', label: 'Pink' },
                              { color: '#eab308', label: 'Yellow' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                onClick={() => updateSettings({ clockColor: c.color })}
                                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                                  settings.clockColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c.color }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <h3 className="font-semibold">24-Hour Format</h3>
                              <p className="text-sm text-white/60">Use 24-hour time format</p>
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
                              <p className="text-sm text-white/60">Display seconds</p>
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

                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <h3 className="font-semibold">Show Date</h3>
                              <p className="text-sm text-white/60">Display today's date</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showDate}
                                onChange={(e) => updateSettings({ showDate: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <h3 className="font-semibold">Show Greeting</h3>
                              <p className="text-sm text-white/60">Personalized greeting</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.showGreeting}
                                onChange={(e) => updateSettings({ showGreeting: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
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

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Long Break (minutes)</h3>
                          <input 
                            type="range" 
                            min="5" 
                            max="45" 
                            step="5"
                            value={settings.focusLongBreak}
                            onChange={(e) => updateSettings({ focusLongBreak: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
                          />
                          <div className="mt-2 text-xs text-white/60 text-right">{settings.focusLongBreak} min</div>
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
                  {!['Themes', 'Home Theme', 'Focus Theme', 'Ambient Theme', 'Appearance', 'Clock', 'Focus Timer', 'Stats', 'Quotes', 'Account', 'Music'].includes(activeTab) && (
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
