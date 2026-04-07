
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useClanMemberData } from '../../hooks/useClanMemberData';
import { usePowerRouletteConfig } from '../../hooks/usePowerRouletteConfig';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { Gift } from 'lucide-react';
import { Wheel } from 'react-custom-roulette';
import { cn } from '../../lib/utils';

export default function PowerRoleta() {
  const { profile, refreshProfile } = useAuth();
  const { stats } = useClanMemberData(profile?.nickJogo || undefined);
  const { config } = usePowerRouletteConfig();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof config.prizes[0] | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  
  const [girosUsados, setGirosUsados] = useState(0);
  const [historico, setHistorico] = useState<{ premio: string; data: string; entregue: boolean }[]>([]);

  const getPreviousWeekRange = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDay(); 
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let daysToSubtract = (currentDay + 6) % 7; 
    if (currentDay === 1 && (currentHour < 9 || (currentHour === 9 && currentMin < 2))) {
      daysToSubtract = 7;
    }

    const startOfPrizeWeek = new Date(now);
    startOfPrizeWeek.setDate(now.getDate() - daysToSubtract);
    startOfPrizeWeek.setHours(9, 2, 0, 0);
    
    return {
       startOfPrizeWeek, 
       lootWeekLabel: `Week of ${startOfPrizeWeek.getDate()}/${startOfPrizeWeek.getMonth()+1}`
    };
  }, []);

  const { startOfPrizeWeek } = getPreviousWeekRange();

  // Loot Reference
  

  // Rule: Score at least 5k loots to qualify. Max 1 spin per week.
  
  const rawWeeklyLoot = Number(stats?.weekly_loots || 0);
  const rawClanWeeklyLoot = Number(stats?.clan_weekly_loots || 0);
  const weeklyLoot = Math.max(rawWeeklyLoot, rawClanWeeklyLoot);

  const rawWeeklyTs = Number(stats?.weekly_ts || 0);
  const rawClanWeeklyTs = Number(stats?.clan_weekly_ts || 0);
  const weeklyTs = Math.max(rawWeeklyTs, rawClanWeeklyTs);

  const clanWeeklyLoot = Math.max(rawClanWeeklyLoot, rawWeeklyLoot);
  const clanWeeklyTs = Math.max(rawClanWeeklyTs, rawWeeklyTs);
  const isClanEventHighlight = clanWeeklyLoot >= 5000 || clanWeeklyTs >= 3_000_000_000;
  const isPowerRaw = weeklyLoot >= 800 || weeklyTs >= 350_000_000;
  const isQualified = isPowerRaw && !isClanEventHighlight;

  const weeklyTotal = isQualified ? 1 : 0; // Quantos giros semanais (grátis) são possíveis
  const extraSpins = profile?.extraSpins || 0; // Giros manuais extras

  // carregar giros já usados NESTA semana de premiação
  useEffect(() => {
    if (!profile?.userId) return;
    async function load() {
      try {
        const q = query(
            collection(db, 'power_roletas'), 
            where('userId', '==', profile!.userId)
        );
        const snap = await getDocs(q);
        
        let count = 0;
        const list: { premio: string; data: string; entregue: boolean }[] = [];
        const startTs = startOfPrizeWeek.getTime();

        snap.forEach(d => {
          const data = d.data();
          const dataDate = data.data?.toDate?.();
          
          if (dataDate && dataDate.getTime() >= startTs) {
             count++;
          }

          list.push({
            premio: data.premio,
            data: dataDate ? dataDate.toLocaleDateString('pt-BR') : String(data.data),
            entregue: !!data.entregue,
          });
        });

        list.reverse(); 

        setGirosUsados(count);
        setHistorico(list);
      } catch (err) {
        console.error("Error loading spins:", err);
      }
    }
    load();
  }, [profile, spinning, startOfPrizeWeek]);

  const girosRestantesSemanais = Math.max(0, weeklyTotal - girosUsados);
  const girosDisponiveis = Math.min(3, girosRestantesSemanais + extraSpins);

  const girar = useCallback(async () => {
    if (spinning || girosDisponiveis <= 0 || !profile?.userId) return;
    setSpinning(true);
    setResult(null);

    // Weighted Random Selection
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selected = config.prizes[0];
    
    for (const p of config.prizes) {
        accumulated += p.chance;
        if (rand <= accumulated) {
            selected = p;
            break;
        }
    }

    const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    setPrizeNumber(prizeIndex);
    setMustSpin(true);

  }, [spinning, girosDisponiveis, profile, config.prizes]);

  return (
    <div className="w-full text-stone-200 font-serif selection:bg-red-900/30">
      <div className="w-full mx-auto space-y-8 animate-in fade-in duration-500">

        <header className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-900/20 rounded-lg text-purple-500 border border-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-widest uppercase">
                <span className="text-purple-600">Power</span> Roleta
              </h1>
              <p className="text-stone-500 text-sm font-serif tracking-wide uppercase mt-1">
                One spin per week • Qualification: 5k+ Loot
              </p>
            </div>
          </div>
        </header>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black border border-white/10 rounded-sm p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-900/50"></div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif">Last Week Loot</p>
            <p className="text-3xl font-serif font-bold text-white mt-2 drop-shadow-md group-hover:text-red-500 transition-colors">
                {weeklyLoot.toLocaleString('pt-BR')}
            </p>
          </div>
          
          <div className="bg-black border border-white/10 rounded-sm p-6 text-center shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-red-900/50"></div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif">Status</p>
            <p className={cn(
                "text-xl font-serif font-bold mt-2 uppercase tracking-wide", 
                isQualified ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
            )}>
                {isQualified ? "QUALIFIED" : "NOT QUALIFIED"}
            </p>
          </div>
          
          <div className="bg-black border border-white/10 rounded-sm p-6 text-center shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-red-900/50"></div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif">Spins Available</p>
            <p className={cn(
                "text-3xl font-serif font-bold mt-2", 
                girosDisponiveis > 0 ? "text-red-500 animate-pulse" : "text-stone-600"
            )}>
                {girosDisponiveis}
            </p>
          </div>
        </div>

        {/* Slot Machine UI */}
        <div className="flex flex-col items-center gap-10 py-12 bg-zinc-950/80 rounded-sm border border-white/5 relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black pointer-events-none"></div>

            {/* Turn Count Display */}
            <div className="z-10 bg-black/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <span className="text-stone-400 uppercase tracking-widest text-xs font-serif">
                    Weekly Prize Pool
                </span>
            </div>

            {/* Wheel Display */}
            <div className="flex flex-col items-center justify-center my-8 z-10 w-full overflow-hidden max-w-sm sm:max-w-md mx-auto pointer-events-none">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={config.prizes.map((p, i) => ({ 
                      option: p.name.substring(0, 10),
                      style: { backgroundColor: i % 2 === 0 ? '#1f1c1c' : '#2a2626', textColor: p.color ? (p.color.includes('amber')?'#f59e0b':p.color.includes('emerald')?'#10b981':p.color.includes('blue')?'#3b82f6':p.color.includes('purple')?'#a855f7':p.color.includes('red')?'#ef4444':'#ffffff') : '#ffffff' }
                  }))}
                  backgroundColors={['#1f1c1c', '#2a2626']}
                  textColors={['#ffffff']}
                  outerBorderColor="#dc2626"
                  outerBorderWidth={6}
                  innerBorderColor="#1f2937"
                  innerBorderWidth={15}
                  innerRadius={10}
                  radiusLineColor="#3f3f46"
                  radiusLineWidth={2}
                  onStopSpinning={async () => {
                    setMustSpin(false);
                    const selected = config.prizes[prizeNumber];
                    
                    try {
                      await addDoc(collection(db, 'power_roletas'), {
                        userId: profile?.userId,
                        premio: selected.name,
                        data: Timestamp.now(),
                        entregue: false,
                      });

                      const hasWeeklyAvailable = weeklyTotal > girosUsados;
                      if (!hasWeeklyAvailable && extraSpins > 0) {
                        await updateDoc(doc(db, 'usuarios', profile!.userId), {
                            extraSpins: increment(-1)
                        });
                      }
                    } catch (err) {
                      console.error('Erro ao salvar:', err);
                    }
                    
                    setResult(selected);
                    setGirosUsados(prev => prev + 1);
                    await refreshProfile?.();
                    setSpinning(false);
                  }}
                />
            </div>

            {/* Controls */}
             <button
                onClick={girar}
                disabled={spinning || girosDisponiveis <= 0}
                className={cn(
                  "relative z-10 px-12 py-5 rounded-sm font-serif font-black text-2xl uppercase tracking-[0.2em] shadow-2xl transform transition-all active:scale-95 border border-white/10",
                  spinning
                    ? "bg-stone-900 text-stone-600 cursor-wait border-stone-800"
                    : girosDisponiveis > 0
                      ? "bg-red-800 text-white hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] border-red-600"
                      : "bg-stone-900 text-stone-700 cursor-not-allowed border-stone-800"
                )}
              >
                {spinning ? 'ADICIONANDO...' : 'ADICIONAR ITEM'}
            </button>

             {/* Result Display */}
             {result && (
                <div className="z-10 animate-in fade-in zoom-in duration-300 mt-4 text-center">
                    <p className="text-red-500 font-serif uppercase text-sm tracking-widest mb-2">P R I Z E  A C Q U I R E D</p>
                    <p className={cn("text-5xl font-serif font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]", result.color)}>{result.name}</p>
                </div>
             )}

            {/* Prize Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full max-w-4xl px-8 opacity-80 z-10">
                {config.prizes.map(p => (
                    <div key={p.id} className="text-center p-4 rounded-sm bg-black/40 border border-white/5 backdrop-blur-sm group hover:border-red-900/30 transition-colors">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{p.icon}</div>
                        <div className={cn("font-serif font-bold text-sm tracking-wider uppercase", p.color)}>{p.name}</div>
                        <div className="text-xs text-stone-500 mt-1 font-mono">{p.chance}% Probability</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="bg-black/80 border border-white/10 rounded-sm overflow-hidden backdrop-blur-md">
            <div className="px-6 py-5 border-b border-white/10 bg-red-950/10">
              <h2 className="text-lg font-serif font-bold text-white tracking-widest uppercase">Spin History</h2>
            </div>
            <table className="w-full text-sm font-serif">
              <thead className="text-xs text-stone-500 uppercase bg-black border-b border-white/5 tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left font-normal">Date</th>
                  <th className="px-6 py-4 text-left font-normal">Prize</th>
                  <th className="px-6 py-4 text-center font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historico.map((h, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-stone-400 tracking-wide font-mono text-xs">{h.data}</td>
                    <td className="px-6 py-4 text-white font-bold tracking-wide">{h.premio}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest border",
                        h.entregue ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/30" : "bg-amber-950/30 text-amber-500 border-amber-900/30"
                      )}>
                        {h.entregue ? 'Claimed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      
      </div>
    </div>
  );
}
