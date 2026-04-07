import { cn } from '../lib/utils';
import { Shield, Swords, Star, Circle, User } from 'lucide-react';

export function RankBadge({ rank }: { rank: string }) {
  let color = 'bg-stone-900 text-stone-400 ring-stone-800';
  let Icon = User;

  switch (rank) {
    case 'IronHeart':
      color = 'bg-rose-950 text-rose-400 ring-rose-900';
      Icon = Star;
      break;
    case 'High Warden':
      color = 'bg-purple-950 text-purple-400 ring-purple-900';
      Icon = Shield;
      break;
    case 'Blade Master':
      color = 'bg-amber-950 text-amber-400 ring-amber-900';
      Icon = Swords;
      break;
    case 'Guardian':
      color = 'bg-blue-950 text-blue-400 ring-blue-900';
      Icon = Shield;
      break;
    case 'Gate Soldier':
      color = 'bg-green-950 text-green-400 ring-green-900';
      Icon = Circle;
      break;
    case 'Street Cleaner':
    default:
      color = 'bg-slate-900 text-slate-400 ring-slate-800';
      Icon = User;
      break;
  }

  return (
    <span className={cn(
      'inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 uppercase tracking-wider w-36',
      color
    )}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{rank || 'Unknown'}</span>
    </span>
  );
}
