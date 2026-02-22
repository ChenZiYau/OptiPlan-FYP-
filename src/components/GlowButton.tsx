import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function GlowButton({
  children,
  variant = 'primary',
  onClick,
  className = '',
  type = 'button',
}: GlowButtonProps) {
  const baseStyles =
    variant === 'primary'
      ? 'btn-primary'
      : 'btn-secondary';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
}
