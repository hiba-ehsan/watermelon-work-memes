'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('image', file);

    const res = await fetch('/api/vibe/submit', { method: 'POST', body: formData });

    if (res.ok) {
      setMessage('Submitted for moderation');
      setTitle('');
      setFile(null);
    } else {
      const err = await res.json();
      setMessage(err.error || 'Upload failed');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-mono flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#FF3131]">
          Submit a Vibe
        </h1>
        <p className="mt-4 text-white/50 text-xl tracking-widest uppercase">
          Upload your meme for the collective
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/50">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl focus:outline-none focus:border-[#FF3131] transition-colors rounded-none"
            placeholder="Meme title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/50">Image</label>
          <input
            type="file"
            required
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full text-white/50 file:mr-4 file:py-3 file:px-6 file:border-2 file:border-white/20 file:bg-transparent file:text-white file:font-bold file:uppercase file:text-sm hover:file:border-[#FF3131] transition-colors cursor-pointer"
          />
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 border text-sm font-bold uppercase ${
              message === 'Submitted for moderation'
                ? 'border-[#39FF14] text-[#39FF14]'
                : 'border-[#FF3131] text-[#FF3131]'
            }`}
          >
            {message === 'Submitted for moderation' ? `[SUCCESS]: ${message}` : `[ERROR]: ${message}`}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !title || !file}
          className="w-full py-6 bg-[#FF3131] text-white font-black text-xl uppercase tracking-widest hover:bg-[#e02020] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Uploading...' : '> Upload Vibe'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => router.push('/vibes')}
          className="w-full py-4 border border-white/20 text-white/50 font-bold uppercase text-sm hover:border-white hover:text-white transition-colors cursor-pointer"
        >
          Back to Vibes
        </motion.button>
      </form>
    </main>
  );
}
