import { dbGet, dbList, dbSet } from './firebase';

export interface ProfileLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  discord?: string;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  accentColor: string | null;
  links: ProfileLinks;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

interface EventSummary {
  id: string;
  title: string;
  event_type: string;
  banner_color: string | null;
}

interface LeaderboardEntry {
  user_id: string | null;
  points: number;
  challenges_solved: number;
}

interface ChallengeInfo {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
}

interface SolveRecord {
  user_id: string | null;
  solved_at: string;
}

export interface EventResult {
  eventId: string;
  eventTitle: string;
  eventType: string;
  bannerColor: string | null;
  points: number;
  challengesSolved: number;
  rank: number;
  fieldSize: number;
}

export interface CtfStats {
  totalPoints: number;
  totalSolved: number;
  eventsPlayed: number;
  bestRank: number | null;
  topThreeFinishes: number;
  results: EventResult[];
}

export interface SolveActivity {
  date: string;
  eventId: string;
  eventTitle: string;
  challengeId: string;
  challengeTitle: string;
  category: string;
  difficulty: string;
  points: number;
}

export interface GlobalRank {
  rank: number;
  totalMembers: number;
}

export interface PortfolioData {
  stats: CtfStats;
  activity: SolveActivity[];
  globalRank: GlobalRank | null;
}

const PROFILE_PATH = (uid: string) => `profiles/${uid}`;

export async function getProfile(uid: string): Promise<UserProfile | null> {
  return dbGet<UserProfile>(PROFILE_PATH(uid));
}

export async function saveProfile(uid: string, profile: Omit<UserProfile, 'createdAt'>): Promise<UserProfile> {
  const existing = await getProfile(uid);
  const toSave: UserProfile = { ...profile, createdAt: existing?.createdAt || new Date().toISOString() };
  await dbSet(PROFILE_PATH(uid), toSave);
  return toSave;
}

/**
 * One coordinated pass over every event that produces everything the
 * portfolio page needs: this user's per-event results, their full solve
 * history (for the activity heatmap / feed / category breakdown), and
 * their points rank among every member who's ever scored. Fetches each
 * event's leaderboard, solve tree, and challenge list once (in parallel)
 * rather than re-fetching per feature — the naive version of this ended up
 * three separate functions each re-walking the event list.
 */
export async function getPortfolioData(uid: string): Promise<PortfolioData> {
  const events = await dbList<EventSummary>('events');

  const results: EventResult[] = [];
  const activity: SolveActivity[] = [];
  const globalTotals = new Map<string, number>();

  await Promise.all(
    events.map(async (ev) => {
      const [board, solvesTree, challenges] = await Promise.all([
        dbList<LeaderboardEntry>(`eventLeaderboard/${ev.id}`),
        dbGet<Record<string, Record<string, SolveRecord>>>(`eventSolves/${ev.id}`),
        dbList<ChallengeInfo>(`eventChallenges/${ev.id}`),
      ]);

      for (const entry of board) {
        if (!entry.user_id) continue;
        globalTotals.set(entry.user_id, (globalTotals.get(entry.user_id) || 0) + entry.points);
      }

      if (board.length > 0) {
        const sorted = [...board].sort((a, b) => b.points - a.points);
        const rankIndex = sorted.findIndex((entry) => entry.user_id === uid);
        if (rankIndex !== -1) {
          const entry = sorted[rankIndex];
          results.push({
            eventId: ev.id,
            eventTitle: ev.title,
            eventType: ev.event_type,
            bannerColor: ev.banner_color,
            points: entry.points,
            challengesSolved: entry.challenges_solved,
            rank: rankIndex + 1,
            fieldSize: sorted.length,
          });
        }
      }

      if (solvesTree) {
        const challengeMap = new Map(challenges.map((c) => [c.id, c]));
        for (const [challengeId, solvers] of Object.entries(solvesTree)) {
          for (const solve of Object.values(solvers)) {
            if (solve.user_id !== uid) continue;
            const ch = challengeMap.get(challengeId);
            activity.push({
              date: solve.solved_at,
              eventId: ev.id,
              eventTitle: ev.title,
              challengeId,
              challengeTitle: ch?.title || 'Challenge',
              category: ch?.category || 'Misc',
              difficulty: ch?.difficulty || 'medium',
              points: ch?.points ?? 0,
            });
          }
        }
      }
    })
  );

  results.sort((a, b) => b.points - a.points);
  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const totalSolved = results.reduce((sum, r) => sum + r.challengesSolved, 0);
  const ranks = results.map((r) => r.rank);

  const sortedGlobal = [...globalTotals.entries()].sort((a, b) => b[1] - a[1]);
  const globalIndex = sortedGlobal.findIndex(([id]) => id === uid);

  return {
    stats: {
      totalPoints,
      totalSolved,
      eventsPlayed: results.length,
      bestRank: ranks.length ? Math.min(...ranks) : null,
      topThreeFinishes: results.filter((r) => r.rank <= 3).length,
      results,
    },
    activity,
    globalRank: globalIndex !== -1 ? { rank: globalIndex + 1, totalMembers: sortedGlobal.length } : null,
  };
}
