<?php
// admin/api/news_posts.php
// Returns list of news posts for admin pool (with both translations for preview).

declare(strict_types=1);

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

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../content/news_posts.php';

ensure_news_tables($pdo);

/**
 * Normalize stored image_path to a URL that works from anywhere.
 * Preferred format for front-end: root-relative (/Images/...).
 */
function normalize_image_url(string $path): string {
    $p0 = trim($path);
    if ($p0 === '') return '';

    $p = str_replace('\\', '/', $p0);
    $p = preg_replace('~^\./+~', '', $p) ?? $p;

    // Keep absolute URLs, protocol-relative, and root-relative paths.
    if (preg_match('~^(https?:)?//~i', $p) || str_starts_with($p, '/')) return $p;

    // Keep ../ paths as-is (legacy values)
    if (str_starts_with($p, '../')) return $p;

    // Most common legacy values are stored as "Images/..."
    if (str_starts_with($p, 'Images/')) {
        return '/' . $p;
    }

    return $p;
}

try {
    $sql = "
        SELECT
            p.id,
            p.badge,
            p.image_path,
            COALESCE(p.display_date, DATE_FORMAT(p.published_at, '%m/%Y')) AS display_date,
            cs.title AS title_cs,
            en.title AS title_en,
            cs.perex AS perex_cs,
            en.perex AS perex_en,
            cs.body_html AS body_cs,
            en.body_html AS body_en
        FROM news_posts p
        LEFT JOIN news_post_translations cs ON cs.post_id = p.id AND cs.lang='cs'
        LEFT JOIN news_post_translations en ON en.post_id = p.id AND en.lang='en'
        ORDER BY p.id DESC
    ";
    $rows = $pdo->query($sql)->fetchAll();
    if (!is_array($rows)) $rows = [];

    $out = array_map(static function($r){
        return [
            'id' => (int)$r['id'],
            'badge' => (string)($r['badge'] ?? ''),
            'image' => normalize_image_url((string)($r['image_path'] ?? '')),
            'date' => (string)($r['display_date'] ?? ''),
            'title_cs' => (string)($r['title_cs'] ?? ''),
            'title_en' => (string)($r['title_en'] ?? ''),
            'perex_cs' => (string)($r['perex_cs'] ?? ''),
            'perex_en' => (string)($r['perex_en'] ?? ''),
            'body_cs' => (string)($r['body_cs'] ?? ''),
            'body_en' => (string)($r['body_en'] ?? ''),
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'items' => $out], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}