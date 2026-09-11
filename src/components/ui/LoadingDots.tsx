'use client';

import { motion } from 'framer-motion';

interface LoadingDotsProps {
  className?: string;
}

export default function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut' as const,
          }}
        />
      ))}
    </div>
  );
}
