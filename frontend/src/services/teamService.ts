/**
 * teamService.ts
 *
 * Dedicated Supabase persistence layer for the Team Members feature.
 * Connects directly to Supabase from the client.
 */

import { supabase } from '../lib/supabase';
import type { TeamMember } from '../types/TeamMember';

const TEAM_TABLE = 'team_members' as const;

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const COLORS = ['#00D4AA', '#4A9EFF', '#FFB547', '#A78BFA', '#F472B6', '#4ADE80', '#FF6B6B', '#FB923C'];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getTeam(): Promise<ServiceResult<TeamMember[]>> {
  try {
    const { data, error } = await supabase
      .from(TEAM_TABLE)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return seed data as fallback so the app doesn't break
      if (error.code === 'PGRST205') {
        console.warn('[teamService] team_members table not found in Supabase. Using fallback SEED_TEAM.');
        return { success: true, data: [] };
      }
      throw error;
    }

    const team = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name || '',
      color: row.color || getRandomColor(),
      status: row.status || 'Active'
    }));

    return { success: true, data: team };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[teamService] getTeam exception:', message);
    return { success: false, error: message };
  }
}

export async function createTeamMember(member: Partial<TeamMember>): Promise<ServiceResult> {
  try {
    const payload = {
      name: member.name,
      status: 'Active',
      color: member.color || getRandomColor()
    };

    const { error } = await supabase
      .from(TEAM_TABLE)
      .insert(payload);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[teamService] createTeamMember exception:', message);
    return { success: false, error: message };
  }
}

// ─── Realtime Subscription ──────────────────────────────────────────────────

export type TeamChangeCallback = (team: TeamMember[]) => void;

export function subscribeToTeam(callback: TeamChangeCallback): () => void {
  const channel = supabase
    .channel('realtime-team-frontend')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TEAM_TABLE,
      },
      async () => {
        const res = await getTeam();
        if (res.success && res.data) {
          callback(res.data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
