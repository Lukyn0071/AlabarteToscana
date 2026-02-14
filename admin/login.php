<?php
require_once __DIR__ . '/auth/bootstrap.php';

// If already logged in, go to dashboard
if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = null;
$username = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Vyplňte username i heslo.';
    } else {
        try {
            $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = :username LIMIT 1');
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, (string)$user['password_hash'])) {
                $error = 'Neplatný username nebo heslo.';
            } else {
                login_admin((int)$user['id'], (string)$user['username']);
                header('Location: index.php');
                exit;
            }
        } catch (Throwable $e) {
            $error = 'Chyba při přihlášení. Zkontrolujte, zda existuje tabulka adminů.';
        }
    }
}

$csrf = csrf_get_token()['token'];
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin přihlášení</title>
    <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:40px auto;padding:0 16px}
        form{display:grid;gap:12px}
        input{padding:10px;font-size:16px}
        button{padding:10px;font-size:16px;cursor:pointer}
        .error{background:#ffe3e3;border:1px solid #ffb3b3;padding:10px}
        .links{display:flex;gap:12px;flex-wrap:wrap}
    </style>
</head>
<body>
<h1>Admin přihlášení</h1>

<?php if ($error): ?>
    <div class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
<?php endif; ?>

<form method="post" action="">
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">

    <label>
        Username
        <input type="text" name="username" required value="<?php echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8'); ?>">
    </label>

    <label>
        Heslo
        <input type="password" name="password" required>
    </label>

    <button type="submit">Přihlásit</button>
</form>
<hr>
</body>
</html>