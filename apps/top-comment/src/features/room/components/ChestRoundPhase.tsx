// Chest round interstitial — shown every N rounds.
// Generates 3 upgrade options per player; player taps to select.
// Host sees aggregate selection status.

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { UpgradeCard } from './UpgradeCard';
import {
  generateUpgradeOptions,
  DEFAULT_UPGRADE_POOL,
} from '../../../domain/sociale/chestUpgrades';
import type { ChestUpgrade } from '../../../domain/sociale/chestUpgrades';
import { supabase } from '../../../supabase/client';

interface ChestRoundPhaseProps {
  socialeId: string;
  socialiteId: string | null;
  /** Current round index — used as seed variety (not cryptographic). */
  roundIndex: number;
  isHost: boolean;
  /** Number of players who have picked (host view). */
  pickedCount?: number;
  totalCount?: number;
  onAdvancePhase?: () => void;
}

export function ChestRoundPhase({
  socialeId,
  socialiteId,
  roundIndex,
  isHost,
  pickedCount = 0,
  totalCount = 0,
  onAdvancePhase,
}: ChestRoundPhaseProps) {
  const [selected, setSelected] = useState<ChestUpgrade | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Generate stable options per player+round combination.
  // In production the server generates these; here we generate client-side
  // and the edge function validates the selection.
  const options = useMemo(
    () => generateUpgradeOptions(DEFAULT_UPGRADE_POOL, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundIndex, socialiteId],
  );

  const handleConfirm = async () => {
    if (!selected || !socialiteId || confirming) return;
    setConfirming(true);

    try {
      await supabase.from('sociale_chest_upgrades').upsert(
        {
          sociale_id: socialeId,
          socialite_id: socialiteId,
          upgrade_id: selected.id,
          upgrade_json: selected as any, // Cast to any/Json for database
          applies_to_round: roundIndex + 1, // buff fires on the next round
          consumed: false,
        },
      );
      setConfirmed(true);
    } catch {
      // Non-fatal — player can retry
    } finally {
      setConfirming(false);
    }
  };

  // ── HOST VIEW ──────────────────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-yellow-400">
              Chest Round
            </p>
            <p className="text-xs text-yellow-300/70">
              Players are picking upgrades
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>Selections</span>
            <span>{pickedCount} / {totalCount}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-500"
              style={{ width: totalCount > 0 ? `${(pickedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {onAdvancePhase && (
          <button
            type="button"
            onClick={onAdvancePhase}
            className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-black py-2.5 uppercase tracking-wider transition-colors"
          >
            Continue →
          </button>
        )}
      </div>
    );
  }

  // ── PLAYER VIEW ────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <div className="text-6xl">{selected?.emoji}</div>
        <p className="text-2xl font-black text-white">{selected?.name}</p>
        <p className="text-sm text-white/60">{selected?.description}</p>
        <p className="text-xs text-white/40 mt-4">Waiting for other players…</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-4xl mb-2">🎁</div>
        <h2 className="text-2xl font-black text-white">Choose an Upgrade</h2>
        <p className="text-sm text-white/60">Pick one power-up for the next rounds</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((upgrade) => (
          <UpgradeCard
            key={upgrade.id}
            upgrade={upgrade}
            selected={selected?.id === upgrade.id}
            onSelect={setSelected}
            disabled={confirmed}
          />
        ))}
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || confirming}
        className="w-full rounded-xl bg-white text-black text-sm font-black py-3 uppercase tracking-wider transition-opacity disabled:opacity-40"
      >
        {confirming ? 'Saving…' : 'Confirm Pick'}
      </button>
    </div>
  );
}
