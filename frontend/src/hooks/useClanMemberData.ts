import { useState, useEffect, useCallback } from 'react';

const FIREBASE_RT_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com";
const BASE_DATE = '2026-02-23';
const REFRESH_MS = 5 * 60 * 1000;

export interface ClanMemberStats {
  username: string;
  currentAll: number;
  dailyLoot: number;
  weeklyToDate: number;
  weeklyValues: number[];
  /** { data: 'YYYY-MM-DD', valor: number }[] for chart */
  dailyHistory: { data: string; valor: number }[];
  /** { semana: string, total: number }[] for chart */
  weeklyHistory: { semana: string; total: number }[];
}

/** Fetch all scraped usernames from Realtime DB (for the selector dropdown) */
export function useScrapedUsernames() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(FIREBASE_RT_URL + '/daily.json?shallow=true');
        const dateKeys: Record<string, boolean> = await res.json();
        if (!dateKeys) { setUsernames([]); setLoading(false); return; }

        const sorted = Object.keys(dateKeys).sort();
        const latest = sorted[sorted.length - 1];

        const res2 = await fetch(FIREBASE_RT_URL + `/daily/${latest}.json`);
        const dayData = await res2.json();
        if (!dayData) { setUsernames([]); setLoading(false); return; }

        const names = Object.keys(dayData).filter(k => k !== 'hourly').sort();
        setUsernames(names);
      } catch {
        setUsernames([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { usernames, loading };
}

/** Fetch detailed clan data for a specific username from Realtime DB */
export function useClanMemberData(username: string | undefined) {
  const [stats, setStats] = useState<ClanMemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!username) { setStats(null); setLoading(false); return; }

    try {
      const res = await fetch(FIREBASE_RT_URL + '/daily.json');
      const daily = await res.json();
      if (!daily) { setStats(null); setLoading(false); return; }

      const dateKeys = Object.keys(daily).sort();
      const latest = dateKeys[dateKeys.length - 1];

      // Build history for this user
      const historyAll: Record<string, number> = {};
      const datesWithData: string[] = [];
      for (const dt of dateKeys) {
        const entry = daily[dt]?.[username];
        if (entry && typeof entry === 'object' && entry.alltimeloot !== undefined) {
          historyAll[dt] = entry.alltimeloot || 0;
          datesWithData.push(dt);
        }
      }

      // First date this specific user was seen
      const firstDate = datesWithData.length > 0 ? datesWithData[0] : null;

      // Ensure we have a latestVal reference for calculations
      const latestVal = historyAll[latest] || 0;

      // Helper to get value for a date. 
      // CRITICAL LOGIC: If date is before user joined, return their "Start Value" (firstDate's loot).
      // This ensures (End - Start) = 0 if they haven't started playing yet, or measures gain correctly from entry point.
      const getValOrClosest = (dstr: string) => {
        // 1. Future or beyond latest known? Return latest value.
        if (latest && dstr > latest) return historyAll[latest];

        // 2. Exact match?
        if (historyAll[dstr] !== undefined) return historyAll[dstr];

        // 3. Before first existence? Return FIRST VALUE.
        if (firstDate && dstr < firstDate) return historyAll[firstDate];

        // 4. In a gap? Return most recent previous.
        let closestPrev = firstDate || dstr;
        // Efficient search: datesWithData is sorted.
        for (const k of datesWithData) {
          if (k > dstr) break;
          closestPrev = k;
        }
        return historyAll[closestPrev] || 0;
      };

      // Recalculate dailyLoot (latest date - previous available date)
      let dailyLoot = 0;
      if (datesWithData.length >= 2) {
        // If we have at least 2 data points, diff the last two
        const last = datesWithData[datesWithData.length - 1];
        const prev = datesWithData[datesWithData.length - 2];
        if (last === latest) { // Ensure the last point is actually today/latest
           dailyLoot = historyAll[last] - historyAll[prev];
        }
      } else {
        // Only 1 data point (first day) -> Daily Loot is 0
        dailyLoot = 0;
      }

      // Daily History (Chart)
      const dailyHistory: { data: string; valor: number }[] = [];
      for (let i = 0; i < datesWithData.length; i++) {
        const dt = datesWithData[i];
        const val = historyAll[dt];
        
        // If it's the first data point, gain is 0 (baseline established)
        if (i === 0) {
            dailyHistory.push({ data: dt, valor: 0 });
            continue;
        }

        const prevDt = datesWithData[i - 1];
        const gain = val - historyAll[prevDt];
        dailyHistory.push({ data: dt, valor: gain });
      }

      // Weekly Calc
      function isoToDate(s: string) { return new Date(s + 'T00:00:00'); }
      function dateToIso(d: Date) { return d.toISOString().slice(0, 10); }

      const baseDateObj = isoToDate(BASE_DATE);
      const latestDateObj = isoToDate(latest);
      const daysSinceBase = Math.floor((latestDateObj.getTime() - baseDateObj.getTime()) / 86400000);
      const totalWeeks = Math.floor(daysSinceBase / 7) + 1;
      const startWeek = Math.max(0, totalWeeks - 6); // Show last 6 weeks

      const weekStarts: string[] = [];
      for (let i = startWeek; i < totalWeeks; i++) {
        weekStarts.push(dateToIso(new Date(baseDateObj.getTime() + i * 7 * 86400000)));
      }



      const weeklyValues: number[] = [];
      const weeklyHistory: { semana: string; total: number }[] = [];
      
      for (let i = 0; i < weekStarts.length; i++) {
        const ws = weekStarts[i]; // Week Start Date (Monday)
        const nextDate = new Date(isoToDate(ws).getTime() + 7 * 86400000);
        const nextIso = dateToIso(nextDate); // Next Week Start (Monday)

        const startVal = getValOrClosest(ws);
        const endVal = getValOrClosest(nextIso);

        let val = endVal - startVal;
        if (val < 0) val = 0;

        weeklyValues.push(val);
        weeklyHistory.push({ semana: `S${i + startWeek + 1}`, total: val });
      }

      // Current Week to Date
      const cwStart = weekStarts.length ? weekStarts[weekStarts.length - 1] : BASE_DATE;
      const valStartWeek = getValOrClosest(cwStart);
      const weeklyToDate = latestVal - valStartWeek;

      setStats({
        username,
        currentAll: latestVal,
        dailyLoot,
        weeklyToDate: weeklyToDate < 0 ? 0 : weeklyToDate,
        weeklyValues,
        dailyHistory,
        weeklyHistory,
      });
    } catch (err) {
      console.error('Error fetching clan member data:', err);
      setStats(null);
    }
    setLoading(false);
  }, [username]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { stats, loading };
}
