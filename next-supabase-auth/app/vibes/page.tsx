'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CritterRunner from '@/components/CritterRunner';

export default function VibesPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [memes, setMemes] = useState<{ id: number; src: string; alt: string }[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/vibe/memes')
      .then(res => res.json())
      .then(data => setMemes(data));
  }, []);

  const handleMemeClick = (id: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/twin?meme=${id}`);
    }, 750);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-mono overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter text-[#39FF14]">
          What's the vibe?
        </h1>
        <p className="mt-4 text-white/50 text-xl tracking-widest uppercase">Select an iteration to proceed</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl z-10">
        {memes.map((meme, index) => (
          <motion.div
            key={meme.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMemeClick(meme.id)}
            className="relative aspect-square cursor-pointer rounded-none overflow-hidden shadow-2xl border-4 border-white/20 hover:border-[#FF3131] transition-colors group"
          >
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
            <img 
              src={`/memes/${meme.src}`}
              alt={meme.alt}
              className="absolute inset-0 w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-[#FF3131]/20 opacity-0 group-hover:opacity-100 mix-blend-screen transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-white font-black text-2xl uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                [ INIT VIBE ]
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <CritterRunner isTransitioning={isTransitioning} />
    </main>
  );
}
