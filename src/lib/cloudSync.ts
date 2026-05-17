import type { HunterState } from '../types';
import { supabase } from './supabase';

const TABLE = 'hunter_states';

export type CloudFetchResult =
  | { kind: 'found'; state: HunterState }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export async function fetchCloudState(userId: string): Promise<CloudFetchResult> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[cloudSync] fetch failed', error.message);
    return { kind: 'error', message: error.message };
  }
  if (!data?.state) return { kind: 'empty' };
  return { kind: 'found', state: data.state as HunterState };
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
