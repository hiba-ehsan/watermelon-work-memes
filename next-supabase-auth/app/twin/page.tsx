'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

function TwinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memeId = searchParams.get('meme');
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    
    // Fire confetti sequence
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const fireConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#39FF14', '#FF3131', '#ffffff', '#000000']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#39FF14', '#FF3131', '#ffffff', '#000000']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    };

    fireConfetti();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] font-mono flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF3131]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-[30rem] h-[30rem] bg-[#39FF14]/10 rounded-full blur-3xl pointer-events-none" />

      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          className="text-center z-10 flex flex-col items-center"
        >
          <h1 className="text-6xl md:text-9xl font-black uppercase text-white drop-shadow-[0_0_15px_rgba(255,49,49,0.8)] mb-8 tracking-tighter">
            {memeId === '3' ? (
              <>KAAM<br/><span className="text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]">KERLO</span></>
            ) : (
              <>SAME<br/><span className="text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]">TWIN</span></>
            )}
          </h1>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            onClick={() => router.push('/vibes')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-[#FF3131] hover:bg-[#39FF14] hover:text-black text-white transition-all font-black uppercase tracking-widest text-xl flex items-center gap-4 group rounded-none"
          >
            <span>Abort Sequence</span>
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </motion.button>
        </motion.div>
      )}
    </main>
  );
}

export default function TwinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <TwinContent />
    </Suspense>
  );
}
