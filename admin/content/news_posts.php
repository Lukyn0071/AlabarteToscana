<?php
// admin/content/news_posts.php
// DB helpers for news/aktuality posts & translations.

declare(strict_types=1);

/**
 * Creates tables for news posts and translations (cs/en).
 */
function ensure_news_tables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `news_posts` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `slot` VARCHAR(32) NULL,
            `sort_order` INT NOT NULL DEFAULT 0,
            `badge` VARCHAR(60) NULL,
            `image_paths` TEXT NULL, -- JSON pole obrázků
            `display_date` VARCHAR(32) NULL,
            `published_at` DATE NULL,
            `is_published` TINYINT(1) NOT NULL DEFAULT 1,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_news_published` (`is_published`, `published_at`, `id`),
            KEY `idx_news_slot_order` (`slot`, `sort_order`, `id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Pokud sloupec image_paths neexistuje, přidat ho (pro migraci starých DB)
    try {
        $col = $pdo->query("SHOW COLUMNS FROM `news_posts` LIKE 'image_paths'")->fetch();
        if (!$col) {
            $pdo->exec("ALTER TABLE `news_posts` ADD COLUMN `image_paths` TEXT NULL AFTER `image_path`");
        }
    } catch (Throwable $e) {}

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `news_post_translations` (
            `post_id` INT UNSIGNED NOT NULL,
            `lang` ENUM('cs','en') NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `perex` TEXT NOT NULL,
            `body_html` MEDIUMTEXT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`post_id`, `lang`),
            CONSTRAINT `fk_news_post_translations_post`
                FOREIGN KEY (`post_id`) REFERENCES `news_posts`(`id`)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

/**
 * Normalize stored image_path to a URL that works from anywhere.
 * Preferred format for front-end: root-relative (/Images/...).
 */
function normalize_image_url(string $path): string {
    $p0 = trim($path);
    if ($p0 === '') return '';

    $p = str_replace('\\', '/', $p0);
    $p = preg_replace('~^\./+~', '', $p) ?? $p;

    // Absolutní URL nech
    if (preg_match('~^(https?:)?//~i', $p)) return $p;

    // Odstraň ../ na začátku
    $p = preg_replace('~^(\.\./)+~', '', $p);

    // Pokud začíná Images/, přidej lomítko
    if (str_starts_with($p, 'Images/')) {
        return '/' . $p;
    }

    // Pokud už je root-relative
    if (str_starts_with($p, '/')) return $p;

    return '/' . $p;
}

/**
 * Loads all news for given language.
 * Returns array of: id, slot, badge, display_date, images (pole), title, perex, body_html
 */
function load_news(PDO $pdo, string $lang, bool $publishedOnly = true): array
{
    ensure_news_tables($pdo);

    $lang = in_array($lang, ['cs', 'en'], true) ? $lang : 'cs';

    $sql = "
        SELECT
            p.id,
            p.slot,
            p.sort_order,
            p.badge,
            p.image_paths,
            COALESCE(p.display_date, DATE_FORMAT(p.published_at, '%m/%Y')) AS display_date,
            t.title,
            t.perex,
            t.body_html
        FROM news_posts p
        LEFT JOIN news_post_translations t
            ON t.post_id = p.id AND t.lang = :lang
        ORDER BY (p.slot IS NULL) ASC, p.slot ASC, p.sort_order ASC, p.id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':lang' => $lang]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($rows as $row) {

        $images = [];

        if (!empty($row['image_paths'])) {

            $decoded = json_decode($row['image_paths'], true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {

                foreach ($decoded as $img) {

                    if (!is_string($img)) continue;

                    // Normalizuj každou cestu na root-relative/absolute URL
                    $images[] = normalize_image_url($img);
                }
            }
        }

        $result[] = [
            'id' => (int)$row['id'],
            'slot' => $row['slot'],
            'sort_order' => (int)$row['sort_order'],
            'badge' => $row['badge'],
            'images' => $images,
            'display_date' => $row['display_date'],
            'title' => $row['title'] ?? '',
            'perex' => $row['perex'] ?? '',
            'body_html' => $row['body_html'] ?? '',
        ];
    }

    return $result;
}