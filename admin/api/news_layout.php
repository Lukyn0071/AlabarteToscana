<?php
// admin/api/news_layout.php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(0);

// Always try to return JSON even on fatal errors
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

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../content/page_content.php';
require_once __DIR__ . '/../content/news_layout.php';

$lang = get_lang();
$layoutKey = isset($_GET['layout']) && is_string($_GET['layout']) && $_GET['layout'] !== '' ? (string)$_GET['layout'] : 'aktuality_default';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $data = load_news_layout($pdo, $lang, $layoutKey, false);
        echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw ?: '', true);
        if (!is_array($payload)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'errors' => ['Invalid JSON payload']], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $items = isset($payload['items']) && is_array($payload['items']) ? $payload['items'] : [];
        $gridCols = isset($payload['grid_cols']) ? (int)$payload['grid_cols'] : 2;
        if ($gridCols <= 0 || $gridCols > 24) $gridCols = 2;

        $gridRows = null;
        if (array_key_exists('grid_rows', $payload)) {
            $gridRows = (int)$payload['grid_rows'];
            if ($gridRows <= 0 || $gridRows > 3000) {
                $gridRows = null;
            }
        }

        // Ensure layout exists with correct grid columns (+ optional rows)
        ensure_default_news_layout($pdo, $layoutKey, $gridCols, $gridRows ?? 8);

        $res = save_news_layout($pdo, $layoutKey, $items, $gridCols, $gridRows);
        if (!$res['ok']) {
            http_response_code(422);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Return full refreshed layout (incl. grid_rows) so client can confirm persistence.
        $data = load_news_layout($pdo, $lang, $layoutKey, false);
        echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'errors' => ['Method not allowed']], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}