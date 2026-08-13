import { create } from 'zustand';
import { apiGet, apiSend } from '../lib/apiClient';

export interface Match {
  id: number;
  title: string;
  sport: string;
  venue: string;
  date: string;
  time: string;
  players: number;
  maxPlayers: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Open';
}

export interface CreateMatchPayload {
  title: string;
  sport: string;
  venue: string;
  date: string;
  time: string;
  maxPlayers: number;
  level: Match['level'];
}

interface MatchState {
  matches: Match[];
  loading: boolean;
  error: string | null;
  fetchMatches: () => Promise<void>;
  createMatch: (payload: CreateMatchPayload) => Promise<void>;
  joinMatch: (id: number) => Promise<void>;
}

const fallbackMatches: Match[] = [
  {
    id: 1,
    title: 'Futsal Friendly 5v5',
    sport: 'Futsal',
    venue: 'GOAL Arena Kemang',
    date: 'Hari ini',
    time: '19:00',
    players: 7,
    maxPlayers: 10,
    level: 'Intermediate',
  },
  {
    id: 2,
    title: 'Basket Half Court',
    sport: 'Basketball',
    venue: 'South Court',
    date: 'Besok',
    time: '16:30',
    players: 5,
    maxPlayers: 8,
    level: 'Open',
  },
];

function normalizeMatch(input: Record<string, unknown>): Match {
  return {
    id: Number(input.id),
    title: String(input.title ?? 'Match'),
    sport: String(input.sport ?? input.sport_type ?? 'Futsal'),
    venue: String(input.venue ?? input.field_name ?? 'Venue'),
    date: String(input.date ?? input.match_date ?? ''),
    time: String(input.time ?? input.start_time ?? ''),
    players: Number(input.players ?? input.current_players ?? 0),
    maxPlayers: Number(input.maxPlayers ?? input.max_players ?? 0),
    level: (input.level as Match['level']) ?? 'Open',
  };
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: fallbackMatches,
  loading: false,
  error: null,

  fetchMatches: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiGet<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>('/matches');
      const raw = Array.isArray(res) ? res : res.data;
      set({
        matches: Array.isArray(raw) ? raw.map(normalizeMatch) : fallbackMatches,
        loading: false,
      });
    } catch {
      set({ matches: get().matches.length ? get().matches : fallbackMatches, loading: false });
    }
  },

  createMatch: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await apiSend<{ data?: Record<string, unknown> }>('POST', '/matches', { body: payload });
      if (res.data) {
        set((state) => ({ matches: [normalizeMatch(res.data as Record<string, unknown>), ...state.matches], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      const optimistic: Match = {
        id: Date.now(),
        title: payload.title,
        sport: payload.sport,
        venue: payload.venue,
        date: payload.date,
        time: payload.time,
        players: 1,
        maxPlayers: payload.maxPlayers,
        level: payload.level,
      };
      set((state) => ({ matches: [optimistic, ...state.matches], loading: false }));
    }
  },

  joinMatch: async (id) => {
    try {
      await apiSend('POST', `/matches/${id}/join`, {});
    } catch {}
    set((state) => ({
      matches: state.matches.map((match) => (
        match.id === id
          ? { ...match, players: Math.min(match.maxPlayers, match.players + 1) }
          : match
      )),
    }));
  },
}));
