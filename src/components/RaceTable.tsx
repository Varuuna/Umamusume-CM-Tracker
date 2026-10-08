import { seriesVar } from "../model/colors";
import { positionIn } from "../model/stats";
import type { Race, Team, Uma } from "../model/types";

type Props = {
  umas: Uma[];
  teams: Team[];
  /** Races to show, each with its original (global) race number. */
  rows: { race: Race; n: number }[];
  total: number;
  onDelete: (id: string) => void;
  onSetTeam: (raceId: string, teamId: string | null) => void;
};

export function RaceTable({ umas, teams, rows: shown, total, onDelete, onSetTeam }: Props) {
  // Newest first, keeping the original race number.
  const rows = [...shown].reverse();

  return (
    <section className="card">
      <h2>Races ({shown.length === total ? total : `${shown.length} of ${total}`})</h2>
      {shown.length === 0 ? (
        <div className="empty">{total === 0 ? "No races yet." : "No races for this filter."}</div>
      ) : (
        <div className="race-table-scroll">
          <table className="race-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="team-col">Team</th>
                {umas.map((u) => (
                  <th key={u.id} className={`uma-col${u.retired ? " retired" : ""}`}>
                    <span className="name-cell">
                      <span className="swatch" style={{ background: seriesVar(u.color) }} />
                      {u.name}
                    </span>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ race, n }) => (
                <tr key={race.id}>
                  <td>{n}</td>
                  <td className="team-col">
                    <select
                      value={race.teamId ?? ""}
                      onChange={(e) => onSetTeam(race.id, e.target.value || null)}
                      aria-label={`Team for race ${n}`}
                    >
                      <option value="">—</option>
                      {teams
                        .filter((t) => !t.retired || t.id === race.teamId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  {umas.map((u) => {
                    const p = positionIn(race, u.id);
                    return (
                      <td key={u.id} className={`pos${p !== null && p <= 3 ? ` p${p}` : ""}`}>
                        {p ?? ""}
                      </td>
                    );
                  })}
                  <td>
                    <button
                      className="link"
                      title="Delete race"
                      aria-label={`Delete race ${n}`}
                      onClick={() => {
                        if (confirm(`Delete race #${n}?`)) onDelete(race.id);
                      }}
                    >
                      ✕
                    </button>
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
