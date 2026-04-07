import { useState, useEffect } from 'react';

const FIREBASE_PROFILES_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com/profiles.json";

/**
 * Calculate when current "day" started (09:00 AM São Paulo time)
 */
function getDayStartSaoPaulo(): Date {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const partsObj: Record<string, string> = {};
  parts.forEach(part => {
    partsObj[part.type] = part.value;
  });

  const year = parseInt(partsObj.year, 10);
  const month = parseInt(partsObj.month, 10) - 1;
  const day = parseInt(partsObj.day, 10);
  const hour = parseInt(partsObj.hour, 10);

  const todayAt9 = new Date(year, month, day, 9, 0, 0, 0);

  if (hour < 9) {
    todayAt9.setDate(todayAt9.getDate() - 1);
  }

  return todayAt9;
}

/**
 * Calculate daily TS based on weekly TS
 */
export function calculateDailyTS(username: string, weeklyTS: number): number {
  const dayStart = getDayStartSaoPaulo();
  const dayStartTime = dayStart.getTime();
  const storageKey = `ts_snapshot_${username}_${dayStartTime}`;
  
  const previousSnapshot = localStorage.getItem(storageKey);
  
  if (previousSnapshot) {
    const previousValue = parseInt(previousSnapshot, 10);
    const dailyDifference = Math.max(0, weeklyTS - previousValue);
    return dailyDifference;
  } else {
    localStorage.setItem(storageKey, weeklyTS.toString());
    return 0;
  }
}

export interface MemberProfile {
  username: string;
  collected_at: string;
  
  // TS Records
  weekly_ts: number;
  clan_weekly_ts: number;
  exp_since_death: number;
  all_time_ts: number;
  total_exp: number;
  expected_loss_on_death: number;
  
  // TPK Records
  daily_tpk: number;
  weekly_tpk: number;
  clan_weekly_tpk: number;
  all_time_tpk: number;
  last_players_killed: string;
  last_hit_by: string;
  
  // Loot Records
  weekly_loots: number;
  all_time_loots: number;
  clan_weekly_loots: number;
  all_time_clan_loots: number;
  
  // Misc
  last_clan_join: string;
  
  // Rank
  rank: string;
  rank_score: number;
}

export function useProfilesData() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(FIREBASE_PROFILES_URL);
        const data = await res.json();
        
        if (!data) {
          setProfiles([]);
          return;
        }

        const parsedProfiles: MemberProfile[] = Object.values(data);
        setProfiles(parsedProfiles);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
    
    // Auto refresh every 5 min
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { profiles, loading };
}
