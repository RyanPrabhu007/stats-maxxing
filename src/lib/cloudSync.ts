import type { HunterState } from '../types';
import { supabase } from './supabase';

const TABLE = 'hunter_states';

export async function fetchCloudState(userId: string): Promise<HunterState | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[cloudSync] fetch failed', error.message);
    return null;
  }
  return (data?.state as HunterState | undefined) ?? null;
}

export async function upsertCloudState(
  userId: string,
  state: HunterState,
): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, state, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) {
    console.warn('[cloudSync] upsert failed', error.message);
    return false;
  }
  return true;
}
