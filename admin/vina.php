<?php
// admin/vina.php — Wine catalog administration

declare(strict_types=1);

require_once __DIR__ . '/auth/bootstrap.php';
require_login();

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/content/wines.php';

/** @var PDO $pdo */

// Ensure table + seed exist
ensure_wines_table($pdo);

$username = current_admin_username();

// Cache-bust helper
function asset_ver_vina(string $filePath): string {
    $t = @filemtime($filePath);
    if ($t && is_int($t)) return (string)$t;
    return (string)time();
}

$ver_vina_css       = asset_ver_vina(__DIR__ . '/../vina.css');
$ver_typography_css = asset_ver_vina(__DIR__ . '/../typography.css');
$ver_admin_css      = asset_ver_vina(__DIR__ . '/admin.css');
$ver_vina_admin_css = asset_ver_vina(__DIR__ . '/vina_admin.css');
$ver_index_js       = asset_ver_vina(__DIR__ . '/../index.js');
$ver_vina_js        = asset_ver_vina(__DIR__ . '/../vina.js');
$ver_vina_admin_js  = asset_ver_vina(__DIR__ . '/vina_admin.js');
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALABARTE – Vína (Admin)</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../typography.css?v=<?php echo urlencode($ver_typography_css); ?>">
    <link rel="stylesheet" href="../vina.css?v=<?php echo urlencode($ver_vina_css); ?>">
    <link rel="stylesheet" href="admin.css?v=<?php echo urlencode($ver_admin_css); ?>">
    <link rel="stylesheet" href="vina_admin.css?v=<?php echo urlencode($ver_vina_admin_css); ?>">

    <script src="../index.js?v=<?php echo urlencode($ver_index_js); ?>" defer></script>
    <!-- We do NOT load vina.js here — admin JS handles everything -->
    <script src="vina_admin.js?v=<?php echo urlencode($ver_vina_admin_js); ?>" defer></script>

    <!-- Fix relative image paths (vina.css uses Images/... relative to root) -->
    <style>
        .vina-top-bg {
            background-image: url("../Images/backgrounds/bg-vina1.jpg");
        }
    </style>
</head>
<body>

<!-- ===== ADMIN PANEL ===== -->
<div class="admin-panel">
    Přihlášen jako <strong><?php echo htmlspecialchars((string)$username, ENT_QUOTES, 'UTF-8'); ?></strong>
    | <a href="index.php">Administrace</a>
    | <a href="logout.php">Odhlásit</a>
    <div class="toast" id="toastOk" style="display:none;"></div>
</div>

<section class="hero">

    <!-- ===== TOP (pozadí jen pro nav + nadpis) ===== -->
    <div class="vina-top-bg">
        <div class="hero-overlay">

            <?php
              $active = 'vina';
              require __DIR__ . '/../partials/admin_top.php';
            ?>

            <!-- TITLE + LOGA -->
            <header class="vina-header" aria-label="Nadpis sekce Vína">
                <div class="vina-brands" aria-label="Loga značek">
                    <div class="vina-brand vina-brand--left">
                        <img src="../Images/alabarte-red.png" alt="Alabarte logo">
                    </div>
                    <div class="vina-brand vina-brand--right">
                        <img src="../Images/fattoria.png" alt="Fattoria La Torre logo">
                    </div>
                </div>

                <h1 class="vina-title typo-h1" data-key="vina_title">
                    <span class="vina-title__small">Naše</span>
                    <span class="vina-title__big">vína</span>
                </h1>
            </header>

        </div>
    </div>

    <!-- ===== BÍLÁ ČÁST: slideshow + search ===== -->
    <div class="vina-white-area">

        <!-- SLIDESHOW -->
        <div class="presentation-shell" aria-label="Prezentace vín">
            <button class="presentation-arrow presentation-arrow--prev" type="button" aria-label="Předchozí obrázek">‹</button>

            <section class="wine-presentation-slider" data-slider="presentation" aria-label="Prezentace vín">
                <div class="presentation-slide is-active">
                    <img src="../Images/prezentace/acquaiole-pret.png" alt="">
                </div>
                <div class="presentation-slide">
                    <img src="../Images/prezentace/Caroobacoo-pret.png" alt="">
                </div>
                <div class="presentation-slide">
                    <img src="../Images/prezentace/sciallebianco-pret.png" alt="">
                </div>
                <div class="presentation-slide">
                    <img src="../Images/prezentace/chiacchere-pret.png" alt="">
                </div>
                <div class="presentation-slide">
                    <img src="../Images/prezentace/guinzano-pret.png" alt="">
                </div>
                <div class="presentation-slide">
                    <img src="../Images/prezentace/stradina-pret.png" alt="">
                </div>
            </section>

            <button class="presentation-arrow presentation-arrow--next" type="button" aria-label="Další obrázek">›</button>
        </div>

        <!-- VYHLEDÁVÁNÍ + FILTRY -->
        <div class="wine-search-wrap" id="wineSearchWrap">
            <button
                class="wine-search-toggle wine-search-toggle--icon"
                id="wineSearchToggle"
                type="button"
                aria-label="Vyhledat víno"
                aria-expanded="false"
                aria-controls="wineSearchPanel"
            >
                <svg class="wine-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <g transform="translate(0.5,0.5)">
                        <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/>
                        <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </g>
                </svg>
            </button>

            <section class="wine-search wine-search--panel" id="wineSearchPanel" hidden>
                <div class="wine-search__label typo-eyebrow">Vyhledat víno</div>
                <div class="wine-search__controls">
                    <input id="wineSearch" class="wine-search__input" type="search" placeholder="Název vína..." autocomplete="off">
                    <button id="wineSearchClear" class="wine-search__clear" type="button">Vymazat</button>
                </div>

                <div class="wine-filter-groups">
                    <div class="wine-filter-group" aria-label="Filtr certifikace">
                        <div class="wine-filters__label typo-meta">Certifikace:</div>
                        <div class="wine-checkbox-grid" id="wineCertificationFilters"></div>
                    </div>

                    <div class="wine-filter-group" aria-label="Filtr stylu">
                        <div class="wine-filters__label typo-meta">Styl:</div>
                        <div class="wine-checkbox-grid" id="wineStyleFilters"></div>
                    </div>
                </div>

                <div class="wine-price-filter" aria-label="Cenové rozmezí">
                    <div class="wine-filters__label typo-meta">Cena:</div>
                    <div class="wine-range" id="winePriceRange">
                        <div class="wine-range__track"></div>
                        <div class="wine-range__fill" id="winePriceRangeFill"></div>
                        <input id="winePriceMin" class="wine-range__input wine-range__input--min" type="range" min="0" max="0" step="1" value="0" aria-label="Minimální cena">
                        <input id="winePriceMax" class="wine-range__input wine-range__input--max" type="range" min="0" max="0" step="1" value="0" aria-label="Maximální cena">
                    </div>
                    <p id="winePriceStatus" class="wine-search__status"></p>
                </div>

                <p id="wineSearchStatus" class="wine-search__status"></p>
            </section>
        </div>

    </div>

    <div style="display:flex; justify-content:center; padding: 0 1.25rem 1.25rem;">
        <button type="button" class="wine-edit-save" id="addWineBtn">+ Přidat víno</button>
    </div>

    <!-- ===== VÍNA (katalog) — karty se renderují přes JS z API ===== -->
    <section class="wines" id="vina-katalog" aria-label="Katalog vín">
        <!-- JS fills this -->
    </section>

    <p id="wineNoResults" class="wine-no-results typo-meta" hidden>
        Žádná vína neodpovídají zadanému hledání.
    </p>

</section>

<!-- ===== EDITAČNÍ MODAL ===== -->
<div class="wine-edit-modal" id="wineEditModal">
    <div class="wine-edit-modal__backdrop"></div>

    <div class="wine-edit-modal__panel" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
        <button class="wine-edit-modal__close" type="button" aria-label="Zavřít">✕</button>

        <div class="wine-edit-modal__grid">
            <!-- LEVÁ STRANA: obrázek -->
            <div class="wine-edit-modal__media">
                <img id="editWineImage" src="" alt="">
                <div class="wine-edit-modal__img-upload">
                    <button type="button" class="wine-edit-modal__img-btn" id="editWineImageBtn">Změnit obrázek</button>
                    <input type="file" id="editWineImageInput" accept="image/jpeg,image/png,image/webp" hidden>
                </div>
            </div>

            <!-- PRAVÁ STRANA: formulář -->
            <div class="wine-edit-modal__content">
                <h2 id="editModalTitle" style="margin:0 0 0.5rem; font-family: var(--font-display, 'Domine', serif); font-size: 1.3rem;">Upravit víno</h2>

                <div class="wine-form-lang-switch" role="tablist" aria-label="Jazyk textů vína">
                    <button type="button" class="wine-form-lang-btn is-active" data-form-lang="cs">Čeština</button>
                    <button type="button" class="wine-form-lang-btn" data-form-lang="en">English</button>
                </div>

                <div class="wine-edit-field">
                    <label for="editName">Název</label>
                    <input type="text" id="editName" placeholder="Název vína">
                </div>

                <div class="wine-edit-field">
                    <label for="editText">Popis / příběh</label>
                    <textarea id="editText" placeholder="Popis vína..."></textarea>
                </div>

                <div class="wine-edit-field--inline">
                    <div class="wine-edit-subfield">
                        <label for="editCena">Cena (Kč)</label>
                        <input type="number" id="editCena" min="0" placeholder="350">
                    </div>
                    <div class="wine-edit-subfield">
                        <label for="editRocnik">Ročník</label>
                        <input type="number" id="editRocnik" min="1900" max="2099" placeholder="2023">
                    </div>
                </div>

                <h3 class="wine-edit-section-title">Specifikace</h3>

                <div class="wine-edit-field--inline">
                    <div class="wine-edit-subfield">
                        <label for="editOdruda">Odrůda</label>
                        <input type="text" id="editOdruda" placeholder="Sangiovese">
                    </div>
                    <div class="wine-edit-subfield">
                        <label for="editZeme">Země</label>
                        <input type="text" id="editZeme" placeholder="Itálie">
                    </div>
                </div>

                <div class="wine-edit-field--inline">
                    <div class="wine-edit-subfield">
                        <label for="editRegion">Region</label>
                        <input type="text" id="editRegion" placeholder="Toskánsko">
                    </div>
                    <div class="wine-edit-subfield">
                        <label for="editObjem">Objem</label>
                        <input type="text" id="editObjem" placeholder="0,75 l">
                    </div>
                </div>

                <div class="wine-edit-field--inline">
                    <div class="wine-edit-subfield">
                        <label for="editAlkohol">Alkohol</label>
                        <input type="text" id="editAlkohol" placeholder="13 %">
                    </div>
                    <div class="wine-edit-subfield">
                        <label for="editCertifikace">Certifikace</label>
                        <select id="editCertifikace">
                            <option value="none">Žádná</option>
                            <option value="DOCG">DOCG</option>
                            <option value="DOC">DOC</option>
                            <option value="IGT">IGT</option>
                        </select>
                    </div>
                </div>

                <div class="wine-edit-field--inline">
                    <div class="wine-edit-subfield">
                        <label for="editStyl">Styl</label>
                        <select id="editStyl">
                            <option value="červené">Červené</option>
                            <option value="bílé">Bílé</option>
                            <option value="růžové">Růžové</option>
                        </select>
                    </div>
                    <div class="wine-edit-subfield">
                        <label for="editOdkaz">Odkaz (e-shop URL)</label>
                        <input type="url" id="editOdkaz" placeholder="https://www.alabarte.cz/...">
                    </div>
                </div>

                <div style="margin-top: 1.2rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <button type="button" class="wine-edit-save" id="editWineSave">Uložit změny</button>
                    <span class="wine-edit-status" id="editWineStatus"></span>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>


