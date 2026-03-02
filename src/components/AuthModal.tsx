import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save user profile with student status
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          isStudent: isStudent,
          isOnboarded: false,
          createdAt: new Date()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: result.user.email,
          isStudent: false, // Default or handle via onboarding check later
          isOnboarded: false,
          createdAt: new Date()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[95%] max-w-[420px] max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[32px] border border-white/10 bg-[#1a1a1a]/80 text-white shadow-2xl backdrop-blur-xl p-6 md:p-10 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              {isLogin ? 'Welcome back' : 'Let\'s get more done'} <span className="text-yellow-400">✨</span>
            </h2>
            <p className="text-white/60 mb-6 md:mb-8 text-sm font-medium">
              {isLogin ? 'Log in to continue your progress.' : 'Save your setup for peak productivity.'}
            </p>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form className="space-y-4 md:space-y-5 mb-6 md:mb-8" onSubmit={handleAuth}>
              {!isLogin && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="First name" 
                    className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm"
                  />
                </div>
              )}
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm"
                />
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={isLogin ? "password" : "create password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2.5 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {!isLogin && (
                  <p className="text-[10px] text-white/30 text-left mt-1.5">
                    8+ characters, 1 uppercase letter, 1 number
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      id="isStudent" 
                      checked={isStudent}
                      onChange={(e) => setIsStudent(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-[#6366f1] cursor-pointer"
                    />
                    <label htmlFor="isStudent" className="text-xs text-white/60 cursor-pointer select-none">
                      I am a student
                    </label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      id="newsletter" 
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-[#6366f1] cursor-pointer"
                    />
                    <label htmlFor="newsletter" className="text-xs text-white/60 cursor-pointer select-none">
                      Join our productivity newsletter
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-[#6366f1] py-3 text-sm font-bold text-white hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isLogin ? 'Log In' : 'Continue'}
                </motion.button>
                <motion.button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-white text-black py-3 text-sm font-bold hover:bg-gray-200 transition-all shadow-lg"
                >
                  Sign in with Google
                </motion.button>
                <motion.button 
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-[#2a2a30] py-3 text-sm font-bold text-white hover:bg-[#3a3a40] transition-all flex items-center justify-center gap-2"
                >
                  Stay logged out <ArrowRight size={14} />
                </motion.button>
              </div>
            </form>

            <div className="text-xs text-white/40 mb-4 md:mb-6">
              {isLogin ? "Don't have an account?" : "Have an account?"} 
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-white hover:underline font-medium ml-1"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>

            <div className="text-[10px] text-white/20 leading-tight max-w-xs mx-auto">
              By proceeding, you agree to the <a href="#" className="underline hover:text-white/40">Terms of Service</a> and <a href="#" className="underline hover:text-white/40">Privacy Policy</a>.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
