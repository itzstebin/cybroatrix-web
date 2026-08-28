import type { LucideIcon } from 'lucide-react';
import { Globe, Lock, Search, Zap, Terminal, Eye, Wifi, Hash } from 'lucide-react';

export const difficulties = ['easy', 'medium', 'hard', 'insane'];

export const difficultyConfig: Record<string, { color: string; label: string; dot: string }> = {
  easy: { color: 'text-emerald-400', label: 'Easy', dot: 'bg-emerald-400' },
  medium: { color: 'text-amber-400', label: 'Medium', dot: 'bg-amber-400' },
  hard: { color: 'text-red-400', label: 'Hard', dot: 'bg-red-400' },
  insane: { color: 'text-purple-400', label: 'Insane', dot: 'bg-purple-400' },
};

export const categories = ['Web', 'Crypto', 'Forensics', 'Pwn', 'Reverse', 'OSINT', 'Network', 'Misc'];

export const categoryConfig: Record<string, { color: string; icon: LucideIcon }> = {
  Web: { color: 'text-blue-400 border-blue-500/30 bg-blue-950/10', icon: Globe },
  Crypto: { color: 'text-purple-400 border-purple-500/30 bg-purple-950/10', icon: Lock },
  Forensics: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10', icon: Search },
  Pwn: { color: 'text-red-400 border-red-500/30 bg-red-950/10', icon: Zap },
  Reverse: { color: 'text-amber-400 border-amber-500/30 bg-amber-950/10', icon: Terminal },
  OSINT: { color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10', icon: Eye },
  Network: { color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/10', icon: Wifi },
  Misc: { color: 'text-white/40 border-white/10 bg-white/5', icon: Hash },
};
