import type { LucideIcon } from 'lucide-react';
import { Flame, Target, Medal, Crown, Star, Sparkles, Trophy, TrendingUp, Layers, Skull, Moon, CalendarDays } from 'lucide-react';
import type { CtfStats, SolveActivity } from './profile';

export interface Achievement {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  test: (stats: CtfStats, activity: SolveActivity[]) => boolean;
}

export const achievements: Achievement[] = [
  { id: 'first-blood', icon: Flame, label: 'First Blood', description: 'Solve your first challenge', test: (s) => s.totalSolved >= 1 },
  { id: 'century', icon: Star, label: 'Century Club', description: 'Earn 100+ total points', test: (s) => s.totalPoints >= 100 },
  { id: 'podium', icon: Medal, label: 'Podium Finish', description: 'Place top 3 in any event', test: (s) => s.topThreeFinishes >= 1 },
  { id: 'regular', icon: Target, label: 'Regular', description: 'Compete in 3+ events', test: (s) => s.eventsPlayed >= 3 },
  { id: 'consistent', icon: CalendarDays, label: 'Consistent', description: 'Solve challenges on 3+ different days', test: (_s, a) => new Set(a.map((x) => x.date.slice(0, 10))).size >= 3 },
  { id: 'jack-of-all-trades', icon: Layers, label: 'Jack of All Trades', description: 'Solve challenges in 4+ categories', test: (_s, a) => new Set(a.map((x) => x.category)).size >= 4 },
  { id: 'marathon', icon: TrendingUp, label: 'Marathon', description: 'Solve 10+ challenges total', test: (s) => s.totalSolved >= 10 },
  { id: 'high-scorer', icon: Sparkles, label: 'High Scorer', description: 'Earn 500+ total points', test: (s) => s.totalPoints >= 500 },
  { id: 'night-owl', icon: Moon, label: 'Night Owl', description: 'Solve something between midnight and 4am', test: (_s, a) => a.some((x) => { const h = new Date(x.date).getHours(); return h >= 0 && h < 4; }) },
  { id: 'insane-solver', icon: Skull, label: 'Insane Solver', description: 'Solve an Insane-difficulty challenge', test: (_s, a) => a.some((x) => x.difficulty === 'insane') },
  { id: 'champion', icon: Crown, label: 'Champion', description: 'Finish #1 in an event', test: (s) => s.bestRank === 1 },
  { id: 'elite', icon: Trophy, label: 'Elite', description: 'Earn 1,000+ total points', test: (s) => s.totalPoints >= 1000 },
];

export function earnedAchievements(stats: CtfStats, activity: SolveActivity[]): Achievement[] {
  return achievements.filter((a) => a.test(stats, activity));
}
