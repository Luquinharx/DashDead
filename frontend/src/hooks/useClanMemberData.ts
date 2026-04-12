import { useState, useEffect, useCallback } from "react";

const FIREBASE_RT_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com";
const REFRESH_MS = 5 * 60 * 1000;

export interface ClanMemberStats {
  username?: string;
  collected_at?: string;
  weekly_ts?: number;
  clan_weekly_ts?: number;
  exp_since_death?: number;
  all_time_ts?: number;
  total_exp?: number;
  expected_loss_on_death?: number;
  daily_tpk?: number;
  weekly_tpk?: number;
  clan_weekly_tpk?: number;
  all_time_tpk?: number;
  last_players_killed?: string;
  last_hit_by?: string;
  weekly_loots?: number;
  all_time_loots?: number;
  clan_weekly_loots?: number;
  all_time_clan_loots?: number;
  last_clan_join?: string;
  rank?: string;
  rank_score?: number;
  daily_ts_calc?: number;
  
  // Compatibility fields for the frontend
  currentAll: number; // all_time_loots (user's total)
  dailyLoot: number; // Calculated from snapshots
  weeklyToDate: number; // weekly_loots (user's weekly)
  clanAllTime: number; // all_time_clan_loots (user in clan)
  dailyHistory: { data: string; valor: number }[];
  dailyTSHistory: { data: string; valor: number }[];
  weeklyValues: number[];
  weeklyHistory: { semana: string; total: number }[];
}

export function useScrapedUsernames() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(FIREBASE_RT_URL + "/profiles.json?shallow=true");
        const profiles = await res.json();
        if (!profiles) { setUsernames([]); setLoading(false); return; }

        setUsernames(Object.keys(profiles).sort((a, b) => {
           let da = a, db = b;
           try { da = decodeURIComponent(a); } catch(e){}
           try { db = decodeURIComponent(b); } catch(e){}
           return da.localeCompare(db, undefined, {sensitivity: 'base'});
        }));
      } catch {
        setUsernames([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { usernames, loading };
}

export function useClanMemberData(username: string | undefined) {
  const [stats, setStats] = useState<ClanMemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!username) { setStats(null); setLoading(false); return; }

    try {
      // O dropdown agora passa a chave real do Firebase (ex: "SAO%20Asuna", "killer%20instint%2023").
      // Repassamos direto pra URL sÃ³ fazendo encodeURIComponent nela pra lidar com barras e etc (e transformando em %2520, que o Firebase decoda pra %20 ao buscar no json)
      const dbUser = encodeURIComponent(username).replace(/\./g, '%2E');

      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const parts = formatter.formatToParts(now);
      const p: Record<string, string> = {};
      parts.forEach(({ type, value }) => { p[type] = value; });
      const spDate = new Date(parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day), parseInt(p.hour), parseInt(p.minute), parseInt(p.second));
      const adjustedDate = new Date(spDate.getTime() - 8 * 60 * 60 * 1000);

      const dailyDates: string[] = [];
      const shortDates: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(adjustedDate.getTime() - i * 24 * 60 * 60 * 1000);
        const yY = d.getFullYear();
        const yM = String(d.getMonth() + 1).padStart(2, '0');
        const yD = String(d.getDate()).padStart(2, '0');
        dailyDates.push(`${yY}-${yM}-${yD}`);
        shortDates.push(`${yD}/${yM}`);
      }

      const yesterday = new Date(adjustedDate.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const requests = [
        fetch(`${FIREBASE_RT_URL}/profiles/${dbUser}.json`).then(r => r.json()),
        fetch(`${FIREBASE_RT_URL}/daily.json?orderBy="$key"&endAt="${encodeURIComponent('"' + yesterdayStr + '"')}"&limitToLast=7`).then(r => r.json()).catch(() => null),
        ...dailyDates.map(dateStr => fetch(`${FIREBASE_RT_URL}/daily/${dateStr}/${dbUser}.json`).then(r => r.json()).catch(() => null))
      ];

      const responses = await Promise.all(requests);
      const data = responses[0];
      const allDailyData = responses[1];

      if (!data || data.error) { setStats(null); setLoading(false); return; }

      const snaps = responses.slice(2);
      snaps.push(data); // Add current live data at the end (index 8)

      const dailyHistory: { data: string; valor: number }[] = [];
      const dailyTSHistory: { data: string; valor: number }[] = [];

      for (let i = 0; i < 8; i++) {
        const oldSnap = snaps[i];
        const newSnap = snaps[i + 1];
        
        // Date label for the difference (if index is 7, it's today)
        const dateLabel = i === 7 ? "Hoje" : shortDates[i + 1];

        if (oldSnap && newSnap) {
          const oldLoot = Number(oldSnap.all_time_loots) || Number(oldSnap.alltimeloot) || 0;
          const newLoot = Number(newSnap.all_time_loots) || Number(newSnap.alltimeloot) || 0;
          const lootDiff = newLoot - oldLoot;
          dailyHistory.push({ data: dateLabel, valor: Math.max(0, lootDiff) }); 

          const oldTS = Number(oldSnap.total_exp) || Number(oldSnap.alltimets) || Number(oldSnap.all_time_ts) || 0;
          const newTS = Number(newSnap.total_exp) || Number(newSnap.alltimets) || Number(newSnap.all_time_ts) || 0;
          const tsDiff = newTS - oldTS;
          dailyTSHistory.push({ data: dateLabel, valor: Math.max(0, tsDiff) });
        } else {
          dailyHistory.push({ data: dateLabel, valor: 0 });
          dailyTSHistory.push({ data: dateLabel, valor: 0 });
        }
      }

        // Optional: calculate local differences for graphs if needed.
      const currentAll = data.all_time_loots || 0;
      const currentTotalExp = Number(data.total_exp) || 0;
      const weeklyLootsUser = data.weekly_loots || 0;
      const allTimeClanLoots = data.all_time_clan_loots || 0;

      // Extract accurate 8AM baselines for the daily cards, using retroactive baseline
      let baselineLoot: number | null = null;
      let baselineExp: number | null = null;
      let cardDailyLoot = 0;
      let cardDailyTS = 0;

      if (allDailyData) {
        const allDailyDates = Object.keys(allDailyData).sort().filter(d => d <= yesterdayStr);
        for (let i = allDailyDates.length - 1; i >= 0; i--) {
            const snap = allDailyData[allDailyDates[i]]?.[dbUser] || allDailyData[allDailyDates[i]]?.[username];
            if (snap) {
                if (baselineLoot === null) {
                    baselineLoot = snap.alltimeloot !== undefined ? Number(snap.alltimeloot) : (snap.all_time_loots !== undefined ? Number(snap.all_time_loots) : null);
                }
                if (baselineExp === null) {
                    const snapExp = snap.total_exp !== undefined ? Number(snap.total_exp) : (snap.alltimets !== undefined ? Number(snap.alltimets) : (snap.all_time_ts !== undefined ? Number(snap.all_time_ts) : null));
                    if (snapExp !== null) {
                        baselineExp = snapExp;
                    }
                }
                if (baselineLoot !== null && baselineExp !== null) {
                    break;
                }
            }
        }
      } else {
        // Fallback se nÃ£o conseguiu baixar daily.json completo
        const todaySnap = snaps[7];
        baselineLoot = todaySnap ? (Number(todaySnap.alltimeloot) || Number(todaySnap.all_time_loots) || 0) : currentAll;
        baselineExp = todaySnap ? (Number(todaySnap.total_exp) || Number(todaySnap.all_time_ts) || currentTotalExp) : currentTotalExp;
      }

      if (baselineLoot !== null) cardDailyLoot = Math.max(0, currentAll - baselineLoot);
      if (baselineExp !== null) cardDailyTS = Math.max(0, currentTotalExp - baselineExp);

      setStats({
        ...data,
        currentAll: currentAll,
        dailyLoot: cardDailyLoot,
        daily_ts_calc: cardDailyTS,
        weeklyToDate: weeklyLootsUser,
        clanAllTime: allTimeClanLoots,
        dailyHistory,
        dailyTSHistory,
        weeklyValues: [weeklyLootsUser],
        weeklyHistory: [{ semana: "Current", total: weeklyLootsUser }]
      });
    } catch (err) {
      console.error("Error fetching clan member data:", err);
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
