// =============================================================================
// UNIFIED SOCIALE REALTIME CHANNEL
// =============================================================================
// Consolidates multiple per-socialeId channels (rounds, responses, votes,
// socialites) into a SINGLE channel with multiple postgres_changes listeners.
//
// BEFORE: 3-5 channels per socialeId (rounds, responses, votes, socialites, etc.)
// AFTER:  1 channel per socialeId
//
// Each hook that needs realtime invalidation calls useSocialeChannel() which
// ref-counts the underlying Supabase channel via the SubscriptionPool.

import { useEffect, useRef } from 'react';
import { subscriptionPool } from '../../../shared/services/SubscriptionPool';
import type { PgChangesFilter } from '../../../shared/services/SubscriptionPool';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Subscribe to the unified sociale channel for a given socialeId.
 * The channel listens to changes on: sociale_rounds, sociale_responses,
 * sociale_votes, and socialites — all filtered by sociale_id.
 *
 * @param socialeId - The sociale ID to subscribe to
 * @param onPayload - Callback invoked on every postgres_changes event.
 *   The payload includes `table` info so consumers can filter.
 */
export function useSocialeChannel(
  socialeId: string | undefined,
  onPayload: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
) {
  // Keep a ref to the latest onPayload so the subscription is never torn down
  // just because the callback reference changed (e.g. due to parent re-renders).
  // The channel is only recreated when socialeId itself changes.
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    if (!socialeId) return;

    const channelName = `sociale-unified:${socialeId}`;

    const filters: PgChangesFilter[] = [
      { event: '*', schema: 'public', table: 'sociale_rounds', filter: `sociale_id=eq.${socialeId}` },
      { event: '*', schema: 'public', table: 'sociale_responses', filter: `sociale_id=eq.${socialeId}` },
      { event: '*', schema: 'public', table: 'sociale_votes', filter: `sociale_id=eq.${socialeId}` },
      { event: '*', schema: 'public', table: 'socialites', filter: `sociale_id=eq.${socialeId}` },
    ];

    const stableCallback = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
      onPayloadRef.current(payload);

    const unsub = subscriptionPool.subscribe(channelName, filters, stableCallback);

    return unsub;
  }, [socialeId]); // onPayload intentionally excluded — the ref keeps it current
}
