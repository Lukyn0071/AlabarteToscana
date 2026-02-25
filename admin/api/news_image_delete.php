<?php
// admin/api/news_image_delete.php
// Smaže obrázek z galerie příspěvku a z disku, aktualizuje DB.

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

// Use shared normalization helper so comparisons are consistent with other APIs
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
    $imgPath = (string)($data['img_path'] ?? '');
    if ($postId <= 0 || !$imgPath) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['post_id and img_path are required']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $row = $pdo->query("SELECT image_paths FROM news_posts WHERE id=" . (int)$postId)->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'errors' => ['Post not found']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $images = [];
    if (!empty($row['image_paths'])) {
        $decoded = json_decode($row['image_paths'], true);
        if (is_array($decoded)) {
            $images = $decoded;
        }
    }

    // Normalize all stored paths so comparison is consistent
    $normalizedStored = [];
    foreach ($images as $v) {
        if (!is_string($v)) continue;
        $nv = function_exists('normalize_image_url') ? normalize_image_url($v) : preg_replace('~^(\.\./)+~', '', $v);
        if ($nv !== '') $normalizedStored[] = $nv;
    }

    $imgNorm = function_exists('normalize_image_url') ? normalize_image_url($imgPath) : preg_replace('~^(\.\./)+~', '', $imgPath);

    // Remove matching normalized path(s)
    $remaining = array_values(array_filter($normalizedStored, fn($v) => $v !== $imgNorm));

    // Persist normalized remaining paths to DB
    $pdo->prepare('UPDATE news_posts SET image_paths = :image_paths WHERE id = :id')
        ->execute([
            ':image_paths' => json_encode($remaining, JSON_UNESCAPED_UNICODE),
            ':id' => $postId
        ]);

    // Smazat soubor z disku (základní bezpečnost: povolit mazání pouze z Images/aktuality)
    $fsPath = realpath(__DIR__ . '/../../' . ltrim($imgNorm, '/\\'));
    $baseDir = realpath(__DIR__ . '/../../Images/aktuality');
    if ($fsPath && $baseDir && strpos($fsPath, $baseDir) === 0 && is_file($fsPath)) {
        @unlink($fsPath);
    }
    echo json_encode(['ok' => true, 'images' => $remaining], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}
