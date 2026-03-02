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

  const getBackground = () => {
    // Base image for all modes (Implant Mode aesthetic - Lush Forest)
    const baseImage = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop';
    
    switch (appMode) {
      case 'ambient':
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
          blurStyle: { filter: 'blur(0px)' }
        };
      case 'focus':
        if (settings.focusBackground === 'solid') {
          return {
            type: 'solid',
            image: '',
            overlayStyle: { backgroundColor: '#171717' }, // neutral-900
            blurStyle: { filter: 'blur(0px)' }
          };
        } else if (settings.focusBackground.startsWith('gradient-')) {
          let gradientClass = '';
          switch (settings.focusBackground) {
            case 'gradient-morning':
              gradientClass = 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500';
              break;
            case 'gradient-afternoon':
              gradientClass = 'bg-gradient-to-br from-amber-200 via-orange-400 to-rose-500';
              break;
            case 'gradient-evening':
              gradientClass = 'bg-gradient-to-br from-violet-500 to-purple-900';
              break;
            case 'gradient-night':
              gradientClass = 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';
              break;
          }
          return {
            type: 'gradient',
            gradientClass,
            image: '',
            overlayStyle: { backgroundColor: 'transparent' },
            blurStyle: { filter: 'blur(0px)' }
          };
        }
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
          blurStyle: { filter: 'blur(4px)' }
        };
      case 'student-dashboard':
        return {
          type: 'solid',
          image: '', // No background image for student dashboard
          overlayStyle: { backgroundColor: '#0f0f13' },
          blurStyle: { filter: 'blur(0px)' }
        };
      case 'tracker':
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          blurStyle: { filter: 'blur(4px)' }
        };
      case 'home':
      default:
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: `rgba(0, 0, 0, ${settings.homeOverlay / 100})` },
          blurStyle: { filter: `blur(${settings.homeBlur}px)` }
        };
    }
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
    <div className="relative min-h-screen w-full overflow-hidden font-sans selection:bg-white/30 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background */}
      {appMode !== 'student-dashboard' && (
        <div className="absolute inset-0 z-0 transition-all duration-1000">
          <motion.div 
            initial={false}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <AnimatePresence mode="wait">
              {bg.type === 'image' && (
                <motion.img
                  key="bg-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  src={bg.image}
                  alt="Background"
                  className="h-full w-full object-cover transition-all duration-1000"
                  style={bg.blurStyle}
                />
              )}
              {bg.type === 'gradient' && (
                <motion.div
                  key={bg.gradientClass}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className={`absolute inset-0 ${bg.gradientClass}`}
                />
              )}
            </AnimatePresence>
          </motion.div>
          <div className="absolute inset-0 transition-colors duration-1000" style={bg.overlayStyle} />
        </div>
      )}

      {/* Top Bar */}
      {appMode !== 'student-dashboard' && (
        <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-bold tracking-tighter text-white select-none drop-shadow-md pointer-events-auto flex items-center gap-2"
          >
            <Leaf className="text-green-400" size={24} />
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
              <ClockMode />
            </motion.div>
          )}
          {appMode === 'focus' && (
            <motion.div key="focus" className="w-full h-full flex justify-center">
              <TimerMode user={user} settings={settings} setIsGamificationOpen={setIsGamificationOpen} />
            </motion.div>
          )}
          {appMode === 'ambient' && (
            <motion.div key="ambient" className="w-full h-full flex justify-center">
              <AmbientMode />
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
              className="flex items-center gap-2 pointer-events-auto overflow-x-auto max-w-full custom-scrollbar pb-2 md:pb-0 w-full md:w-auto justify-center md:justify-start"
            >
              <div className="relative shrink-0">
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
              <MotionButton 
                onClick={() => setAppMode('student-dashboard')}
                className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                title="Student Dashboard"
              >
                <LayoutDashboard size={20} />
              </MotionButton>
              <MotionButton 
                onClick={() => setIsNotepadOpen(true)}
                className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                title="Notepad (N)"
              >
                <FileText size={20} />
              </MotionButton>
            </motion.div>

            {/* Right Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 md:gap-4 pointer-events-auto overflow-x-auto max-w-full custom-scrollbar pb-2 md:pb-0 w-full md:w-auto justify-center md:justify-end"
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
    </div>
  );
}
