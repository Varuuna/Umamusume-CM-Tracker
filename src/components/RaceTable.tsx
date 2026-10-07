import { seriesVar } from "../model/colors";
import { positionIn } from "../model/stats";
import type { Race, Uma } from "../model/types";

type Props = {
  umas: Uma[];
  races: Race[];
  onDelete: (id: string) => void;
};

export function RaceTable({ umas, races, onDelete }: Props) {
  // Newest first, keeping the original race number.
  const rows = races.map((r, i) => ({ race: r, n: i + 1 })).reverse();

  return (
    <section className="card">
      <h2>Races ({races.length})</h2>
      {races.length === 0 ? (
        <div className="empty">No races yet.</div>
      ) : (
        <div className="race-table-scroll">
          <table className="race-table">
            <thead>
              <tr>
                <th>#</th>
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
