<?php
// admin/content/page_sections.php
// Dynamic page-content sections loader (CS/EN). Enables adding/removing sections freely.

declare(strict_types=1);

require_once __DIR__ . '/page_content.php';

function ensure_page_sections_table(PDO $pdo, string $tableName): void
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

/**
 * Loads all sections for given language, ordered.
 * Returns [] if none exist.
 */
function load_page_sections(PDO $pdo, ?string $lang = null): array
{
    $lang = $lang ?? get_lang();
    $table = $lang === 'en' ? 'page_sections_en' : 'page_sections_cs';

    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    try {
        $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY sort_order ASC, id ASC");
        $rows = $stmt->fetchAll();
        return is_array($rows) ? $rows : [];
    } catch (Throwable $e) {
        return [];
    }
}

/**
 * Determines alternating section style based on index.
 * Even: info-section layout, Odd: winery-section layout.
 */
function section_style_class(int $index): string
{
    return ($index % 2 === 0) ? 'info-section' : 'winery-section';
}

function section_inner_class(int $index): string
{
    return ($index % 2 === 0) ? 'info-inner js-reveal' : 'winery-inner js-reveal-winery';
}

function section_card_class(int $index): string
{
    return ($index % 2 === 0) ? 'brush-card' : 'winery-card';
}

function section_eyebrow_class(int $index): string
{
    return ($index % 2 === 0) ? 'info-eyebrow' : 'winery-eyebrow';
}

function section_title_class(int $index): string
{
    return ($index % 2 === 0) ? 'info-title' : 'winery-title';
}

function section_p_class(int $index): string
{
    return ($index % 2 === 0) ? 'info-par' : 'winery-par';
}

/**
 * Loads paired CS+EN records by sort_order.
 * @return array<int, array{sort_order:int,anchor:?string,image_path:string,image_alt:string,cs:array,en:array}>
 */
function load_section_pairs(PDO $pdo): array
{
    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    $cs = $pdo->query('SELECT * FROM page_sections_cs ORDER BY sort_order ASC, id ASC')->fetchAll() ?: [];
    $en = $pdo->query('SELECT * FROM page_sections_en ORDER BY sort_order ASC, id ASC')->fetchAll() ?: [];

    $bySortEn = [];
    foreach ($en as $r) {
        $bySortEn[(int)$r['sort_order']] = $r;
    }

    $pairs = [];
    foreach ($cs as $r) {
        $sort = (int)$r['sort_order'];
        $enRow = $bySortEn[$sort] ?? null;
        if (!$enRow) {
            continue;
        }

        $pairs[] = [
            'sort_order' => $sort,
            'anchor' => ($r['anchor'] ?? null),
            'image_path' => (string)$r['image_path'],
            'image_alt' => (string)$r['image_alt'],
            'cs' => $r,
            'en' => $enRow,
        ];
    }

    return $pairs;
}

function get_pair_by_sort(PDO $pdo, int $sortOrder): ?array
{
    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    $stmt = $pdo->prepare('SELECT * FROM page_sections_cs WHERE sort_order = :s LIMIT 1');
    $stmt->execute([':s' => $sortOrder]);
    $cs = $stmt->fetch();

    $stmt2 = $pdo->prepare('SELECT * FROM page_sections_en WHERE sort_order = :s LIMIT 1');
    $stmt2->execute([':s' => $sortOrder]);
    $en = $stmt2->fetch();

    if (!is_array($cs) || !is_array($en)) {
        return null;
    }

    return [
        'sort_order' => $sortOrder,
        'anchor' => ($cs['anchor'] ?? null),
        'image_path' => (string)$cs['image_path'],
        'image_alt' => (string)$cs['image_alt'],
        'cs' => $cs,
        'en' => $en,
    ];
}

/**
 * Delete both CS+EN rows by sort_order and return deleted data for undo.
 */
function delete_pair_by_sort(PDO $pdo, int $sortOrder): ?array
{
    $pair = get_pair_by_sort($pdo, $sortOrder);
    if ($pair === null) {
        return null;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('DELETE FROM page_sections_cs WHERE sort_order = :s');
        $stmt->execute([':s' => $sortOrder]);
        $stmt2 = $pdo->prepare('DELETE FROM page_sections_en WHERE sort_order = :s');
        $stmt2->execute([':s' => $sortOrder]);
        $pdo->commit();
        return $pair;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Restore a deleted pair (undo delete).
 */
function restore_pair(PDO $pdo, array $pair): void
{
    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    $sort = (int)$pair['sort_order'];

    $pdo->beginTransaction();
    try {
        $ins = 'INSERT INTO %s (sort_order, anchor, image_path, image_alt, eyebrow, title, body1, body2)
                VALUES (:sort_order, :anchor, :image_path, :image_alt, :eyebrow, :title, :body1, :body2)';

        $stmtCs = $pdo->prepare(sprintf($ins, 'page_sections_cs'));
        $stmtEn = $pdo->prepare(sprintf($ins, 'page_sections_en'));

        $common = [
            ':sort_order' => $sort,
            ':anchor' => $pair['cs']['anchor'] ?? null,
            ':image_path' => (string)$pair['cs']['image_path'],
            ':image_alt' => (string)$pair['cs']['image_alt'],
        ];

        $stmtCs->execute($common + [
            ':eyebrow' => (string)$pair['cs']['eyebrow'],
            ':title' => (string)$pair['cs']['title'],
            ':body1' => (string)$pair['cs']['body1'],
            ':body2' => ($pair['cs']['body2'] ?? null),
        ]);

        $stmtEn->execute($common + [
            ':eyebrow' => (string)$pair['en']['eyebrow'],
            ':title' => (string)$pair['en']['title'],
            ':body1' => (string)$pair['en']['body1'],
            ':body2' => ($pair['en']['body2'] ?? null),
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Update both CS+EN rows by sort_order.
 */
function update_pair(PDO $pdo, int $sortOrder, array $common, array $cs, array $en): void
{
    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    $pdo->beginTransaction();
    try {
        $sql = 'UPDATE %s SET anchor = :anchor, image_alt = :image_alt, eyebrow = :eyebrow, title = :title, body1 = :body1, body2 = :body2 WHERE sort_order = :sort_order';

        // image_path is updated only if provided and non-empty
        $setImage = (isset($common['image_path']) && is_string($common['image_path']) && $common['image_path'] !== '');
        if ($setImage) {
            $sql = 'UPDATE %s SET anchor = :anchor, image_path = :image_path, image_alt = :image_alt, eyebrow = :eyebrow, title = :title, body1 = :body1, body2 = :body2 WHERE sort_order = :sort_order';
        }

        $stmtCs = $pdo->prepare(sprintf($sql, 'page_sections_cs'));
        $stmtEn = $pdo->prepare(sprintf($sql, 'page_sections_en'));

        $base = [
            ':sort_order' => $sortOrder,
            ':anchor' => $common['anchor'] ?? null,
            ':image_alt' => (string)$common['image_alt'],
        ];

        if ($setImage) {
            $base[':image_path'] = (string)$common['image_path'];
        }

        $stmtCs->execute($base + [
            ':eyebrow' => (string)$cs['eyebrow'],
            ':title' => (string)$cs['title'],
            ':body1' => (string)$cs['body1'],
            ':body2' => ($cs['body2'] !== '' ? $cs['body2'] : null),
        ]);

        $stmtEn->execute($base + [
            ':eyebrow' => (string)$en['eyebrow'],
            ':title' => (string)$en['title'],
            ':body1' => (string)$en['body1'],
            ':body2' => ($en['body2'] !== '' ? $en['body2'] : null),
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Returns JSON-serializable array for client-side language switching in admin preview.
 */
function section_pairs_to_client_data(array $pairs): array
{
    $out = [];
    foreach ($pairs as $p) {
        $sort = (int)$p['sort_order'];
        $out[$sort] = [
            'anchor' => (string)($p['anchor'] ?? ''),
            'image_path' => (string)($p['image_path'] ?? ''),
            'image_alt' => (string)($p['image_alt'] ?? ''),
            'cs' => [
                'eyebrow' => (string)($p['cs']['eyebrow'] ?? ''),
                'title' => (string)($p['cs']['title'] ?? ''),
                'body1' => (string)($p['cs']['body1'] ?? ''),
                'body2' => (string)($p['cs']['body2'] ?? ''),
            ],
            'en' => [
                'eyebrow' => (string)($p['en']['eyebrow'] ?? ''),
                'title' => (string)($p['en']['title'] ?? ''),
                'body1' => (string)($p['en']['body1'] ?? ''),
                'body2' => (string)($p['en']['body2'] ?? ''),
            ],
        ];
    }
    return $out;
}

/**
 * Reorders sections by providing an ordered list of existing sort_order values.
 * Updates both CS and EN tables to new contiguous sort_order: 1..N.
 *
 * @param int[] $orderedSortOrders
 */
function reorder_sections(PDO $pdo, array $orderedSortOrders): void
{
    ensure_page_sections_table($pdo, 'page_sections_cs');
    ensure_page_sections_table($pdo, 'page_sections_en');

    // sanitize
    $ordered = [];
    foreach ($orderedSortOrders as $v) {
        $i = (int)$v;
        if ($i > 0 && !in_array($i, $ordered, true)) {
            $ordered[] = $i;
        }
    }

    if (!$ordered) {
        return;
    }

    // Build mapping old=>new
    $map = [];
    $n = 1;
    foreach ($ordered as $old) {
        $map[$old] = $n++;
    }

    $pdo->beginTransaction();
    try {
        // Use temporary large values to avoid unique conflicts if someone later adds unique index
        $tmpBase = 1000000;
        $stmtCs = $pdo->prepare('UPDATE page_sections_cs SET sort_order = :new WHERE sort_order = :old');
        $stmtEn = $pdo->prepare('UPDATE page_sections_en SET sort_order = :new WHERE sort_order = :old');

        foreach ($map as $old => $new) {
            $tmp = $tmpBase + $new;
            $stmtCs->execute([':new' => $tmp, ':old' => $old]);
            $stmtEn->execute([':new' => $tmp, ':old' => $old]);
        }

        foreach ($map as $old => $new) {
            $tmp = $tmpBase + $new;
            $stmtCs->execute([':new' => $new, ':old' => $tmp]);
            $stmtEn->execute([':new' => $new, ':old' => $tmp]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}