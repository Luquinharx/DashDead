import { useState, useEffect, useCallback } from 'react';

const FIREBASE_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com/profiles.json";
const REFRESH_MS = 5 * 60 * 1000;

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
        const weeklyLoot = (val.weekly_personal_loot_calc ?? val.weekly_loots) || 0; // Reset semanal às 09:00 SP
        const dailyLoot = val.daily_loot_calc || 0; // Reset diário às 09:00 SP

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
