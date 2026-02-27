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
require_once __DIR__ . '/../db.php';
$pdo = $pdo ?? null;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../content/news_posts.php';

ensure_news_tables($pdo);

try {
    $sql = "
        SELECT
            p.id,
            p.badge,
            p.image_paths,
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
        $images = [];
        if (!empty($r['image_paths'])) {
            $decoded = json_decode($r['image_paths'], true);
            if (is_array($decoded)) {
                // Normalize each image path if helper exists
                if (function_exists('normalize_image_url')) {
                    $normalized = [];
                    foreach ($decoded as $img) {
                        if (!is_string($img)) continue;
                        $normalized[] = normalize_image_url($img);
                    }
                    $images = $normalized;
                } else {
                    $images = $decoded;
                }
            }
        }
        return [
            'id' => (int)$r['id'],
            'badge' => (string)($r['badge'] ?? ''),
            'images' => $images,
            'image' => (function_exists('normalize_image_url') ? normalize_image_url($images[0] ?? '') : ($images[0] ?? '')),
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