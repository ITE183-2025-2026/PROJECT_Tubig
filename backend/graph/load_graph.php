<?php
require_once __DIR__ . "/../includes/cors.php";

session_start();
header("Content-Type: application/json");

require_once __DIR__ . "/../includes/db.php";

// Require login
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$graph_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$graph_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing graph id"]);
    exit;
}

$conn = getDB();

// Fetch graph main record
$stmt = $conn->prepare("
    SELECT id, owner_id, name, is_directed,
           center_lat, center_lng, zoom,
           rotation, tilt,
           metadata,
           created_at, updated_at
    FROM graphs 
    WHERE id = ?
");

$stmt->execute([$graph_id]);
$graph = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$graph) {
    http_response_code(404);
    echo json_encode(["error" => "Graph not found"]);
    exit;
}

// Permission check
$user = $_SESSION['user'];
if ($graph['owner_id'] != $user['id'] && $user['role'] !== "superadmin") {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

// Decode metadata JSON
if (!empty($graph['metadata'])) {
    $graph['metadata'] = json_decode($graph['metadata'], true);
}

// Fetch nodes
$nodeStmt = $conn->prepare("
    SELECT 
        node_key AS id,
        label,
        lat,
        lng,
        meta
    FROM graph_nodes
    WHERE graph_id = ?
");
$nodeStmt->execute([$graph_id]);
$nodes = $nodeStmt->fetchAll(PDO::FETCH_ASSOC);

// Decode node meta
foreach ($nodes as &$n) {
    if (!empty($n['meta'])) {
        $n['meta'] = json_decode($n['meta'], true);
    }
}

// Fetch edges
$edgeStmt = $conn->prepare("
    SELECT 
        from_key AS `from`,
        to_key AS `to`,
        weight,
        properties
    FROM graph_edges
    WHERE graph_id = ?
");
$edgeStmt->execute([$graph_id]);
$edges = $edgeStmt->fetchAll(PDO::FETCH_ASSOC);

// Decode edge properties
foreach ($edges as &$e) {
    if (!empty($e['properties'])) {
        $e['properties'] = json_decode($e['properties'], true);
    }
}

echo json_encode([
    "success" => true,
    "graph" => $graph,
    "nodes" => $nodes,
    "edges" => $edges
]);
?>
