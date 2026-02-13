<?php
// admin/content/page_content.php
// Shared loader for page-content sections from DB.

declare(strict_types=1);

/**
 * Returns 'cs' or 'en'. Priority: ?lang=, cookie 'lang', default 'cs'.
 */
function get_lang(): string
{
    if (isset($_GET['lang']) && in_array((string)$_GET['lang'], ['cs', 'en'], true)) {
        return (string)$_GET['lang'];
    }

    if (!empty($_COOKIE['lang']) && in_array((string)$_COOKIE['lang'], ['cs', 'en'], true)) {
        return (string)$_COOKIE['lang'];
    }

    return 'cs';
}

function ensure_page_content_table(PDO $pdo, string $tableName): void
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

/**
 * Loads page content from `page_content_{cs|en}` (row id=1).
 * If row missing, returns empty strings (so it is not hardcoded in HTML).
 */
function load_page_content(PDO $pdo, ?string $lang = null): array
{
    $lang = $lang ?? get_lang();
    $table = $lang === 'en' ? 'page_content_en' : 'page_content_cs';

    // Ensure tables exist (but do NOT seed data)
    ensure_page_content_table($pdo, 'page_content_cs');
    ensure_page_content_table($pdo, 'page_content_en');

    $empty = [
        'about_image' => '',
        'about_image_alt' => '',
        'about_eyebrow' => '',
        'about_title' => '',
        'about_p1' => '',
        'about_p2' => '',
        'winery_image' => '',
        'winery_image_alt' => '',
        'winery_eyebrow' => '',
        'winery_title' => '',
        'winery_p1' => '',
        'winery_p2' => '',
    ];

    try {
        $stmt = $pdo->query("SELECT * FROM `$table` WHERE id = 1 LIMIT 1");
        $row = $stmt->fetch();
        if (is_array($row)) {
            return array_merge($empty, $row);
        }
    } catch (Throwable $e) {
        // ignore
    }

    return $empty;
}
