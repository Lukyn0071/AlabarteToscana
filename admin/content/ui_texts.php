<?php
// admin/content/ui_texts.php
// DB-driven UI copy for index.php outside page-content sections.

declare(strict_types=1);

require_once __DIR__ . '/page_content.php';

function ensure_ui_texts_table(PDO $pdo, string $tableName): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `$tableName` (
            `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,

            `site_title` VARCHAR(255) NOT NULL DEFAULT '',

            `nav_home` VARCHAR(80) NOT NULL DEFAULT '',
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

            -- Aktuality page UI
            `aktuality_title` VARCHAR(255) NOT NULL DEFAULT '',
            `aktuality_lead` TEXT NOT NULL,
            `quote_text` VARCHAR(255) NOT NULL DEFAULT '',
            `quote_author` VARCHAR(255) NOT NULL DEFAULT '',
            `modal_detail_h3` VARCHAR(80) NOT NULL DEFAULT '',

            -- shared/footer
            `kontakt_title` VARCHAR(80) NOT NULL DEFAULT '',

            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function load_ui_texts(PDO $pdo, ?string $lang = null): array
{
    $lang = $lang ?? get_lang();
    $table = $lang === 'en' ? 'ui_texts_en' : 'ui_texts_cs';

    ensure_ui_texts_table($pdo, 'ui_texts_cs');
    ensure_ui_texts_table($pdo, 'ui_texts_en');

    $empty = [
        'site_title' => 'ALABARTE',
        'nav_home' => '',
        'nav_kontakt' => '',
        'nav_vina' => '',
        'nav_galerie' => '',
        'nav_eshop' => '',
        'hero_tagline' => '',
        'scroll_hint' => '',
        'slide1_h2' => '',
        'slide1_p' => '',
        'slide2_h2' => '',
        'slide2_p' => '',
        'slide3_h2' => '',
        'slide3_p' => '',
        'cta_wines' => '',
        'cta_shop' => '',

        // Aktuality page UI
        'aktuality_title' => '',
        'aktuality_lead' => '',
        'quote_text' => '',
        'quote_author' => '',
        'modal_detail_h3' => '',

        // shared/footer
        'kontakt_title' => '',
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