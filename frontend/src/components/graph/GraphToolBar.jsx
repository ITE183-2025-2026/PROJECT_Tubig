// src/components/graph/GraphToolbar.jsx
import React from "react";

export default function GraphToolbar({
  mode,
  setMode,
  onSaveClick,
  onLoadClick,
  isDirected,
  setIsDirected,
  onRunDijkstra,
  onRunMST,
  disableDirected,
}) {
  return (
    <div
      className="graph-toolbar ui-layer absolute top-4 right-4 flex gap-2 p-2 rounded z-[1000]"
      style={{ pointerEvents: "auto" }}
    >
      <button
        onClick={() => setMode("pan")}
        className={`px-3 py-2 rounded ${mode === "pan" ? "bg-blue-700" : "bg-gray-800"}`}
      >
        Pan
      </button>

      <button
        onClick={() => setMode("add-node")}
        className={`px-3 py-2 rounded ${mode === "add-node" ? "bg-blue-700" : "bg-gray-800"}`}
      >
        Add Node
      </button>

      <button
        onClick={() => setMode("add-edge")}
        className={`px-3 py-2 rounded ${mode === "add-edge" ? "bg-blue-700" : "bg-gray-800"}`}
      >
        Add Edge
      </button>

      <button
        onClick={() => setMode((m) => (m === "move" ? "pan" : "move"))}
        className={`px-3 py-2 rounded ${mode === "move" ? "bg-blue-700" : "bg-gray-800"}`}
      >
        {mode === "move" ? "Moving" : "Move Node"}
      </button>

      <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-800">
        <input
          type="checkbox"
          checked={isDirected}
          disabled={disableDirected}
          onChange={(e) => setIsDirected(e.target.checked)}
        />
        Directed
      </label>

      <button onClick={onSaveClick} className="px-3 py-2 rounded bg-green-600">
        Save
      </button>

      <button onClick={onLoadClick} className="px-3 py-2 rounded bg-teal-600">
        Load
      </button>

      <button
        onClick={onRunDijkstra}
        className="px-3 py-2 rounded bg-purple-600"
      >
        Dijkstra
      </button>

      <button
        onClick={onRunMST}
        className="px-3 py-2 rounded bg-orange-600"
      >
        MST
      </button>
    </div>
  );
}
