<?php
// api/news.php
// Returns news posts as JSON for the Aktuality page.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../admin/db.php';
require_once __DIR__ . '/../admin/content/page_content.php';
require_once __DIR__ . '/../admin/content/news_posts.php';
require_once __DIR__ . '/../admin/content/news_layout.php';

try {
    $lang = isset($_GET['lang']) && in_array((string)$_GET['lang'], ['cs', 'en'], true)
        ? (string)$_GET['lang']
        : get_lang();

    $layoutKey = isset($_GET['layout']) && is_string($_GET['layout']) && $_GET['layout'] !== ''
        ? (string)$_GET['layout']
        : 'aktuality_default';

    // Ensure layout tables exist and default layout row exists
    ensure_default_news_layout($pdo, $layoutKey, 2);

    $data = load_news_layout($pdo, $lang, $layoutKey, false);

    $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

    // If layout is empty, fallback to news list
    if (count($items) === 0) {
        $rows = load_news($pdo, $lang, false);
        $fallbackItems = [];
        $y = 0;
        foreach ($rows as $r) {
            $fallbackItems[] = [
                'post_id' => (int)($r['id'] ?? 0),
                'x' => 0,
                'y' => $y++,
                'w' => 2,
                'h' => 1,
                'badge' => (string)($r['badge'] ?? ''),
                'image' => (string)($r['image_path'] ?? ''),
                'date' => (string)($r['display_date'] ?? ''),
                'title' => (string)($r['title'] ?? ''),
                'perex' => (string)($r['perex'] ?? ''),
                'bodyHtml' => (string)($r['body_html'] ?? ''),
            ];
        }

        $data['layout'] = ['layout_key' => $layoutKey, 'grid_cols' => 2];
        $data['items'] = $fallbackItems;
        $data['meta'] = ($data['meta'] ?? []) + [
            'fallback' => 'all_posts_list',
            'fallback_items' => count($fallbackItems),
        ];
    }

    echo json_encode(['ok' => true, 'mode' => 'layout', 'layout_key' => $layoutKey] + $data, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'news_api_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}