
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth, type UserProfile } from '../../hooks/useAuth';
import { useClanMemberData } from '../../hooks/useClanMemberData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Flame, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';


export default function DashboardUser() {
  const { profile } = useAuth();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [selectedNickJogo, setSelectedNickJogo] = useState('');
  const [loading, setLoading] = useState(true);

  const { stats, loading: statsLoading } = useClanMemberData(selectedNickJogo || undefined);

  // carregar todos os usuários vinculados
  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, 'usuarios'));
      const list: UserProfile[] = [];
      snap.forEach(d => list.push(d.data() as UserProfile));
      // filtrar somente quem tem nickJogo preenchido
      const linked = list.filter(u => u.nickJogo).sort((a, b) => a.nick.localeCompare(b.nick));
      setUsuarios(linked);

      // selecionar o próprio usuário por padrão
      if (profile?.nickJogo) {
        setSelectedNickJogo(profile.nickJogo);
      } else if (linked.length > 0) {
        setSelectedNickJogo(linked[0].nickJogo);
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  const selectedUser = useMemo(() => usuarios.find(u => u.nickJogo === selectedNickJogo), [usuarios, selectedNickJogo]);

  const girosDisponiveis = stats ? Math.floor((stats.weeklyToDate || 0) / 5000) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-stone-200">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-950/20 rounded-sm text-red-500 border border-red-900/40">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-black text-white tracking-widest uppercase">Member Dash</h1>
              <p className="text-stone-500 text-sm font-serif tracking-wider uppercase mt-1">Live Performance Data</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold text-stone-500 mb-1 uppercase tracking-widest">Select Operative</label>
            <select
              value={selectedNickJogo}
              onChange={e => setSelectedNickJogo(e.target.value)}
              className="px-4 py-3 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-all min-w-[250px] font-mono text-sm uppercase"
            >
              {usuarios.map(u => (
                <option key={u.userId} value={u.nickJogo}>{u.nick} ({u.nickJogo})</option>
              ))}
            </select>
          </div>
        </header>

        {/* KPI Cards */}
        {statsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-sm flex items-center gap-4 hover:border-red-900/30 transition-colors">
                  <div className="p-3 bg-black border border-white/10 rounded-sm text-stone-400 transform rotate-3"><Users className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Rank</p>
                    <p className="text-xl font-bold text-white font-serif">{selectedUser?.cargo || '—'}</p>
                  </div>
              </div>

              <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-sm flex items-center gap-4 hover:border-red-900/30 transition-colors">
                  <div className="p-3 bg-black border border-white/10 rounded-sm text-stone-400 transform -rotate-3"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">All Time</p>
                    <p className="text-xl font-bold text-white font-serif">{stats.currentAll.toLocaleString('pt-BR')}</p>
                  </div>
              </div>

              <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-sm flex items-center gap-4 hover:border-red-900/30 transition-colors">
                  <div className="p-3 bg-black border border-white/10 rounded-sm text-stone-400 transform rotate-3"><Flame className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Weekly</p>
                    <p className="text-xl font-bold text-white font-serif">{stats.weeklyToDate.toLocaleString('pt-BR')}</p>
                  </div>
              </div>

              <div className="bg-stone-900/50 border border-white/5 rounded-sm p-6 shadow-sm flex items-center gap-4 hover:border-red-900/30 transition-colors">
                  <div className={cn("p-3 rounded-sm border transform -rotate-3", girosDisponiveis > 0 ? "bg-red-950/20 text-red-500 border-red-900/40" : "bg-black text-stone-600 border-stone-800")}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest">Spins</p>
                    <p className="text-xl font-bold text-white font-serif">{girosDisponiveis}</p>
                  </div>
                </div>
            </div>

            {/* Loot Diário (hoje) */}
            <div className="bg-gradient-to-r from-red-950/20 to-transparent border-l-4 border-red-600 rounded-r-sm p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold text-white uppercase tracking-widest">Loot Today</h2>
                <p className="text-4xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                    +{stats.dailyLoot.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Loot Diário - Area Chart */}
              <div className="bg-stone-950 border border-white/5 rounded-sm p-6 shadow-xl">
                <h2 className="text-lg font-serif font-bold text-stone-300 mb-6 uppercase tracking-wider">Activity Log (Daily)</h2>
                {stats.dailyHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.dailyHistory}>
                      <defs>
                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" />
                      <XAxis dataKey="data" stroke="#44403c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#44403c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0px', color: '#e7e5e4', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#ef4444' }}
                        labelStyle={{ color: '#78716c' }}
                      />
                      <Area type="monotone" dataKey="valor" stroke="#dc2626" fillOpacity={1} fill="url(#colorValor)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-stone-600 font-serif uppercase tracking-widest">No Data</div>
                )}
              </div>

              {/* Loot Semanal - Bar Chart */}
              <div className="bg-stone-950 border border-white/5 rounded-sm p-6 shadow-xl">
                <h2 className="text-lg font-serif font-bold text-stone-300 mb-6 uppercase tracking-wider">Weekly Performance</h2>
                {stats.weeklyHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.weeklyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" />
                      <XAxis dataKey="semana" stroke="#44403c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#44403c" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <Tooltip
                        cursor={{fill: '#1c1917'}}
                        contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0px', color: '#e7e5e4', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#ef4444' }}
                        labelStyle={{ color: '#78716c' }}
                      />
                      <Bar dataKey="total" fill="#7f1d1d" radius={[2, 2, 0, 0]} activeBar={{ fill: '#dc2626' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-stone-600 font-serif uppercase tracking-widest">No Data</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-40 text-stone-600 font-serif uppercase tracking-widest">
            {selectedNickJogo ? 'No data for this operative.' : 'Select operative to view data.'}
          </div>
        )}
      </div>
    </div>
  );
}
