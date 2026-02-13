<?php
require_once __DIR__ . '/auth/bootstrap.php';

$error = null;
$success = null;
$username = '';

// Allow registration only if no admins exist yet (or with secret key)
$registrationAllowed = true;
try {
    $registrationAllowed = admin_registration_allowed($pdo);
} catch (Throwable $e) {
    // if DB not ready, still show instructions
    $registrationAllowed = true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $password2 = (string)($_POST['password2'] ?? '');

    if (!$registrationAllowed) {
        $error = 'Registrace dalšího admina je zakázaná.';
    } elseif ($username === '' || $password === '' || $password2 === '') {
        $error = 'Vyplňte všechna pole.';
    } elseif (strlen($username) < 3) {
        $error = 'Username musí mít alespoň 3 znaky.';
    } elseif ($password !== $password2) {
        $error = 'Hesla se neshodují.';
    } elseif (strlen($password) < 8) {
        $error = 'Heslo musí mít alespoň 8 znaků.';
    } else {
        try {
            // Create table if missing
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS admin_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(64) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            );

            // If table exists and admin already exists, block unless allowed via key
            if (!admin_registration_allowed($pdo)) {
                $error = 'Registrace dalšího admina je zakázaná.';
            } else {
                $hash = password_hash($password, PASSWORD_DEFAULT);

                $stmt = $pdo->prepare('INSERT INTO admin_users (username, password_hash) VALUES (:username, :hash)');
                $stmt->execute([':username' => $username, ':hash' => $hash]);

                $newId = (int)$pdo->lastInsertId();
                login_admin($newId, $username);

                $success = 'Admin účet byl vytvořen a jste přihlášen.';
                header('Location: index.php');
                exit;
            }
        } catch (Throwable $e) {
            $error = 'Registrace se nezdařila (možná už username existuje).';
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
    <title>Registrace admina</title>
    <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:40px auto;padding:0 16px}
        form{display:grid;gap:12px}
        input{padding:10px;font-size:16px}
        button{padding:10px;font-size:16px;cursor:pointer}
        .error{background:#ffe3e3;border:1px solid #ffb3b3;padding:10px}
        .note{background:#f4f6ff;border:1px solid #cfd6ff;padding:10px}
    </style>
</head>
<body>
<h1>Registrace admina</h1>

<?php if (!$registrationAllowed): ?>
    <div class="note">
        Registrace je povolená jen pro prvního admina. Pokud chcete přidat dalšího,
        nastavte tajný klíč (viz níže) nebo to udělejte přímo v DB.
    </div>
<?php endif; ?>

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

    <label>
        Heslo znovu
        <input type="password" name="password2" required>
    </label>

    <button type="submit" <?php echo $registrationAllowed ? '' : 'disabled'; ?>>Vytvořit admin účet</button>
</form>

<p style="margin-top:16px;"><a href="login.php">Zpět na přihlášení</a></p>

<hr>
<h3>Volitelné: tajný klíč pro další registrace</h3>
<p style="font-size:14px;color:#666;">
    Pokud chcete povolit registraci dalšího admina přes URL parametr, definujte konstantu
    <code>ADMIN_REGISTER_KEY</code> (např. v <code>admin/auth/bootstrap.php</code>) a otevřete
    <code>register.php?key=VAS_KLIC</code>.
</p>
</body>
</html>