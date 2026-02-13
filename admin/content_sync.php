<?php
// admin/content_sync.php
// Helper: creates content tables (CS/EN). Does NOT insert any data.

declare(strict_types=1);

require_once __DIR__ . '/auth/bootstrap.php';
require_login();

function create_content_table(PDO $pdo, string $tableName): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `$tableName` (
            `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            `about_image` VARCHAR(255) NOT NULL,
            `about_image_alt` VARCHAR(255) NOT NULL,
            `about_eyebrow` VARCHAR(120) NOT NULL,
            `about_title` VARCHAR(255) NOT NULL,
            `about_p1` TEXT NOT NULL,
            `about_p2` TEXT NOT NULL,

            `winery_image` VARCHAR(255) NOT NULL,
            `winery_image_alt` VARCHAR(255) NOT NULL,
            `winery_eyebrow` VARCHAR(120) NOT NULL,
            `winery_title` VARCHAR(255) NOT NULL,
            `winery_p1` TEXT NOT NULL,
            `winery_p2` TEXT NOT NULL,

            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function create_sections_table(PDO $pdo, string $tableName): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `$tableName` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `sort_order` INT NOT NULL DEFAULT 0,
            `anchor` VARCHAR(64) NULL,

            `image_path` VARCHAR(255) NOT NULL,
            `image_alt` VARCHAR(255) NOT NULL,

            `eyebrow` VARCHAR(120) NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `body1` TEXT NOT NULL,
            `body2` TEXT NULL,

            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            INDEX (`sort_order`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function create_ui_texts_table(PDO $pdo, string $tableName): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `$tableName` (
            `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,

            `site_title` VARCHAR(255) NOT NULL DEFAULT '',

            `nav_kontakt` VARCHAR(80) NOT NULL DEFAULT '',
            `nav_vina` VARCHAR(80) NOT NULL DEFAULT '',
            `nav_galerie` VARCHAR(80) NOT NULL DEFAULT '',
            `nav_eshop` VARCHAR(80) NOT NULL DEFAULT '',

            `hero_tagline` VARCHAR(255) NOT NULL DEFAULT '',
            `scroll_hint` VARCHAR(80) NOT NULL DEFAULT '',

            `slide1_h2` VARCHAR(255) NOT NULL DEFAULT '',
            `slide1_p` TEXT NOT NULL,
            `slide2_h2` VARCHAR(255) NOT NULL DEFAULT '',
            `slide2_p` TEXT NOT NULL,
            `slide3_h2` VARCHAR(255) NOT NULL DEFAULT '',
            `slide3_p` TEXT NOT NULL,

            `cta_wines` VARCHAR(80) NOT NULL DEFAULT '',
            `cta_shop` VARCHAR(80) NOT NULL DEFAULT '',

            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

try {
    // Legacy single-row tables (still used elsewhere)
    create_content_table($pdo, 'page_content_cs');
    create_content_table($pdo, 'page_content_en');

    // New dynamic sections tables
    create_sections_table($pdo, 'page_sections_cs');
    create_sections_table($pdo, 'page_sections_en');

    // UI texts tables
    create_ui_texts_table($pdo, 'ui_texts_cs');
    create_ui_texts_table($pdo, 'ui_texts_en');

    $ok = true;
} catch (Throwable $e) {
    $ok = false;
    $err = $e->getMessage();
}
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Content tables</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 16px}</style>
</head>
<body>
<h1>Content tables</h1>
<?php if ($ok): ?>
    <p>Hotovo: tabulky jsou vytvořené:</p>
    <ul>
        <li><code>page_content_cs</code>, <code>page_content_en</code> (legacy)</li>
        <li><code>page_sections_cs</code>, <code>page_sections_en</code> (pro dynamické sekce v page-content)</li>
        <li><code>ui_texts_cs</code>, <code>ui_texts_en</code> (UI texty index.php mimo page-content)</li>
    </ul>

    <p>Teď do <code>page_sections_cs</code> a <code>page_sections_en</code> vložte sekce (řádky) dle potřeby.</p>
    <p><a href="index.php">Zpět do adminu</a></p>
<?php else: ?>
    <p>Chyba: <?php echo htmlspecialchars((string)$err, ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>
</body>
</html>