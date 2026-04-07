const fs = require('fs');
let file = 'c:/Users/Lucas/Desktop/dash/DashDead-main/frontend/src/hooks/useClanData.ts';
let code = fs.readFileSync(file, 'utf8');

const anchor1 = '      if (!profiles || profiles.error) { setData([]); setLoading(false); return; }\n';
const injection1 = \
      let dailyBaseline: Record<string, any> = {};
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const parts = formatter.formatToParts(now);
        const p: Record<string, string> = {};
        parts.forEach(({ type, value }) => { p[type] = value; });
        
        const spYear = parseInt(p.year);
        const spMonth = parseInt(p.month);
        const spDay = parseInt(p.day);
        const spHour = parseInt(p.hour);
        const daysToSub = spHour < 9 ? 2 : 1;
        
        const targetDate = new Date(Date.UTC(spYear, spMonth - 1, spDay));
        targetDate.setUTCDate(targetDate.getUTCDate() - daysToSub);
        const prevDayStr = targetDate.toISOString().slice(0, 10);
        
        const dailyRes = await fetch(\\\https://deadbb-2d5a8-default-rtdb.firebaseio.com/daily/\\\.json\\\);
        if (dailyRes.ok) {
            dailyBaseline = await dailyRes.json() || {};
        }
      } catch (e) {
          console.error("Failed to fetch daily baseline frontend", e);
      }
\;

code = code.replace(anchor1, anchor1 + injection1);

const anchorLinesArray = code.split('\n');
const matchIdx = anchorLinesArray.findIndex(l => l.includes('dailyLoot = val.daily_loot_calc'));
if (matchIdx !== -1) {
    anchorLinesArray[matchIdx] = \        let dailyLoot = val.daily_loot_calc || 0;
        if (dailyLoot === 0 && dailyBaseline[u] && dailyBaseline[u].alltimeloot) {
            const baselineLoot = dailyBaseline[u].alltimeloot;
            if (currentAll > baselineLoot) {
                dailyLoot = currentAll - baselineLoot;
            }
        }\;
    code = anchorLinesArray.join('\n');
}

fs.writeFileSync(file, code, 'utf8');
