// src/components/graph/LoadGraphModal.jsx
import React, { useEffect, useState } from "react";
import { listGraphs, loadGraph, deleteGraph } from "../../api/graphApi";

export default function LoadGraphModal({ onClose, onSelectGraph }) {
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setLoading(true);
    const res = await listGraphs();
    setLoading(false);

    if (!res.success) {
      alert("Failed to list saved graphs");
      return;
    }
    setGraphs(res.graphs || []);
  }

  async function handleLoad(id) {
    const res = await loadGraph(id);

    if (!res.success) {
      alert("Failed to load graph");
      return;
    }

    onSelectGraph(res); // send full payload back
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this graph?")) return;
    const res = await deleteGraph(id);
    if (res.success) loadList();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[99999] pointer-events-auto">
      <div className="bg-[#111] text-white rounded-lg w-[420px] p-4 shadow-xl border border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Load Saved Graph</h2>
          <button className="text-gray-400 hover:text-gray-200" onClick={onClose}>
            ✖
          </button>
        </div>

        {loading && <div className="text-gray-400 p-3">Loading…</div>}

        {!loading && graphs.length === 0 && (
          <div className="text-gray-500 p-3">No saved graphs.</div>
        )}

        {!loading && graphs.length > 0 && (
          <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {graphs.map((g) => (
              <div
                key={g.id}
                className="flex justify-between items-center bg-[#181818] rounded px-3 py-2 border border-gray-700"
              >
                <div>
                  <div className="font-semibold text-white">{g.name || "Untitled"}</div>
                  <div className="text-xs text-gray-400">Updated: {g.updated_at}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700"
                    onClick={() => handleLoad(g.id)}
                  >
                    Load
                  </button>

                  <button
                    className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-700"
                    onClick={() => handleDelete(g.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
