import { useState } from "react";
import { num, pct } from "../format";
import { seriesVar } from "../model/colors";
import type { TeamFilter, TeamStats } from "../model/stats";
import type { Uma } from "../model/types";

type Key = "name" | "races" | "wins" | "winPct" | "top3" | "top3Pct" | "bestAvg" | "avgCombined";

type Column = {
  key: Key;
  label: string;
  title?: string;
  fmt: (s: TeamStats) => string;
  asc?: boolean;
};

const COLUMNS: Column[] = [
  { key: "name", label: "Team", fmt: (s) => s.name, asc: true },
  { key: "races", label: "Races", fmt: (s) => String(s.races) },
  {
    key: "wins",
    label: "Team wins",
    title: "Races where any member finished 1st",
    fmt: (s) => String(s.wins),
  },
  { key: "winPct", label: "Win %", fmt: (s) => pct(s.winPct) },
  {
    key: "top3",
    label: "Top 3",
    title: "Races with at least one member in the top 3",
    fmt: (s) => String(s.top3),
  },
  { key: "top3Pct", label: "Top 3 %", fmt: (s) => pct(s.top3Pct) },
  {
    key: "bestAvg",
    label: "Best finisher avg",
    title: "Average position of the best-placed member",
    fmt: (s) => num(s.bestAvg),
    asc: true,
  },
  {
    key: "avgCombined",
    label: "Avg combined",
    title: "Average of the members' mean position",
    fmt: (s) => num(s.avgCombined),
    asc: true,
  },
];

type Props = {
  stats: TeamStats[];
  umas: Uma[];
  filter: TeamFilter;
  onFilter: (f: TeamFilter) => void;
};

export function TeamSummaryTable({ stats, umas, filter, onFilter }: Props) {
  const [sort, setSort] = useState<{ key: Key; asc: boolean }>({ key: "winPct", asc: false });

  const sorted = [...stats].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    // Teams without data always sink to the bottom.
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    const c = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
    return sort.asc ? c : -c;
  });

  const onSort = (key: Key, defaultAsc = false) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: defaultAsc }));

  const umaOf = (id: string) => umas.find((u) => u.id === id);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Team summary</h2>
        <span className="hint">Click a team to filter everything below to its races.</span>
      </div>
      {stats.length === 0 ? (
        <div className="empty">No teams yet. Create one in the Teams panel.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="sortable"
                    title={c.title}
                    onClick={() => onSort(c.key, c.asc)}
                    aria-sort={
                      sort.key === c.key ? (sort.asc ? "ascending" : "descending") : undefined
                    }
                  >
                    {c.label}
                    {sort.key === c.key ? (sort.asc ? " ▲" : " ▼") : ""}
                  </th>
                ))}
                <th className="member-wins-col">Wins by member</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr
                  key={s.id}
                  className={`clickable${s.retired ? " retired" : ""}${filter === s.id ? " selected" : ""}`}
                  onClick={() => onFilter(filter === s.id ? "all" : s.id)}
                  aria-selected={filter === s.id}
                >
                  {COLUMNS.map((c) =>
                    c.key === "name" ? (
                      <td key={c.key}>
                        <span className="name-cell">
                          {s.name}
                          {s.retired && <span className="hint">(retired)</span>}
                        </span>
                      </td>
                    ) : (
                      <td key={c.key}>{c.fmt(s)}</td>
                    ),
                  )}
                  <td className="member-wins-col">
                    <span className="member-wins">
                      {s.memberWins.map((m) => {
                        const u = umaOf(m.umaId);
                        return (
                          <span key={m.umaId} className={m.wins === 0 ? "muted" : ""}>
                            <span className="swatch" style={{ background: seriesVar(u?.color ?? "") }} />
                            {u?.name} {m.wins}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
