import { useRef } from "react";
import type { Action } from "../model/state";
import { parseState } from "../model/storage";
import type { AppState } from "../model/types";

type Props = {
  state: AppState;
  dispatch: (a: Action) => void;
};

export function DataMenu({ state, dispatch }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isEmpty = state.umas.length === 0 && state.races.length === 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cm-practice-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    let parsed: AppState | null = null;
    try {
      parsed = parseState(JSON.parse(await file.text()));
    } catch {
      parsed = null;
    }
    if (!parsed) {
      alert("That file is not a valid CM Practice Tracker export.");
      return;
    }
    const msg = `Import ${parsed.umas.length} umas and ${parsed.races.length} races? This replaces the current data.`;
    if (isEmpty || confirm(msg)) dispatch({ type: "importState", state: parsed });
  };

  return (
    <div className="toolbar">
      <button onClick={exportJson} disabled={isEmpty}>
        Export JSON
      </button>
      <button onClick={() => fileRef.current?.click()}>Import JSON</button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importJson(f);
          e.target.value = "";
        }}
      />
      <button
        className="danger"
        disabled={isEmpty}
        onClick={() => {
          if (confirm("Clear all umas and races? Export first if you want a backup.")) {
            dispatch({ type: "clearAll" });
          }
        }}
      >
        Clear all
      </button>
    </div>
  );
}
