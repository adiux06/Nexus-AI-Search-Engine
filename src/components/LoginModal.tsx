import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, ArrowRight, Zap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
  isOpen: boolean;
  isCompulsory: boolean;
  isDarkTheme: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ isOpen, isCompulsory, isDarkTheme, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Mock login delay
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login successful', tokenResponse);
      setIsGoogleLoading(false);
      onLoginSuccess();
    },
    onError: (errorResponse) => {
      console.error('Google login failed', errorResponse);
      setError('Google login was cancelled or failed.');
      setIsGoogleLoading(false);
    },
  });

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    loginWithGoogle();
    
    // Safety timeout in case popup gets blocked and onError doesn't fire immediately
    setTimeout(() => {
      setIsGoogleLoading(false);
    }, 60000); // 1 minute timeout
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 backdrop-blur-xl ${isDarkTheme ? 'bg-black/60' : 'bg-white/60'}`}
            onClick={isCompulsory ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${
              isDarkTheme 
                ? 'bg-gray-900 border-gray-800 shadow-blue-900/20' 
                : 'bg-white border-gray-200 shadow-blue-500/20'
            }`}
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

            {!isCompulsory && (
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
                  isDarkTheme ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <X size={20} />
              </button>
            )}

            <div className="relative p-8">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Zap size={32} className="text-white" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to NexusAI
                </h2>
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                  {isCompulsory 
                    ? "You've reached your free usage limit. Please sign in to continue exploring."
                    : "Sign in to unlock advanced features and save your search history."}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    {error}
                  </div>
                )}
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className={isDarkTheme ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all ${
                      isDarkTheme 
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className={isDarkTheme ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all ${
                      isDarkTheme 
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDarkTheme ? 'border-gray-800' : 'border-gray-200'}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-2 ${isDarkTheme ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-500'}`}>
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isLoading || isGoogleLoading}
                    className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 border ${
                      isDarkTheme
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 text-white'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Google</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!isCompulsory && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`text-sm font-medium transition-colors ${
                      isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
