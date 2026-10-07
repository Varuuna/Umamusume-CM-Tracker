import { useEffect, useMemo, useReducer } from "react";
import { DataMenu } from "./components/DataMenu";
import { RaceEntry } from "./components/RaceEntry";
import { RaceTable } from "./components/RaceTable";
import { RosterPanel } from "./components/RosterPanel";
import { SummaryTable } from "./components/SummaryTable";
import { PositionDistChart } from "./components/charts/PositionDistChart";
import { TrendChart } from "./components/charts/TrendChart";
import { WinRateChart } from "./components/charts/WinRateChart";
import { reducer } from "./model/state";
import { perUmaStats } from "./model/stats";
import { loadState, saveState } from "./model/storage";

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => saveState(state), [state]);

  const stats = useMemo(() => perUmaStats(state.umas, state.races), [state]);

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>CM Practice Tracker</h1>
          <div className="meta">
            {state.races.length} races · {state.umas.length} umas · saved in this browser
          </div>
        </div>
        <DataMenu state={state} dispatch={dispatch} />
      </header>

      <div className="grid-top">
        <RaceEntry
          umas={state.umas}
          raceNumber={state.races.length + 1}
          onSave={(order) => dispatch({ type: "addRace", order })}
        />
        <RosterPanel state={state} dispatch={dispatch} />
      </div>

      <SummaryTable stats={stats} />

      <div className="grid-2">
        <WinRateChart stats={stats} />
        <PositionDistChart umas={state.umas} races={state.races} />
      </div>

      <TrendChart umas={state.umas} races={state.races} />

      <RaceTable
        umas={state.umas}
        races={state.races}
        onDelete={(id) => dispatch({ type: "deleteRace", id })}
      />
    </div>
  );
}
