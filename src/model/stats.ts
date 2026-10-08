import type { Race, Team, Uma } from "./types";

export type UmaStats = {
  id: string;
  name: string;
  color: string;
  retired: boolean;
  races: number;
  wins: number;
  winPct: number | null;
  top3: number;
  top3Pct: number | null;
  avg: number | null;
  best: number | null;
  worst: number | null;
};

/** 1-based finishing position, or null if the uma did not run. */
export function positionIn(race: Race, umaId: string): number | null {
  const i = race.order.indexOf(umaId);
  return i === -1 ? null : i + 1;
}

export function perUmaStats(umas: Uma[], races: Race[]): UmaStats[] {
  return umas.map((u) => {
    const positions = races
      .map((r) => positionIn(r, u.id))
      .filter((p): p is number => p !== null);
    const n = positions.length;
    const wins = positions.filter((p) => p === 1).length;
    const top3 = positions.filter((p) => p <= 3).length;
    return {
      id: u.id,
      name: u.name,
      color: u.color,
      retired: u.retired,
      races: n,
      wins,
      winPct: n ? wins / n : null,
      top3,
      top3Pct: n ? top3 / n : null,
      avg: n ? positions.reduce((a, b) => a + b, 0) / n : null,
      best: n ? Math.min(...positions) : null,
      worst: n ? Math.max(...positions) : null,
    };
  });
}

export function maxFieldSize(races: Race[]): number {
  return races.reduce((m, r) => Math.max(m, r.order.length), 0);
}

export type Distribution = {
  id: string;
  name: string;
  races: number;
  /** counts[i] = number of times finished in position i + 1 */
  counts: number[];
};

export function positionDistribution(umas: Uma[], races: Race[]): Distribution[] {
  const max = maxFieldSize(races);
  return umas.map((u) => {
    const counts = Array.from({ length: max }, () => 0);
    let n = 0;
    for (const r of races) {
      const p = positionIn(r, u.id);
      if (p !== null) {
        counts[p - 1]++;
        n++;
      }
    }
    return { id: u.id, name: u.name, races: n, counts };
  });
}

export type TrendMode = "cumulative" | "rolling";
export type TrendPoint = { race: number; [umaId: string]: number | null };

/**
 * One point per race (race = 1-based race number). Each uma id key holds its win rate at that race:
 * - cumulative: over all races it has run so far
 * - rolling: over the last `window` races it has run
 * null until the uma has run at least once.
 */
export function winTrend(umas: Uma[], races: Race[], mode: TrendMode, window = 20): TrendPoint[] {
  const history = new Map<string, boolean[]>(umas.map((u) => [u.id, []]));
  const size = Math.max(1, Math.floor(window));
  return races.map((r, i) => {
    const point: TrendPoint = { race: i + 1 };
    for (const u of umas) {
      const h = history.get(u.id)!;
      const p = positionIn(r, u.id);
      if (p !== null) h.push(p === 1);
      const sample = mode === "rolling" ? h.slice(-size) : h;
      point[u.id] = sample.length ? sample.filter(Boolean).length / sample.length : null;
    }
    return point;
  });
}

export type TeamStats = {
  id: string;
  name: string;
  retired: boolean;
  memberIds: string[];
  races: number;
  /** Races where any member finished 1st. */
  wins: number;
  winPct: number | null;
  /** Races where at least one member finished top 3. */
  top3: number;
  top3Pct: number | null;
  /** Average over races of the best-placed member's position. */
  bestAvg: number | null;
  /** Average over races of the mean position of the members who placed. */
  avgCombined: number | null;
  /** Wins per member within this team's races, in member order. */
  memberWins: { umaId: string; wins: number }[];
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Per-team stats over the races tagged with that team. Untagged races are ignored. */
export function teamStats(teams: Team[], races: Race[]): TeamStats[] {
  return teams.map((t) => {
    const own = races.filter((r) => r.teamId === t.id);
    const memberWins = t.memberIds.map((umaId) => ({ umaId, wins: 0 }));
    const best: number[] = [];
    const combined: number[] = [];
    let wins = 0;
    let top3 = 0;
    for (const r of own) {
      const positions = t.memberIds
        .map((id) => positionIn(r, id))
        .filter((p): p is number => p !== null);
      const winner = memberWins.find((m) => m.umaId === r.order[0]);
      if (winner) {
        winner.wins++;
        wins++;
      }
      if (positions.length === 0) continue;
      const b = Math.min(...positions);
      if (b <= 3) top3++;
      best.push(b);
      combined.push(mean(positions)!);
    }
    const n = own.length;
    return {
      id: t.id,
      name: t.name,
      retired: t.retired,
      memberIds: t.memberIds,
      races: n,
      wins,
      winPct: n ? wins / n : null,
      top3,
      top3Pct: n ? top3 / n : null,
      bestAvg: mean(best),
      avgCombined: mean(combined),
      memberWins,
    };
  });
}

/** Team filter value: all races, races without a team, or one team's id. */
export type TeamFilter = "all" | "none" | string;

export function filterByTeam<T extends { race: Race }>(rows: T[], filter: TeamFilter): T[] {
  if (filter === "all") return rows;
  if (filter === "none") return rows.filter((x) => !x.race.teamId);
  return rows.filter((x) => x.race.teamId === filter);
}
