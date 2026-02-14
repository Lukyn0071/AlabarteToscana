<?php
// api/ui.php
// Minimal endpoint to provide translated UI texts for pages that still use data-key placeholders.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../admin/db.php';
require_once __DIR__ . '/../admin/content/page_content.php';
require_once __DIR__ . '/../admin/content/ui_texts.php';

try {
    $lang = isset($_GET['lang']) && in_array((string)$_GET['lang'], ['cs', 'en'], true)
        ? (string)$_GET['lang']
        : get_lang();

    $ui = load_ui_texts($pdo, $lang);

    echo json_encode([
        'lang' => $lang,
        'ui' => $ui,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'ui_api_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
