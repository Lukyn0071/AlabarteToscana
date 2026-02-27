<?php
// admin/api/news_post_delete.php
// Deletes a news post (+ translations via FK cascade) and optionally cleans up unused images.

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
require_once __DIR__ . '/../content/news_layout.php';

ensure_news_tables($pdo);
ensure_news_layout_tables($pdo);

/**
 * Convert stored DB path to filesystem path. Only allows /Images/aktuality/*
 */
function news_image_public_to_fs(string $publicPath): ?string {
    $p = trim(str_replace('\\', '/', $publicPath));
    if ($p === '') return null;

    // Allow both Images/... and /Images/...
    if (str_starts_with($p, 'Images/')) {
        $p = '/' . $p;
    }

    if (!str_starts_with($p, '/Images/aktuality/')) return null;

    $rel = substr($p, 1); // remove leading '/'
    return dirname(__DIR__, 2) . '/' . $rel; // project root + Images/...
}

function list_used_news_images(PDO $pdo): array {
    $rows = $pdo->query("SELECT image_paths FROM news_posts WHERE image_paths IS NOT NULL AND image_paths <> ''")->fetchAll();
    if (!is_array($rows)) return [];
    $out = [];
    foreach ($rows as $r) {
        if (!is_array($r)) continue;
        $decoded = json_decode($r['image_paths'], true);
        if (is_array($decoded)) {
            foreach ($decoded as $img) {
                $out[] = (string)$img;
            }
        }
    }
    return $out;
}

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

    $postId = (int)($data['id'] ?? 0);
    if ($postId <= 0) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['id is required']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Capture image path before delete (so we can cleanup if unused)
    $stmt = $pdo->prepare('SELECT image_paths FROM news_posts WHERE id = :id');
    $stmt->execute([':id' => $postId]);
    $imagePaths = (string)($stmt->fetchColumn() ?: '');

    $pdo->beginTransaction();

    // Remove from layouts
    $delLayoutItems = $pdo->prepare('DELETE FROM news_layout_items WHERE post_id = :id');
    $delLayoutItems->execute([':id' => $postId]);
    $layoutDeleted = $delLayoutItems->rowCount();

    // Fallback: delete translations explicitly (in case FK constraints are missing/disabled)
    $delTr = $pdo->prepare('DELETE FROM news_post_translations WHERE post_id = :id');
    $delTr->execute([':id' => $postId]);
    $trDeleted = $delTr->rowCount();

    // Delete post
    $delPost = $pdo->prepare('DELETE FROM news_posts WHERE id = :id');
    $delPost->execute([':id' => $postId]);
    $postDeleted = $delPost->rowCount();

    $pdo->commit();

    if ($postDeleted <= 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'errors' => ['Post not found']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Cleanup images: delete the deleted post image if no longer used by any post.
    $deletedFiles = [];
    if ($imagePaths !== '') {
        $paths = json_decode($imagePaths, true);
        if (is_array($paths)) {
            foreach ($paths as $imagePath) {
                $stillUsed = false;
                $chk = $pdo->prepare('SELECT COUNT(*) FROM news_posts WHERE image_paths LIKE :p');
                $chk->execute([':p' => '%"' . $imagePath . '"%']);
                $stillUsed = ((int)$chk->fetchColumn()) > 0;

                if (!$stillUsed) {
                    $fs = news_image_public_to_fs($imagePath);
                    if ($fs && is_file($fs)) {
                        @unlink($fs);
                        if (!is_file($fs)) {
                            $deletedFiles[] = $imagePath;
                        }
                    }
                }
            }
        }
    }

    // Optional: full garbage collection of Images/aktuality directory (remove files not referenced in DB)
    $gc = isset($data['gc']) ? (bool)$data['gc'] : true;
    if ($gc) {
        $used = array_filter(array_map('trim', list_used_news_images($pdo)));
        $usedSet = [];
        foreach ($used as $u) {
            $u2 = str_replace('\\', '/', $u);
            if (str_starts_with($u2, 'Images/')) $u2 = '/' . $u2;
            $usedSet[$u2] = true;
        }

        $dir = dirname(__DIR__, 2) . '/Images/aktuality';
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            if (is_array($files)) {
                foreach ($files as $fsPath) {
                    if (!is_file($fsPath)) continue;
                    $base = basename($fsPath);
                    $pub = '/Images/aktuality/' . $base;
                    if (!isset($usedSet[$pub])) {
                        @unlink($fsPath);
                        if (!is_file($fsPath)) {
                            $deletedFiles[] = $pub;
                        }
                    }
                }
            }
        }
    }

    echo json_encode([
        'ok' => true,
        'deleted' => [
            'layout_items' => (int)$layoutDeleted,
            'translations' => (int)$trDeleted,
            'posts' => (int)$postDeleted,
        ],
        'deleted_files' => array_values(array_unique($deletedFiles))
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}