<?php
// admin/api/news_create.php
// Creates a new news post with CS/EN translations.

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
require_once __DIR__ . '/../db.php';
$pdo = $pdo ?? null;

ensure_news_tables($pdo);

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'errors' => ['Method not allowed']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'errors' => ['Invalid JSON']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $badge = isset($data['badge']) ? (string)$data['badge'] : null;
    $image = isset($data['image']) ? (string)$data['image'] : null;
    $displayDate = isset($data['date']) ? (string)$data['date'] : null;
    $imagePaths = (isset($data['image_paths']) && is_array($data['image_paths'])) ? $data['image_paths'] : [];
    $imagePaths = array_values(array_unique(array_filter($imagePaths, fn($v)=>!!$v)));
    $titleCs = trim((string)($data['title_cs'] ?? ''));
    $titleEn = trim((string)($data['title_en'] ?? $titleCs));
    $perexCs = (string)($data['perex_cs'] ?? '');
    $perexEn = (string)($data['perex_en'] ?? $perexCs);
    $bodyCs = (string)($data['body_cs'] ?? '');
    $bodyEn = (string)($data['body_en'] ?? $bodyCs);

    if ($titleCs === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['title_cs is required']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO news_posts (slot, sort_order, badge, image_paths, display_date) VALUES (NULL, 0, :badge, :image_paths, :display_date)');
    $stmt->execute([
        ':badge' => $badge,
        ':image_paths' => json_encode($imagePaths, JSON_UNESCAPED_UNICODE),
        ':display_date' => $displayDate,
    ]);

    $postId = (int)$pdo->lastInsertId();

    $tr = $pdo->prepare('INSERT INTO news_post_translations (post_id, lang, title, perex, body_html) VALUES (:post_id, :lang, :title, :perex, :body_html)');
    $tr->execute([':post_id' => $postId, ':lang' => 'cs', ':title' => $titleCs, ':perex' => $perexCs, ':body_html' => $bodyCs]);
    $tr->execute([':post_id' => $postId, ':lang' => 'en', ':title' => $titleEn, ':perex' => $perexEn, ':body_html' => $bodyEn]);

    $pdo->commit();

    echo json_encode(['ok' => true, 'post_id' => $postId], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}