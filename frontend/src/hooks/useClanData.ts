import { useState, useEffect, useCallback } from 'react';

const FIREBASE_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com/daily.json";
const BASE_DATE = '2026-02-23';
const REFRESH_MS = 5 * 60 * 1000; // auto-refresh a cada 5 min

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
  isUpdated: boolean;
  lastCollectedAt: string;
}

export function useClanData() {
  const [data, setData] = useState<MemberData[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [numWeekCols, setNumWeekCols] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState('');
  const [latestCollectedAt, setLatestCollectedAt] = useState('');
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(FIREBASE_URL);
      const daily = await res.json();

      if (!daily) { setData([]); setLoading(false); return; }

      const RESERVED = new Set(['hourly']);
      const dateKeys = Object.keys(daily).sort();
      const latest = dateKeys[dateKeys.length - 1];
      setLatestDate(latest);
      setDates(dateKeys);

      // coletar usernames reais APENAS do snapshot mais recente
      // Se não estiver no último dia, não faz parte do clã atual (ou saiu/foi removido)
      const users = new Set<string>();
      const latestData = daily[latest] || {};
      for (const key of Object.keys(latestData)) {
          if (!RESERVED.has(key)) users.add(key);
      }

      // determinar último horário e collected_at da coleta mais recente
      let globalCollectedAt = '';
      let latestHour = '';
      const todayData = daily[latest] || {};
      for (const [key, val] of Object.entries(todayData) as [string, any][]) {
        if (RESERVED.has(key)) continue;
        if (val?.collected_at && val.collected_at > globalCollectedAt) globalCollectedAt = val.collected_at;
        if (val?.hour && val.hour > latestHour) latestHour = val.hour;
      }
      setLatestCollectedAt(globalCollectedAt);

      function isoToDate(s: string) { return new Date(s + 'T00:00:00'); }
      function dateToIso(d: Date) { return d.toISOString().slice(0, 10); }
      const baseDateObj = isoToDate(BASE_DATE);
      const latestDateObj = isoToDate(latest);
      const daysSinceBase = Math.floor((latestDateObj.getTime() - baseDateObj.getTime()) / 86400000);
      const totalWeeksGlobal = Math.max(0, Math.floor(daysSinceBase / 7) + 1);
      setNumWeekCols(Math.min(4, totalWeeksGlobal));

      let updCnt = 0;
      const out: MemberData[] = [];

      users.forEach(u => {
        // montar histórico (só datas onde o user tem dados reais)
        const historyAll: Record<string, number> = {};
        const datesWithData: string[] = [];
        for (const dt of dateKeys) {
          const entry = daily[dt]?.[u];
          if (entry && typeof entry === 'object' && entry.alltimeloot !== undefined) {
            historyAll[dt] = entry.alltimeloot || 0;
            datesWithData.push(dt);
          }
        }

        const latestVal = historyAll[latest] ?? 0;


        // status de atualização por membro
        const memberEntry = daily[latest]?.[u];
        const memberHour = memberEntry?.hour || '';
        const memberCollectedAt = memberEntry?.collected_at || '';
        const isUpdated = memberHour === latestHour && latestHour !== '';
        if (isUpdated) updCnt++;

        // Helper: Data inicial
        const firstDate = datesWithData.length > 0 ? datesWithData[0] : null;

        // --- daily loot ---
        let dailyLoot = 0;
        // Se temos pelo menos 2 dias de dados
        if (datesWithData.length >= 2) {
          const lastDt = datesWithData[datesWithData.length - 1];
          const prevDt = datesWithData[datesWithData.length - 2];
          if (lastDt === latest) {
             dailyLoot = (historyAll[lastDt] || 0) - (historyAll[prevDt] || 0);
          }
        }
        
        // Se usuário acabou de entrar (1 único dia de dados), dailyLoot = 0
        // (Já é 0 por inicialização)

        // --- weekly ---
        function getValOrPrev(dstr: string) {
          // 1. Data exata existe?
          if (historyAll[dstr] !== undefined) return historyAll[dstr];

          // 2. Data pedida é ANTES de o usuário existir? Retorna valor inicial.
          // Isso garante ganho = 0 para períodos onde ele não estava no clã
          if (firstDate && dstr < firstDate) return historyAll[firstDate];

          // 3. Data futura/além do latest? Retorna latest
          if (dstr > latest) return historyAll[latest] || 0;

          // 4. Buscar anterior mais próximo
          // Otimizado: datesWithData está ordenado
          let closest = firstDate || dstr; 
          for (const k of datesWithData) {
            if (k > dstr) break;
            closest = k;
          }
          return historyAll[closest] || 0;
        }

        const totalWeeks = Math.floor(daysSinceBase / 7) + 1;
        const startWeek = Math.max(0, totalWeeks - 6);
        const weekStarts: string[] = [];
        for (let i = startWeek; i < totalWeeks; i++) {
          weekStarts.push(dateToIso(new Date(baseDateObj.getTime() + i * 7 * 86400000)));
        }

        const weeklyValues: number[] = [];
        let weeklyToDate = 0;
        
        // Calcular gain semanal SEMPRE (se tiver dados), usando a lógica de baseline
        if (datesWithData.length > 0) {
          for (let i = 0; i < weekStarts.length; i++) {
            const ws = weekStarts[i];
            const wsDate = isoToDate(ws);
            const nextDate = new Date(wsDate.getTime() + 7 * 86400000);
            const nextIso = dateToIso(nextDate);
            
            const startVal = getValOrPrev(ws);
            const endVal = nextDate <= latestDateObj ? getValOrPrev(nextIso) : latestVal;
            
            let val = endVal - startVal;
            if (val < 0) val = 0;
            weeklyValues.push(val);
          }
          const cwStart = weekStarts.length ? weekStarts[weekStarts.length - 1] : BASE_DATE;
          const startValWeek = getValOrPrev(cwStart);
          weeklyToDate = latestVal - startValWeek;
          if (weeklyToDate < 0) weeklyToDate = 0;
        }

        // variação %
        const lastW = weeklyValues.length ? weeklyValues[weeklyValues.length - 1] : 0;
        const prevW = weeklyValues.length > 1 ? weeklyValues[weeklyValues.length - 2] : 0;
        let pct = '0%', pctNum = 0;
        if (prevW !== 0) { pctNum = ((lastW - prevW) / Math.abs(prevW)) * 100; pct = pctNum.toFixed(1) + '%'; }
        else { pct = lastW > 0 ? '∞%' : '0%'; pctNum = lastW > 0 ? Infinity : 0; }

        // streak
        let streak = 0, streak_type: 'positive' | 'negative' = 'negative';
        for (let i = weeklyValues.length - 1; i >= 0; i--) {
          const v = weeklyValues[i];
          if (i === weeklyValues.length - 1) { streak_type = v > 0 ? 'positive' : 'negative'; streak = 1; }
          else { if ((v > 0 && streak_type === 'positive') || (v === 0 && streak_type === 'negative')) streak++; else break; }
        }
        const signedStreak = streak_type === 'positive' ? streak : -streak;

        out.push({
          username: u, currentAll: latestVal, dailyLoot, weeklyToDate, weeklyValues,
          pct, pctNum, streak: signedStreak, streak_type,
          isUpdated, lastCollectedAt: memberCollectedAt,
        });
      });

      setData(out);
      setUpdatedCount(updCnt);
      setTotalCount(users.size);
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

  return { data, dates, numWeekCols, loading, error, latestDate, latestCollectedAt, updatedCount, totalCount };
}
