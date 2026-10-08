import { useEffect, useMemo, useReducer, useState } from "react";
import { DataMenu } from "./components/DataMenu";
import { RaceEntry } from "./components/RaceEntry";
import { RaceTable } from "./components/RaceTable";
import { RosterPanel } from "./components/RosterPanel";
import { SummaryTable } from "./components/SummaryTable";
import { TeamSummaryTable } from "./components/TeamSummaryTable";
import { TeamsPanel } from "./components/TeamsPanel";
import { PositionDistChart } from "./components/charts/PositionDistChart";
import { TrendChart } from "./components/charts/TrendChart";
import { WinRateChart } from "./components/charts/WinRateChart";
import { reducer } from "./model/state";
import { type TeamFilter, filterByTeam, perUmaStats, teamStats } from "./model/stats";
import { loadState, saveState } from "./model/storage";

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [rawFilter, setFilter] = useState<TeamFilter>("all");

  useEffect(() => saveState(state), [state]);

  // A filter on a team that no longer exists falls back to all races.
  const filter =
    rawFilter === "all" || rawFilter === "none" || state.teams.some((t) => t.id === rawFilter)
      ? rawFilter
      : "all";

  // Number races before filtering so the race table keeps global race numbers.
  const rows = useMemo(
    () => filterByTeam(state.races.map((race, i) => ({ race, n: i + 1 })), filter),
    [state.races, filter],
  );
  const races = useMemo(() => rows.map((r) => r.race), [rows]);

  const stats = useMemo(() => perUmaStats(state.umas, races), [state.umas, races]);
  const teams = useMemo(() => teamStats(state.teams, state.races), [state.teams, state.races]);
  const unassigned = state.races.filter((r) => !r.teamId).length;

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>CM Practice Tracker</h1>
          <div className="meta">
            {state.races.length} races · {state.umas.length} umas · {state.teams.length} teams ·
            saved in this browser
          </div>
        </div>
        <DataMenu state={state} dispatch={dispatch} />
      </header>

      <div className="grid-top">
        <RaceEntry
          umas={state.umas}
          teams={state.teams}
          raceNumber={state.races.length + 1}
          onSave={(order, teamId) => dispatch({ type: "addRace", order, teamId })}
        />
        <div className="stack">
          <RosterPanel state={state} dispatch={dispatch} />
          <TeamsPanel state={state} dispatch={dispatch} />
        </div>
      </div>

      <TeamSummaryTable stats={teams} umas={state.umas} filter={filter} onFilter={setFilter} />

      {state.teams.length > 0 && (
        <WinRateChart
          stats={teams}
          title="Team win % and top-3 %"
          labelWidth={200}
          emptyText="No races tagged with a team yet."
        />
      )}

      <div className="filter-bar card">
        <label>
          Show races
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All races</option>
            <option value="none">No team ({unassigned})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.races})
              </option>
            ))}
          </select>
        </label>
        <span className="hint">
          {filter === "all"
            ? "Uma stats, charts and the race table cover all races."
            : `Uma stats, charts and the race table cover ${races.length} of ${state.races.length} races.`}
        </span>
        {filter !== "all" && <button onClick={() => setFilter("all")}>Show all</button>}
      </div>

      <SummaryTable stats={stats} />

      <div className="grid-2">
        <WinRateChart stats={stats} />
        <PositionDistChart umas={state.umas} races={races} />
      </div>

      <TrendChart umas={state.umas} races={races} />

      <RaceTable
        umas={state.umas}
        teams={state.teams}
        rows={rows}
        total={state.races.length}
        onDelete={(id) => dispatch({ type: "deleteRace", id })}
        onSetTeam={(raceId, teamId) => dispatch({ type: "setRaceTeam", raceId, teamId })}
      />
    </div>
  );
}
