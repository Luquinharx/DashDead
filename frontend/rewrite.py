import re

with open(r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\components\Dashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

header_match = re.search(r'<thead.*?</thead>', text, re.DOTALL)
if header_match:
    new_header = '''<thead className="text-xs text-stone-500 uppercase bg-black border-b border-white/10 font-serif tracking-widest">
                <tr>
                  <th className="px-6 py-5 font-bold cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('username')}>Username <SortIcon columnKey="username" /></th>
                  <th className="px-6 py-5 font-bold text-center hidden md:table-cell cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('rank')}>Rank <SortIcon columnKey="rank" /></th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('dailyLoot')}>Daily Loot <SortIcon columnKey="dailyLoot" /></th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('weeklyToDate')}>Weekly Loot <SortIcon columnKey="weeklyToDate" /></th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('clanWeeklyLoot')}>Clan Weekly Loot <SortIcon columnKey="clanWeeklyLoot" /></th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('currentAll')}>All Time Loot <SortIcon columnKey="currentAll" /></th>
                  <th className="px-6 py-5 font-bold text-right cursor-pointer hover:text-white transition-colors select-none group focus:outline-none" onClick={() => handleSort('streak')}>WK Streak <SortIcon columnKey="streak" /></th>
                </tr>
              </thead>'''
    text = text.replace(header_match.group(0), new_header)


body_match = re.search(r'<tbody className="divide-y divide-white/5 font-mono">.*?</tbody>', text, re.DOTALL)
if body_match:
    new_body = '''<tbody className="divide-y divide-white/5 font-mono">
                {paginatedData.map((r, idx) => {
                  const absoluteIdx = (currentPage - 1) * itemsPerPage + idx;
                  const profile = profiles.find((p) => p.username.toLowerCase() === r.username.toLowerCase());
                  
                  const username = r.username;
                  const rank = r.rank;
                  const dailyLoot = Number(r.dailyLoot || 0);
                  const weeklyLoot = Number(profile?.weekly_loots || 0);
                  const clanWeeklyLoot = Number(profile?.clan_weekly_loots || 0);
                  const allTimeLoot = Number(profile?.all_time_loots || r.currentAll || 0);
                  const streak = Number(r.streak || 0);
                  
                  const isPower = clanWeeklyLoot >= 5000;
                  const isClanEventHighlight = clanWeeklyLoot > 0 ? true : false;
                  
                  const dlText = (dailyLoot >= 0 ? '+' : '') + dailyLoot.toLocaleString('pt-BR');
                  const stText = (streak > 0 ? '+' + streak : streak.toString());

                  return (
                    <tr key={username} className={cn(
                        "transition-colors hover:bg-white/5",
                         isClanEventHighlight && "bg-red-950/10 hover:bg-red-950/20"
                      )}>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap flex items-center gap-3">
                        <span className="text-stone-600 w-6 text-xs text-right font-serif">{absoluteIdx + 1}.</span>
                        <Link to={`/dashboard?user=${encodeURIComponent(username)}`} className="tracking-wide hover:text-red-500 hover:underline transition-all">
                            {username}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center text-stone-300 hidden md:table-cell">
                        <RankBadge rank={rank} />
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold",
                        dailyLoot > 0 ? "text-emerald-500" : dailyLoot < 0 ? "text-red-500" : "text-stone-600"
                      )}>
                        {dlText}
                      </td>
                      <td className="px-6 py-4 text-right text-stone-400">
                        {weeklyLoot.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right text-stone-300 flex justify-end items-center gap-2">
                        {isClanEventHighlight && <Flame className="w-4 h-4 text-orange-500" />}
                        {!isClanEventHighlight && isPower && <span className="text-yellow-400 text-sm">⚡</span>}
                        {clanWeeklyLoot.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right text-stone-300 font-bold">
                        {allTimeLoot.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-xs font-bold min-w-[2.5rem] tracking-wider border",
                          streak > 0 ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/30" : streak < 0 ? "bg-red-950/30 text-red-500 border-red-900/30" : "bg-stone-900 text-stone-600 border-stone-800"
                        )}>
                          {stText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-stone-600 font-serif uppercase tracking-widest">
                      Não há contas para exibir.
                    </td>
                  </tr>
                )}
              </tbody>'''
    text = text.replace(body_match.group(0), new_body)

sort_match = re.search(r'let av = 0, bv = 0;.*?return sortDesc \? \(bv \- av\) : \(av \- bv\);', text, re.DOTALL)
if sort_match:
    new_sort = '''let av: number | string = 0, bv: number | string = 0;
      const profileA = profiles.find(p => p.username.toLowerCase() === a.username.toLowerCase());
      const profileB = profiles.find(p => p.username.toLowerCase() === b.username.toLowerCase());
      
      const aSortKeyStr = String(sortKey);
      
      if (aSortKeyStr === 'username' || aSortKeyStr === 'rank') {
         av = String(a[aSortKeyStr as keyof MemberData] || "").toLowerCase();
         bv = String(b[aSortKeyStr as keyof MemberData] || "").toLowerCase();
         return sortDesc ? (av < bv ? 1 : av > bv ? -1 : 0) : (av > bv ? 1 : av < bv ? -1 : 0);
      } else if (aSortKeyStr === 'currentAll') {
        av = Number(profileA?.all_time_loots || a.currentAll || 0);
        bv = Number(profileB?.all_time_loots || b.currentAll || 0);
      } else if (aSortKeyStr === 'weeklyToDate') {
        av = Number(profileA?.weekly_loots || a.weeklyToDate || 0);
        bv = Number(profileB?.weekly_loots || b.weeklyToDate || 0);
      } else if (aSortKeyStr === 'clanWeeklyLoot') {
        av = Number(profileA?.clan_weekly_loots || 0);
        bv = Number(profileB?.clan_weekly_loots || 0);
      } else if (aSortKeyStr === 'dailyLoot') {
        av = Number(a.dailyLoot || 0);
        bv = Number(b.dailyLoot || 0);
      } else if (aSortKeyStr === 'streak') {
        av = Number(a.streak || 0);
        bv = Number(b.streak || 0);
      } else {
        av = Number(a[aSortKeyStr as keyof MemberData] || 0);
        bv = Number(b[aSortKeyStr as keyof MemberData] || 0);
      }
      return sortDesc ? (Number(bv) - Number(av)) : (Number(av) - Number(bv));'''
    text = text.replace(sort_match.group(0), new_sort)

with open(r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\components\Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
