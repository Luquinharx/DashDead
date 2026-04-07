
import { useState, useMemo, useEffect } from 'react';
import { useClanData, type MemberData } from '../hooks/useClanData';
import { useProfilesData } from '../hooks/useProfilesData';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users, TrendingUp, Flame, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { RankBadge } from './RankBadge';


type SortKey = keyof MemberData | `week_${number}`;

export default function Dashboard() {
  const { data, numWeekCols, weekLabels, loading, error, latestCollectedAt, updatedCount, totalCount } = useClanData();
  const { profiles } = useProfilesData();

  function formatCollectedAt(iso: string): string {
    if (!iso) return 'â€”';
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
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('active');
  const [sortKey, setSortKey] = useState<SortKey>('currentAll');
  const [sortDesc, setSortDesc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode, sortKey, sortDesc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data
      .filter(r => r.isActive)
      .filter(r => r.username.toLowerCase().includes(search.toLowerCase()));

    if (filterMode === 'active') {
      result = result.filter(r => r.isActive);
    } else if (filterMode === 'inactive') {
      result = result.filter(r => !r.isActive);
    } else if (filterMode === 'all') {
      result = data.filter(r => r.username.toLowerCase().includes(search.toLowerCase()));
    }

    result.sort((a, b) => {
      let av = 0, bv = 0;
      if (String(sortKey).startsWith('week_')) {
        const n = parseInt(String(sortKey).split('_')[1], 10) - 1; // 0-based index
        av = (a.weeklyValues && a.weeklyValues.length > n) ? a.weeklyValues[n] : 0;
        bv = (b.weeklyValues && b.weeklyValues.length > n) ? b.weeklyValues[n] : 0;
      } else if (sortKey === 'currentAll') {
        // Use all_time_loots from profiles data (user's personal total)
        const profileA = profiles.find(p => p.username.toLowerCase() === a.username.toLowerCase());
        const profileB = profiles.find(p => p.username.toLowerCase() === b.username.toLowerCase());
        av = Number(profileA?.all_time_loots ?? a.currentAll ?? 0);
        bv = Number(profileB?.all_time_loots ?? b.currentAll ?? 0);
      } else {
        av = Number(a[sortKey as keyof MemberData] ?? 0);
        bv = Number(b[sortKey as keyof MemberData] ?? 0);
      }
      return sortDesc ? (bv - av) : (av - bv);
    });

    return result;
  }, [data, search, sortKey, sortDesc, filterMode, profiles]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);    
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const topEarnerData = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        const aWeekly = (a.weeklyValues && a.weeklyValues.length) ? a.weeklyValues[a.weeklyValues.length - 1] : 0;
        const bWeekly = (b.weeklyValues && b.weeklyValues.length) ? b.weeklyValues[b.weeklyValues.length - 1] : 0;
        return bWeekly - aWeekly;
      })
      .slice(0, 3)
      .map((m, idx) => ({
        rank: idx + 1,
        username: m.username,
        weekly: (m.weeklyValues && m.weeklyValues.length) ? m.weeklyValues[m.weeklyValues.length - 1] : 0
      }));
  }, [data]);

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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 md:py-8 space-y-8 animate-in fade-in duration-700">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
          <div className="relative">
             <div className="absolute -left-10 top-0 w-1 h-full bg-red-600 hidden md:block"></div>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-widest uppercase shadow-red-500/20 drop-shadow-lg">
                Dash <span className="text-red-700">Loot</span>
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

        {/* Top 3 Weekly Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topEarnerData.map((earner) => (
            <div key={earner.username} className="bg-stone-950 border border-white/10 rounded-sm p-6 shadow-lg backdrop-blur-sm hover:border-red-900/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-sm text-sm font-bold",
                  earner.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  earner.rank === 2 ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" :
                  "bg-orange-600/20 text-orange-400 border border-orange-600/30"
                )}>
                  {earner.rank === 1 ? '🥇' : earner.rank === 2 ? '🥈' : '🥉'}
                </div>
                <span className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Position {earner.rank}</span>
              </div>
              <p className="text-sm text-stone-400 truncate mb-2">{earner.username}</p>
              <p className="text-2xl font-mono font-bold text-red-500">{earner.weekly.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-stone-600 mt-2">Weekly Loot</p>
            </div>
          ))}
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

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                "px-4 py-2 rounded-sm text-xs font-serif font-bold uppercase tracking-widest transition-all",
                filterMode === 'all'
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/50"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={cn(
                "px-4 py-2 rounded-sm text-xs font-serif font-bold uppercase tracking-widest transition-all",
                filterMode === 'active'
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/50"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              )}
            >
              Active
            </button>
            <button
              onClick={() => setFilterMode('inactive')}
              className={cn(
                "px-4 py-2 rounded-sm text-xs font-serif font-bold uppercase tracking-widest transition-all",
                filterMode === 'inactive'
                  ? "bg-red-600/70 text-white shadow-lg shadow-red-600/50"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              )}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-stone-950 border border-white/10 rounded-sm shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-stone-500 uppercase bg-black border-b border-white/10 font-serif tracking-widest">
                <tr>
                  <th className="px-6 py-5 font-bold">Username</th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group hidden md:table-cell" onClick={() => handleSort('currentAll')}>
                    Rank
                  </th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('currentAll')}>
                    All-time <SortIcon columnKey="currentAll" />
                  </th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('dailyLoot')}>
                    Daily Loot <SortIcon columnKey="dailyLoot" />
                  </th>
                  {Array.from({ length: numWeekCols }).map((_, i) => {
                    const w = i + 1;
                    return (
                      <th key={w} className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group whitespace-nowrap" onClick={() => handleSort(`week_${w}`)}>
                        {weekLabels[i] || `WK ${w}`} <SortIcon columnKey={`week_${w}`} />
                      </th>
                    );
                  })}
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group" onClick={() => handleSort('streak')}>
                    Wk Streak <SortIcon columnKey="streak" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {paginatedData.map((r, idx) => {
                  const absoluteIdx = (currentPage - 1) * itemsPerPage + idx;   
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
                        <span className="text-stone-600 w-6 text-xs text-right font-serif">{absoluteIdx + 1}.</span>
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rotate-45 flex-shrink-0",   
                          r.isUpdated ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-stone-700"
                        )} title={r.isUpdated ? 'Updated' : 'Pending'} />       

                        <Link to={`/dashboard?user=${encodeURIComponent(r.username)}`} className="tracking-wide hover:text-red-500 hover:underline transition-all">
                            {r.username}
                        </Link>

                        {isHighlight && <Flame className="w-3.5 h-3.5 text-red-600" />}
                      </td>
                      <td className="px-6 py-4 text-right text-stone-300 hidden md:table-cell">      
                        <RankBadge rank={r.rank} />
                      </td>
                      <td className="px-6 py-4 text-right text-stone-300">      
                        {(() => {
                          const profile = profiles.find(p => p.username.toLowerCase() === r.username.toLowerCase());
                          const value = profile?.all_time_loots ?? r.currentAll ?? 0;
                          return Number(value).toLocaleString('pt-BR');
                        })()}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold",
                        dl > 0 ? "text-emerald-500" : dl < 0 ? "text-red-500" : 
"text-stone-600"
                      )}>
                        {dlText}
                      </td>

                      {Array.from({ length: numWeekCols }).map((_, i) => {      
                        const val = (r.weeklyValues && r.weeklyValues.length > i) ? r.weeklyValues[i] : 0;
                        return (
                          <td key={i} className="px-6 py-4 text-right text-stone-400">
                            {val.toLocaleString('pt-BR')}
                          </td>
                        );
                      })}

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
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-stone-600 font-serif uppercase tracking-widest">
                      No operatives found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-black border-t border-white/10 px-6 py-4 gap-4">
              <span className="text-xs font-serif uppercase tracking-widest text-stone-500">
                PÃ¡gina {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}       
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 border border-white/10 rounded-sm text-xs font-serif font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-red-900 hover:bg-stone-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 border border-white/10 rounded-sm text-xs font-serif font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-red-900 hover:bg-stone-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
