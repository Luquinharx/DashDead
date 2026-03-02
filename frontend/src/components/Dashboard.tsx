
import { useState, useMemo } from 'react';
import { useClanData, type MemberData } from '../hooks/useClanData';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users, TrendingUp, Flame, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';


type SortKey = keyof MemberData | `week_${number}`;

export default function Dashboard() {
  const { data, numWeekCols, loading, error, latestCollectedAt, updatedCount, totalCount } = useClanData();

  function formatCollectedAt(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  const allUpdated = updatedCount === totalCount && totalCount > 0;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('currentAll');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(r => r.username.toLowerCase().includes(search.toLowerCase()));

    result.sort((a, b) => {
      let av = 0, bv = 0;
      if (String(sortKey).startsWith('week_')) {
        const n = parseInt(String(sortKey).split('_')[1], 10);
        av = (a.weeklyValues && a.weeklyValues.length >= n) ? a.weeklyValues[a.weeklyValues.length - n] : 0;
        bv = (b.weeklyValues && b.weeklyValues.length >= n) ? b.weeklyValues[b.weeklyValues.length - n] : 0;
      } else {
        av = Number(a[sortKey as keyof MemberData] ?? 0);
        bv = Number(b[sortKey as keyof MemberData] ?? 0);
      }
      return sortDesc ? (bv - av) : (av - bv);
    });

    return result;
  }, [data, search, sortKey, sortDesc]);

  const totalDailyLoot = data.reduce((acc, curr) => acc + curr.dailyLoot, 0);
  const topEarner = data.length > 0 ? [...data].sort((a, b) => b.dailyLoot - a.dailyLoot)[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500">
        Error loading data: {error}
      </div>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="w-4 h-4 ml-1 inline-block opacity-30" />;
    return sortDesc ? <ArrowDown className="w-4 h-4 ml-1 inline-block text-red-500" /> : <ArrowUp className="w-4 h-4 ml-1 inline-block text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-black text-stone-200 font-sans">
      <div className="w-full max-w-[1920px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
          <div className="relative">
             <div className="absolute -left-10 top-0 w-1 h-full bg-red-600 hidden md:block"></div>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-widest uppercase shadow-red-500/20 drop-shadow-lg">
                Clan Loot <span className="text-red-700">Tracker</span>
            </h1>
            <p className="text-stone-500 mt-2 flex items-center gap-2 font-serif uppercase tracking-wider text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Last Update: <span className="text-stone-300 font-bold">{formatCollectedAt(latestCollectedAt)}</span>
            </p>
          </div>
           
           <div className="flex items-center gap-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-serif font-bold tracking-widest uppercase border",
                allUpdated
                  ? "bg-red-950/20 text-red-400 border-red-900/40"
                  : "bg-amber-950/20 text-amber-500 border-amber-900/40"
              )}>
                {allUpdated
                  ? <><CheckCircle2 className="w-4 h-4" /> Systems Operational ({updatedCount}/{totalCount})</>
                  : <><RefreshCw className="w-4 h-4 animate-spin" /> Updating ({updatedCount}/{totalCount})</>
                }
              </span>
            </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-lg backdrop-blur-sm group hover:border-red-900/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-black border border-white/10 rounded-sm text-stone-400 group-hover:text-red-500 transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Tracked Members</p>
                <p className="text-3xl font-serif font-black text-white mt-1">{data.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-lg backdrop-blur-sm group hover:border-red-900/30 transition-all">
             <div className="flex items-center gap-5">
              <div className="p-4 bg-black border border-white/10 rounded-sm text-stone-400 group-hover:text-red-500 transition-colors">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Total Daily Loot</p>
                <p className="text-3xl font-serif font-black text-white mt-1 text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                    +{totalDailyLoot.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-lg backdrop-blur-sm group hover:border-red-900/30 transition-all">
             <div className="flex items-center gap-5">
              <div className="p-4 bg-black border border-white/10 rounded-sm text-stone-400 group-hover:text-red-500 transition-colors">
                <Flame className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Top Earner</p>
                <p className="text-3xl font-serif font-black text-white mt-1 truncate max-w-[200px]" title={topEarner?.username}>
                  {topEarner?.username || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black border-y border-white/10 py-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input 
              type="text" 
              placeholder="SEARCH OPERATIVE..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-white/10 rounded-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-all font-mono text-sm uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-stone-950 border border-white/10 rounded-sm shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-stone-500 uppercase bg-black border-b border-white/10 font-serif tracking-widest">
                <tr>
                  <th className="px-6 py-5 font-bold">Username</th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('currentAll')}>
                    All-time <SortIcon columnKey="currentAll" />
                  </th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('dailyLoot')}>
                    Daily Loot <SortIcon columnKey="dailyLoot" />
                  </th>
                  {Array.from({ length: numWeekCols }).map((_, i) => {
                    const w = i + 1;
                    return (
                      <th key={w} className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort(`week_${w}`)}>
                        WK {w} <SortIcon columnKey={`week_${w}`} />
                      </th>
                    );
                  })}
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('pctNum')}>
                    Var % <SortIcon columnKey="pctNum" />
                  </th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('streak')}>
                    Wk Streak <SortIcon columnKey="streak" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredAndSortedData.map((r, idx) => {
                  const isHighlight = (r.weeklyValues && r.weeklyValues.length && r.weeklyValues[r.weeklyValues.length-1] > 5000);
                  
                  const dl = Number(r.dailyLoot || 0);
                  const dlText = (dl >= 0 ? '+' : '') + dl.toLocaleString('pt-BR');
                  
                  const st = Number(r.streak || 0);
                  const stText = (st > 0 ? '+' + st : st.toString());

                  return (
                    <tr 
                      key={r.username} 
                      className={cn(
                        "transition-colors hover:bg-white/5",
                        isHighlight && "bg-red-950/10 hover:bg-red-950/20"
                      )}
                    >
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap flex items-center gap-3">
                        <span className="text-stone-600 w-6 text-xs text-right font-serif">{idx + 1}.</span>
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rotate-45 flex-shrink-0",
                          r.isUpdated ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-stone-700"
                        )} title={r.isUpdated ? 'Updated' : 'Pending'} />
                        
                        <Link to={`/dashboard?user=${encodeURIComponent(r.username)}`} className="tracking-wide hover:text-red-500 hover:underline transition-all">
                            {r.username}
                        </Link>
                        
                        {isHighlight && <Flame className="w-3.5 h-3.5 text-red-600" />}
                      </td>
                      <td className="px-6 py-4 text-right text-stone-300">
                        {r.currentAll.toLocaleString('pt-BR')}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold",
                        dl > 0 ? "text-emerald-500" : dl < 0 ? "text-red-500" : "text-stone-600"
                      )}>
                        {dlText}
                      </td>
                      
                      {Array.from({ length: numWeekCols }).map((_, i) => {
                        const w = i + 1;
                        const val = (r.weeklyValues && r.weeklyValues.length >= w) ? r.weeklyValues[r.weeklyValues.length - w] : 0;
                        return (
                          <td key={w} className="px-6 py-4 text-right text-stone-400">
                            {val.toLocaleString('pt-BR')}
                          </td>
                        );
                      })}

                      <td className="px-6 py-4 text-right text-stone-500">
                        {r.pct}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-xs font-bold min-w-[2.5rem] tracking-wider border",
                          st > 0 ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/30" : st < 0 ? "bg-red-950/30 text-red-500 border-red-900/30" : "bg-stone-900 text-stone-600 border-stone-800"
                        )}>
                          {stText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-stone-600 font-serif uppercase tracking-widest">
                      No operatives found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
