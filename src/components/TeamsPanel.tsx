import { useState } from "react";
import { seriesVar } from "../model/colors";
import { type Action, defaultTeamName, isLineupTaken } from "../model/state";
import { type AppState, TEAM_SIZE } from "../model/types";

type Props = {
  state: AppState;
  dispatch: (a: Action) => void;
};

export function TeamsPanel({ state, dispatch }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const active = state.umas.filter((u) => !u.retired);
  const complete = picked.length === TEAM_SIZE;
  const duplicate = complete && isLineupTaken(state, picked);

  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < TEAM_SIZE ? [...p, id] : p,
    );

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || duplicate) return;
    dispatch({ type: "addTeam", memberIds: picked, name });
    setPicked([]);
    setName("");
  };

  const commitRename = () => {
    if (editing) dispatch({ type: "renameTeam", id: editing.id, name: editing.name });
    setEditing(null);
  };

  const hasRaces = (id: string) => state.races.some((r) => r.teamId === id);
  const umaOf = (id: string) => state.umas.find((u) => u.id === id);

  return (
    <section className="card">
      <h2>Teams</h2>
      {active.length < TEAM_SIZE ? (
        <div className="hint">Add at least {TEAM_SIZE} umas to the roster to build a team.</div>
      ) : (
        <form onSubmit={add}>
          <div className="team-pick" role="group" aria-label={`Pick ${TEAM_SIZE} team members`}>
            {active.map((u) => {
              const on = picked.includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  className={`chip-btn${on ? " on" : ""}`}
                  aria-pressed={on}
                  disabled={!on && complete}
                  onClick={() => toggle(u.id)}
                >
                  <span className="swatch" style={{ background: seriesVar(u.color) }} />
                  {u.name}
                </button>
              );
            })}
          </div>
          <div className="roster-add">
            <input
              type="text"
              placeholder={
                complete ? defaultTeamName(state, picked) : `Pick ${TEAM_SIZE - picked.length} more`
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Team name (optional)"
            />
            <button type="submit" disabled={!complete || duplicate}>
              Add team
            </button>
          </div>
          {duplicate && <div className="error">That lineup already exists.</div>}
        </form>
      )}

      {state.teams.length === 0 ? (
        <div className="hint">No teams yet.</div>
      ) : (
        <ul className="roster-list">
          {state.teams.map((t) => (
            <li key={t.id} className={t.retired ? "retired" : ""}>
              <span className="team-swatches" aria-hidden>
                {t.memberIds.map((id) => (
                  <span
                    key={id}
                    className="swatch"
                    style={{ background: seriesVar(umaOf(id)?.color ?? "") }}
                  />
                ))}
              </span>
              {editing?.id === t.id ? (
                <input
                  type="text"
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ id: t.id, name: e.target.value })}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  aria-label={`Rename ${t.name}`}
                />
              ) : (
                <span
                  className="name"
                  title={`${t.memberIds.map((id) => umaOf(id)?.name).join(" + ")} · double-click to rename`}
                  onDoubleClick={() => setEditing({ id: t.id, name: t.name })}
                >
                  {t.name}
                </span>
              )}
              <button onClick={() => dispatch({ type: "toggleRetireTeam", id: t.id })}>
                {t.retired ? "Restore" : "Retire"}
              </button>
              {!hasRaces(t.id) && (
                <button
                  className="link"
                  title="Delete (only possible before it has races)"
                  onClick={() => dispatch({ type: "deleteTeam", id: t.id })}
                  aria-label={`Delete ${t.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="hint">
        Pick {TEAM_SIZE} umas, then pick the team when entering a race. Older races can be tagged
        from the race table.
      </p>
    </section>
  );
}
