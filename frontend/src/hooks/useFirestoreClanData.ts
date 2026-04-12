import { useState, useEffect } from 'react';

export interface FirestoreClanData {
  joinDate: Date | null;
  baseLoot: number;
  donatedCash: number;
  donatedCredits: number;
}

export function useFirestoreClanData(username: string | undefined) {
  const [data, setData] = useState<FirestoreClanData>({ joinDate: null, baseLoot: 0, donatedCash: 0, donatedCredits: 0 });
  const [loading, setLoading] = useState(true);
  const [logsData, setLogsData] = useState<any>(null);
  const [profilesData, setProfilesData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("https://deadbb-2d5a8-default-rtdb.firebaseio.com/clan_logs/runs.json").then(r => r.json()).catch(() => null),
      fetch("https://deadbb-2d5a8-default-rtdb.firebaseio.com/clan_member_profiles.json").then(r => r.json()).catch(() => null)
    ]).then(([logs, profiles]) => {
      setLogsData(logs);
      setProfilesData(profiles);
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!username || !logsData || !profilesData) {
        setData({ joinDate: null, baseLoot: 0, donatedCash: 0, donatedCredits: 0 });
        setLoading(!logsData || !profilesData);
        return;
      }

      setLoading(true);
      try {
        let decodedUsername = username;
        try {
          decodedUsername = decodeURIComponent(username);
        } catch {
          // ignore
        }
        const uLower = decodedUsername.toLowerCase().trim();
        
        let joinDate: Date | null = null;
        let baseLoot = 0;

        if (profilesData && profilesData['2166'] && profilesData['2166'].users) {
          const users = Object.values(profilesData['2166'].users) as any[];
          for (const user of users) {
             if (user.username && user.username.toLowerCase().trim() === uLower) {
                if (user.dfprofiler) {
                   baseLoot = Number(user.dfprofiler.all_time_clan_loots) || 0;
                   const rawJoinDate = user.dfprofiler.last_clan_join;
                   if (rawJoinDate) {
                       let parsedDate = new Date(rawJoinDate);
                       if (!isNaN(parsedDate.getTime())) {
                           joinDate = parsedDate;
                       }
                   }
                }
                break;
             }
          }
        }

        // Fetch bank from Realtime Database
        // Already fetched above
        
        let donatedCash = 0;
        let donatedCredits = 0;
        const allLogs: Record<string, any> = {};

        if (logsData) {
          Object.values(logsData).forEach((run: any) => {
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
          if (fields.action === 'give' && fields.username && fields.username.toLowerCase().trim() === uLower) {
            const curr = (fields.currency || '').toLowerCase();
            let amountStr = curr.replace(/[^0-9]/g, '');
            const amount = Number(amountStr) || 0;
            if (curr.includes('credit')) {
              donatedCredits += amount;
            } else {
              donatedCash += amount;
            }
          }
        });

        setData({ joinDate, baseLoot, donatedCash, donatedCredits });
      } catch (err) {
        console.error('Error fetching firestore clan data:', err);
        setData({ joinDate: null, baseLoot: 0, donatedCash: 0, donatedCredits: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [username, logsData, profilesData]);

  return { data, loading };
}
