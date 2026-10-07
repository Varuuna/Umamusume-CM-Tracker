import { useState } from "react";
import { seriesVar } from "../model/colors";
import { type Action, isNameTaken, normalizeName } from "../model/state";
import type { AppState } from "../model/types";

type Props = {
  state: AppState;
  dispatch: (a: Action) => void;
};

export function RosterPanel({ state, dispatch }: Props) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const trimmed = normalizeName(name);
  const duplicate = trimmed !== "" && isNameTaken(state, trimmed);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || duplicate) return;
    dispatch({ type: "addUma", name: trimmed });
    setName("");
  };

  const commitRename = () => {
    if (editing) dispatch({ type: "renameUma", id: editing.id, name: editing.name });
    setEditing(null);
  };

  const hasRaces = (id: string) => state.races.some((r) => r.order.includes(id));

  return (
    <section className="card">
      <h2>Roster</h2>
      <form className="roster-add" onSubmit={add}>
        <input
          type="text"
          placeholder="Uma name, e.g. Oguri Cap (mine)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New uma name"
        />
        <button type="submit" disabled={!trimmed || duplicate}>
          Add
        </button>
      </form>
      {duplicate && <div className="error">That name is already in the roster.</div>}

      {state.umas.length === 0 ? (
        <div className="hint">No umas yet.</div>
      ) : (
        <ul className="roster-list">
          {state.umas.map((u) => (
            <li key={u.id} className={u.retired ? "retired" : ""}>
              <span className="swatch" style={{ background: seriesVar(u.color) }} />
              {editing?.id === u.id ? (
                <input
                  type="text"
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ id: u.id, name: e.target.value })}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  aria-label={`Rename ${u.name}`}
                />
              ) : (
                <span
                  className="name"
                  title="Double-click to rename"
                  onDoubleClick={() => setEditing({ id: u.id, name: u.name })}
                >
                  {u.name}
                </span>
              )}
              <button onClick={() => dispatch({ type: "toggleRetire", id: u.id })}>
                {u.retired ? "Restore" : "Retire"}
              </button>
              {!hasRaces(u.id) && (
                <button
                  className="link"
                  title="Delete (only possible before it has results)"
                  onClick={() => dispatch({ type: "deleteUma", id: u.id })}
                  aria-label={`Delete ${u.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="hint">
        Double-click a name to rename. Retired umas are hidden from entry but keep their results.
      </p>
    </section>
  );
}
