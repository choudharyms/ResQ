import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export interface RealtimeDisasterCallbacks {
  onIncidentChange?: (payload: { eventType: string; new: unknown; old: unknown }) => void;
  onAssetChange?: (payload: { eventType: string; new: unknown; old: unknown }) => void;
}

/**
 * Subscribes to Postgres change data capture (CDC) via Supabase Realtime channels.
 * Gracefully returns a no-op unsubscribe function if Supabase is not configured.
 */
export function subscribeToDisasterUpdates(callbacks: RealtimeDisasterCallbacks): () => void {
  if (!supabase) {
    // In local simulation mode or when Supabase keys are not present, return no-op cleanup
    return () => {};
  }

  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('public:resq_operations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        (payload) => {
          if (callbacks.onIncidentChange) {
            callbacks.onIncidentChange({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        (payload) => {
          if (callbacks.onAssetChange) {
            callbacks.onAssetChange({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[ResQ Realtime] Connected to live Supabase WebSocket channel');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('[ResQ Realtime] Realtime channel disconnected; operating in fallback mode');
        }
      });
  } catch (err) {
    console.warn('[ResQ Realtime] Failed to initialize WebSocket subscription:', err);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}
