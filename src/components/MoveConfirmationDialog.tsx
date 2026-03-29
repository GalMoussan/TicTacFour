import { motion, AnimatePresence } from 'framer-motion';
import { NeonButton } from './ui';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
}

interface MoveConfirmationDialogProps {
  pendingMove: PendingMove | null;
  currentPlayer: 'X' | 'O';
  onConfirm: () => void;
  onCancel: () => void;
  clickX?: number;
  clickY?: number;
}

export function MoveConfirmationDialog({
  pendingMove,
  currentPlayer,
  onConfirm,
  onCancel,
  clickX,
  clickY,
}: MoveConfirmationDialogProps) {
  if (!pendingMove) return null;

  // Calculate popup position near cursor with edge protection
  const calculatePosition = () => {
    const offset = 10; // Offset from cursor
    const popupWidth = 380; // Approximate max-w-md width
    const popupHeight = 200; // Approximate popup height

    let x = (clickX ?? window.innerWidth / 2) + offset;
    let y = (clickY ?? window.innerHeight / 2) + offset;

    // Edge protection: adjust if popup would overflow
    if (x + popupWidth > window.innerWidth) {
      x = (clickX ?? window.innerWidth / 2) - popupWidth - offset;
    }
    if (y + popupHeight > window.innerHeight) {
      y = (clickY ?? window.innerHeight / 2) - popupHeight - offset;
    }

    // Ensure popup stays on screen even if cursor is at edge
    x = Math.max(16, Math.min(x, window.innerWidth - popupWidth - 16));
    y = Math.max(16, Math.min(y, window.innerHeight - popupHeight - 16));

    return { x, y };
  };

  const { x, y } = calculatePosition();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`,
          }}
          className="glass border-2 border-neon-cyan/30 rounded-xl p-6 w-[380px] shadow-glow-cyan"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                currentPlayer === 'X' ? 'border-neon-cyan' : 'border-neon-pink'
              }`}
            >
              <span
                className={`font-display text-xl ${
                  currentPlayer === 'X' ? 'text-neon-cyan' : 'text-neon-pink'
                }`}
              >
                {currentPlayer}
              </span>
            </div>
            <h2 className="font-display text-xl text-white uppercase tracking-wider">
              Confirm Move
            </h2>
          </div>

          {/* Message */}
          <p className="font-body text-gray-300 mb-6">
            Place{' '}
            <span
              className={`font-display font-bold ${
                currentPlayer === 'X' ? 'text-neon-cyan' : 'text-neon-pink'
              }`}
            >
              {currentPlayer}
            </span>{' '}
            at{' '}
            <span className="text-white font-semibold">
              Layer {pendingMove.layer + 1}, Row {pendingMove.row + 1}, Column {pendingMove.col + 1}
            </span>
            ?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <NeonButton
              color="cyan"
              onClick={onConfirm}
              className="flex-1 py-3 text-sm"
            >
              ✓ CONFIRM
            </NeonButton>
            <button
              onClick={onCancel}
              className="flex-1 glass border border-white/20 text-gray-300 hover:border-red-400 hover:text-red-400 py-3 rounded-lg transition-all text-sm font-display uppercase tracking-wider"
            >
              ✕ CANCEL
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
