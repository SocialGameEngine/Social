import { motion } from 'framer-motion';
import QRCodeBlock from '../../../components/QRCodeBlock';

interface TVCornerQRProps {
  /** Full join URL (e.g. https://.../room/ABCD). */
  joinUrl: string;
  /** Room code shown under the QR. */
  roomCode: string;
  /**
   * When true, the QR shrinks to a compact badge so it doesn't dominate the
   * screen during active play. When false (lobby, reveal, results, ended), it
   * renders at full theatrical size.
   */
  isActivePlay: boolean;
}

/**
 * P1-26 — persistent bottom-right QR that stays mounted for the whole /tv session.
 *
 * Uses `layout` animations so the transition between expanded (idle) and
 * shrunken (active play) is smooth instead of a pop. Positioned in the bottom-
 * right corner so it sits alongside the bottom-left player-count badge.
 */
export function TVCornerQR({ joinUrl, roomCode, isActivePlay }: TVCornerQRProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: isActivePlay ? -1.5 : 0 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6 pointer-events-none"
      style={{
        transformOrigin: 'bottom right',
      }}
    >
      <motion.div
        layout
        animate={{ scale: isActivePlay ? 0.55 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="chaos-tv-qr chaos-tv-qr--compact"
        style={{ transformOrigin: 'bottom right' }}
      >
        <QRCodeBlock value={joinUrl} caption={`Room ${roomCode}`} isDark={false} />
      </motion.div>
    </motion.div>
  );
}

export default TVCornerQR;
