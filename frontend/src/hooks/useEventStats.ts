import { useState, useEffect } from 'react';
import { useClanData } from './useClanData';

export interface EventMemberStat {
  username: string;
  rank: string;
  donatedCash: number;
  donatedCredits: number;
}

export function useEventStats() {
  const [stats, setStats] = useState<EventMemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: scraperData, loading: scraperLoading } = useClanData();

  useEffect(() => {
    async function fetchStats() {
      if (scraperLoading) return;
      setLoading(true);
      try {
        const bankRes = await fetch("https://deadbb-2d5a8-default-rtdb.firebaseio.com/clan_logs/runs.json");
        const bankData = await bankRes.json();

        const donatedCashMap: Record<string, number> = {};
        const donatedCreditsMap: Record<string, number> = {};
        const allLogs: Record<string, any> = {};

        if (bankData) {
          Object.values(bankData).forEach((run: any) => {
            if (run && run.bank) {
              Object.entries(run.bank).forEach(([k, v]: [string, any]) => {
                if (v && v.fields) {
                  allLogs[k] = v.fields;
                }
              });
            }
          });
        }

        const isDateInEventRange = (timeStr: string) => {
          if (!timeStr) return false;
          const parts = timeStr.split(' ');
          if (parts.length === 0) return false;
          const [dayStr, monthStr, yearStr] = parts[0].split('/');
          const d = parseInt(dayStr, 10);
          const m = parseInt(monthStr, 10);
          const y = parseInt(yearStr, 10);
          
          if (y === 2026 && m === 4 && d >= 9 && d <= 12) {
            return true;
          }
          return false;
        };

        Object.values(allLogs).forEach(fields => {
          if (fields.action === 'give' && fields.username && isDateInEventRange(fields.time)) {
            const curr = (fields.currency || '').toLowerCase();
            let amountStr = curr.replace(/[^0-9]/g, '');
            const amount = Number(amountStr) || 0;
            if (curr.includes('credit')) {
              donatedCreditsMap[fields.username] = (donatedCreditsMap[fields.username] || 0) + amount;
            } else {
              donatedCashMap[fields.username] = (donatedCashMap[fields.username] || 0) + amount;
            }
          }
        });

        // Map and include only those who donated something OR members just to show who didn't
        // But since it's an event ladder, let's keep all members but only showing non-zero totals
        const mergedStats: EventMemberStat[] = scraperData.map(scUser => ({
          username: scUser.username,
          rank: scUser.rank || 'Street Cleaner',
          donatedCash: donatedCashMap[scUser.username] || 0,
          donatedCredits: donatedCreditsMap[scUser.username] || 0,
        }));

        setStats(mergedStats);
      } catch (error) {
        console.error('Error fetching event stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [scraperData, scraperLoading]);

  return { stats, loading };
}
