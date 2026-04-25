// Host-side banter moderation drawer.
// Mirrors the HostModerationQueue open/close toggle pattern.
// Shows the BanterChannel with isHost=true so the host can approve/reject banter.

import { useState } from 'react';
import { BanterChannel } from '../../room/components/BanterChannel';
import { usePendingSocialeBanter } from '../../sociale/hooks';
import type { Sociale } from '../../../domain/types/sociale.types';

interface HostBanterDrawerProps {
  sociale: Sociale | null | undefined;
}

export function HostBanterDrawer({ sociale }: HostBanterDrawerProps) {
  const [open, setOpen] = useState(false);

  const { data: pendingBanter = [] } = usePendingSocialeBanter(sociale?.id);

  if (!sociale) return null;

  return (
    <div className="fixed bottom-16 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-h-[480px] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Banter Moderation</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors text-lg leading-none"
              aria-label="Close banter drawer"
            >
              ×
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <BanterChannel sociale={sociale} isHost={true} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/20 rounded-full text-white text-sm font-medium shadow-lg transition-colors"
        aria-label="Toggle banter moderation"
      >
        💬 Banter
        {pendingBanter.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full text-xs font-bold text-black flex items-center justify-center">
            {pendingBanter.length > 9 ? '9+' : pendingBanter.length}
          </span>
        )}
      </button>
    </div>
  );
}
