<?php
// admin/api/news_image_attach.php
// Appends an uploaded image path to a post's image_paths array (idempotent).

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
require_once __DIR__ . '/../content/news_posts.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

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

    $postId = (int)($data['post_id'] ?? 0);
    $imgPath = isset($data['img_path']) ? (string)$data['img_path'] : '';

    if ($postId <= 0 || $imgPath === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['post_id and img_path are required']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    ensure_news_tables($pdo);

    $row = $pdo->prepare('SELECT image_paths FROM news_posts WHERE id = :id');
    $row->execute([':id' => $postId]);
    $r = $row->fetch(PDO::FETCH_ASSOC);

    if (!$r) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'errors' => ['Post not found']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $images = [];
    if (!empty($r['image_paths'])) {
        $decoded = json_decode($r['image_paths'], true);
        if (is_array($decoded)) $images = $decoded;
    }

    // Normalize input path using helper
    $norm = function_exists('normalize_image_url') ? normalize_image_url($imgPath) : preg_replace('~^(\./|(\../)+)~', '', $imgPath);
    if ($norm === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['Invalid image path']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Append if not present
    $stored = [];
    foreach ($images as $v) {
        if (!is_string($v)) continue;
        $stored[] = $v;
    }

    // Use root-relative stored format (do not double-normalize existing)
    if (!in_array($norm, $stored, true)) {
        $stored[] = $norm;
    }

    $upd = $pdo->prepare('UPDATE news_posts SET image_paths = :image_paths WHERE id = :id');
    $ok = $upd->execute([':image_paths' => json_encode($stored, JSON_UNESCAPED_UNICODE), ':id' => $postId]);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'errors' => ['Failed to update DB']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Return normalized list for client
    echo json_encode(['ok' => true, 'images' => $stored], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}

