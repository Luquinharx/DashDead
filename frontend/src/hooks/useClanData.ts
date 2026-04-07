import { useState, useEffect, useCallback } from 'react';

const FIREBASE_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com/profiles.json";
const REFRESH_MS = 5 * 60 * 1000;

/**
 * Calculate when current "day" started (09:00 AM São Paulo time)
 */
function getDayStartSaoPaulo(): Date {
  const now = new Date();
  
  // Format current time in São Paulo timezone
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
 * Calculate daily loot based on weekly loots
 */
function calculateDailyLoot(username: string, weeklyLoots: number): number {
  const dayStart = getDayStartSaoPaulo();
  const dayStartTime = dayStart.getTime();
  const storageKey = `loot_snapshot_${username}_${dayStartTime}`;
  
  const previousSnapshot = localStorage.getItem(storageKey);
  
  if (previousSnapshot) {
    const previousValue = parseInt(previousSnapshot, 10);
    const dailyDifference = Math.max(0, weeklyLoots - previousValue);
    return dailyDifference;
  } else {
    localStorage.setItem(storageKey, weeklyLoots.toString());
    return 0;
  }
}

export interface MemberData {
  username: string;
  currentAll: number;
  clanAllTime: number;
  dailyLoot: number;
  weeklyToDate: number;
  weeklyValues: number[];
  pct: string;
  pctNum: number;
  streak: number;
  streak_type: 'positive' | 'negative';
  isUpdated: boolean;
  isActive: boolean;
  lastCollectedAt: string;
  rank: string;
}

export function useClanData() {
  const [data, setData] = useState<MemberData[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [numWeekCols] = useState(1);
  const [weekLabels] = useState<string[]>(["Current Week"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState('');
  const [latestCollectedAt, setLatestCollectedAt] = useState('');
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(FIREBASE_URL);
      const profiles = await res.json();

      if (!profiles || profiles.error) { setData([]); setLoading(false); return; }

      const users = Object.keys(profiles);
      const out: MemberData[] = [];
      let globalCollectedAt = '';
      
      users.forEach(u => {
        const val = profiles[u];
        if (val?.collected_at && val.collected_at > globalCollectedAt) {
          globalCollectedAt = val.collected_at;
        }
        
        // Use user's personal loots, not clan loots
        const currentAll = val.all_time_loots || 0; // User's all time loots
        const clanAllTime = val.all_time_clan_loots || 0; // Clan all time loots
        const weeklyLoot = val.weekly_loots || 0; // User's weekly loots
        const dailyLoot = calculateDailyLoot(u, weeklyLoot); // Calculate daily based on 09:00 SP reset

        out.push({
          username: u,
          currentAll: currentAll,
          clanAllTime: clanAllTime,
          dailyLoot: dailyLoot, // Now calculated correctly with 09:00 reset
          weeklyToDate: weeklyLoot,
          weeklyValues: [weeklyLoot],
          pct: '0%',
          pctNum: 0,
          streak: weeklyLoot > 0 ? 1 : 0,
          streak_type: weeklyLoot > 0 ? 'positive' : 'negative',
          isUpdated: true,
          isActive: true,
          lastCollectedAt: val.collected_at || '',
          rank: val.rank || 'Street Cleaner'
        });
      });

      setData(out);
      setLatestCollectedAt(globalCollectedAt);
      setLatestDate(new Date().toISOString().slice(0, 10));
      
      setUpdatedCount(users.length);
      setTotalCount(users.length);
      setDates([new Date().toISOString().slice(0, 10)]);

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, dates, numWeekCols, weekLabels, loading, error, latestDate, latestCollectedAt, updatedCount, totalCount };
}
