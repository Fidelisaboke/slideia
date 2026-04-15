/**
 * Reusable Motion animation variants for the Purple Mint design system.
 *
 * Usage:
 *   import { fadeInUp, staggerContainer } from '@/lib/motion';
 *   <motion.div variants={staggerContainer} initial="hidden" animate="show">
 *     <motion.div variants={fadeInUp}>...</motion.div>
 *   </motion.div>
 */

import type { Variants } from 'motion/react';

// ── Fade-in from below ───────────────────────────────────────────────

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ── Fade-in from left ────────────────────────────────────────────────

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ── Scale in (for cards, badges) ─────────────────────────────────────

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ── Stagger container ────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ── Fast stagger (for chips, suggestion cards) ───────────────────────

export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};
