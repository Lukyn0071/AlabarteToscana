<?php
require_once __DIR__ . '/auth/bootstrap.php';
require_login();

require_once __DIR__ . '/content/page_sections.php';
require_once __DIR__ . '/content/ui_texts.php';
require_once __DIR__ . '/content/hero_ui.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$username = current_admin_username();

$flashError = null;

// ------------------------------
// DELETE
// ------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete_section') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $sort = (int)($_POST['sort_order'] ?? 0);
    if ($sort <= 0) {
        $flashError = 'Neplatná sekce.';
    } else {
        try {
            $deleted = delete_pair_by_sort($pdo, $sort);
            if ($deleted) {
                $_SESSION['undo'] = ['type' => 'delete', 'payload' => $deleted, 'ts' => time()];
                header('Location: index.php?t=ok&m=' . urlencode('Sekce byla smazána.') . '&u=1');
                exit;
            }
            $flashError = 'Sekci se nepodařilo smazat.';
        } catch (Throwable $e) {
            $flashError = 'Sekci se nepodařilo smazat.';
        }
    }
}

// ------------------------------
// EDIT
// ------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'edit_section') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $sort = (int)($_POST['sort_order'] ?? 0);
    if ($sort <= 0) {
        $flashError = 'Neplatná sekce.';
    } else {
        $anchor = trim((string)($_POST['anchor'] ?? ''));
        if ($anchor !== '' && !preg_match('~^[a-z0-9\-]{1,64}$~', $anchor)) {
            $flashError = 'Anchor musí obsahovat jen a-z, 0-9 a pomlčku.';
        }

        $imageAlt = trim((string)($_POST['image_alt'] ?? ''));
        if ($flashError === null && $imageAlt === '') {
            $flashError = 'Alt text obrázku je povinný.';
        }

        $csEyebrow = trim((string)($_POST['cs_eyebrow'] ?? ''));
        $csTitle = trim((string)($_POST['cs_title'] ?? ''));
        $csBody1 = trim((string)($_POST['cs_body1'] ?? ''));
        $csBody2 = trim((string)($_POST['cs_body2'] ?? ''));

        $enEyebrow = trim((string)($_POST['en_eyebrow'] ?? ''));
        $enTitle = trim((string)($_POST['en_title'] ?? ''));
        $enBody1 = trim((string)($_POST['en_body1'] ?? ''));
        $enBody2 = trim((string)($_POST['en_body2'] ?? ''));

        if ($flashError === null && ($csTitle === '' || $csBody1 === '' || $enTitle === '' || $enBody1 === '')) {
            $flashError = 'Vyplňte povinná pole (title+text pro CS i EN).';
        }

        $newImagePath = '';
        if ($flashError === null && !empty($_FILES['image']) && is_array($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            if (($_FILES['image']['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                $flashError = 'Chyba při nahrávání obrázku.';
            } else {
                $tmp = (string)$_FILES['image']['tmp_name'];
                $size = (int)$_FILES['image']['size'];
                if ($size > 5 * 1024 * 1024) {
                    $flashError = 'Obrázek je moc velký (max 5 MB).';
                } else {
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mime = $finfo->file($tmp) ?: '';
                    $ext = match ($mime) {
                        'image/jpeg' => 'jpg',
                        'image/png' => 'png',
                        'image/webp' => 'webp',
                        default => '',
                    };
                    if ($ext === '') {
                        $flashError = 'Nepodporovaný typ obrázku (povoleno JPG/PNG/WebP).';
                    } else {
                        $targetDir = __DIR__ . '/../Images/sections';
                        if (!is_dir($targetDir)) {
                            @mkdir($targetDir, 0755, true);
                        }
                        if (!is_dir($targetDir) || !is_writable($targetDir)) {
                            $flashError = 'Nelze zapisovat do Images/sections.';
                        } else {
                            $fileName = bin2hex(random_bytes(16)) . '.' . $ext;
                            $targetPath = $targetDir . '/' . $fileName;
                            if (!move_uploaded_file($tmp, $targetPath)) {
                                $flashError = 'Uložení obrázku se nezdařilo.';
                            } else {
                                $newImagePath = 'Images/sections/' . $fileName;
                            }
                        }
                    }
                }
            }
        }

        if ($flashError === null) {
            try {
                $prev = get_pair_by_sort($pdo, $sort);
                if (!$prev) {
                    $flashError = 'Sekce neexistuje.';
                } else {
                    $_SESSION['undo'] = ['type' => 'edit', 'payload' => $prev, 'ts' => time()];

                    update_pair(
                        $pdo,
                        $sort,
                        [
                            'anchor' => ($anchor !== '' ? $anchor : null),
                            'image_alt' => $imageAlt,
                            'image_path' => $newImagePath,
                        ],
                        ['eyebrow' => $csEyebrow, 'title' => $csTitle, 'body1' => $csBody1, 'body2' => $csBody2],
                        ['eyebrow' => $enEyebrow, 'title' => $enTitle, 'body1' => $enBody1, 'body2' => $enBody2]
                    );

                    header('Location: index.php?t=ok&m=' . urlencode('Sekce byla uložena.') . '&u=1');
                    exit;
                }
            } catch (Throwable $e) {
                $flashError = 'Uložení se nezdařilo.';
            }
        }
    }
}

// Handle add-section form
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add_section') {
    csrf_verify($_POST['csrf_token'] ?? null);

    // Basic sanitization
    $anchor = trim((string)($_POST['anchor'] ?? ''));
    if ($anchor !== '' && !preg_match('~^[a-z0-9\-]{1,64}$~', $anchor)) {
        $flashError = 'Anchor musí obsahovat jen a-z, 0-9 a pomlčku.';
    }

    $imageAlt = trim((string)($_POST['image_alt'] ?? ''));
    $imagePath = '';

    $csEyebrow = trim((string)($_POST['cs_eyebrow'] ?? ''));
    $csTitle = trim((string)($_POST['cs_title'] ?? ''));
    $csBody1 = trim((string)($_POST['cs_body1'] ?? ''));
    $csBody2 = trim((string)($_POST['cs_body2'] ?? ''));

    $enEyebrow = trim((string)($_POST['en_eyebrow'] ?? ''));
    $enTitle = trim((string)($_POST['en_title'] ?? ''));
    $enBody1 = trim((string)($_POST['en_body1'] ?? ''));
    $enBody2 = trim((string)($_POST['en_body2'] ?? ''));

    // Validate required CS+EN
    if ($flashError === null) {
        if ($imageAlt === '' || $csTitle === '' || $csBody1 === '' || $enTitle === '' || $enBody1 === '') {
            $flashError = 'Vyplňte povinná pole (alt obrázku, title+text pro CS i EN).';
        }
    }

    // Upload image (required)
    if ($flashError === null) {
        if (empty($_FILES['image']) || !is_array($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            $flashError = 'Nahrajte obrázek.';
        } elseif (($_FILES['image']['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            $flashError = 'Chyba při nahrávání obrázku.';
        } else {
            $tmp = (string)$_FILES['image']['tmp_name'];
            $size = (int)$_FILES['image']['size'];
            if ($size > 5 * 1024 * 1024) {
                $flashError = 'Obrázek je moc velký (max 5 MB).';
            } else {
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mime = $finfo->file($tmp) ?: '';
                $ext = match ($mime) {
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    default => '',
                };

                if ($ext === '') {
                    $flashError = 'Nepodporovaný typ obrázku (povoleno JPG/PNG/WebP).';
                } else {
                    // Save into public Images/sections so the website can serve it
                    $targetDir = __DIR__ . '/../Images/sections';
                    if (!is_dir($targetDir)) {
                        @mkdir($targetDir, 0755, true);
                    }

                    if (!is_dir($targetDir) || !is_writable($targetDir)) {
                        $flashError = 'Nelze zapisovat do Images/sections.';
                    } else {
                        $fileName = bin2hex(random_bytes(16)) . '.' . $ext;
                        $targetPath = $targetDir . '/' . $fileName;

                        if (!move_uploaded_file($tmp, $targetPath)) {
                            $flashError = 'Uložení obrázku se nezdařilo.';
                        } else {
                            // Store relative path from web root
                            $imagePath = 'Images/sections/' . $fileName;
                        }
                    }
                }
            }
        }
    }

    if ($flashError === null) {
        try {
            // Ensure tables exist
            ensure_page_sections_table($pdo, 'page_sections_cs');
            ensure_page_sections_table($pdo, 'page_sections_en');

            // Determine next sort order from CS table
            $stmt = $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort FROM page_sections_cs');
            $nextSort = (int)($stmt->fetch()['next_sort'] ?? 1);

            $pdo->beginTransaction();

            $insertSql = 'INSERT INTO %s (sort_order, anchor, image_path, image_alt, eyebrow, title, body1, body2)
                          VALUES (:sort_order, :anchor, :image_path, :image_alt, :eyebrow, :title, :body1, :body2)';

            $stmtCs = $pdo->prepare(sprintf($insertSql, 'page_sections_cs'));
            $stmtEn = $pdo->prepare(sprintf($insertSql, 'page_sections_en'));

            $common = [
                ':sort_order' => $nextSort,
                ':anchor' => $anchor !== '' ? $anchor : null,
                ':image_path' => $imagePath,
                ':image_alt' => $imageAlt,
            ];

            $stmtCs->execute($common + [
                ':eyebrow' => $csEyebrow,
                ':title' => $csTitle,
                ':body1' => $csBody1,
                ':body2' => ($csBody2 !== '' ? $csBody2 : null),
            ]);

            $stmtEn->execute($common + [
                ':eyebrow' => $enEyebrow,
                ':title' => $enTitle,
                ':body1' => $enBody1,
                ':body2' => ($enBody2 !== '' ? $enBody2 : null),
            ]);

            $pdo->commit();

            // undo for add = delete this new sort order
            $_SESSION['undo'] = ['type' => 'add', 'payload' => ['sort_order' => $nextSort], 'ts' => time()];
            header('Location: index.php?t=ok&m=' . urlencode('Sekce byla přidána.') . '&u=1');
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $flashError = 'Uložení do databáze se nezdařilo.';
        }
    }
}

// ------------------------------
// UNDO (last action)
// ------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'undo') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $undo = $_SESSION['undo'] ?? null;
    if (!is_array($undo) || empty($undo['type'])) {
        $flashError = 'Není co vracet.';
    } else {
        try {
            if ($undo['type'] === 'delete') {
                restore_pair($pdo, (array)$undo['payload']);
            } elseif ($undo['type'] === 'edit') {
                $sort = (int)($undo['payload']['sort_order'] ?? 0);
                if ($sort > 0) {
                    delete_pair_by_sort($pdo, $sort);
                }
                restore_pair($pdo, (array)$undo['payload']);
            } elseif ($undo['type'] === 'add') {
                $sort = (int)($undo['payload']['sort_order'] ?? 0);
                if ($sort > 0) {
                    delete_pair_by_sort($pdo, $sort);
                }
            }

            unset($_SESSION['undo']);
            header('Location: index.php?t=ok&m=' . urlencode('Akce byla vrácena zpět.'));
            exit;
        } catch (Throwable $e) {
            $flashError = 'Vrácení zpět se nezdařilo.';
        }
    }
}

// ------------------------------
// REORDER (drag&drop)
// ------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'reorder_sections') {
    csrf_verify($_POST['csrf_token'] ?? null);

    $order = $_POST['order'] ?? [];
    if (!is_array($order)) {
        $flashError = 'Neplatná data pro řazení.';
    } else {
        try {
            reorder_sections($pdo, $order);
            header('Location: index.php?t=ok&m=' . urlencode('Pořadí bylo uloženo.'));
            exit;
        } catch (Throwable $e) {
            $flashError = 'Uložení pořadí se nezdařilo.';
        }
    }
}

$lang = get_lang();
$uiCs = load_ui_texts($pdo, 'cs');
$uiEn = load_ui_texts($pdo, 'en');
$adminUiClient = ['cs' => ui_texts_to_hero_client_data($uiCs), 'en' => ui_texts_to_hero_client_data($uiEn)];

$sectionPairs = load_section_pairs($pdo);
$clientSections = section_pairs_to_client_data($sectionPairs);
$csrf = csrf_get_token()['token'];

// toast query params
$toastType = isset($_GET['t']) ? (string)$_GET['t'] : '';
$toastMsg = isset($_GET['m']) ? (string)$_GET['m'] : '';
$toastUndo = isset($_GET['u']) && (string)$_GET['u'] === '1';
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($lang, ENT_QUOTES, 'UTF-8'); ?>">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ALABARTE</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="admin.css">
    <script src="../index.js" defer></script>

    <!-- admin styles moved to admin/admin.css -->
</head>
<body>

<div class="admin-panel">
    Přihlášen jako <strong><?php echo htmlspecialchars((string)$username, ENT_QUOTES, 'UTF-8'); ?></strong>
    | <a href="logout.php">Odhlásit</a>

    <?php if ($flashError): ?>
        <div class="toast toast--error is-show" id="toastError"><?php echo htmlspecialchars($flashError, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php endif; ?>

    <?php if ($toastMsg !== '' && $toastType === 'ok'): ?>
        <div class="toast is-show" id="toastOk">
            <?php echo htmlspecialchars($toastMsg, ENT_QUOTES, 'UTF-8'); ?>
            <?php if ($toastUndo): ?>
                <form method="post" action="" style="display:inline; margin-left:10px;">
                    <input type="hidden" name="action" value="undo">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">
                    <button type="submit" style="all:unset;cursor:pointer;text-decoration:underline;">Vrátit zpět</button>
                </form>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<form id="reorderForm" method="post" action="" style="display:none;">
    <input type="hidden" name="action" value="reorder_sections">
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">
    <div id="reorderInputs"></div>
</form>

<div class="reorder-bar" id="reorderBar" aria-live="polite" style="display:none;">
    <div class="reorder-bar__inner">
        <span class="reorder-bar__text">Změny v pořadí nejsou uloženy.</span>
        <div class="reorder-bar__actions">
            <button type="button" class="reorder-btn" id="btnSaveOrder">Uložit změny</button>
            <button type="button" class="reorder-btn reorder-btn--ghost" id="btnCancelOrder">Zrušit</button>
        </div>
    </div>
</div>

<section class="hero">
    <div class="hero-bg">
        <div class="hero-overlay">

            <div class="hero-top">
                <div class="lang-switcher">
                    <button type="button" class="lang-btn" data-lang="cs">CS</button>
                    <button type="button" class="lang-btn" data-lang="en">EN</button>
                </div>

                <nav class="hero-nav" id="heroNav">
                    <a href="#kontakt" data-ui-field="nav_kontakt">Kontakt</a>
                    <a href="../vina.php" data-ui-field="nav_vina">Vína</a>
                    <a href="../aktuality.php" data-ui-field="nav_galerie">Galerie</a>
                    <a href="https://www.alabarte.cz/vino/" data-ui-field="nav_eshop">E-shop</a>
                </nav>
            </div>

            <header class="hero-header">
                <div class="hero-logo">
                    <a href="../index.php">
                        <img src="../Images/Alabarte-logo.webp" alt="Alabarte">
                    </a>
                </div>
            </header>

            <p class="hero-tagline" data-ui-field="hero_tagline">
                Pečlivě vybraná vína z Toskánska, dovážená přímo do České republiky.
            </p>

            <div class="hero-content">
                <div class="hero-slides">
                    <a href="https://www.alabarte.cz/vino/" class="slideshow image-stage hero-wine-link" aria-label="Zobrazit vína">
                        <div class="image-slide active"><img src="../Images/Vína/víno1.png" alt=""></div>
                        <div class="image-slide next"><img src="../Images/Vína/Víno2.png" alt=""></div>
                        <div class="image-slide prev"><img src="../Images/Vína/Víno%203.png" alt=""></div>
                    </a>

                    <div class="slideshow text-stage">
                        <div class="text-frame">
                            <div class="text-content">
                                <div class="text-slide active">
                                    <div class="text-bg">
                                        <h2 data-ui-field="slide1_h2">Vernaccia di San Gimignano</h2>
                                        <p data-ui-field="slide1_p">Svěží bílé víno s minerálním charakterem, jemnými citrusovými tóny a typickou elegancí toskánské krajiny.</p>
                                    </div>
                                </div>
                                <div class="text-slide"><div class="text-bg"><h2 data-ui-field="slide2_h2">Rosso Toscana</h2><p data-ui-field="slide2_p">Vyvážené červené víno s tóny zralého ovoce a jemného koření, které spojuje tradici Toskánska s moderním projevem.</p></div></div>
                                <div class="text-slide"><div class="text-bg"><h2 data-ui-field="slide3_h2">Sangiovese z Toskánska</h2><p data-ui-field="slide3_p">Charakteristické červené víno s jemnými tříslovinami, ovocným profilem a dlouhým, harmonickým závěrem.</p></div></div>
                            </div>

                            <div class="text-cta">
                                <a href="../vina.php" class="cta-btn cta-btn--primary" data-ui-field="cta_wines">Naše vína</a>
                                <a href="https://www.alabarte.cz/vino/" class="cta-btn cta-btn--ghost" data-ui-field="cta_shop">E-shop</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hero-divider"></div>
            <div class="scroll-hint" aria-hidden="true">
                <span class="scroll-hint__text" data-ui-field="scroll_hint">Více o Alabarte</span>
                <span class="scroll-hint__arrow">↓</span>
            </div>
        </div>
    </div>
</section>

<!-- ✅ jeden velký box pro všechny sekce -->
<div class="page-content">
    <div class="info-wrapper" id="sectionsContainer">

        <?php foreach ($sectionPairs as $i => $pair): ?>
            <?php
                $s = $pair['cs']; // render CS in admin preview
                $enRow = $pair['en'];

                $sectionClass = section_style_class((int)$i);
                $innerClass = section_inner_class((int)$i);
                $cardClass = section_card_class((int)$i);
                $eyebrowClass = section_eyebrow_class((int)$i);
                $titleClass = section_title_class((int)$i);
                $pClass = section_p_class((int)$i);

                $sortOrder = (int)$pair['sort_order'];
                $anchor = isset($pair['anchor']) && is_string($pair['anchor']) && $pair['anchor'] !== '' ? $pair['anchor'] : null;

                $img = (string)($pair['image_path'] ?? '');
                $alt = (string)($pair['image_alt'] ?? '');
                $eyebrow = (string)($s['eyebrow'] ?? '');
                $title = (string)($s['title'] ?? '');
                $body1 = (string)($s['body1'] ?? '');
                $body2 = (string)($s['body2'] ?? '');

                $imgAdmin = $img !== '' ? '../' . ltrim($img, '/') : '';
            ?>

            <div class="section-dnd" draggable="true" data-sort-order="<?php echo (int)$sortOrder; ?>">
                <div class="dnd-head">
                    <span class="dnd-handle" title="Přetáhnout / klik pro přesun na pozici">↕ Přetáhnout</span>
                    <span class="dnd-note">Pořadí: <?php echo (int)$sortOrder; ?></span>
                    <span class="dnd-move">
                        <label style="font-size:12px;opacity:.9">Přesunout na:</label>
                        <select class="dnd-pos" aria-label="Přesunout na pozici"></select>
                    </span>
                </div>

                <!-- ADMIN: section actions: edit_section, delete_section -->
                <div class="section-admin-tools">
                    <button type="button" class="btnEdit"
                            data-sort="<?php echo (int)$sortOrder; ?>"
                            data-anchor="<?php echo htmlspecialchars((string)($pair['anchor'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-image-alt="<?php echo htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'); ?>"
                            data-cs-eyebrow="<?php echo htmlspecialchars((string)($s['eyebrow'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-cs-title="<?php echo htmlspecialchars((string)($s['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-cs-body1="<?php echo htmlspecialchars((string)($s['body1'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-cs-body2="<?php echo htmlspecialchars((string)($s['body2'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-en-eyebrow="<?php echo htmlspecialchars((string)($enRow['eyebrow'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-en-title="<?php echo htmlspecialchars((string)($enRow['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-en-body1="<?php echo htmlspecialchars((string)($enRow['body1'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                            data-en-body2="<?php echo htmlspecialchars((string)($enRow['body2'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        Upravit
                    </button>

                    <form method="post" action="" onsubmit="return confirm('Opravdu smazat sekci?');">
                        <input type="hidden" name="action" value="delete_section">
                        <input type="hidden" name="sort_order" value="<?php echo (int)$sortOrder; ?>">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">
                        <button type="submit" class="danger">Smazat</button>
                    </form>
                </div>

                <section class="<?php echo htmlspecialchars($sectionClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-sort="<?php echo (int)$sortOrder; ?>"<?php echo $anchor ? ' id="' . htmlspecialchars($anchor, ENT_QUOTES, 'UTF-8') . '"' : ''; ?>>
                    <div class="<?php echo htmlspecialchars($innerClass, ENT_QUOTES, 'UTF-8'); ?>">

                        <?php if ($sectionClass === 'info-section'): ?>
                            <div class="info-media">
                                <img src="<?php echo htmlspecialchars($imgAdmin, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="image">
                            </div>
                            <div class="info-text">
                                <div class="<?php echo htmlspecialchars($cardClass, ENT_QUOTES, 'UTF-8'); ?>">
                                    <span class="<?php echo htmlspecialchars($eyebrowClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="eyebrow"><?php echo htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8'); ?></span>
                                    <h2 class="<?php echo htmlspecialchars($titleClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="title"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h2>
                                    <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body1"><?php echo nl2br(htmlspecialchars($body1, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php if ($body2 !== ''): ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body2"><?php echo nl2br(htmlspecialchars($body2, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php else: ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body2" style="display:none"></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="winery-text">
                                <div class="<?php echo htmlspecialchars($cardClass, ENT_QUOTES, 'UTF-8'); ?>">
                                    <span class="<?php echo htmlspecialchars($eyebrowClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="eyebrow"><?php echo htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8'); ?></span>
                                    <h2 class="<?php echo htmlspecialchars($titleClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="title"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h2>
                                    <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body1"><?php echo nl2br(htmlspecialchars($body1, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php if ($body2 !== ''): ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body2"><?php echo nl2br(htmlspecialchars($body2, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php else: ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="body2" style="display:none"></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="winery-media">
                                <img src="<?php echo htmlspecialchars($imgAdmin, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'); ?>" data-section-field="image">
                            </div>
                        <?php endif; ?>

                    </div>
                </section>
            </div>

        <?php endforeach; ?>

        <div style="margin: 26px 0 40px; text-align:center;">
            <button type="button" class="cta-btn cta-btn--primary" id="btnOpenAdd">Přidat sekci</button>
        </div>

    </div>
</div>

<!-- Modal form -->
<div class="modal-backdrop" id="addModal" aria-hidden="true">
    <div class="modal admin-add" role="dialog" aria-modal="true" aria-labelledby="addModalTitle">
        <div class="modal-header">
            <h2 id="addModalTitle">Přidat sekci</h2>
            <button type="button" class="modal-close" id="btnCloseAdd">Zavřít</button>
        </div>
        <div class="modal-body">
            <form method="post" action="" enctype="multipart/form-data" id="addSectionForm">
                <input type="hidden" name="action" value="add_section">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">

                <div class="row">
                    <label>
                        Anchor (volitelné, např. o-nas)
                        <input type="text" name="anchor" maxlength="64" placeholder="o-nas">
                    </label>
                    <label>
                        Alt text obrázku (povinné)
                        <input type="text" name="image_alt" maxlength="255" required>
                    </label>
                </div>

                <label>
                    Obrázek (JPG/PNG/WebP, max 5 MB)
                    <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required>
                </label>

                <div class="admin-grid">
                    <div>
                        <h3 style="margin:10px 0 6px;">Čeština</h3>
                        <label>Eyebrow <input type="text" name="cs_eyebrow" maxlength="120"></label>
                        <label>Title (povinné) <input type="text" name="cs_title" maxlength="255" required></label>
                        <label>Text 1 (povinné) <textarea name="cs_body1" required></textarea></label>
                        <label>Text 2 (volitelné) <textarea name="cs_body2"></textarea></label>
                    </div>
                    <div>
                        <h3 style="margin:10px 0 6px;">Angličtina</h3>
                        <label>Eyebrow <input type="text" name="en_eyebrow" maxlength="120"></label>
                        <label>Title (povinné) <input type="text" name="en_title" maxlength="255" required></label>
                        <label>Text 1 (povinné) <textarea name="en_body1" required></textarea></label>
                        <label>Text 2 (volitelné) <textarea name="en_body2"></textarea></label>
                    </div>
                </div>

                <div class="actions">
                    <button type="submit">Uložit sekci</button>
                    <button type="button" class="modal-close" id="btnCancelAdd">Zrušit</button>
                </div>
            </form>

            <p style="margin:10px 0 0;color:rgba(255,255,255,.85);font-size:12px;">
                Sekce se uloží do <code>page_sections_cs</code> + <code>page_sections_en</code> se stejným <code>sort_order</code>.
                Obrázek se uloží do <code>Images/sections/</code>.
            </p>
        </div>
    </div>
</div>

<!-- Edit modal -->
<div class="modal-backdrop" id="editModal" aria-hidden="true">
    <div class="modal admin-add" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
        <div class="modal-header">
            <h2 id="editModalTitle">Upravit sekci</h2>
            <button type="button" class="modal-close" id="btnCloseEdit">Zavřít</button>
        </div>
        <div class="modal-body">
            <form method="post" action="" enctype="multipart/form-data" id="editSectionForm">
                <input type="hidden" name="action" value="edit_section">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="sort_order" id="edit_sort_order" value="">

                <div class="row">
                    <label>Anchor <input type="text" name="anchor" id="edit_anchor" maxlength="64"></label>
                    <label>Alt text obrázku <input type="text" name="image_alt" id="edit_image_alt" maxlength="255" required></label>
                </div>

                <label>
                    Nový obrázek (volitelné)
                    <input type="file" name="image" accept="image/jpeg,image/png,image/webp">
                </label>

                <div class="admin-grid">
                    <div>
                        <h3 style="margin:10px 0 6px;">Čeština</h3>
                        <label>Eyebrow <input type="text" name="cs_eyebrow" id="edit_cs_eyebrow" maxlength="120"></label>
                        <label>Title <input type="text" name="cs_title" id="edit_cs_title" maxlength="255" required></label>
                        <label>Text 1 <textarea name="cs_body1" id="edit_cs_body1" required></textarea></label>
                        <label>Text 2 <textarea name="cs_body2" id="edit_cs_body2"></textarea></label>
                    </div>
                    <div>
                        <h3 style="margin:10px 0 6px;">Angličtina</h3>
                        <label>Eyebrow <input type="text" name="en_eyebrow" id="edit_en_eyebrow" maxlength="120"></label>
                        <label>Title <input type="text" name="en_title" id="edit_en_title" maxlength="255" required></label>
                        <label>Text 1 <textarea name="en_body1" id="edit_en_body1" required></textarea></label>
                        <label>Text 2 <textarea name="en_body2" id="edit_en_body2"></textarea></label>
                    </div>
                </div>

                <div class="actions">
                    <button type="submit">Uložit změny</button>
                    <button type="button" class="modal-close" id="btnCancelEdit">Zrušit</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
(function(){
    const modal = document.getElementById('addModal');
    const openBtn = document.getElementById('btnOpenAdd');
    const closeBtn = document.getElementById('btnCloseAdd');
    const cancelBtn = document.getElementById('btnCancelAdd');

    function openModal(){
        if(!modal) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden','false');
        // focus first input
        const first = modal.querySelector('input,textarea,button');
        if(first) first.focus();
    }
    function closeModal(){
        if(!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden','true');
    }

    if(openBtn) openBtn.addEventListener('click', openModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // click on backdrop closes
    if(modal) modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });

    // ESC closes
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') closeModal();
    });

    // Auto-hide toasts
    const ok = document.getElementById('toastOk');
    if(ok && ok.classList.contains('is-show')){
        setTimeout(()=>{ ok.classList.remove('is-show'); }, 3500);
    }
    const err = document.getElementById('toastError');
    if(err && err.classList.contains('is-show')){
        setTimeout(()=>{ err.classList.remove('is-show'); }, 6000);
    }

    // edit modal
    const editModal = document.getElementById('editModal');
    const btnCloseEdit = document.getElementById('btnCloseEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    function openEdit(){
        if(!editModal) return;
        editModal.classList.add('is-open');
        editModal.setAttribute('aria-hidden','false');
        const first = editModal.querySelector('input,textarea,button');
        if(first) first.focus();
    }
    function closeEdit(){
        if(!editModal) return;
        editModal.classList.remove('is-open');
        editModal.setAttribute('aria-hidden','true');
    }

    document.querySelectorAll('.btnEdit').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('edit_sort_order').value = btn.dataset.sort || '';
            document.getElementById('edit_anchor').value = btn.dataset.anchor || '';
            document.getElementById('edit_image_alt').value = btn.dataset.imageAlt || '';
            document.getElementById('edit_cs_eyebrow').value = btn.dataset.csEyebrow || '';
            document.getElementById('edit_cs_title').value = btn.dataset.csTitle || '';
            document.getElementById('edit_cs_body1').value = btn.dataset.csBody1 || '';
            document.getElementById('edit_cs_body2').value = btn.dataset.csBody2 || '';

            // EN values are not present in current render, load them via hidden dataset stored in DOM?
            // Minimal approach: keep EN in same table by current language; so we only prefill current language.
            // But requirement needs both CS+EN. We'll fetch from server by embedding EN into data attributes below.
            document.getElementById('edit_en_eyebrow').value = btn.dataset.enEyebrow || '';
            document.getElementById('edit_en_title').value = btn.dataset.enTitle || '';
            document.getElementById('edit_en_body1').value = btn.dataset.enBody1 || '';
            document.getElementById('edit_en_body2').value = btn.dataset.enBody2 || '';

            openEdit();
        });
    });

    if(btnCloseEdit) btnCloseEdit.addEventListener('click', closeEdit);
    if(btnCancelEdit) btnCancelEdit.addEventListener('click', closeEdit);
    if(editModal) editModal.addEventListener('click', (e) => { if(e.target === editModal) closeEdit(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeEdit(); });
})();
</script>

<script>
    window.ADMIN_SECTIONS = <?php echo json_encode($clientSections, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
    window.ADMIN_UI = <?php echo json_encode($adminUiClient, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
</script>

<script>
(function(){
    function applyUiLang(lang){
        const data = window.ADMIN_UI || {};
        const ui = data[lang] || data.cs;
        if(!ui) return;

        document.querySelectorAll('[data-ui-field]').forEach(el => {
            const key = el.getAttribute('data-ui-field');
            if(!key || !(key in ui)) return;
            const value = String(ui[key] ?? '');
            // Keep <br> for multiline texts
            el.innerHTML = value.replace(/\n/g, '<br>');
        });
    }

    const init = localStorage.getItem('lang') || document.documentElement.lang || 'cs';
    applyUiLang(init);

    document.addEventListener('langchange', (e) => {
        const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('lang') || 'cs');
        applyUiLang(l);
    });
})();
</script>

<script>
(function(){
    function applySectionsLang(lang){
        const data = window.ADMIN_SECTIONS || {};
        document.querySelectorAll('[data-section-sort]').forEach(sec => {
            const sort = sec.getAttribute('data-section-sort');
            const rec = data[sort];
            if(!rec) return;
            const tr = rec[lang] || rec.cs;
            sec.querySelectorAll('[data-section-field]').forEach(el => {
                const field = el.getAttribute('data-section-field');
                if(field === 'image'){
                    const img = el;
                    const src = rec.image_path ? ('../' + rec.image_path.replace(/^\/+/, '')) : '';
                    img.setAttribute('src', src);
                    img.setAttribute('alt', rec.image_alt || '');
                    return;
                }
                if(field === 'eyebrow') el.textContent = tr.eyebrow || '';
                if(field === 'title') el.textContent = tr.title || '';
                if(field === 'body1') el.innerHTML = (tr.body1 || '').replace(/\n/g,'<br>');
                if(field === 'body2'){
                    const v = tr.body2 || '';
                    if(v === ''){ el.style.display = 'none'; el.innerHTML = ''; }
                    else { el.style.display = ''; el.innerHTML = v.replace(/\n/g,'<br>'); }
                }
            });
        });
    }

    // initial
    const lang = localStorage.getItem('lang') || 'cs';
    applySectionsLang(lang);

    document.addEventListener('langchange', (e) => {
        const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('lang') || 'cs');
        applySectionsLang(l);
    });
})();
</script>

<script>
(function(){
    const container = document.getElementById('sectionsContainer');
    if(!container) return;

    const bar = document.getElementById('reorderBar');
    const btnSave = document.getElementById('btnSaveOrder');
    const btnCancel = document.getElementById('btnCancelOrder');

    let dragging = null;
    let dirty = false;
    const originalOrder = [...container.querySelectorAll('.section-dnd')].map(el => el.getAttribute('data-sort-order'));

    const placeholder = document.createElement('div');
    placeholder.className = 'section-placeholder';
    placeholder.setAttribute('aria-hidden','true');

    function setDirty(v){
        dirty = v;
        if(bar) bar.style.display = dirty ? 'block' : 'none';
        // update pickers
        if(window.__refreshPositionSelects) window.__refreshPositionSelects();
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.section-dnd:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    function ensurePlaceholder(){
        if(!placeholder.parentNode && dragging){
            container.insertBefore(placeholder, dragging.nextSibling);
        }
    }

    function removePlaceholder(){
        if(placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    }

    function buildOrderInputs(){
        const items = [...container.querySelectorAll('.section-dnd')];
        const inputsWrap = document.getElementById('reorderInputs');
        if(!inputsWrap) return;
        inputsWrap.innerHTML = '';
        items.forEach(el => {
            const sort = el.getAttribute('data-sort-order');
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'order[]';
            input.value = sort;
            inputsWrap.appendChild(input);
        });
    }

    function currentOrder(){
        return [...container.querySelectorAll('.section-dnd')].map(el => el.getAttribute('data-sort-order'));
    }

    function restoreOriginal(){
        const map = new Map();
        container.querySelectorAll('.section-dnd').forEach(el => map.set(el.getAttribute('data-sort-order'), el));
        originalOrder.forEach(k => {
            const el = map.get(k);
            if(el) container.appendChild(el);
        });
        setDirty(false);
    }

    // drag interactions (more Google-Forms-ish)
    container.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.section-dnd');
        if(!item) return;
        dragging = item;
        item.classList.add('dragging');
        ensurePlaceholder();
        // Make the dragged card slightly detached
        try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.getAttribute('data-sort-order') || '');
        } catch(err) {}
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        if(!dragging) return;
        const afterEl = getDragAfterElement(container, e.clientY);
        if (afterEl == null) {
            container.appendChild(placeholder);
        } else {
            container.insertBefore(placeholder, afterEl);
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        if(!dragging) return;
        container.insertBefore(dragging, placeholder);
        setDirty(true);
    });

    container.addEventListener('dragend', (e) => {
        const item = e.target.closest('.section-dnd');
        if(item) item.classList.remove('dragging');
        dragging = null;
        removePlaceholder();
        if(window.__refreshPositionSelects) window.__refreshPositionSelects();
    });

    // Save/cancel
    if(btnSave) btnSave.addEventListener('click', () => {
        buildOrderInputs();
        document.getElementById('reorderForm').submit();
    });

    if(btnCancel) btnCancel.addEventListener('click', () => {
        restoreOriginal();
    });

    // when click-to-move changes order, mark dirty but do not submit
    window.__markOrderDirty = () => setDirty(true);

    // initial
    setDirty(false);
})();
</script>

<script>
(function(){
    const container = document.getElementById('sectionsContainer');
    if(!container) return;

    // helper from existing code
    function refreshPositionSelects(){
        const items = [...container.querySelectorAll('.section-dnd')];
        items.forEach((el, idx) => {
            const sel = el.querySelector('select.dnd-pos');
            if(!sel) return;
            sel.innerHTML = '';
            for(let i=1;i<=items.length;i++){
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = String(i);
                if(i === idx+1) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    }

    refreshPositionSelects();

    // click-to-move
    container.querySelectorAll('.section-dnd .dnd-handle').forEach(handle => {
        handle.addEventListener('click', (e) => {
            const card = handle.closest('.section-dnd');
            if(!card) return;
            // toggle picker
            const isOpen = card.classList.contains('is-picking');
            container.querySelectorAll('.section-dnd.is-picking').forEach(x => x.classList.remove('is-picking'));
            if(!isOpen){
                card.classList.add('is-picking');
                refreshPositionSelects();
                const sel = card.querySelector('select.dnd-pos');
                if(sel) sel.focus();
            }
        });
    });

    container.querySelectorAll('.section-dnd select.dnd-pos').forEach(sel => {
        sel.addEventListener('change', () => {
            const card = sel.closest('.section-dnd');
            if(!card) return;
            const items = [...container.querySelectorAll('.section-dnd')];
            const targetPos = Math.max(1, Math.min(items.length, parseInt(sel.value,10) || 1));
            const currentIndex = items.indexOf(card);
            const targetIndex = targetPos - 1;

            if(currentIndex === -1 || targetIndex === currentIndex) {
                card.classList.remove('is-picking');
                return;
            }

            // Move in DOM
            const ref = items[targetIndex];
            if(targetIndex > currentIndex) {
                // insert after ref
                container.insertBefore(card, ref.nextSibling);
            } else {
                container.insertBefore(card, ref);
            }

            card.classList.remove('is-picking');
            refreshPositionSelects();
            if(window.__markOrderDirty) window.__markOrderDirty();
        });
    });

    // close picker when clicking outside
    document.addEventListener('click', (e) => {
        const inside = e.target.closest && e.target.closest('.section-dnd');
        if(!inside){
            container.querySelectorAll('.section-dnd.is-picking').forEach(x => x.classList.remove('is-picking'));
        }
    });

    // expose for drag script update if needed
    window.__refreshPositionSelects = refreshPositionSelects;
    // window.__submitSectionOrder removed (save happens via button)
})();
</script>