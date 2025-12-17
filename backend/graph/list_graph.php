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

$conn = getDB();
$userId = $_SESSION['user']['id'];

// Fetch graph list
$stmt = $conn->prepare("
    SELECT 
        id,
        name,
        is_directed,
        center_lat,
        center_lng,
        zoom,
        rotation,
        tilt,
        metadata,
        created_at,
        updated_at
    FROM graphs
    WHERE owner_id = ?
    ORDER BY updated_at DESC
");
$stmt->execute([$userId]);
$graphs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($graphs as &$g) {

    // Decode metadata
    if (!empty($g["metadata"])) {
        $g["metadata"] = json_decode($g["metadata"], true);
    }

    // Load nodes
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
    $nodeStmt->execute([$g["id"]]);
    $nodes = $nodeStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($nodes as &$n) {
        if (!empty($n["meta"])) {
            $n["meta"] = json_decode($n["meta"], true);
        }
    }

    // Load edges
    $edgeStmt = $conn->prepare("
        SELECT 
            from_key AS `from`,
            to_key AS `to`,
            weight,
            properties
        FROM graph_edges
        WHERE graph_id = ?
    ");
    $edgeStmt->execute([$g["id"]]);
    $edges = $edgeStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($edges as &$e) {
        if (!empty($e["properties"])) {
            $e["properties"] = json_decode($e["properties"], true);
        }
    }

    // attach to graph
    $g["nodes"] = $nodes;
    $g["edges"] = $edges;
}

// FINAL OUTPUT
echo json_encode([
    "success" => true,
    "graphs" => $graphs
]);
