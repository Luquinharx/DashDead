import { useState, useEffect } from 'react';
import { useClanData } from './useClanData';

export interface ClanMemberStat {
  username: string;
  rank: string;
  donatedCash: number;
  donatedCredits: number;
  baseLoot: number;
  scraperLoot: number;
  totalLoot: number;
  dailyLoot: number;
  weeklyLoot: number;
  clanWeeklyLoot: number;
}

export function useAllClanStats() {
  const [stats, setStats] = useState<ClanMemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: scraperData, loading: scraperLoading } = useClanData();

  useEffect(() => {
    async function fetchStats() {
      if (scraperLoading) return;
      setLoading(true);
      try {
        // Fetch donations from Realtime Database (clan_logs/runs)
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

        Object.values(allLogs).forEach(fields => {
          if (fields.action === 'give' && fields.username) {
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

        // Use scraper data directly (all_time_clan_loots is always updated)
        const mergedStats: ClanMemberStat[] = scraperData.map(scUser => ({
          username: scUser.username,
          rank: scUser.rank || 'Street Cleaner',
          donatedCash: donatedCashMap[scUser.username] || 0,
          donatedCredits: donatedCreditsMap[scUser.username] || 0,
          baseLoot: 0,
          scraperLoot: scUser.clanAllTime,
          totalLoot: scUser.clanAllTime,
          dailyLoot: scUser.dailyLoot,
          weeklyLoot: scUser.weeklyToDate,
          clanWeeklyLoot: scUser.clanWeeklyLoot
        }));

        // Sort by totalLoot descending
        mergedStats.sort((a, b) => b.totalLoot - a.totalLoot);

        setStats(mergedStats);
      } catch (error) {
        console.error('Error fetching all clan stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [scraperData, scraperLoading]);

  return { stats, loading };
}
