// src/pages/MapPage.jsx
import React, { useCallback, useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Sidebar from "../components/Sidebar";
// NOTE: file name/casing — make sure component file is GraphToolbar.jsx
import GraphToolbar from "../components/graph/GraphToolBar";
import GraphNodeMarker from "../components/graph/GraphNodeMarker";
import GraphEdge from "../components/graph/GraphEdge";
import GraphContextMenu from "../components/graph/GraphContextMenu";
import SaveGraphModal from "../components/graph/SaveGraphModal";
import LoadGraphModal from "../components/graph/LoadGraphModal";
import { saveGraph } from "../api/graphApi";
import { runAlgorithm } from "../api/algorithmApi";

// If you want arrowheads, install leaflet-polylinedecorator and uncomment:
// import "leaflet-polylinedecorator";

/* MapEvents to capture clicks/context on map */
function MapEvents({ onClick, onContext }) {
  useMapEvents({
    click(e) {
      onClick?.(e);
    },
    contextmenu(e) {
      onContext?.(e);
    },
  });
  return null;
}

export default function MapPage({ user, setUser }) {
  const mapRef = useRef(null);
  const decoratorLayerRef = useRef(null); // for arrowheads

  // UI / modes
  const [mode, setMode] = useState("pan"); // pan | add-node | add-edge | move
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);

  // graph state matching backend schema
  const [graphState, setGraphState] = useState({
    graph_id: null,
    name: "",
    isDirected: false,
    center: { lat: 8.224, lng: 124.245, zoom: 14, rotation: 0, tilt: 0 },
    nodes: [],
    edges: [],
  });

  // context menu state
  const [context, setContext] = useState(null); // { position, type, data }

  // edge creation state
  const [edgeFromKey, setEdgeFromKey] = useState(null);

  // node type → color mapping
  const nodeTypeColor = {
    junction: "#38bdf8", // blue
    pump: "#fb7185", // red
    cluster: "#34d399", // green
    reservoir: "#facc15", // yellow
  };

  // helper: generate node key a,b,c,...,z,aa,ab...
  const generateNodeKey = useCallback((index) => {
    let name = "";
    while (index >= 0) {
      name = String.fromCharCode((index % 26) + 97) + name;
      index = Math.floor(index / 26) - 1;
    }
    return name;
  }, []);

  // convenience setters
  const setNodes = (updater) =>
    setGraphState((g) => ({ ...g, nodes: typeof updater === "function" ? updater(g.nodes) : updater }));
  const setEdges = (updater) =>
    setGraphState((g) => ({ ...g, edges: typeof updater === "function" ? updater(g.edges) : updater }));

  // next free key (prevents duplicates)
  const nextNodeKey = useCallback(() => {
    const used = new Set(graphState.nodes.map((n) => n.key));
    for (let i = 0; i < 10000; i++) {
      // support beyond z: a, b, ... z, aa, ab, ...
      let idx = i;
      let key = "";
      while (idx >= 0) {
        key = String.fromCharCode((idx % 26) + 97) + key;
        idx = Math.floor(idx / 26) - 1;
      }
      if (!used.has(key)) return key;
    }
    throw new Error("Too many nodes");
  }, [graphState.nodes]);

  // map click => add node (in add-node mode)
  const handleMapClick = (e) => {
    if (mode !== "add-node") return;
    const key = nextNodeKey();
    const node = {
      key,
      label: key.toUpperCase(),
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      meta: { type: "junction" },
    };
    setNodes((arr) => [...arr, node]);
  };

  // node click => edge creation when in add-edge mode
  const handleNodeClick = (node) => {
    if (mode === "add-edge") {
      if (!edgeFromKey) {
        setEdgeFromKey(node.key);
      } else {
        if (edgeFromKey !== node.key) {
          setEdges((es) => [...es,
              {
                id: crypto.randomUUID(),
               from: edgeFromKey,
                to: node.key,
                weight: 1,
                properties: {},
              },
            ]);

        }
        setEdgeFromKey(null);
      }
    }
  };

  // node dragged to new coordinates (move mode)
  const handleNodeDrag = (node, latlng) => {
    setNodes((arr) => arr.map((n) => (n.key === node.key ? { ...n, lat: latlng.lat, lng: latlng.lng } : n)));
  };

  // context handlers (right-click)
  const handleNodeContext = (node, e) => {
    setContext({
      position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
      type: "node",
      data: node,
    });
  };

  const handleEdgeContext = (edge, e) => {
    setContext({
      position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
      type: "edge",
      data: edge,
    });
  };

  const handleMapContext = (e) => {
    setContext({
      position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
      type: "empty",
      data: null,
    });
  };

  // edit node with duplicate-label prevention
  const editNode = (node) => {
    const newLabel = window.prompt("New label:", node.label ?? node.key.toUpperCase());
    if (newLabel === null) return;

    // prevent duplicates (case-insensitive)
    if (graphState.nodes.some((n) => n.label?.toLowerCase() === newLabel.toLowerCase() && n.key !== node.key)) {
      alert("Duplicate node label not allowed.");
      return;
      
    }

    
    const type = window.prompt("Type (junction, pump, cluster, reservoir):", node.meta?.type ?? "junction");
    const validTypes = ["junction", "pump", "cluster", "reservoir"];
    const chosenType = validTypes.includes(type) ? type : "junction";
    setNodes((arr) =>
    arr.map((n) =>
     n.key === node.key
         ? {
            ...n,
            label: newLabel,
            meta: { ...n.meta, type: type || "junction" }
            }
          : n
    )
    );
    setContext(null);
  };

  const moveNode = (node) => {
    setMode("move");
    setContext(null);
  };

  const deleteNode = (key) => {
    if (!window.confirm("Delete node and its edges?")) return;
    setNodes((arr) => arr.filter((n) => n.key !== key));
    setEdges((arr) => arr.filter((e) => e.from !== key && e.to !== key));
    setContext(null);
  };

  // edge editing and connection changes
  const editEdge = (edge) => {
  const newW = window.prompt("Edge weight:", edge.weight ?? 1);
  if (newW === null) return;

  setEdges((arr) =>
    arr.map((ed) =>
      ed.id === edge.id
        ? { ...ed, weight: Number(newW) || 1 }
        : ed
    )
  );
  setContext(null);
};


  const changeEdgeConnection = (edge) => {
    const which = window.prompt("Change 'from' or 'to'?", "to");
    if (!which) return;
    const endpoint = which.toLowerCase() === "from" ? "from" : "to";
    const newKey = window.prompt("Enter new node key (exact):");
    if (!newKey) return;
    if (!graphState.nodes.some((n) => n.key === newKey)) {
      alert("Node not found.");
      return;
    }
    setEdges((arr) => arr.map((ed) => (ed.from === edge.from && ed.to === edge.to ? { ...ed, [endpoint]: newKey } : ed)));
    setContext(null);
  };

  const deleteEdge = (edge) => {
    if (!window.confirm("Delete this edge?")) return;
    setEdges((arr) => arr.filter((ed) => !(ed.from === edge.from && ed.to === edge.to)));
    setContext(null);
  };

  // getGraphState -> format payload for backend
  const getGraphState = () => {
    const center = graphState.center || { lat: 8.224, lng: 124.245, zoom: 14, rotation: 0, tilt: 0 };
    return {
      graph_id: graphState.graph_id,
      name: graphState.name,
      is_directed: graphState.isDirected ? 1 : 0,
      center_lat: center.lat,
      center_lng: center.lng,
      zoom: center.zoom,
      rotation: center.rotation || 0,
      tilt: center.tilt || 0,
      nodes: graphState.nodes.map((n) => ({
        key: n.key,
        label: n.label,
        lat: n.lat,
        lng: n.lng,
        meta: { type: n.meta?.type || "junction" },
      })),
      edges: graphState.edges.map((e) => ({
        from: e.from,
        to: e.to,
        weight: e.weight ?? 1,
        properties: e.properties || {},
      })),
    };
  };

  // immediate save helper (used by Save modal)
  const handleSaveNow = async (name) => {
    const payload = getGraphState();
    payload.name = name || payload.name || "Untitled";
    try {
      const res = await saveGraph(payload);
      if (res.success) {
        alert("Saved");
        setGraphState((g) => ({ ...g, graph_id: res.graph_id, name: payload.name }));
      } else {
        alert("Save failed: " + (res.error || "unknown"));
      }
    } catch (err) {
      alert("Save error: " + err.message);
    }
  };

  // load result handler used by LoadGraphModal
  const onLoadSelect = (res) => {
    if (!res || !res.graph) return;
    const g = res.graph;
    const nodes = (res.nodes || []).map((n) => ({
      key: n.key,
      label: n.label ?? n.key.toUpperCase(),
      lat: Number(n.lat),
      lng: Number(n.lng),
      meta: n.meta || { type: "junction" },
    }));
    const edges = (res.edges || []).map((e) => ({
      from: e.from,
      to: e.to,
      weight: Number(e.weight || 1),
      properties: e.properties || {},
    }));
    setGraphState({
      graph_id: g.id,
      name: g.name,
      isDirected: Boolean(g.is_directed ?? 0),
      center: {
        lat: g.center_lat !== null ? Number(g.center_lat) : 8.224,
        lng: g.center_lng !== null ? Number(g.center_lng) : 124.245,
        zoom: g.zoom !== null ? Number(g.zoom) : 14,
        rotation: g.rotation ?? 0,
        tilt: g.tilt ?? 0,
      },
      nodes,
      edges,
    });
  };
    useEffect(() => {
    if (!mapRef.current) return;

    const c = graphState.center;
    mapRef.current.setView([c.lat, c.lng], c.zoom, {
    animate: true,
  });
}, 
 [graphState.center.lat, 
  graphState.center.lng, 
  graphState.center.zoom
]);




  // edge rendering decorator for arrowheads (only runs if plugin present)
  useEffect(() => {
    // clear previous decorator
    if (!mapRef.current) return;
    if (decoratorLayerRef.current) {
      try {
        decoratorLayerRef.current.remove();
      } catch (e) {}
      decoratorLayerRef.current = null;
    }

    // if no decorator lib or not directed, skip
    if (!graphState.isDirected) return;

    // try to create a layer and decorations for each edge
    try {
      const group = L.layerGroup().addTo(mapRef.current);
      graphState.edges.forEach((edge) => {
        const fromNode = graphState.nodes.find((n) => n.key === edge.from);
        const toNode = graphState.nodes.find((n) => n.key === edge.to);
        if (!fromNode || !toNode) return;
        const poly = L.polyline([
          [fromNode.lat, fromNode.lng],
          [toNode.lat, toNode.lng],
        ]);
        poly.addTo(group);
        // add decorator (requires leaflet-polylinedecorator)
        if (L.polylineDecorator) {
          L.polylineDecorator(poly, {
            patterns: [
              {
                offset: "50%",
                repeat: 0,
                symbol: L.Symbol.arrowHead({
                  pixelSize: 10,
                  polygon: true,
                  pathOptions: { stroke: true, color: "#ffffff", weight: 1, fillOpacity: 1 },
                }),
              },
            ],
          }).addTo(group);
        }
      });
      decoratorLayerRef.current = group;
    } catch (err) {
      // plugin probably not installed — silently ignore
      // console.warn("Decorator error:", err);
    }
  }, [graphState.isDirected, graphState.edges, graphState.nodes]);

  // color by node type
  const getColorForNode = (node) => nodeTypeColor[node.meta?.type] || nodeTypeColor.junction;
  const isHighlighted = (edge) => {
  return highlightedEdges.some(
    (he) =>
      (he.from === edge.from && he.to === edge.to) ||
      (!graphState.isDirected &&
        he.from === edge.to &&
        he.to === edge.from)
  );
};


  // close context
  const closeContext = () => setContext(null);

  // disable directed toggle if edges already exist
  const disableDirectedToggle = graphState.edges.length > 0;

const clearGraph = () => {
  if (!window.confirm("Clear all nodes and edges?")) return;

  setGraphState((g) => ({
    ...g,
    nodes: [],
    edges: [],
  }));
};

const [highlightedEdges, setHighlightedEdges] = useState([]);
const [algorithmResult, setAlgorithmResult] = useState(null);



async function runDijkstra(startNodeKey) {
  const payload = {
    algorithm: "dijkstra",
    start: startNodeKey,
    is_directed: graphState.isDirected,
    nodes: graphState.nodes.map(n => n.key),
    edges: graphState.edges.map(e => ({
      from: e.from,
      to: e.to,
      weight: e.weight ?? 1,
    })),
  };

  const res = await runAlgorithm(payload);

  if (res.error) {
    alert(res.error);
    return;
  }

  // pick shortest path to all nodes OR later let user choose target
  setAlgorithmResult(res.results);

  // flatten all shortest-path edges into highlight list
  const edgesToHighlight = [];
  Object.values(res.results).forEach(r => {
    if (!r || !r.path) return;
    for (let i = 0; i < r.path.length - 1; i++) {
      edgesToHighlight.push({
        from: r.path[i],
        to: r.path[i + 1],
      });
    }
  });

  setHighlightedEdges(edgesToHighlight);
}

async function runMST() {
  if (graphState.isDirected) {
    alert("MST only works on undirected graphs.");
    return;
  }

  const payload = {
    algorithm: "mst",
    nodes: graphState.nodes.map(n => n.key),
    edges: graphState.edges.map(e => ({
      from: e.from,
      to: e.to,
      weight: e.weight ?? 1,
    })),
  };

  const res = await runAlgorithm(payload);

  if (res.error) {
    alert(res.error);
    return;
  }

  setAlgorithmResult(res);
  setHighlightedEdges(res.edges); // already [{from,to,weight}]
}

useEffect(() => {
  setHighlightedEdges([]);
  setAlgorithmResult(null);
}, [graphState.nodes.length, graphState.edges.length]);


  return (
    <div className="flex h-screen bg-[#0d0d0d]">
      {/* SIDEBAR */}
      <div className="sidebar ui-layer">
        <Sidebar user={user} setUser={setUser} isOpen={true} />
      </div>

      {/* MAIN */}
      <div className="flex-1 relative">
        {/* RIGHT-SIDED TOOLBAR */}
        <div className="fixed right-4 top-20 z-[5000]">
          <GraphToolbar
            mode={mode}
            setMode={(m) => setMode(m)}
            onSaveClick={() => setSaveOpen(true)}
            onLoadClick={() => setLoadOpen(true)}
            isDirected={graphState.isDirected}
            setIsDirected={(v) => {
              if (disableDirectedToggle) {
                alert("Cannot change directed/undirected after edges exist.");
                return;
              }
              setGraphState((g) => ({ ...g, isDirected: v }));
            }}
                disableDirected={disableDirectedToggle}
            onRunDijkstra={() => {
              const start = prompt("Start node key:");
              if (start) runDijkstra(start);
            }}
            onRunMST={runMST}
            />

        </div>

        {/* MAP */}
        <MapContainer
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
          center={[graphState.center.lat, graphState.center.lng]}
          zoom={graphState.center.zoom}
          style={{ height: "100vh", width: "100%" }}
          className="leaflet-container"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents onClick={handleMapClick} onContext={handleMapContext} />

          {/* Edges (render first so markers are on top) */}
          {graphState.edges.map((edge, i) => {
            const fromNode = graphState.nodes.find((n) => n.key === edge.from);
            const toNode = graphState.nodes.find((n) => n.key === edge.to);
            // if missing endpoints, skip rendering
            if (!fromNode || !toNode) return null;
            // thicker stroke = base weight * 2 (min 3)
            const stroke = Math.max(3, (edge.weight || 1) * 2);
            
            const highlighted = isHighlighted(edge);

            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                color={highlighted ? "#ef4444" : graphState.isDirected ? "#f97316" : "#06b6d4"} // 🔴 red
                weight={highlighted ? 6 : stroke}
                isDirected={graphState.isDirected}
                onContextMenu={(ed, e) => handleEdgeContext(edge, e)}
               />
            );
          })}

          {/* Nodes */}
          {graphState.nodes.map((node) => (
            <GraphNodeMarker
              // key includes label so updates force re-render
              key={`${node.key}-${node.label}`}
              node={node}
              color={getColorForNode(node)}
              onClick={(n, e) => handleNodeClick(n)}
              onContextMenu={(n, e) => handleNodeContext(n, e)}
              draggable={mode === "move"}
              onDragend={(n, latlng) => handleNodeDrag(n, latlng)}
            />
          ))}
        </MapContainer>

        {/* CONTEXT MENU */}
        <GraphContextMenu
          position={context?.position}
          type={context?.type}
          data={context?.data}
          onEditNode={editNode}
          onMoveNode={moveNode}
          onDeleteNode={deleteNode}
          onEditEdge={editEdge}
          onChangeEdgeConnection={changeEdgeConnection}
          onDeleteEdge={deleteEdge}
          onClose={closeContext}
        />
        

        {/* Save / Load modals */}
        {saveOpen && (
          <SaveGraphModal
            onClose={() => setSaveOpen(false)}
            // Save modal will call getGraphState() to build payload by design
            getGraphState={() => getGraphState()}
            // if your SaveGraphModal supports a direct onSave handler, you can pass handleSaveNow
            onSaveNow={handleSaveNow}
          />
        )}

        {loadOpen && (
          <LoadGraphModal
            onClose={() => setLoadOpen(false)}
            onSelectGraph={(res) => {
              onLoadSelect(res);
              setLoadOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
