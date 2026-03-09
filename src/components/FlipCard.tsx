import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  glowing?: boolean;
}

export function FlipCard({ front, back, className = '', glowing = false }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`[perspective:1000px] cursor-pointer ${className}`}
      onClick={() => setIsFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped((f) => !f);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Flip card to front' : 'Flip card to back'}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] glass-card p-6 ${
            glowing ? 'border-opti-accent/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]' : ''
          }`}
        >
          {front}
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] glass-card p-6 ${
            glowing ? 'border-opti-accent/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]' : ''
          }`}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}
