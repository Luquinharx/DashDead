import { useState, useMemo } from 'react';
import { useClanData, type MemberData } from '../hooks/useClanData';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users, TrendingUp, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

type SortKey = keyof MemberData | `week_${number}`;

export default function Dashboard() {
  const { data, numWeekCols, loading, error, latestDate } = useClanData();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500">
        Error loading data: {error}
      </div>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="w-4 h-4 ml-1 inline-block opacity-30" />;
    return sortDesc ? <ArrowDown className="w-4 h-4 ml-1 inline-block text-indigo-400" /> : <ArrowUp className="w-4 h-4 ml-1 inline-block text-indigo-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Clan Loot Dashboard</h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Última coleta: <span className="text-slate-300 font-medium">{latestDate}</span>
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Membros Rastreados</p>
                <p className="text-2xl font-bold text-white">{data.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Daily Loot</p>
                <p className="text-2xl font-bold text-white">+{totalDailyLoot.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Top Earner (Hoje)</p>
                <p className="text-2xl font-bold text-white truncate max-w-[150px]" title={topEarner?.username}>
                  {topEarner?.username || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filtrar por nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('currentAll')}>
                    All-time <SortIcon columnKey="currentAll" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('dailyLoot')}>
                    Daily Loot <SortIcon columnKey="dailyLoot" />
                  </th>
                  {Array.from({ length: numWeekCols }).map((_, i) => {
                    const w = i + 1;
                    return (
                      <th key={w} className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort(`week_${w}`)}>
                        {w}ª Semana <SortIcon columnKey={`week_${w}`} />
                      </th>
                    );
                  })}
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('pctNum')}>
                    Var % <SortIcon columnKey="pctNum" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('streak')}>
                    Streak <SortIcon columnKey="streak" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
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
                        "transition-colors hover:bg-slate-800/50",
                        isHighlight && "bg-red-950/20 hover:bg-red-950/30"
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-2">
                        <span className="text-slate-500 w-4 text-xs">{idx + 1}.</span>
                        {r.username}
                        {isHighlight && <Flame className="w-4 h-4 text-red-500" />}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300 font-mono">
                        {r.currentAll.toLocaleString('pt-BR')}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-mono font-medium",
                        dl > 0 ? "text-emerald-400" : dl < 0 ? "text-red-400" : "text-slate-500"
                      )}>
                        {dlText}
                      </td>
                      
                      {Array.from({ length: numWeekCols }).map((_, i) => {
                        const w = i + 1;
                        const val = (r.weeklyValues && r.weeklyValues.length >= w) ? r.weeklyValues[r.weeklyValues.length - w] : 0;
                        return (
                          <td key={w} className="px-6 py-4 text-right font-mono text-slate-300">
                            {val.toLocaleString('pt-BR')}
                          </td>
                        );
                      })}

                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                        {r.pct}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold min-w-[2.5rem]",
                          st > 0 ? "bg-emerald-500/10 text-emerald-400" : st < 0 ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-400"
                        )}>
                          {stText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                      Nenhum membro encontrado com esse filtro.
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
