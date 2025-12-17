// src/api/graphApi.js
const BASE = "http://localhost/wdn-app/backend/graph";

// -----------------------------
// LIST ALL GRAPHS
// -----------------------------
export async function listGraphs() {
  const res = await fetch(`${BASE}/list_graph.php`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load graphs");
  }

  return res.json(); // { success: true, graphs: [...] }
}

// -----------------------------
// LOAD ONE GRAPH (WITH NODES + EDGES)
// -----------------------------
export async function loadGraph(id) {
  const res = await fetch(`${BASE}/load_graph.php?id=${id}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load graph");
  }

  return res.json(); // { success: true, graph, nodes, edges }
}

// -----------------------------
// SAVE GRAPH
// -----------------------------
export async function saveGraph(payload) {
  const res = await fetch(`${BASE}/save_graph.php`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to save graph");
  }

  return res.json(); // { success: true, graph_id }
}

// -----------------------------
// DELETE GRAPH
// -----------------------------
export async function deleteGraph(id) {
  const formData = new FormData();
  formData.append("id", id);

  const res = await fetch(`${BASE}/delete_graph.php`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to delete graph");
  }

  return res.json(); // { success: true }
}
