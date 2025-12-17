// src/context/GraphContext.jsx
import React, { createContext, useContext, useState } from "react";

const GraphContext = createContext(null);

export function GraphProvider({ children }) {
  const [graphState, setGraphState] = useState({
    graph_id: null,
    name: "",
    isDirected: false,
    center: { lat: 8.22, lng: 124.24, zoom: 14, rotation: 0, tilt: 0 },
    nodes: [],
    edges: [],
  });

  function applyLoadedGraph({ graph, nodes, edges }) {
    setGraphState({
      graph_id: graph.id,
      name: graph.name,
      isDirected: !!graph.is_directed,
      center: {
        lat: graph.center_lat ?? 8.22,
        lng: graph.center_lng ?? 124.24,
        zoom: graph.zoom ?? 14,
        rotation: graph.rotation ?? 0,
        tilt: graph.tilt ?? 0,
      },
      nodes,
      edges,
    });
  }

  return (
    <GraphContext.Provider value={{ graphState, setGraphState, applyLoadedGraph }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  return useContext(GraphContext);
}
