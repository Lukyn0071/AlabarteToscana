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
            `image_path` VARCHAR(255) NULL,
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
 * Loads all news for given language.
 * Returns array of: id, slot, badge, display_date, image_path, title, perex, body_html
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
            p.image_path,
            COALESCE(p.display_date, DATE_FORMAT(p.published_at, '%m/%Y')) AS display_date,
            t.title,
            t.perex,
            t.body_html
        FROM news_posts p
        INNER JOIN news_post_translations t
            ON t.post_id = p.id AND t.lang = :lang
        ORDER BY (p.slot IS NULL) ASC, p.slot ASC, p.sort_order ASC, p.id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':lang' => $lang]);
    $rows = $stmt->fetchAll();

    return is_array($rows) ? $rows : [];
}