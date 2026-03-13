<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../admin/db.php';
require_once __DIR__ . '/../admin/content/wines.php';

$lang = isset($_GET['lang']) && $_GET['lang'] === 'en' ? 'en' : 'cs';

try {
    ensure_wines_table($pdo);
    $wines = get_all_wines($pdo, $lang, false);
    echo json_encode(['ok' => true, 'lang' => $lang, 'items' => $wines], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB error', 'details' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}