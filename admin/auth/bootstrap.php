<?php
// admin/auth/bootstrap.php
// Central bootstrap for admin authentication pages.

declare(strict_types=1);

// Secure-ish session defaults for admin area
$cookieParams = session_get_cookie_params();
$useHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => $cookieParams['path'] ?? '/',
    'domain' => $cookieParams['domain'] ?? '',
    'secure' => $useHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/functions.php';
