import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeBlock } from '../../components/QRCodeBlock';
import { useRoomTonightScores, type TonightScoreEntry } from './hooks/useRoomTonightScores';
import { useRoomAllTimeRecord, type AllTimeRecord } from './hooks/useRoomAllTimeRecord';
import { useAmbientSampleRound, type AmbientSampleRound } from './hooks/useAmbientSampleRound';

type CardKey = 'title' | 'howto' | 'sample' | 'scores' | 'record' | 'rules';

const FULL_CARD_SEQUENCE: CardKey[] = [
  'title',
  'howto',
  'sample',
  'scores',
  'record',
  'rules',
];

const CARD_DURATION_MS = 8_000;

interface TVAttractScreenProps {
  roomCode: string;
  roomId: string;
  roomName?: string | null;
  /**
   * Retained for backwards compatibility but the chaos aesthetic is
   * intentionally a single vivid theme that reads from across the room.
   */
  isDark?: boolean;
  socialiteCount?: number;
}

export function TVAttractScreen({
  roomCode,
  roomId,
  roomName,
  isDark: _isDark = true,
  socialiteCount = 0,
}: TVAttractScreenProps) {
  const tonightQuery = useRoomTonightScores(roomId);
  const recordQuery = useRoomAllTimeRecord(roomId);
  const sampleQuery = useAmbientSampleRound();

  const hasTonightScores = (tonightQuery.data?.length ?? 0) > 0;
  const hasRecord = !!recordQuery.data;

  const sequence = useMemo<CardKey[]>(() => {
    return FULL_CARD_SEQUENCE.filter((card) => {
      if (card === 'scores' && !hasTonightScores) return false;
      if (card === 'record' && !hasRecord) return false;
      return true;
    });
  }, [hasTonightScores, hasRecord]);

  const [cardIndex, setCardIndex] = useState(0);

  useEffect(() => {
    if (sequence.length <= 1) return;
    const timer = window.setInterval(() => {
      setCardIndex((i) => (i + 1) % sequence.length);
    }, CARD_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [sequence.length]);

  useEffect(() => {
    if (cardIndex >= sequence.length) setCardIndex(0);
  }, [cardIndex, sequence.length]);

  const activeCard: CardKey = sequence[cardIndex] ?? 'title';

  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) firstRenderRef.current = false;
  }, []);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : `/room/${roomCode}`;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background is provided by the parent TVPage (<BackgroundAnimation />)
          so /tv shares the same gradient + beer bubble field regardless of
          whether a sociale is running. */}

      {/* Active card */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-12 md:px-16 md:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard}
            initial={{ opacity: 0, y: 40, rotate: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, rotate: 4, scale: 0.94 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto w-full max-w-6xl"
          >
            {activeCard === 'title' && (
              <TitleCard roomCode={roomCode} roomName={roomName ?? null} />
            )}
            {activeCard === 'howto' && <HowToCard />}
            {activeCard === 'sample' && <SampleCard sample={sampleQuery.data ?? null} />}
            {activeCard === 'scores' && <ScoresCard entries={tonightQuery.data ?? []} />}
            {activeCard === 'record' && <RecordCard record={recordQuery.data ?? null} />}
            {activeCard === 'rules' && <RulesCard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent QR — stickered onto the bottom-right corner */}
      <div className="absolute bottom-8 right-8 z-20 md:bottom-12 md:right-12">
        <div className="chaos-tv-qr chaos-tv-float" style={{ ['--chaos-float-rot' as any]: '-2deg' }}>
          <QRCodeBlock value={joinUrl} caption={`Room ${roomCode}`} isDark={false} />
        </div>
      </div>

      {/* Joined-player badge */}
      <AnimatePresence>
        {socialiteCount > 0 && (
          <motion.div
            key="joined-badge"
            initial={firstRenderRef.current ? { opacity: 1, x: 0 } : { x: 80, opacity: 0, rotate: 8 }}
            animate={{ x: 0, opacity: 1, rotate: 2 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 340, damping: 18 }}
            className="absolute right-8 top-8 z-30 md:right-12 md:top-12"
          >
            <span className="chaos-tv-joined">
              <span className="chaos-tv-joined-dot" />
              {socialiteCount} PLAYER{socialiteCount > 1 ? 'S' : ''} JOINED
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default TVAttractScreen;

// -----------------------------------------------------------------------------
// Cards
// -----------------------------------------------------------------------------

function TitleCard({
  roomCode,
  roomName,
}: {
  roomCode: string;
  roomName: string | null;
}) {
  const displayName = roomName && roomName.trim().length > 0 ? roomName : 'Pub Social';
  return (
    <div className="flex flex-col items-center gap-10 text-center md:gap-14">
      <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold">Tonight at</span>

      <h1
        className="chaos-tv-title chaos-tv-title--subtle text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]"
      >
        {displayName}
      </h1>

      <motion.div
        initial={{ scale: 0.8, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: -1.5, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="chaos-tv-card chaos-tv-card--gold relative"
      >
        <div className="chaos-tv-sheen" aria-hidden />
        <span className="chaos-tv-eyebrow chaos-tv-eyebrow--dark chaos-tv-eyebrow--flip">
          Room code
        </span>
        <div className="chaos-tv-code text-6xl sm:text-8xl md:text-[10rem] leading-none">
          {roomCode}
        </div>
      </motion.div>

      <p className="chaos-tv-title chaos-tv-title--cyan chaos-tv-title--subtle text-3xl md:text-5xl">
        Scan the QR to join
      </p>
    </div>
  );
}

function HowToCard() {
  const steps = [
    'Scan the QR with your phone',
    'Enter a name, pick a mascot',
    'Answer, vote, rack up points',
    'Watch your name on the big screen',
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 32, rotate: -6 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotate: i % 2 === 0 ? -1.5 : 1.5,
      transition: { delay: 0.08 * i, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
    }),
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="chaos-tv-title chaos-tv-title--soft text-center text-5xl md:text-7xl">
        How to play
      </h2>
      <motion.ul
        className="grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-2"
        initial="hidden"
        animate="visible"
      >
        {steps.map((text, i) => (
          <motion.li
            key={text}
            custom={i}
            variants={cardVariants}
            className="chaos-tv-card chaos-tv-card--dark flex-row items-center gap-5 py-6"
          >
            <span
              className={
                'chaos-tv-bignum ' + (i % 2 === 0 ? 'chaos-tv-bignum--cyan' : '')
              }
            >
              {i + 1}
            </span>
            <span className="text-2xl font-black tracking-tight md:text-3xl">
              {text}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function SampleCard({ sample }: { sample: AmbientSampleRound | null }) {
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold chaos-tv-eyebrow--flip">
        Tonight's warm-up
      </span>

      {sample ? (
        <>
          <h2 className="chaos-tv-title chaos-tv-title--soft text-4xl md:text-6xl max-w-5xl">
            {sample.title}
          </h2>
          <motion.div
            initial={{ rotate: -4, scale: 0.92, opacity: 0 }}
            animate={{ rotate: -1.5, scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-card chaos-tv-card--pink relative max-w-4xl"
          >
            <div className="chaos-tv-sheen" aria-hidden />
            <div className="relative">
              <p
                className="text-2xl md:text-3xl font-bold leading-snug select-none"
                style={{ filter: 'blur(9px)' }}
              >
                {sample.content ?? 'Preview hidden until the round starts'}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="chaos-tv-eyebrow chaos-tv-eyebrow--dark">
                  Answer reveals when the round starts
                </span>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <h2 className="chaos-tv-title chaos-tv-title--soft text-4xl md:text-6xl">
          <span className="dots">A new round is on the way</span>
        </h2>
      )}
    </div>
  );
}

function ScoresCard({ entries }: { entries: TonightScoreEntry[] }) {
  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="chaos-tv-title chaos-tv-title--soft text-center text-5xl md:text-7xl">
        Tonight's top scores
      </h2>
      <motion.ol
        className="flex w-full max-w-3xl flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {entries.map((entry, i) => (
          <motion.li
            key={`${entry.displayName}-${i}`}
            variants={{
              hidden: { opacity: 0, x: i % 2 === 0 ? -40 : 40, rotate: i % 2 === 0 ? -3 : 3 },
              visible: { opacity: 1, x: 0, rotate: i % 2 === 0 ? -0.8 : 0.8 },
            }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className={
              'chaos-tv-row ' +
              (i === 0 ? 'chaos-tv-row--first' : i === 1 ? 'chaos-tv-row--second' : i === 2 ? 'chaos-tv-row--third' : '')
            }
          >
            <span className="flex items-center gap-4 text-2xl font-black md:text-3xl">
              <span
                className={
                  'chaos-tv-bignum ' +
                  (i === 0
                    ? 'chaos-tv-bignum--gold'
                    : i === 1 || i === 2
                      ? ''
                      : 'chaos-tv-bignum--cyan')
                }
                style={{ width: 56, height: 56, fontSize: 24 }}
              >
                {i + 1}
              </span>
              <span className="tracking-tight">{entry.displayName}</span>
            </span>
            <span className="text-3xl font-black tabular-nums md:text-4xl">
              {entry.total.toLocaleString()}
            </span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}

function RecordCard({ record }: { record: AllTimeRecord | null }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold">All-time venue record</span>

      {record ? (
        <>
          <motion.h2
            initial={{ scale: 0.8, rotate: -4, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-title chaos-tv-title--subtle text-6xl md:text-8xl lg:text-9xl"
          >
            {record.playerName}
          </motion.h2>

          <motion.div
            initial={{ rotate: -4, scale: 0.9, opacity: 0 }}
            animate={{ rotate: 1.5, scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-card chaos-tv-card--gold"
          >
            <div className="chaos-tv-sheen" aria-hidden />
            <div className="text-5xl md:text-7xl font-black tabular-nums leading-none">
              {record.total.toLocaleString()} pts
            </div>
          </motion.div>

          <p className="chaos-tv-title chaos-tv-title--cyan chaos-tv-title--subtle text-2xl md:text-4xl">
            Think you can beat it?
          </p>
        </>
      ) : (
        <h2 className="chaos-tv-title text-5xl md:text-7xl">
          Be the first to set a record!
        </h2>
      )}
    </div>
  );
}

function RulesCard() {
  const rules = [
    'Play fair — one phone per person',
    'Keep it friendly',
    "Host's decision is final",
    'Most points wins bragging rights',
  ];

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="chaos-tv-title chaos-tv-title--soft text-center text-5xl md:text-7xl">
        House rules
      </h2>
      <motion.ul
        className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {rules.map((text, i) => (
          <motion.li
            key={text}
            variants={{
              hidden:  { opacity: 0, y: 30, rotate: -6 },
              visible: { opacity: 1, y: 0, rotate: i % 2 === 0 ? -1.5 : 1.5 },
            }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className={
              'chaos-tv-card ' + (i % 2 === 0 ? 'chaos-tv-card--cyan' : 'chaos-tv-card--pink')
            }
          >
            <span className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              {text}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
