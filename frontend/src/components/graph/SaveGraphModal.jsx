import React, { useState } from "react";
import { saveGraph } from "../../api/graphApi";

export default function SaveGraphModal({ onClose, getGraphState }) {
  const [name, setName] = useState("");

  async function handleSave() {
  const graph = getGraphState();

  // Default center fallback for brand new projects
  const center = graph.center && graph.center.lat !== undefined
    ? graph.center
    : { lat: 8.224, lng: 124.245, zoom: 14, rotation: 0, tilt: 0 };

  const payload = {
    graph_id: graph.graph_id || null,
    name,
    is_directed: graph.isDirected ? 1:0 ,

    // Use SAFE center values
    center_lat: center.lat,
    center_lng: center.lng,
    zoom: center.zoom,
    rotation: center.rotation || 0,
    tilt: center.tilt || 0,

    // Backend expects 'key', not 'id'
    nodes: graph.nodes.map(n => ({
      key: n.key,
      label: n.label ?? n.key.toUpperCase(),
      lat: n.lat,
      lng: n.lng,
      meta: n.meta ?? null
    })),

    edges: graph.edges.map(e => ({
      from: e.from,
      to: e.to,
      weight: e.weight ?? null,
      properties: e.properties ?? null
    }))
  };

  await saveGraph(payload);
  onClose(true);
}


  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111] p-6 rounded-xl w-80 border border-gray-700">
        <h2 className="text-xl mb-4">Save Graph</h2>

        <input
          className="w-full p-2 bg-[#222] border border-gray-700 rounded mb-4"
          placeholder="Graph name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button className="px-3 py-1 bg-gray-700 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="px-3 py-1 bg-blue-600 rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
