import type { Race, Uma } from "./types";

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
