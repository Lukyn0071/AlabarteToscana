<?php
// admin/content/news_layout.php
// DB helpers for news layout (grid) + loading localized posts for each tile.

declare(strict_types=1);

require_once __DIR__ . '/news_posts.php';

function ensure_news_layouts_grid_rows_column(PDO $pdo): bool
{
    try {
        $col = $pdo->query("SHOW COLUMNS FROM `news_layouts` LIKE 'grid_rows'")->fetch();
        if ($col) return true;
        $pdo->exec("ALTER TABLE `news_layouts` ADD COLUMN `grid_rows` SMALLINT UNSIGNED NOT NULL DEFAULT 8 AFTER `grid_cols`");
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

function ensure_news_layout_tables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `news_layouts` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `layout_key` VARCHAR(80) NOT NULL,
            `grid_cols` TINYINT UNSIGNED NOT NULL DEFAULT 12,
            `grid_rows` SMALLINT UNSIGNED NOT NULL DEFAULT 8,
            `is_active` TINYINT(1) NOT NULL DEFAULT 1,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_news_layout_key` (`layout_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // If table existed before grid_rows was added and ALTER is not allowed, we fall back to settings table.
    $hasGridRows = ensure_news_layouts_grid_rows_column($pdo);

    // Fallback settings table when ALTER TABLE is not permitted on hosting.
    if (!$hasGridRows) {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `news_layout_settings` (
                `layout_key` VARCHAR(80) NOT NULL,
                `setting_key` VARCHAR(80) NOT NULL,
                `setting_value` VARCHAR(255) NOT NULL,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`layout_key`, `setting_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `news_layout_items` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `layout_id` INT UNSIGNED NOT NULL,
            `post_id` INT UNSIGNED NOT NULL,
            `x` TINYINT UNSIGNED NOT NULL,
            `y` SMALLINT UNSIGNED NOT NULL,
            `w` TINYINT UNSIGNED NOT NULL,
            `h` TINYINT UNSIGNED NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_layout_post` (`layout_id`, `post_id`),
            KEY `idx_layout_xy` (`layout_id`, `y`, `x`),
            CONSTRAINT `fk_news_layout_items_layout` FOREIGN KEY (`layout_id`) REFERENCES `news_layouts`(`id`) ON DELETE CASCADE,
            CONSTRAINT `fk_news_layout_items_post` FOREIGN KEY (`post_id`) REFERENCES `news_posts`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function ensure_default_news_layout(PDO $pdo, string $layoutKey = 'aktuality_default', int $gridCols = 12, int $gridRows = 8): int
{
    ensure_news_layout_tables($pdo);

    $stmt = $pdo->prepare('SELECT id, grid_cols, grid_rows FROM news_layouts WHERE layout_key = :k LIMIT 1');
    $stmt->execute([':k' => $layoutKey]);
    $row = $stmt->fetch();
    if (is_array($row) && !empty($row['id'])) {
        $id = (int)$row['id'];
        $currentCols = (int)($row['grid_cols'] ?? 12);
        $currentRows = (int)($row['grid_rows'] ?? 8);

        if ($gridCols > 0 && $gridCols !== $currentCols) {
            $upd = $pdo->prepare('UPDATE news_layouts SET grid_cols = :c WHERE id = :id');
            $upd->execute([':c' => $gridCols, ':id' => $id]);
        }
        if ($gridRows > 0 && $gridRows !== $currentRows) {
            $upd = $pdo->prepare('UPDATE news_layouts SET grid_rows = :r WHERE id = :id');
            $upd->execute([':r' => $gridRows, ':id' => $id]);
        }
        return $id;
    }

    $gridCols = $gridCols > 0 ? $gridCols : 12;
    $gridRows = $gridRows > 0 ? $gridRows : 8;

    $ins = $pdo->prepare('INSERT INTO news_layouts (layout_key, grid_cols, grid_rows, is_active) VALUES (:k, :c, :r, 1)');
    $ins->execute([':k' => $layoutKey, ':c' => $gridCols, ':r' => $gridRows]);
    return (int)$pdo->lastInsertId();
}

function validate_layout_items(array $items, int $gridCols): array
{
    $errors = [];
    $seenPost = [];

    $rects = [];
    foreach ($items as $idx => $it) {
        $postId = isset($it['post_id']) ? (int)$it['post_id'] : 0;
        $x = isset($it['x']) ? (int)$it['x'] : -1;
        $y = isset($it['y']) ? (int)$it['y'] : -1;
        $w = isset($it['w']) ? (int)$it['w'] : 0;
        $h = isset($it['h']) ? (int)$it['h'] : 0;

        if ($postId <= 0) $errors[] = "Item #$idx: invalid post_id";
        if ($x < 0 || $y < 0) $errors[] = "Item #$idx: x/y must be >= 0";
        if (!in_array($w, [1, 2], true) || !in_array($h, [1, 2], true)) $errors[] = "Item #$idx: w/h must be 1 or 2";
        if ($x + $w > $gridCols) $errors[] = "Item #$idx: out of bounds (x+w > grid_cols)";

        // NOTE: y is intentionally unbounded (layout can grow vertically)

        if ($postId > 0) {
            if (isset($seenPost[$postId])) $errors[] = "Duplicate post_id in layout: $postId";
            $seenPost[$postId] = true;
        }

        $rects[] = ['idx' => $idx, 'post_id' => $postId, 'x' => $x, 'y' => $y, 'w' => $w, 'h' => $h];
    }

    // Overlap check
    $n = count($rects);
    for ($i = 0; $i < $n; $i++) {
        for ($j = $i + 1; $j < $n; $j++) {
            $a = $rects[$i];
            $b = $rects[$j];
            $overlap = ($a['x'] < $b['x'] + $b['w']) && ($a['x'] + $a['w'] > $b['x'])
                && ($a['y'] < $b['y'] + $b['h']) && ($a['y'] + $a['h'] > $b['y']);
            if ($overlap) {
                $errors[] = "Overlap between items {$a['idx']} (post {$a['post_id']}) and {$b['idx']} (post {$b['post_id']})";
            }
        }
    }

    return $errors;
}

function get_news_layout_setting_int(PDO $pdo, string $layoutKey, string $settingKey, int $default): int
{
    try {
        $s = $pdo->prepare('SELECT setting_value FROM news_layout_settings WHERE layout_key = :k AND setting_key = :sk LIMIT 1');
        $s->execute([':k' => $layoutKey, ':sk' => $settingKey]);
        $val = $s->fetchColumn();
        $parsed = (int)$val;
        return $parsed > 0 ? $parsed : $default;
    } catch (Throwable $e) {
        return $default;
    }
}

/**
 * Returns layout metadata.
 */
function load_news_layout_meta(PDO $pdo, string $layoutKey = 'aktuality_default'): array
{
    ensure_news_layout_tables($pdo);

    // Prefer settings override (works even when ALTER/UPDATE privileges are restricted)
    $rowsOverride = get_news_layout_setting_int($pdo, $layoutKey, 'grid_rows', 0);

    $stmt = $pdo->prepare('SELECT id, layout_key, grid_cols, grid_rows FROM news_layouts WHERE layout_key = :k LIMIT 1');
    $stmt->execute([':k' => $layoutKey]);
    $row = $stmt->fetch();
    if (!is_array($row)) {
        $id = ensure_default_news_layout($pdo, $layoutKey);
        $row = ['id' => $id, 'layout_key' => $layoutKey, 'grid_cols' => 12, 'grid_rows' => 8];
    }

    if ($rowsOverride > 0) {
        $row['grid_rows'] = $rowsOverride;
    } else {
        $row['grid_rows'] = (int)($row['grid_rows'] ?? 8);
    }

    return $row;
}

/**
 * Loads layout items joined with localized post data.
 */
function load_news_layout(PDO $pdo, string $lang, string $layoutKey = 'aktuality_default', bool $publishedOnly = true): array
{
    $lang = in_array($lang, ['cs', 'en'], true) ? $lang : 'cs';
    $meta = load_news_layout_meta($pdo, $layoutKey);
    $layoutId = (int)$meta['id'];

    // For diagnostics
    $cntStmt = $pdo->prepare('SELECT COUNT(*) FROM news_layout_items WHERE layout_id = :layout_id');
    $cntStmt->execute([':layout_id' => $layoutId]);
    $totalItems = (int)$cntStmt->fetchColumn();

    $sql = "
        SELECT
            li.post_id,
            li.x, li.y, li.w, li.h,
            p.badge,
            p.image_path,
            COALESCE(p.display_date, DATE_FORMAT(p.published_at, '%m/%Y')) AS display_date,
            t.title, t.perex, t.body_html
        FROM news_layout_items li
        INNER JOIN news_posts p ON p.id = li.post_id
        INNER JOIN news_post_translations t ON t.post_id = p.id AND t.lang = :lang
        WHERE li.layout_id = :layout_id
        ORDER BY li.y ASC, li.x ASC, li.id ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':lang' => $lang, ':layout_id' => $layoutId]);
    $items = $stmt->fetchAll();
    if (!is_array($items)) $items = [];

    $outItems = [];
    foreach ($items as $r) {
        if (!is_array($r)) continue;
        $outItems[] = [
            'post_id' => (int)($r['post_id'] ?? 0),
            'x' => (int)($r['x'] ?? 0),
            'y' => (int)($r['y'] ?? 0),
            'w' => (int)($r['w'] ?? 1),
            'h' => (int)($r['h'] ?? 1),
            'badge' => (string)($r['badge'] ?? ''),
            'image' => (string)($r['image_path'] ?? ''),
            'date' => (string)($r['display_date'] ?? ''),
            'title' => (string)($r['title'] ?? ''),
            'perex' => (string)($r['perex'] ?? ''),
            'bodyHtml' => (string)($r['body_html'] ?? ''),
        ];
    }

    return [
        'layout' => [
            'layout_key' => (string)$meta['layout_key'],
            'grid_cols' => (int)$meta['grid_cols'],
            'grid_rows' => (int)($meta['grid_rows'] ?? 8),
        ],
        'items' => $outItems,
        'meta' => [
            'layout_items_total' => $totalItems,
            'layout_items_returned' => count($outItems),
        ],
    ];
}

function save_news_layout(PDO $pdo, string $layoutKey, array $items, int $gridCols = 12, ?int $gridRows = null): array
{
    // Ensure layout exists (grid_rows update may fail if column doesn't exist)
    $layoutId = ensure_default_news_layout($pdo, $layoutKey, $gridCols, $gridRows ?? 8);

    // Persist grid_rows even on hostings without ALTER privileges.
    if ($gridRows !== null && $gridRows > 0) {
        $updated = false;
        try {
            $pdo->prepare('UPDATE news_layouts SET grid_rows = :r WHERE id = :id')->execute([
                ':r' => $gridRows,
                ':id' => $layoutId,
            ]);
            $updated = true;
        } catch (Throwable $e) {
            $updated = false;
        }

        if (!$updated) {
            try {
                // Ensure fallback table exists
                $pdo->exec(
                    "CREATE TABLE IF NOT EXISTS `news_layout_settings` (
                        `layout_key` VARCHAR(80) NOT NULL,
                        `setting_key` VARCHAR(80) NOT NULL,
                        `setting_value` VARCHAR(255) NOT NULL,
                        `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (`layout_key`, `setting_key`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                );
                $up = $pdo->prepare('INSERT INTO news_layout_settings (layout_key, setting_key, setting_value) VALUES (:k, :sk, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
                $up->execute([':k' => $layoutKey, ':sk' => 'grid_rows', ':v' => (string)$gridRows]);
            } catch (Throwable $e) {
                // ignore
            }
        }
    }

    $errors = validate_layout_items($items, $gridCols);
    if ($errors) {
        return ['ok' => false, 'errors' => $errors];
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM news_layout_items WHERE layout_id = :id')->execute([':id' => $layoutId]);

        $ins = $pdo->prepare('INSERT INTO news_layout_items (layout_id, post_id, x, y, w, h) VALUES (:layout_id, :post_id, :x, :y, :w, :h)');
        foreach ($items as $it) {
            $ins->execute([
                ':layout_id' => $layoutId,
                ':post_id' => (int)$it['post_id'],
                ':x' => (int)$it['x'],
                ':y' => (int)$it['y'],
                ':w' => (int)$it['w'],
                ':h' => (int)$it['h'],
            ]);
        }

        $pdo->commit();
        return ['ok' => true];
    } catch (Throwable $e) {
        $pdo->rollBack();
        return ['ok' => false, 'errors' => [$e->getMessage()]];
    }
}

// End of file