<?php
// admin/auth/functions.php

declare(strict_types=1);

/**
 * @return array{token:string}
 */
function csrf_get_token(): array
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return ['token' => $_SESSION['csrf_token']];
}

function csrf_verify(?string $token): void
{
    $sessionToken = $_SESSION['csrf_token'] ?? '';
    if (!is_string($sessionToken) || !is_string($token) || $token === '' || !hash_equals($sessionToken, $token)) {
        http_response_code(400);
        exit('Neplatný CSRF token.');
    }
}

function is_logged_in(): bool
{
    return !empty($_SESSION['admin_user_id']);
}

function require_login(): void
{
    if (!is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

function current_admin_username(): ?string
{
    return isset($_SESSION['admin_username']) && is_string($_SESSION['admin_username']) ? $_SESSION['admin_username'] : null;
}

function login_admin(int $id, string $username): void
{
    // Prevent session fixation
    session_regenerate_id(true);

    $_SESSION['admin_user_id'] = $id;
    $_SESSION['admin_username'] = $username;
}

function logout_admin(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool)($params['secure'] ?? false),
            (bool)($params['httponly'] ?? true)
        );
    }

    session_destroy();
}

function admin_users_table_exists(PDO $pdo): bool
{
    $stmt = $pdo->query("SHOW TABLES LIKE 'admin_users'");
    return (bool)$stmt->fetchColumn();
}

function admin_users_count(PDO $pdo): int
{
    $stmt = $pdo->query('SELECT COUNT(*) FROM admin_users');
    return (int)$stmt->fetchColumn();
}

/**
 * Public registration is dangerous. Default behavior here:
 * - If there are no admins yet => registration allowed.
 * - Otherwise => registration forbidden, unless you set ADMIN_REGISTER_KEY.
 */
function admin_registration_allowed(PDO $pdo): bool
{
    if (!admin_users_table_exists($pdo)) {
        return true; // first run: allow so you can create table/admin
    }

    $count = admin_users_count($pdo);
    if ($count === 0) {
        return true;
    }

    // Optional: allow with secret key
    $key = defined('ADMIN_REGISTER_KEY') ? (string)ADMIN_REGISTER_KEY : '';
    return $key !== '' && isset($_GET['key']) && hash_equals($key, (string)$_GET['key']);
}