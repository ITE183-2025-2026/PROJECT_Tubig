// src/components/graph/GraphMap.jsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGraph } from "../../components/graph/GraphContext";

export default function GraphMap() {
  const { graphState, setGraphState } = useGraph();
  const { center, nodes, edges } = graphState;

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  // 1. Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map("graph-map-container").setView(
        [center.lat, center.lng],
        center.zoom
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      map.on("click", (e) => {
        const newIndex = graphState.nodes.length;
        const key = generateNodeName(newIndex);

        const newNode = {
          key,
          label: key.toUpperCase(),
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };

        setGraphState((prev) => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
        }));
      });

      mapRef.current = map;
    }
  }, []);

  // 2. If center changes (loaded graph), move view
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], center.zoom);
    }
  }, [center]);

  // 3. Draw nodes
  useEffect(() => {
    if (!mapRef.current) return;

    // cleanup old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    nodes.forEach((node) => {
      const marker = L.marker([node.lat, node.lng]).addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [nodes]);

  // 4. Draw edges
  useEffect(() => {
    if (!mapRef.current) return;

    polylinesRef.current.forEach((l) => l.remove());
    polylinesRef.current = [];

    edges.forEach((e) => {
      const from = nodes.find((n) => n.key === e.from);
      const to = nodes.find((n) => n.key === e.to);
      if (!from || !to) return;

      const line = L.polyline(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        { color: "cyan", weight: 4 }
      ).addTo(mapRef.current);

      polylinesRef.current.push(line);
    });
  }, [edges, nodes]);

  // Replace your node name generator
  function generateNodeName(i) {
    let s = "";
    while (i >= 0) {
      s = String.fromCharCode((i % 26) + 97) + s;
      i = Math.floor(i / 26) - 1;
    }
    return s;
  }

  return <div id="graph-map-container" className="w-full h-full" />;
}
