<?php
declare(strict_types=1);
// admin/api/wine_delete.php — delete a wine (admin, requires login)
ini_set('display_errors', '0');
error_reporting(0);
register_shutdown_function(static function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
            http_response_code(500);
        }
        echo json_encode(['ok' => false, 'errors' => ['Fatal: ' . ($err['message'] ?? 'unknown')]], JSON_UNESCAPED_UNICODE);
    }
});

require_once __DIR__ . '/../auth/bootstrap.php';
require_login();
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../content/wines.php';
/** @var PDO $pdo */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'errors' => ['Method not allowed']], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data) || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'errors' => ['Missing id']], JSON_UNESCAPED_UNICODE);
    exit;
}

$id = (int)$data['id'];

try {
    ensure_wines_table($pdo);
    $existing = get_wine_by_id($pdo, $id);
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'errors' => ['Víno nebylo nalezeno']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $ok = delete_wine($pdo, $id);
    echo json_encode(['ok' => $ok, 'id' => $id], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}
