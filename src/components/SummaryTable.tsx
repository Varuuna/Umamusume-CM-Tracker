import { useState } from "react";
import { num, pct } from "../format";
import { seriesVar } from "../model/colors";
import type { UmaStats } from "../model/stats";

type Key = Exclude<keyof UmaStats, "id" | "color" | "retired">;

const COLUMNS: { key: Key; label: string; fmt: (s: UmaStats) => string; asc?: boolean }[] = [
  { key: "name", label: "Uma", fmt: (s) => s.name, asc: true },
  { key: "races", label: "Races", fmt: (s) => String(s.races) },
  { key: "wins", label: "Wins", fmt: (s) => String(s.wins) },
  { key: "winPct", label: "Win %", fmt: (s) => pct(s.winPct) },
  { key: "top3", label: "Top 3", fmt: (s) => String(s.top3) },
  { key: "top3Pct", label: "Top 3 %", fmt: (s) => pct(s.top3Pct) },
  { key: "avg", label: "Avg finish", fmt: (s) => num(s.avg), asc: true },
  { key: "best", label: "Best", fmt: (s) => num(s.best, 0), asc: true },
  { key: "worst", label: "Worst", fmt: (s) => num(s.worst, 0), asc: true },
];

export function SummaryTable({ stats }: { stats: UmaStats[] }) {
  const [sort, setSort] = useState<{ key: Key; asc: boolean }>({ key: "winPct", asc: false });

  const sorted = [...stats].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    // Umas without data always sink to the bottom.
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    const c = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
    return sort.asc ? c : -c;
  });

  const onSort = (key: Key, defaultAsc = false) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: defaultAsc }));

  return (
    <section className="card">
      <h2>Summary</h2>
      {stats.length === 0 ? (
        <div className="empty">No umas yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="sortable"
                    onClick={() => onSort(c.key, c.asc)}
                    aria-sort={
                      sort.key === c.key ? (sort.asc ? "ascending" : "descending") : undefined
                    }
                  >
                    {c.label}
                    {sort.key === c.key ? (sort.asc ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className={s.retired ? "retired" : ""}>
                  {COLUMNS.map((c) =>
                    c.key === "name" ? (
                      <td key={c.key}>
                        <span className="name-cell">
                          <span className="swatch" style={{ background: seriesVar(s.color) }} />
                          {s.name}
                          {s.retired && <span className="hint">(retired)</span>}
                        </span>
                      </td>
                    ) : (
                      <td key={c.key}>{c.fmt(s)}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
