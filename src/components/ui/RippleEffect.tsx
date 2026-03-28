import { motion } from 'framer-motion';

/**
 * RippleEffect Component Props
 */
interface RippleEffectProps {
  x: number;
  y: number;
  color?: string;
}

/**
 * RippleEffect Component
 *
 * Creates an animated ripple effect emanating from a specific point.
 * Used to add visual feedback to button clicks and interactions.
 *
 * @param x - X coordinate of the ripple origin (relative to container)
 * @param y - Y coordinate of the ripple origin (relative to container)
 * @param color - CSS color for the ripple (default: cyan with transparency)
 */
export function RippleEffect({ x, y, color = 'rgba(0, 255, 245, 0.5)' }: RippleEffectProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        backgroundColor: color,
      }}
      initial={{ width: 0, height: 0, x: 0, y: 0 }}
      animate={{
        width: 300,
        height: 300,
        x: -150,
        y: -150,
        opacity: 0,
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  );
}
