import { useState, useEffect } from 'react';

const FIREBASE_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com/daily.json";
const BASE_DATE = '2026-02-23';

export interface MemberData {
  username: string;
  currentAll: number;
  dailyLoot: number;
  weeklyToDate: number;
  weeklyValues: number[];
  pct: string;
  pctNum: number;
  streak: number;
  streak_type: 'positive' | 'negative';
}

export function useClanData() {
  const [data, setData] = useState<MemberData[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [numWeekCols, setNumWeekCols] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(FIREBASE_URL);
        const daily = await res.json();

        if (!daily) {
          setData([]);
          setLoading(false);
          return;
        }

        const dateKeys = Object.keys(daily).sort();
        const latest = dateKeys[dateKeys.length - 1];
        setLatestDate(latest);
        setDates(dateKeys);

        const users = new Set<string>();
        Object.values(daily).forEach((dmap: any) => Object.keys(dmap).forEach(u => users.add(u)));

        function isoToDate(s: string) { return new Date(s + 'T00:00:00'); }
        function dateToIso(d: Date) { return d.toISOString().slice(0,10); }
        
        const baseDateObj = isoToDate(BASE_DATE);
        const latestDateObj = isoToDate(latest);
        const daysSinceBaseGlobal = Math.floor((latestDateObj.getTime() - baseDateObj.getTime())/(24*60*60*1000));
        const totalWeeksGlobal = Math.max(0, Math.floor(daysSinceBaseGlobal/7) + 1);
        const maxColumns = 4;
        setNumWeekCols(Math.min(maxColumns, totalWeeksGlobal));

        const out: MemberData[] = [];
        users.forEach(u => {
          const historyAll: Record<string, number> = {};
          dateKeys.forEach(dt => {
            historyAll[dt] = daily[dt]?.[u]?.alltimeloot || 0;
          });

          const baseVal = historyAll[BASE_DATE] || 0;
          const latestVal = historyAll[latest] || 0;

          let dailyLoot = 0;
          const latestIndex = dateKeys.indexOf(latest);
          if (latestIndex > 0) {
            const prevDateKey = dateKeys[latestIndex-1];
            const prevVal = historyAll[prevDateKey] || baseVal;
            dailyLoot = latestVal - prevVal;
          } else {
            dailyLoot = latestVal - baseVal;
          }

          function getValOrPrev(dstr: string) {
            if (historyAll[dstr] !== undefined) return historyAll[dstr];
            for (let b=0;b<30;b++){
              const d = new Date(dstr + 'T00:00:00');
              d.setDate(d.getDate()-b);
              const s = d.toISOString().slice(0,10);
              if (historyAll[s] !== undefined) return historyAll[s];
            }
            return baseVal;
          }

          const daysSinceBase = Math.floor((latestDateObj.getTime() - baseDateObj.getTime())/(24*60*60*1000));
          const totalWeeks = Math.floor(daysSinceBase/7) + 1;
          const maxWeeks = 6;
          const startWeek = Math.max(0, totalWeeks - maxWeeks);

          const weekStarts: string[] = [];
          for (let i = startWeek; i < totalWeeks; i++){
            const d = new Date(baseDateObj.getTime() + i*7*24*60*60*1000);
            weekStarts.push(dateToIso(d));
          }

          const weeklyValues: number[] = [];
          for (let i=0;i<weekStarts.length;i++){
            const ws = weekStarts[i];
            const wsDate = isoToDate(ws);
            const nextDate = new Date(wsDate.getTime() + 7*24*60*60*1000);
            const nextIso = dateToIso(nextDate);
            const startVal = getValOrPrev(ws);
            let endVal;
            if (nextDate <= latestDateObj) endVal = getValOrPrev(nextIso);
            else endVal = latestVal;
            weeklyValues.push(endVal - startVal);
          }

          const currentWeekStart = weekStarts.length ? weekStarts[weekStarts.length-1] : BASE_DATE;
          const startOfCurrent = getValOrPrev(currentWeekStart);
          const weeklyToDate = latestVal - startOfCurrent;

          const lastWeek = weeklyValues.length ? weeklyValues[weeklyValues.length-1] : 0;
          const prevWeek = weeklyValues.length>1 ? weeklyValues[weeklyValues.length-2] : 0;
          let pct = '0%';
          let pctNum = 0;
          if (prevWeek !== 0) {
            pctNum = ((lastWeek - prevWeek) / Math.abs(prevWeek) )*100;
            pct = pctNum.toFixed(1) + '%';
          } else {
            pct = lastWeek>0 ? '∞%' : '0%';
            pctNum = lastWeek>0 ? Infinity : 0;
          }

          let streak=0; let streak_type: 'positive' | 'negative' = 'negative';
          for (let i = weeklyValues.length-1; i>=0; i--){
            const v = weeklyValues[i];
            if (i===weeklyValues.length-1){
              streak_type = v>0 ? 'positive' : 'negative';
              streak = 1;
            } else {
              if ((v>0 && streak_type==='positive') || (v===0 && streak_type==='negative')) streak++;
              else break;
            }
          }

          const signedStreak = streak_type==='positive' ? streak : -streak;

          out.push({
            username: u, 
            currentAll: latestVal, 
            dailyLoot, 
            weeklyToDate, 
            weeklyValues, 
            pct, 
            pctNum, 
            streak: signedStreak, 
            streak_type
          });
        });

        setData(out);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, dates, numWeekCols, loading, error, latestDate };
}
