'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import CritterRunner from '@/components/CritterRunner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email address is required.';
    if (!email.includes('@')) return 'Missing @ symbol — expected format: user@domain.com';
    const parts = email.split('@');
    if (parts.length > 2) return 'Multiple @ symbols detected — only one allowed.';
    const [local, domain] = parts;
    if (!local) return 'Missing username before @ symbol.';
    if (!domain) return 'Missing domain after @ symbol.';
    if (!domain.includes('.')) return 'Missing domain extension (e.g., .com, .org, .net).';
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) return 'Invalid domain extension — must be at least 2 characters.';
    if (/[!#$%^&*()=+\[\]{};:'"\\|,<>?/]/.test(local)) return 'Invalid characters in username — only letters, numbers, dots, hyphens, and underscores allowed.';
    return null;
  };

  const supabase = createClient();

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/fahhh.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => {
      console.warn('Playback blocked:', err);
    });
  };

  const handleTransition = (path: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 750);
  };

  useEffect(() => {
    const storedCooldown = getStoredCooldown();
    if (storedCooldown > 0) {
      setCooldown(storedCooldown);
      setMessage(`Too many signup attempts — please wait ${storedCooldown} seconds before trying again.`);
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = (seconds: number, waitMessage: string) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    setCooldown(seconds);
    setMessage(waitMessage);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fahhhh-signup-lock', `${Date.now() + seconds * 1000}`);
    }

    cooldownTimerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getStoredCooldown = () => {
    if (typeof window === 'undefined') return 0;

    const storedUntil = Number(window.localStorage.getItem('fahhhh-signup-lock'));
    if (!storedUntil || Number.isNaN(storedUntil)) {
      return 0;
    }

    const remainingMs = storedUntil - Date.now();
    if (remainingMs <= 0) {
      window.localStorage.removeItem('fahhhh-signup-lock');
      return 0;
    }

    return Math.max(1, Math.ceil(remainingMs / 1000));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setMessage('');

    try {
      const emailError = validateEmail(email);
      if (emailError) {
        setMessage(emailError);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('Login error:', error);
          if (error.message.includes('Invalid login credentials')) {
            setMessage('Invalid email or password — check your credentials and try again.');
          } else if (error.message.includes('rate limit')) {
            startCooldown(30, 'Too many attempts — please wait 30 seconds before trying again.');
          } else {
            setMessage('Something went wrong — please try again in a moment.');
          }
        } else {
          playSuccessSound();
          handleTransition('/vibes');
        }
      } else {
        const storedCooldown = getStoredCooldown();
        if (storedCooldown > 0) {
          startCooldown(storedCooldown, `Too many signup attempts — please wait ${storedCooldown} seconds before trying again.`);
          return;
        }

        if (password !== confirmPassword) {
          setMessage('Access keys do not match.');
          return;
        }
        if (password.length < 6) {
          setMessage('Password must be at least 6 characters long.');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          console.error('Signup error:', error);
          if (/rate limit|too many|sign[- ]up attempts|too many requests/i.test(error.message)) {
            const cooldownTime = process.env.NODE_ENV === 'development' ? 10 : 300;
            startCooldown(cooldownTime, `Too many signup attempts — please wait ${cooldownTime} seconds before trying again.`);
          } else if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            setMessage('An account with this email already exists — try logging in instead.');
          } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
            setMessage('This email address appears to be invalid — please double-check and try again.');
          } else if (error.message.includes('confirm') || error.message.includes('Confirm')) {
            setMessage('Please check your email to confirm your account before logging in.');
          } else {
            setMessage('Something went wrong — please try again in a moment.');
          }
        } else if (data?.user?.identities?.length === 0) {
          setMessage('An account with this email already exists — try logging in instead.');
        } else {
          playSuccessSound();
          handleTransition('/vibes');
        }
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    playSuccessSound();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-white relative overflow-hidden font-mono">
      {/* Decorative Neon Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#39FF14] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#FF3131] rounded-full mix-blend-screen filter blur-[200px] opacity-20 pointer-events-none"
      />

      {/* Left Branding */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.h1
            variants={itemVariants}
            className="text-7xl md:text-[8rem] lg:text-[12rem] font-black tracking-tighter leading-none mb-4 uppercase"
          >
            FAH<span className="text-[#39FF14]">HHH</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl md:text-3xl font-light tracking-widest text-[#FF3131] uppercase">
            Relatable memes. Always.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-12 h-[1px] w-full bg-white/20" />
        </motion.div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 z-10 border-l border-white/10 bg-[#050505]/60 backdrop-blur-md">
        <div className="w-full max-w-md mx-auto">
          {/* Mode Toggle */}
          <div className="flex mb-12 border border-white/20 p-1">
            <button
              onClick={() => { setIsLogin(true); setMessage(''); setCooldown(0); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${isLogin ? 'bg-[#39FF14] text-black' : 'text-white hover:text-[#39FF14]'
                }`}
            >
              System Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setMessage(''); setCooldown(0); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${!isLogin ? 'bg-[#FF3131] text-black' : 'text-white hover:text-[#FF3131]'
                }`}
            >
              Init Account
            </button>
          </div>

          {/* Mode Status Indicator */}
          <div className="mb-6 flex items-center gap-3">
            <span className={`inline-block w-2 h-2 rounded-full ${isLogin ? 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'bg-[#FF3131] shadow-[0_0_8px_rgba(255,49,49,0.8)]'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              {isLogin ? '> MODE: RETURNING_USER' : '> MODE: NEW_REGISTRATION'}
            </span>
          </div>

          <div className="min-h-[420px]">
            {cooldown > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 border border-[#39FF14] text-[#39FF14] text-sm font-bold uppercase">
                [STATUS]: {message || `Please wait ${cooldown} seconds before trying again.`}
              </motion.div>
            )}

            {message && cooldown === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 border border-[#FF3131] text-[#FF3131] text-sm font-bold uppercase">
                [ERROR]: {message}
              </motion.div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                  {isLogin ? 'Email_Address' : 'New_Email_Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-transparent border-b-2 border-white/20 py-4 text-xl focus:outline-none transition-colors rounded-none ${isLogin ? 'focus:border-[#39FF14]' : 'focus:border-[#FF3131]'}`}
                  placeholder={isLogin ? 'user@network.com' : 'new_user@network.com'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                  {isLogin ? 'Access_Key' : 'Create_Access_Key'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-transparent border-b-2 border-white/20 py-4 text-xl focus:outline-none transition-colors rounded-none ${isLogin ? 'focus:border-[#39FF14]' : 'focus:border-[#FF3131]'}`}
                  placeholder={isLogin ? '••••••••' : 'min 6 characters'}
                />
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">Confirm_Access_Key</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl focus:outline-none focus:border-[#FF3131] transition-colors rounded-none"
                      placeholder="re-enter access key"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || cooldown > 0}
                className={`w-full py-6 mt-4 font-black text-xl uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer ${isLogin
                  ? 'bg-[#39FF14] text-black hover:bg-[#2ecc0f]'
                  : 'bg-[#FF3131] text-white hover:bg-[#e02020]'
                  }`}
              >
                {cooldown > 0 ? `Cooldown — ${cooldown}s remaining` : loading ? 'Processing...' : isLogin ? '> Authenticate' : '> Establish New Access'}
              </motion.button>
            </form>

            <div className="mt-12">
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">
                -- External Protocols --
              </div>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => handleOAuth('github')}
                  className="py-4 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all font-bold uppercase text-sm cursor-pointer"
                >
                  GitHub
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => handleOAuth('google')}
                  className="py-4 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all font-bold uppercase text-sm cursor-pointer"
                >
                  Google
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CritterRunner isTransitioning={isTransitioning} />
    </main>
  );
}