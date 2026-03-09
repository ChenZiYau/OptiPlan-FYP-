import type { Variants } from 'framer-motion';

export const EASE_OUT_CUBIC = [0.25, 0.1, 0.25, 1] as const;

export const fadeInUp: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInDown: Variants = {
  hidden: { y: -40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInLeft: Variants = {
  hidden: { x: 40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInRight: Variants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const staggerContainer = (staggerDelay = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

export const staggerItem: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_CUBIC,
    },
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
