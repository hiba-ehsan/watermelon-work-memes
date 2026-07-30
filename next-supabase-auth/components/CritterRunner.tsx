'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FRAME_1 = "/critter/frame1.svg";
const FRAME_2 = "/critter/frame2.svg";

export default function CritterRunner({ isTransitioning }: { isTransitioning: boolean }) {
  const [frame, setFrame] = useState(FRAME_1);

  useEffect(() => {
    if (!isTransitioning) return;
    const flip = setInterval(() => {
      setFrame(f => (f === FRAME_1 ? FRAME_2 : FRAME_1));
    }, 90); 
    return () => clearInterval(flip);
  }, [isTransitioning]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.img
          src={frame}
          alt="Transitioning critter"
          initial={{ x: "-10vw", scaleX: 1, scaleY: 1 }}
          animate={{
            x: "110vw",
            scaleY: [1, 1.15, 0.9, 1], 
            transition: {
              x: { duration: 0.8, ease: "linear" },
              scaleY: { duration: 0.3, repeat: 3, ease: "easeInOut" },
            },
          }}
          exit={{ scaleX: 1.4, scaleY: 0.6, opacity: 0, transition: { duration: 0.15 } }}
          style={{
            position: "fixed",
            bottom: 24,
            width: 48,
            height: 48,
            zIndex: 9999,
            imageRendering: "pixelated",
          }}
        />
      )}
    </AnimatePresence>
  );
}
