<?php
// admin/content/wines.php
// Helper functions for the wines table.

declare(strict_types=1);

/**
 * Ensure the `wines` table exists; create + seed if missing.
 */
function ensure_wines_table(PDO $pdo): void
{
    $stmt = $pdo->query("SHOW TABLES LIKE 'wines'");
    if (!$stmt->fetchColumn()) {
        $pdo->exec("
            CREATE TABLE `wines` (
                `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `image`         VARCHAR(512)  NOT NULL DEFAULT '',
                `name`          VARCHAR(255)  NOT NULL DEFAULT '',
                `text`          TEXT          NOT NULL,
                `cena`          INT UNSIGNED  NOT NULL DEFAULT 0,
                `odruda`        VARCHAR(255)  NOT NULL DEFAULT '',
                `rocnik`        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
                `zeme`          VARCHAR(128)  NOT NULL DEFAULT '',
                `region`        VARCHAR(128)  NOT NULL DEFAULT '',
                `objem`         VARCHAR(64)   NOT NULL DEFAULT '',
                `alkohol`       VARCHAR(64)   NOT NULL DEFAULT '',
                `odkaz`         VARCHAR(512)  NOT NULL DEFAULT '',
                `certifikace`   ENUM('DOCG','DOC','IGT','none') NOT NULL DEFAULT 'none',
                `styl`          ENUM('červené','bílé','růžové')  NOT NULL DEFAULT 'bílé',
                `sort_order`    INT UNSIGNED  NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Seed with the 6 existing wines
        $wines = [
            [
                'image'       => 'Images/Vína/vermetinoigt23.png',
                'name'        => 'Vermentino IGT Toscana 2023 BAGIOGIE',
                'text'        => 'Svěží, minerální a chuťově výrazné bílé víno z Toskánska vyrobené z odrůdy Vermentino. Ve vůni i chuti dominují tóny citrusových plodů, především citronu a limetky, doplněné o jemné bylinné nuance a typickou středomořskou mineralitu. Víno působí lehce, elegantně a má suchý, osvěžující závěr.',
                'cena'        => 350,
                'odruda'      => 'Vermentino',
                'rocnik'      => 2023,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '13 %',
                'odkaz'       => 'https://www.alabarte.cz/vermentino-bagiogie/',
                'certifikace' => 'IGT',
                'styl'        => 'bílé',
                'sort_order'  => 1,
            ],
            [
                'image'       => 'Images/Vína/chiantisenesi23.png',
                'name'        => 'Chianti Colli Senesi DOCG 2023 La Villa',
                'text'        => 'Klasické červené víno Chianti z oblasti Colli Senesi pocházející z vinařství Fattoria La Torre. Vyrobené převážně z odrůdy Sangiovese z mladších vinic přibližně 15 let starých. V chuti je víno harmonické, s tóny červeného ovoce, jemným kořenitým nádechem a vyváženými tříslovinami.',
                'cena'        => 375,
                'odruda'      => 'Sangiovese',
                'rocnik'      => 2023,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '13,5 %',
                'odkaz'       => 'https://www.alabarte.cz/chianti-la-villa/',
                'certifikace' => 'DOCG',
                'styl'        => 'červené',
                'sort_order'  => 2,
            ],
            [
                'image'       => 'Images/Vína/rosatoigt23.png',
                'name'        => 'Rosato IGT Toscana 2023 Badalui',
                'text'        => 'Svěží růžové víno z oblasti Toskánska vyrobené z odrůdy Sangiovese z mladých vinic. V chuti dominují tóny červeného ovoce, lehká kyselina a suchý, čistý závěr. Víno je velmi dobře pitelné a ideální pro letní gastronomii.',
                'cena'        => 350,
                'odruda'      => 'Sangiovese',
                'rocnik'      => 2023,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '13 %',
                'odkaz'       => 'https://www.alabarte.cz/badalui-rosato/',
                'certifikace' => 'IGT',
                'styl'        => 'růžové',
                'sort_order'  => 3,
            ],
            [
                'image'       => 'Images/Vína/vernaccia24.png',
                'name'        => 'Vernaccia di San Gimignano DOCG 2024',
                'text'        => 'Klasické bílé víno z oblasti San Gimignano vyráběné z odrůdy Vernaccia. Hrozny jsou jemně lisovány a víno zraje na jemných kalech, což mu dodává čistotu, svěžest a jemnou strukturu. Ve vůni i chuti dominují citrusové tóny, zelené jablko a typická minerální stopa.',
                'cena'        => 375,
                'odruda'      => 'Vernaccia',
                'rocnik'      => 2024,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '12,5 %',
                'odkaz'       => 'https://www.alabarte.cz/vernaccia-di-san-gimignano-docg/',
                'certifikace' => 'DOCG',
                'styl'        => 'bílé',
                'sort_order'  => 4,
            ],
            [
                'image'       => 'Images/Vína/rossodoc22.png',
                'name'        => 'San Gimignano Rosso DOC 2022 GUINZANO',
                'text'        => 'Víno vzniká z odrůd Sangiovese, Merlot a Cabernet Sauvignon, které se vinifikují samostatně a poté se scelí do výsledného cuvée. Následuje zrání v dubových sudech a další ležení v lahvi, díky čemuž je projev harmonický, elegantní a uhlazený. Ve vůni i chuti najdeš zralé červené ovoce, jemné tóny dřeva a vyváženou strukturu s jemnými tříslovinami a dlouhým závěrem.',
                'cena'        => 700,
                'odruda'      => 'Sangiovese, Merlot, Cabernet Sauvignon',
                'rocnik'      => 2022,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '14 %',
                'odkaz'       => 'https://www.alabarte.cz/san-gimignano-rosso-doc-2022/',
                'certifikace' => 'DOC',
                'styl'        => 'červené',
                'sort_order'  => 5,
            ],
            [
                'image'       => 'Images/Vína/vernacciadocg22.png',
                'name'        => 'Vernaccia di San Gimignano Riserva DOCG 2022 Sciallebiancho',
                'text'        => 'Prémiová Vernaccia di San Gimignano Riserva z vinařství Fattoria La Torre. Hrozny pocházejí ze starých vinic přibližně 30 letých. Víno zraje na jemných kalech, což mu dodává hloubku, noblesu a jemnou krémovou strukturu. Ve vůni i chuti se objevují tóny citrusové kůry, minerality, lískových oříšků a jemné vanilky.',
                'cena'        => 700,
                'odruda'      => 'Vernaccia',
                'rocnik'      => 2022,
                'zeme'        => 'Itálie',
                'region'      => 'Toskánsko',
                'objem'       => '0,75 l',
                'alkohol'     => '13,5 %',
                'odkaz'       => 'https://www.alabarte.cz/vernaccia-sciallebianco/',
                'certifikace' => 'DOCG',
                'styl'        => 'bílé',
                'sort_order'  => 6,
            ],
        ];

        $sql = "INSERT INTO `wines` (`image`,`name`,`text`,`cena`,`odruda`,`rocnik`,`zeme`,`region`,`objem`,`alkohol`,`odkaz`,`certifikace`,`styl`,`sort_order`)
                VALUES (:image,:name,:text,:cena,:odruda,:rocnik,:zeme,:region,:objem,:alkohol,:odkaz,:certifikace,:styl,:sort_order)";
        $insert = $pdo->prepare($sql);

        foreach ($wines as $w) {
            $insert->execute($w);
        }
    }

    $stmtTranslations = $pdo->query("SHOW TABLES LIKE 'wine_translations'");
    if (!$stmtTranslations->fetchColumn()) {
        $pdo->exec("
            CREATE TABLE `wine_translations` (
                `wine_id` INT UNSIGNED NOT NULL,
                `lang` VARCHAR(5) NOT NULL,
                `name` VARCHAR(255) NOT NULL DEFAULT '',
                `text` TEXT NOT NULL,
                `zeme` VARCHAR(128) NOT NULL DEFAULT '',
                `region` VARCHAR(128) NOT NULL DEFAULT '',
                PRIMARY KEY (`wine_id`, `lang`),
                CONSTRAINT `fk_wine_translations_wine`
                    FOREIGN KEY (`wine_id`) REFERENCES `wines`(`id`)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } else {
        $columns = $pdo->query("SHOW COLUMNS FROM `wine_translations`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('zeme', $columns, true)) {
            $pdo->exec("ALTER TABLE `wine_translations` ADD COLUMN `zeme` VARCHAR(128) NOT NULL DEFAULT '' AFTER `text`");
        }
        if (!in_array('region', $columns, true)) {
            $pdo->exec("ALTER TABLE `wine_translations` ADD COLUMN `region` VARCHAR(128) NOT NULL DEFAULT '' AFTER `zeme`");
        }
    }
}

function upsert_wine_translation(PDO $pdo, int $wineId, string $lang, array $translation): void
{
    if ($lang !== 'en') {
        return;
    }

    $name = trim((string)($translation['name'] ?? ''));
    $text = trim((string)($translation['text'] ?? ''));
    $zeme = trim((string)($translation['zeme'] ?? ''));
    $region = trim((string)($translation['region'] ?? ''));

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `wine_translations` WHERE `wine_id` = :wine_id AND `lang` = :lang");
    $stmt->execute(['wine_id' => $wineId, 'lang' => $lang]);
    $exists = (int)$stmt->fetchColumn() > 0;

    if ($exists) {
        $update = $pdo->prepare("UPDATE `wine_translations` SET `name` = :name, `text` = :text, `zeme` = :zeme, `region` = :region WHERE `wine_id` = :wine_id AND `lang` = :lang");
        $update->execute([
            'wine_id' => $wineId,
            'lang' => $lang,
            'name' => $name,
            'text' => $text,
            'zeme' => $zeme,
            'region' => $region,
        ]);
        return;
    }

    $insert = $pdo->prepare("INSERT INTO `wine_translations` (`wine_id`, `lang`, `name`, `text`, `zeme`, `region`) VALUES (:wine_id, :lang, :name, :text, :zeme, :region)");
    $insert->execute([
        'wine_id' => $wineId,
        'lang' => $lang,
        'name' => $name,
        'text' => $text,
        'zeme' => $zeme,
        'region' => $region,
    ]);
}

/**
 * @return array<string, array{name:string,text:string,zeme:string,region:string}>
 */
function get_wine_translations(PDO $pdo, int $wineId): array
{
    ensure_wines_table($pdo);
    $stmt = $pdo->prepare("SELECT `lang`, `name`, `text`, `zeme`, `region` FROM `wine_translations` WHERE `wine_id` = :wine_id");
    $stmt->execute(['wine_id' => $wineId]);
    $translations = [];
    foreach ($stmt->fetchAll() as $row) {
        $translations[(string)$row['lang']] = [
            'name' => (string)($row['name'] ?? ''),
            'text' => (string)($row['text'] ?? ''),
            'zeme' => (string)($row['zeme'] ?? ''),
            'region' => (string)($row['region'] ?? ''),
        ];
    }
    return $translations;
}

/**
 * Fetch all wines ordered by sort_order.
 * @return array<int, array<string, mixed>>
 */
function get_all_wines(PDO $pdo, string $lang = 'cs', bool $includeTranslations = true): array
{
    ensure_wines_table($pdo);

    $sql = "SELECT w.*,
                   wt.name AS en_name,
                   wt.text AS en_text,
                   wt.zeme AS en_zeme,
                   wt.region AS en_region
            FROM `wines` w
            LEFT JOIN `wine_translations` wt
              ON wt.wine_id = w.id AND wt.lang = 'en'
            ORDER BY w.`sort_order` ASC, w.`id` ASC";

    $rows = $pdo->query($sql)->fetchAll();
    $lang = $lang === 'en' ? 'en' : 'cs';

    foreach ($rows as &$row) {
        $csName = (string)($row['name'] ?? '');
        $csText = (string)($row['text'] ?? '');
        $csZeme = (string)($row['zeme'] ?? '');
        $csRegion = (string)($row['region'] ?? '');
        $enName = (string)($row['en_name'] ?? '');
        $enText = (string)($row['en_text'] ?? '');
        $enZeme = (string)($row['en_zeme'] ?? '');
        $enRegion = (string)($row['en_region'] ?? '');

        if ($includeTranslations) {
            $row['translations'] = [
                'cs' => ['name' => $csName, 'text' => $csText, 'zeme' => $csZeme, 'region' => $csRegion],
                'en' => ['name' => $enName, 'text' => $enText, 'zeme' => $enZeme, 'region' => $enRegion],
            ];
        }

        if ($lang === 'en') {
            $row['name'] = $enName !== '' ? $enName : $csName;
            $row['text'] = $enText !== '' ? $enText : $csText;
            $row['zeme'] = $enZeme !== '' ? $enZeme : $csZeme;
            $row['region'] = $enRegion !== '' ? $enRegion : $csRegion;
        }

        unset($row['en_name'], $row['en_text'], $row['en_zeme'], $row['en_region']);
    }
    unset($row);

    return $rows;
}

/**
 * Fetch a single wine by id.
 * @return array<string, mixed>|null
 */
function get_wine_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM `wines` WHERE `id` = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Create a new wine row and return its id.
 */
function create_wine(PDO $pdo, array $data): int
{
    ensure_wines_table($pdo);

    $translations = is_array($data['translations'] ?? null) ? $data['translations'] : [];
    unset($data['translations']);

    $defaults = [
        'image' => '',
        'name' => '',
        'text' => '',
        'cena' => 0,
        'odruda' => '',
        'rocnik' => 0,
        'zeme' => '',
        'region' => '',
        'objem' => '',
        'alkohol' => '',
        'odkaz' => '',
        'certifikace' => 'none',
        'styl' => 'bílé',
        'sort_order' => get_next_wine_sort_order($pdo),
    ];

    $payload = array_merge($defaults, array_intersect_key($data, $defaults));

    $sql = "INSERT INTO `wines` (`image`,`name`,`text`,`cena`,`odruda`,`rocnik`,`zeme`,`region`,`objem`,`alkohol`,`odkaz`,`certifikace`,`styl`,`sort_order`)
            VALUES (:image,:name,:text,:cena,:odruda,:rocnik,:zeme,:region,:objem,:alkohol,:odkaz,:certifikace,:styl,:sort_order)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($payload);

    $wineId = (int)$pdo->lastInsertId();
    if (isset($translations['en']) && is_array($translations['en'])) {
        upsert_wine_translation($pdo, $wineId, 'en', $translations['en']);
    }

    return $wineId;
}

function update_wine(PDO $pdo, int $id, array $data): bool
{
    $translations = is_array($data['translations'] ?? null) ? $data['translations'] : [];
    unset($data['translations']);

    $allowed = ['image','name','text','cena','odruda','rocnik','zeme','region','objem','alkohol','odkaz','certifikace','styl','sort_order'];
    $sets = [];
    $params = ['id' => $id];

    foreach ($allowed as $col) {
        if (array_key_exists($col, $data)) {
            $sets[] = "`$col` = :$col";
            $params[$col] = $data[$col];
        }
    }

    $ok = true;
    if (!empty($sets)) {
        $sql = "UPDATE `wines` SET " . implode(', ', $sets) . " WHERE `id` = :id";
        $stmt = $pdo->prepare($sql);
        $ok = $stmt->execute($params);
    }

    if (isset($translations['en']) && is_array($translations['en'])) {
        upsert_wine_translation($pdo, $id, 'en', $translations['en']);
    }

    return $ok;
}

function get_next_wine_sort_order(PDO $pdo): int
{
    ensure_wines_table($pdo);
    $value = $pdo->query("SELECT COALESCE(MAX(`sort_order`), 0) + 1 FROM `wines`")->fetchColumn();
    return max(1, (int)$value);
}

function delete_wine(PDO $pdo, int $id): bool
{
    ensure_wines_table($pdo);
    $stmt = $pdo->prepare("DELETE FROM `wines` WHERE `id` = :id");
    return $stmt->execute(['id' => $id]);
}

/**
 * Persist order of wines by IDs.
 *
 * - Only IDs that exist in DB are used.
 * - Any wines missing from $orderedIds are appended after, keeping their current order.
 * - Final sort_order is normalized to 1..N.
 *
 * @param array<int, int> $orderedIds
 * @return int updated rows count
 */
function reorder_wines_by_ids(PDO $pdo, array $orderedIds): int
{
    ensure_wines_table($pdo);

    // Deduplicate + keep numeric ids > 0
    $seen = [];
    $clean = [];
    foreach ($orderedIds as $id) {
        $id = (int)$id;
        if ($id <= 0) continue;
        if (isset($seen[$id])) continue;
        $seen[$id] = true;
        $clean[] = $id;
    }

    $pdo->beginTransaction();
    try {
        // Lock all wines so concurrent reorder doesn't interleave.
        $rows = $pdo->query("SELECT `id`, `sort_order` FROM `wines` ORDER BY `sort_order` ASC, `id` ASC FOR UPDATE")->fetchAll(PDO::FETCH_ASSOC);
        $existingIds = array_map(static fn($r) => (int)$r['id'], $rows);
        $existingSet = array_fill_keys($existingIds, true);

        // Keep only ids that exist.
        $ordered = [];
        foreach ($clean as $id) {
            if (isset($existingSet[$id])) {
                $ordered[] = $id;
                unset($existingSet[$id]);
            }
        }

        // Append remaining wines (not included in payload) in their current order.
        foreach ($rows as $r) {
            $id = (int)$r['id'];
            if (isset($existingSet[$id])) {
                $ordered[] = $id;
            }
        }

        $stmt = $pdo->prepare("UPDATE `wines` SET `sort_order` = :sort_order WHERE `id` = :id");
        $pos = 1;
        $updated = 0;
        foreach ($ordered as $id) {
            $stmt->execute(['sort_order' => $pos, 'id' => $id]);
            $updated += $stmt->rowCount();
            $pos++;
        }

        $pdo->commit();
        return $updated;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}
