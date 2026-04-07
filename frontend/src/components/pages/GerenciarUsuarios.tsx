import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from '../../lib/firebase';
import { useAuth, type UserProfile } from '../../hooks/useAuth';
import { useScrapedUsernames } from '../../hooks/useClanMemberData';
import { useProfilesData } from '../../hooks/useProfilesData';
import { RankBadge } from '../RankBadge';
import { Edit3, Trash2, Save, X, Search, UserPlus, Gift, Check, ShieldAlert, Loader2, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import CasinoSettings from './CasinoSettings';

const CARGOS = ['Member', 'Officer', 'Sub-Leader', 'Leader'];


// Auth secundário para criar usuários sem deslogar o admin
const secondaryApp = initializeApp({
  apiKey: "AIzaSyA9E6Hrkbfnex1YvxJVplbf49RdEa8dcMc",
  authDomain: "deadbb-2d5a8.firebaseapp.com",
  projectId: "deadbb-2d5a8",
}, 'secondary-admin');
const secondaryAuth = getAuth(secondaryApp);

export default function GerenciarUsuarios() {
  const { profile, refreshProfile } = useAuth();
  const { usernames: scrapedNames } = useScrapedUsernames();
  const { profiles } = useProfilesData();

  // Tabs
  const [activeTab, setActiveTab] = useState<'members' | 'spins' | 'casino'>('members');

  // Members State
  const [usuarios, setUsuarios] = useState<(UserProfile & { docId: string })[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nick: '', discord: '', cargo: '', nickJogo: '', extraSpins: 0 });
  const [loading, setLoading] = useState(true);

  // Spins State
  const [spins, setSpins] = useState<any[]>([]);
  const [spinsLoading, setSpinsLoading] = useState(false);

  // --- Pagination & Sorting state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'dataEntrada', direction: 'desc' });
  const itemsPerPage = 20;

  // --- Cadastro state ---
  const [showCadastro, setShowCadastro] = useState(false);
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadNick, setCadNick] = useState('');
  const [cadNickJogo, setCadNickJogo] = useState('');
  const [cadDiscord, setCadDiscord] = useState('');
  const [cadDataEntrada, setCadDataEntrada] = useState('');
  const [cadCargo, setCadCargo] = useState('Membro');
  const [cadError, setCadError] = useState('');
  const [cadSuccess, setCadSuccess] = useState('');
  const [cadLoading, setCadLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'usuarios'));
    const list: (UserProfile & { docId: string })[] = [];
    snap.forEach(d => list.push({ ...(d.data() as UserProfile), docId: d.id }));
    list.sort((a, b) => a.nick.localeCompare(b.nick));
    setUsuarios(list);
    setLoading(false);
  }

  async function loadSpins() {
    setSpinsLoading(true);
    try {
        // Also ensure users are loaded to map IDs to Names
        if (usuarios.length === 0) {
           await loadAll();
        }

        const q = query(collection(db, 'roletas'), orderBy('data', 'desc'), limit(100)); // Limit to last 100 for performance
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => {
            const data = d.data();
            list.push({
                id: d.id,
                ...data,
                formattedDate: data.data?.toDate?.() ? data.data.toDate().toLocaleDateString('pt-BR') + ' ' + data.data.toDate().toLocaleTimeString('pt-BR') : 'Invalid Date'
            });
        });
        setSpins(list);
    } catch (error) {
        console.error("Error loading spins", error);
    } finally {
        setSpinsLoading(false);
    }
  }

  useEffect(() => { 
      if (activeTab === 'members') loadAll(); 
      if (activeTab === 'spins') { loadAll(); loadSpins(); }
  }, [activeTab]);

  function startEdit(u: UserProfile & { docId: string }) {
    setEditingId(u.docId);
    setEditForm({ 
        nick: u.nick, 
        discord: u.discord, 
        cargo: u.cargo, 
        nickJogo: u.nickJogo || '',
        extraSpins: u.extraSpins || 0,
    });
  }

  async function saveEdit(docId: string) {
    try {
      await updateDoc(doc(db, 'usuarios', docId), {
        nick: editForm.nick,
        discord: editForm.discord,
        cargo: editForm.cargo,
        nickJogo: editForm.nickJogo,
        extraSpins: Number(editForm.extraSpins),
      });
      setEditingId(null);
      await loadAll();
    } catch (err) {
      console.error('Error editing:', err);
    }
  }

  async function handleDelete(docId: string, nickName: string) {
    if (!confirm(`Are you sure you want to remove "${nickName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'usuarios', docId));
      await loadAll();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  }

  // Spin Actions
  async function markSpinDelivered(spinId: string) {
      try {
          await updateDoc(doc(db, 'roletas', spinId), { entregue: true });
          setSpins(prev => prev.map(s => s.id === spinId ? { ...s, entregue: true } : s));
      } catch (e) {
          console.error("Error marking delivered", e);
      }
  }

  async function deleteSpin(spinId: string) {
      if(!confirm("Are you sure you want to delete this spin record?")) return;
      try {
          await deleteDoc(doc(db, 'roletas', spinId));
          setSpins(prev => prev.filter(s => s.id !== spinId));
      } catch (e) {
          console.error("Error deleting spin", e);
      }
  }


  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCadError('');
    setCadLoading(true);
    setCadSuccess('');
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, cadEmail, cadSenha);
      const uid = cred.user.uid;
      await secondaryAuth.signOut();

      await setDoc(doc(db, 'usuarios', uid), {
        userId: uid,
        email: cadEmail,
        nick: cadNick,
        nickJogo: cadNickJogo,
        discord: cadDiscord,
        dataEntrada: cadDataEntrada ? Timestamp.fromDate(new Date(cadDataEntrada + 'T00:00:00')) : Timestamp.now(),
        cargo: cadCargo,
        lootSemanal: 0,
        lootTotal: 0,
        roletaDisponivel: 0,
        criadoEm: Timestamp.now(),
      });

      setCadSuccess(`User "${cadNick}" successfully registered!`);
      setCadEmail(''); setCadSenha(''); setCadNick(''); setCadNickJogo(''); setCadDiscord(''); setCadDataEntrada(''); setCadCargo('Membro');
      await loadAll();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setCadError('Este email já está cadastrado.');
      } else if (code === 'auth/weak-password') {
        setCadError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setCadError('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setCadLoading(false);
    }
  }

  const filtered = usuarios.filter(u =>
    u.nick.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'desc' });
    }
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="text-stone-600 opacity-50 ml-1 font-sans text-[10px]">⇅</span>;
    return sortConfig.direction === 'desc' 
        ? <span className="text-red-500 ml-1 font-sans text-[10px]">↓</span> 
        : <span className="text-red-500 ml-1 font-sans text-[10px]">↑</span>;
  };

  const sortedUsers = [...filtered].sort((a, b) => {
    let valA: any = a[sortConfig.key as keyof typeof a] || '';
    let valB: any = b[sortConfig.key as keyof typeof b] || '';

    // Handle Timestamps
    if (sortConfig.key === 'dataEntrada') {
      valA = a.dataEntrada?.toMillis?.() || 0;
      valB = b.dataEntrada?.toMillis?.() || 0;
    }

    if (sortConfig.key === 'rank') {
      valA = profiles.find(p => p.username === a.nickJogo)?.rank || '';
      valB = profiles.find(p => p.username === b.nickJogo)?.rank || '';
      if (valA === 'Street Cleaner') valA = 'Z'; // Push missing ranks to bottom when sorting ASC
      if (valB === 'Street Cleaner') valB = 'Z';
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    }

    const nA = Number(valA) || 0;
    const nB = Number(valB) || 0;
    return sortConfig.direction === 'asc' ? nA - nB : nB - nA;
  });

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // só líderes podem gerenciar
  const isSuperUser = profile?.email === 'bone.ak103@gmail.com';
  const isAdmin = profile?.cargo === 'Líder' || profile?.cargo === 'Sub-Líder' || isSuperUser;

  // Auto-promote superuser if needed
  useEffect(() => {
      // Check if user is the specific superuser AND not already an admin in profile
      if (isSuperUser && profile?.cargo !== 'Líder' && profile?.userId) {
          const promoteUser = async () => {
              try {
                  // Force database update
                  await updateDoc(doc(db, 'usuarios', profile.userId), { cargo: 'Líder' });
                  // Refresh context to update UI immediately
                  await refreshProfile();
              } catch (err) {
                  // Silently fail or log
                  console.error("Auto-promotion failed", err);
              }
          };
          promoteUser();
      }
  }, [isSuperUser, profile, refreshProfile]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black font-serif">
        <div className="flex items-center justify-center h-[80vh] text-red-600 text-lg uppercase tracking-widest animate-pulse border border-red-900/20 m-12 bg-red-950/10">
          Access Denied • Clearance Level: Leader
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-stone-300 font-serif selection:bg-red-900/30">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 mx-auto space-y-8 animate-in fade-in duration-700">

        <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-950/20 rounded-sm border border-red-900/30 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase">Admin <span className="text-red-600">Console</span></h1>
              <p className="text-stone-500 text-sm tracking-wide font-mono mt-1">Clearance Level: O5</p>
            </div>
          </div>

<div className="flex gap-2 bg-stone-900/50 p-1 rounded-sm border border-white/5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('members')}
                className={cn(
                    "px-6 py-2 rounded-sm text-sm uppercase tracking-widest font-bold transition-all whitespace-nowrap",
                    activeTab === 'members' ? "bg-red-900/30 text-red-500 border border-red-900/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "text-stone-500 hover:text-stone-300 hover:bg-white/5"
                )}
              >
                  Members
              </button>
              <button
                onClick={() => setActiveTab('spins')}
                className={cn(
                    "px-6 py-2 rounded-sm text-sm uppercase tracking-widest font-bold transition-all whitespace-nowrap",
                    activeTab === 'spins' ? "bg-red-900/30 text-red-500 border border-red-900/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "text-stone-500 hover:text-stone-300 hover:bg-white/5"
                )}
              >
                  Slot Spins
              </button>
              <button
                onClick={() => setActiveTab('casino')}
                className={cn(
                    "px-6 py-2 rounded-sm text-sm uppercase tracking-widest font-bold transition-all whitespace-nowrap",
                    activeTab === 'casino' ? "bg-red-900/30 text-red-500 border border-red-900/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "text-stone-500 hover:text-stone-300 hover:bg-white/5"
                )}
              >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> CASINO CONFIG
                  </span>
              </button>
          </div>
        </header>

        {activeTab === 'members' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             
             {/* Controls */}
             <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-950/50 p-4 border border-white/5 rounded-sm">
                 <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                        type="text" placeholder="Search operatives..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black border border-white/10 rounded-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-red-900/50 transition-colors text-sm font-mono"
                    />
                 </div>
                 <button
                    onClick={() => { setShowCadastro(!showCadastro); setCadError(''); setCadSuccess(''); }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest transition-all border w-full sm:w-auto justify-center",
                        showCadastro
                        ? "bg-black border-red-900/50 text-red-500 hover:bg-red-950/20"
                        : "bg-red-900/20 border-red-900/50 text-red-500 hover:bg-red-900/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                    )}
                    >
                    <UserPlus className="w-4 h-4" />
                    {showCadastro ? 'Close' : 'New Operative'}
                </button>
             </div>


            {/* Formulário of Cadastro */}
            {showCadastro && (
            <div className="bg-black border border-red-900/30 rounded-sm p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                
                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                    <div className="p-2 bg-red-900/20 rounded-full text-red-500">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Register Operative</h2>
                        <p className="text-xs text-stone-500 uppercase tracking-widest">Create new database entry</p>
                    </div>
                </div>

                {cadError && (
                <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-sm font-bold font-mono">
                    ERROR: {cadError}
                </div>
                )}
                {cadSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-sm font-bold font-mono">
                    SUCCESS: {cadSuccess}
                </div>
                )}

                <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Email Access</label>
                    <input type="email" value={cadEmail} onChange={e => setCadEmail(e.target.value)} required
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                    placeholder="email@domain.com" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Secure Password</label>
                    <input type="password" value={cadSenha} onChange={e => setCadSenha(e.target.value)} required minLength={6}
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                    placeholder="Min 6 chars" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Codename (Nick)</label>
                    <input type="text" value={cadNick} onChange={e => setCadNick(e.target.value)} required
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                    placeholder="Alpha-1" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Link Operative (Scraper)</label>
                    <select value={cadNickJogo} onChange={e => setCadNickJogo(e.target.value)} required
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono">
                    <option value="">Unlinked</option>
                    {scrapedNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Comms (Discord)</label>
                    <input type="text" value={cadDiscord} onChange={e => setCadDiscord(e.target.value)} required
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                    placeholder="user#0000" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Enlistment Date</label>
                    <input type="date" value={cadDataEntrada} onChange={e => setCadDataEntrada(e.target.value)} required
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Clearance Level (Rank)</label>
                    <select value={cadCargo} onChange={e => setCadCargo(e.target.value)}
                    className="w-full px-4 py-2 bg-stone-950 border border-white/10 rounded-sm text-white focus:outline-none focus:border-red-500 transition-colors text-sm font-mono">
                    {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex items-end lg:col-span-2">
                    <button type="submit" disabled={cadLoading}
                    className={cn(
                        "w-full py-2 rounded-sm font-bold text-xs uppercase tracking-[0.2em] transition-all border",
                        cadLoading ? "bg-stone-900 border-stone-800 text-stone-600 cursor-wait" : "bg-red-900 border-red-700 text-white hover:bg-red-800 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    )}>
                    {cadLoading ? 'PROCESSING...' : 'INITIALIZE OPERATIVE'}
                    </button>
                </div>
                </form>
            </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600" />
                </div>
            ) : (
            <div className="bg-stone-950/50 rounded-sm border border-white/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left font-mono">
                    <thead className="text-[10px] text-stone-500 uppercase bg-black border-b border-white/10 tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nick')}><div className="flex items-center">Membro {renderSortIcon('nick')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nickJogo')}><div className="flex items-center">Status TS {renderSortIcon('nickJogo')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('email')}><div className="flex items-center">Email {renderSortIcon('email')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('discord')}><div className="flex items-center">Cargos Discord {renderSortIcon('discord')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('cargo')}><div className="flex items-center">Access {renderSortIcon('cargo')}</div></th>
                        <th className="px-6 py-4 font-normal hover:text-white transition-colors cursor-pointer" onClick={() => handleSort('dataEntrada')}><div className="flex items-center">Clan Month {renderSortIcon('dataEntrada')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('rank')}><div className="flex items-center">Scrap Rank {renderSortIcon('rank')}</div></th>
                        <th className="px-6 py-4 font-normal cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('extraSpins')}><div className="flex items-center">Balance {renderSortIcon('extraSpins')}</div></th>
                        <th className="px-6 py-4 text-center font-normal">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {paginatedUsers.map(u => (
                        <tr key={u.docId} className="hover:bg-white/5 transition-colors">
                        {editingId === u.docId ? (
                            <>
                            <td className="px-6 py-3">
                                <input value={editForm.nick} onChange={e => setEditForm({ ...editForm, nick: e.target.value })}
                                className="w-full px-2 py-1 bg-black border border-white/20 rounded-sm text-white text-xs" />
                            </td>
                            <td className="px-6 py-3">
                                <select value={editForm.nickJogo} onChange={e => setEditForm({ ...editForm, nickJogo: e.target.value })}
                                className="w-full px-2 py-1 bg-black border border-white/20 rounded-sm text-white text-xs">
                                <option value="">None</option>
                                {scrapedNames.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-3 text-stone-500 text-xs">{u.email}</td>
                            <td className="px-6 py-3">
                                <input value={editForm.discord} onChange={e => setEditForm({ ...editForm, discord: e.target.value })}
                                className="w-full px-2 py-1 bg-black border border-white/20 rounded-sm text-white text-xs" />
                            </td>
                            <td className="px-6 py-3">
                                <select value={editForm.cargo} onChange={e => setEditForm({ ...editForm, cargo: e.target.value })}
                                className="px-2 py-1 bg-black border border-white/20 rounded-sm text-white text-xs">
                                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-3 text-center">
                                <span className="text-xs text-stone-500">-</span>
                            </td>
                            <td className="px-6 py-3 text-center">
                                <span className="text-xs text-stone-500">-</span>
                            </td>
                            <td className="px-6 py-3">
                                <input 
                                    type="number" 
                                    value={editForm.extraSpins} 
                                    onChange={e => setEditForm({ ...editForm, extraSpins: Number(e.target.value) })}
                                    className="w-16 px-2 py-1 bg-black border border-white/20 rounded-sm text-white text-xs text-center" 
                                />
                            </td>
                            <td className="px-6 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                <button onClick={() => saveEdit(u.docId)} className="text-emerald-500 hover:text-emerald-400"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            </td>
                            </>
                        ) : (
                            <>
                            <td className="px-6 py-3 text-white font-serif tracking-wide">{u.nick}</td>
                            <td className="px-6 py-3 text-stone-400 text-xs">{u.nickJogo || <span className="text-stone-700">—</span>}</td>
                            <td className="px-6 py-3 text-stone-500 text-xs">{u.email}</td>
                            <td className="px-6 py-3 text-stone-400 text-xs">{u.discord}</td>
                            <td className="px-6 py-3">
                                <span className={cn(
                                "inline-flex px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-widest border",
                                u.cargo === 'Líder' ? "bg-red-950/20 text-red-500 border-red-900/40" :
                                u.cargo === 'Sub-Líder' ? "bg-stone-800 text-stone-300 border-stone-700" :
                                "bg-stone-900/50 text-stone-500 border-stone-800"
                                )}>
                                {u.cargo}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-stone-400 text-xs tracking-wider">
                                {u.dataEntrada?.toDate?.() ? u.dataEntrada.toDate().toLocaleDateString('pt-BR') : <span className="text-stone-700">—</span>}
                            </td>
                            <td className="px-6 py-3">
                                <RankBadge rank={profiles.find(p => p.username === u.nickJogo)?.rank || 'Street Cleaner'} />
                            </td>
                            <td className="px-6 py-3 text-center text-xs font-bold text-emerald-500">
                                {u.extraSpins && u.extraSpins > 0 ? `+${u.extraSpins}` : <span className="text-stone-700">0</span>}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <div className="flex items-center justify-center gap-3">
                                <button onClick={() => startEdit(u)} className="text-stone-400 hover:text-white transition-colors" title="Edit">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(u.docId, u.nick)} className="text-red-900 hover:text-red-500 transition-colors" title="Purge">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                </div>
                            </td>
                            </>
                        )}
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-6 py-4 bg-black border-t border-white/10">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-stone-900 border border-stone-800 text-stone-400 rounded-sm text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-stone-800 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-stone-500 uppercase tracking-widest font-mono">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-stone-900 border border-stone-800 text-stone-400 rounded-sm text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-stone-800 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
            )}
        </div>
        )}

        {/* SPINS VIEW */}
        {activeTab === 'spins' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-stone-950/50 border border-white/10 rounded-sm overflow-hidden backdrop-blur-sm">
                    
                    <div className="px-6 py-5 border-b border-white/10 bg-black flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-red-600" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Spin Activity (Last 100)</h2>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-500" />
                                <input 
                                    type="text" 
                                    placeholder="FILTER BY OPERATIVE..." 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full md:w-64 pl-8 pr-4 py-1.5 bg-black border border-white/10 rounded-sm text-white text-xs uppercase tracking-wider focus:outline-none focus:border-red-600 transition-colors"
                                />
                            </div>
                            <button onClick={loadSpins} className="text-xs text-stone-500 uppercase tracking-wider hover:text-white transition-colors whitespace-nowrap">
                                Refresh Data
                            </button>
                        </div>
                    </div>

                    {spinsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs uppercase tracking-widest font-bold">Retrieving Data...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-mono">
                                <thead className="text-[10px] text-stone-500 uppercase bg-black border-b border-white/10 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-normal text-left">Date</th>
                                        <th className="px-6 py-4 font-normal text-left">Operative Nick</th>
                                        <th className="px-6 py-4 font-normal text-left">Prize</th>
                                        <th className="px-6 py-4 font-normal text-center">Status</th>
                                        <th className="px-6 py-4 font-normal text-center">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {spins
                                    .filter(spin => {
                                        const userDetails = usuarios.find(u => u.userId === spin.userId || u.docId === spin.userId);
                                        const userName = userDetails?.nick || spin.userId || 'Unknown';
                                        return userName.toLowerCase().includes(search.toLowerCase());
                                    })
                                    .map(spin => {
                                        const userDetails = usuarios.find(u => u.userId === spin.userId || u.docId === spin.userId);
                                        
                                        return (
                                        <tr key={spin.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-3 text-stone-500 text-xs">{spin.formattedDate}</td>
                                            <td className="px-6 py-3 text-white font-serif tracking-wide">
                                                {userDetails?.nick || <span className="text-stone-600 text-[10px] font-mono">{spin.userId}</span>} 
                                            </td>
                                            <td className="px-6 py-3 text-red-400 font-bold">{spin.premio}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-widest border",
                                                    spin.entregue 
                                                        ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/50" 
                                                        : "bg-red-950/30 text-amber-500 border-red-900/50 animate-pulse"
                                                )}>
                                                    {spin.entregue ? 'DELIVERED' : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    {!spin.entregue && (
                                                        <button 
                                                            onClick={() => markSpinDelivered(spin.id)}
                                                            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400 bg-emerald-900/10 border border-emerald-900/30 px-3 py-1.5 rounded-sm transition-all hover:bg-emerald-900/20"
                                                            title="Mark as Delivered"
                                                        >
                                                            <Check className="w-3 h-3" /> Confirm
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteSpin(spin.id)}
                                                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-700 hover:text-red-500 hover:bg-red-950/30 px-2 py-1.5 rounded-sm transition-colors"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                    {spins.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-stone-600 font-serif uppercase tracking-widest">No spin records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
             </div>
        )}

        {/* CASINO CONFIG VIEW */}
        {activeTab === 'casino' && (
             <CasinoSettings />
        )}

      </div>
    </div>
  );
}
