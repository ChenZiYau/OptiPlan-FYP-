import type { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const heroCardVariants: Variants = {
  hidden: { y: '18vh', scale: 0.96, rotateX: 8, opacity: 0 },
  visible: {
    y: 0,
    scale: 1,
    rotateX: 0,
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: 'easeOut',
    },
  },
};
