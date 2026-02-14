<?php
// admin/api/news_image_upload.php
// Uploads an image for a news (aktuality) post and returns its public path.

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

// Allow preflight requests (some environments send OPTIONS before POST)
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    http_response_code(204);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'ok' => false,
            'errors' => ['Method not allowed (expected POST, got ' . (string)($_SERVER['REQUEST_METHOD'] ?? 'unknown') . ')']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (empty($_FILES['image']) || !is_array($_FILES['image'])) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['Missing file field: image']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $file = $_FILES['image'];
    $err = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($err === UPLOAD_ERR_NO_FILE) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'errors' => ['No file uploaded']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($err !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'errors' => ['Upload error']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $tmp = (string)($file['tmp_name'] ?? '');
    $size = (int)($file['size'] ?? 0);
    if ($tmp === '' || !is_file($tmp)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'errors' => ['Invalid upload']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($size > 6 * 1024 * 1024) {
        http_response_code(413);
        echo json_encode(['ok' => false, 'errors' => ['Image too large (max 6 MB)']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)($finfo->file($tmp) ?: '');
    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => '',
    };

    if ($ext === '') {
        http_response_code(415);
        echo json_encode(['ok' => false, 'errors' => ['Unsupported image type (allowed JPG/PNG/WebP)']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Save into public Images/aktuality so the website can serve it.
    $targetDirFs = __DIR__ . '/../../Images/aktuality';
    if (!is_dir($targetDirFs)) {
        @mkdir($targetDirFs, 0755, true);
    }
    if (!is_dir($targetDirFs) || !is_writable($targetDirFs)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'errors' => ['Cannot write to Images/aktuality']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $ext;
    $targetPath = $targetDirFs . '/' . $fileName;

    if (!move_uploaded_file($tmp, $targetPath)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'errors' => ['Failed to save uploaded image']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $publicPath = '/Images/aktuality/' . $fileName;
    echo json_encode(['ok' => true, 'path' => $publicPath], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'errors' => [$e->getMessage()]], JSON_UNESCAPED_UNICODE);
}