import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Maximize, Settings, Timer, User, 
  Leaf, Home, Minimize, FileText, LayoutDashboard
} from 'lucide-react';
import { auth, db } from './services/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Components
import StudentDashboard from './components/StudentDashboard';
import Onboarding from './components/Onboarding';
import Notepad from './components/Notepad';
import SettingsModal, { AppSettings, defaultSettings } from './components/SettingsModal';
import MusicPlayer from './components/MusicPlayer';
import SpotifyManager from './components/SpotifyManager';
import AuthModal from './components/AuthModal';
import GamificationModal from './components/GamificationModal';
import AIChatbot from './components/AIChatbot';

import NotificationController from './components/NotificationController';

// Modes
import TimerMode from './components/modes/TimerMode';
import TrackerMode from './components/modes/TrackerMode';
import AmbientMode from './components/modes/AmbientMode';
import ClockMode from './components/modes/ClockMode';

const MotionButton = ({ children, onClick, className, title, active = false }: any) => (
  <motion.button
    whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.25)" }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`${className} ${active ? 'bg-white text-black shadow-lg scale-105' : ''} transition-colors duration-200 shrink-0`}
    title={title}
  >
    {children}
  </motion.button>
);

export default function App() {
  const [appMode, setAppMode] = useState<'ambient' | 'home' | 'focus' | 'tracker' | 'student-dashboard'>('ambient');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isSpotifyManagerOpen, setIsSpotifyManagerOpen] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isRTL, setIsRTL] = useState(false); // RTL logic wrapper
  const [isDashboardHovered, setIsDashboardHovered] = useState(false);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthOpen(false);
        // Fetch user profile
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsStudent(data.isStudent);
          setIsOnboarded(data.isOnboarded);
          
          if (data.isStudent && !data.isOnboarded) {
            setShowOnboarding(true);
          } else if (data.isStudent && data.isOnboarded) {
            setAppMode('student-dashboard');
          }
        }
      } else {
        setIsStudent(false);
        setIsOnboarded(false);
        setShowOnboarding(false);
        setAppMode('ambient');
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if an input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 's') setIsSettingsOpen(prev => !prev);
      if (e.key.toLowerCase() === 'n') setIsNotepadOpen(prev => !prev);
      if (e.key.toLowerCase() === 'd') {
        if (isStudent) {
          setAppMode(prev => prev === 'student-dashboard' ? 'home' : 'student-dashboard');
        } else {
          setAppMode(prev => prev === 'tracker' ? 'home' : 'tracker');
        }
      }
      if (e.key.toLowerCase() === 'a') setAppMode('ambient');
      if (e.key.toLowerCase() === 'h') setAppMode('home');
      if (e.key.toLowerCase() === 't') setAppMode('focus');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, isStudent]);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getBackground = () => {
    // For student dashboard, keep it dark/solid for readability
    if (appMode === 'student-dashboard') {
      return {
        type: 'solid',
        value: '#0f0f13',
        overlay: 0,
        blur: 0
      };
    }

    // Map appMode to settings key
    let config;
    switch (appMode) {
      case 'home':
        config = settings.home;
        break;
      case 'focus':
        config = settings.focus;
        break;
      case 'ambient':
        config = settings.ambient;
        break;
      case 'tracker':
        // Tracker uses home theme or a default? Let's use home for now or a specific one if needed.
        // For now, let's fallback to home theme for tracker to keep it consistent
        config = settings.home; 
        break;
      default:
        config = settings.home;
    }

    return {
      type: config.type,
      value: config.value,
      overlay: config.overlay,
      blur: config.blur
    };
  };

  const bg = getBackground();

  const handleUserClick = () => {
    if (user) {
      if (confirm('Are you sure you want to log out?')) {
        signOut(auth);
      }
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div 
      className={`relative min-h-screen w-full overflow-hidden selection:bg-white/30 text-white ${
        settings.fontStyle === 'serif' ? 'font-serif' : 
        settings.fontStyle === 'mono' ? 'font-mono' : 'font-sans'
      }`} 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        '--primary-color': settings.primaryColor === 'violet' ? '#8b5cf6' :
                           settings.primaryColor === 'fuchsia' ? '#d946ef' :
                           settings.primaryColor === 'rose' ? '#f43f5e' :
                           settings.primaryColor === 'orange' ? '#f97316' :
                           settings.primaryColor === 'amber' ? '#f59e0b' :
                           settings.primaryColor === 'emerald' ? '#10b981' :
                           settings.primaryColor === 'cyan' ? '#06b6d4' :
                           '#6366f1' // Default Indigo
      } as React.CSSProperties}
    >
      <NotificationController />
      {/* Background */}
      <div className="absolute inset-0 z-0 transition-all duration-1000">
        <AnimatePresence mode="wait">
          {bg.type === 'image' && (
            <motion.img
              key="bg-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              src={bg.value}
              alt="Background"
              className="h-full w-full object-cover transition-all duration-1000"
              style={{ filter: `blur(${bg.blur}px)` }}
            />
          )}
          {bg.type === 'gradient' && (
            <motion.div
              key="bg-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className={`absolute inset-0 ${bg.value}`}
            />
          )}
          {bg.type === 'solid' && (
             <motion.div
              key="bg-solid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
              style={{ backgroundColor: bg.value || '#0f0f13' }}
            />
          )}
          {bg.type === 'video' && (
            <motion.div
              key="bg-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 overflow-hidden pointer-events-none"
            >
               <div className="absolute inset-0 bg-black" /> {/* Fallback/Base */}
               {getYouTubeId(bg.value) && (
                 <iframe
                    className="absolute top-1/2 left-1/2 w-[100vw] h-[100vh] min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
                    src={`https://www.youtube.com/embed/${getYouTubeId(bg.value)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYouTubeId(bg.value)}&showinfo=0&modestbranding=1&iv_load_policy=3&rel=0&disablekb=1`}
                    title="Background Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ filter: `blur(${bg.blur}px)`, opacity: 0.8 }}
                  />
               )}
            </motion.div>
          )}
        </AnimatePresence>
        <div 
          className="absolute inset-0 transition-colors duration-1000 pointer-events-none" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${bg.overlay / 100})` }} 
        />
      </div>

      {/* Top Bar */}
      {appMode !== 'student-dashboard' && (
        <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-bold tracking-tighter text-white select-none drop-shadow-md pointer-events-auto flex items-center gap-2"
          >
            <LayoutDashboard className="text-indigo-400" size={24} />
            EgyFlow
          </motion.div>
          <AnimatePresence>
            {appMode !== 'ambient' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white/80 italic text-xs md:text-sm font-medium select-none drop-shadow-md pointer-events-auto hidden sm:block"
              >
                "Your only limit is your mind"
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* Center Stage */}
      <main className={`relative z-10 w-full ${appMode === 'student-dashboard' ? 'h-screen overflow-hidden' : 'flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-32 md:pb-32'}`}>
        <AnimatePresence mode="wait">
          {appMode === 'home' && (
            <motion.div key="home" className="w-full h-full flex justify-center">
              <ClockMode settings={settings} />
            </motion.div>
          )}
          {appMode === 'focus' && (
            <motion.div key="focus" className="w-full h-full flex justify-center">
              <TimerMode user={user} settings={settings} setIsGamificationOpen={setIsGamificationOpen} />
            </motion.div>
          )}
          {appMode === 'ambient' && (
            <motion.div key="ambient" className="w-full h-full flex justify-center">
              <AmbientMode settings={settings} updateSettings={updateSettings} />
            </motion.div>
          )}
          {appMode === 'tracker' && (
            <motion.div key="tracker" className="w-full h-full flex justify-center">
              <TrackerMode user={user} onSwitchMode={(mode) => setAppMode(mode)} />
            </motion.div>
          )}
          {appMode === 'student-dashboard' && (
             <motion.div key="student-dashboard" className="w-full h-full">
               <StudentDashboard user={user} onSwitchMode={(mode) => setAppMode(mode)} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && user && (
          <Onboarding 
            user={user} 
            onComplete={() => {
              setShowOnboarding(false);
              setIsOnboarded(true);
              setAppMode('student-dashboard');
            }} 
          />
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      {appMode !== 'student-dashboard' && (
        <>
          <footer className="absolute bottom-4 md:bottom-8 left-0 right-0 flex flex-col md:flex-row justify-between items-center md:items-end z-10 px-4 md:px-8 pointer-events-none gap-4">
            {/* Left Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 pointer-events-auto overflow-x-auto max-w-full custom-scrollbar pb-2 md:pb-0 w-full md:w-auto justify-center md:justify-start"
            >
              <div className={`relative shrink-0 transition-all duration-300 ${isDashboardHovered ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100'}`}>
                <MotionButton 
                  onClick={() => setIsMusicPlayerOpen(!isMusicPlayerOpen)}
                  className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                  title="Music"
                >
                  <Music size={20} />
                </MotionButton>
                <AnimatePresence>
                  {isMusicPlayerOpen && (
                    <div className="absolute bottom-full left-0 mb-4 pointer-events-auto">
                      <MusicPlayer 
                        onClose={() => setIsMusicPlayerOpen(false)} 
                        onOpenManager={() => {
                          setIsMusicPlayerOpen(false);
                          setIsSpotifyManagerOpen(true);
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Prominent Dashboard Button */}
              <motion.button 
                onClick={() => setAppMode('student-dashboard')}
                onHoverStart={() => setIsDashboardHovered(true)}
                onHoverEnd={() => setIsDashboardHovered(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 md:p-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] border border-indigo-400/30 relative z-20 mx-2 flex items-center justify-center group"
                title="Student Dashboard"
              >
                <LayoutDashboard size={28} className="text-white drop-shadow-md" />
              </motion.button>

              <div className={`transition-all duration-300 ${isDashboardHovered ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100'}`}>
                <MotionButton 
                  onClick={() => setIsNotepadOpen(true)}
                  className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                  title="Notepad (N)"
                >
                  <FileText size={20} />
                </MotionButton>
              </div>
            </motion.div>

            {/* Right Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center gap-2 md:gap-4 pointer-events-auto overflow-x-auto max-w-full custom-scrollbar pb-2 md:pb-0 w-full md:w-auto justify-center md:justify-end transition-all duration-300 ${isDashboardHovered ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}
            >
              {/* Mode Pill */}
              <div className="flex items-center gap-1 md:gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full p-1.5 md:p-2 shadow-2xl shrink-0">
                <MotionButton 
                  onClick={() => setAppMode('ambient')}
                  active={appMode === 'ambient'}
                  className={`p-2.5 md:p-3 rounded-full ${appMode === 'ambient' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Ambient Mode (A)"
                >
                  <Leaf size={18} className="md:w-5 md:h-5" />
                </MotionButton>
                <MotionButton 
                  onClick={() => setAppMode('home')}
                  active={appMode === 'home'}
                  className={`p-2.5 md:p-3 rounded-full ${appMode === 'home' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Home Mode (H)"
                >
                  <Home size={18} className="md:w-5 md:h-5" />
                </MotionButton>

                <MotionButton 
                  onClick={() => setAppMode('focus')}
                  active={appMode === 'focus'}
                  className={`p-2.5 md:p-3 rounded-full ${appMode === 'focus' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Focus Mode (T)"
                >
                  <Timer size={18} className="md:w-5 md:h-5" />
                </MotionButton>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <MotionButton 
                  onClick={handleUserClick} 
                  className="p-2.5 md:p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                  title={user ? `Logged in as ${user.email}` : "Log In"}
                >
                  {user ? (
                    user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-4 h-4 md:w-5 md:h-5 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <User size={18} className="md:w-5 md:h-5" />
                  )}
                </MotionButton>
                <MotionButton onClick={() => setIsSettingsOpen(true)} className="p-2.5 md:p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" title="Settings (S)">
                  <Settings size={18} className="md:w-5 md:h-5" />
                </MotionButton>
                <MotionButton onClick={toggleFullscreen} className="p-2.5 md:p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white hidden sm:block" title="Fullscreen (F)">
                  {isFullscreen ? <Minimize size={18} className="md:w-5 md:h-5" /> : <Maximize size={18} className="md:w-5 md:h-5" />}
                </MotionButton>
                {/* RTL Toggle for demonstration */}
                <MotionButton onClick={() => setIsRTL(!isRTL)} className="p-2.5 md:p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" title="Toggle RTL">
                  <span className="text-xs font-bold">{isRTL ? 'LTR' : 'RTL'}</span>
                </MotionButton>
              </div>
            </motion.div>
          </footer>

          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            user={user}
            isStudent={isStudent}
            setIsStudent={setIsStudent}
            settings={settings}
            updateSettings={updateSettings}
            appMode={appMode}
            setAppMode={setAppMode}
          />
          <Notepad isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <GamificationModal isOpen={isGamificationOpen} onClose={() => setIsGamificationOpen(false)} />
          <AnimatePresence>
            {isSpotifyManagerOpen && (
              <SpotifyManager onClose={() => setIsSpotifyManagerOpen(false)} />
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* AI Chatbot available globally except in student dashboard where it has a dedicated view */}
      {appMode !== 'student-dashboard' && <AIChatbot />}
    </div>
  );
}
