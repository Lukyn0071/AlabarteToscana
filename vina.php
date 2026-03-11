<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALABARTE – Vína</title>

    <!-- ✅ FONTY (bez duplicit) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- ✅ TYPO + CSS -->
    <link rel="stylesheet" href="typography.css">
    <link rel="stylesheet" href="vina.css">

    <!-- JS -->
    <script src="index.js" defer></script>
    <script src="vina.js" defer></script>
</head>
<body>

<section class="hero">

    <!-- ✅ TOP (pozadí jen pro nav + nadpis) -->
    <div class="vina-top-bg">
        <div class="hero-overlay">

            <!-- ===== TOP BAR ===== -->
            <div class="hero-top">
                <div class="lang-switcher" aria-label="Přepínač jazyka">
                    <a class="lang-btn" href="?lang=cs" data-lang="cs">CS</a>
                    <a class="lang-btn" href="?lang=en" data-lang="en">EN</a>
                </div>

                <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
                    <a href="index.php" data-key="home">Domů</a>
                    <a href="vina.php" data-key="vina" aria-current="page">Vína</a>
                    <a href="index.php#partner-section" data-key="partner">Fattoria La Torre</a>
                    <a href="aktuality.php" data-key="aktuality">Novinky</a>
                    <a href="https://www.alabarte.cz/vino/" data-key="eshop">E-Shop</a>
                </nav>
            </div>
            <!-- ===== TITLE + LOGA ===== -->
            <header class="vina-header" aria-label="Nadpis sekce Vína">
                <div class="vina-brands" aria-label="Loga značek">
                    <div class="vina-brand vina-brand--left">
                        <img src="Images/alabarte-red.png" alt="Alabarte logo">
                    </div>

                    <div class="vina-brand vina-brand--right">
                        <img src="Images/fattoria.png" alt="Fattoria La Torre logo">
                    </div>
                </div>

                <h1 class="vina-title typo-h1" data-key="vina_title">
                    <span class="vina-title__small" data-vina-title-small>Naše</span>
                    <span class="vina-title__big" data-vina-title-big>vína</span>
                </h1>
            </header>

        </div>
    </div>

    <!-- ✅ BÍLÁ ČÁST: slideshow + search -->
    <div class="vina-white-area">

        <!-- ===== SLIDESHOW ===== -->
        <div class="presentation-shell" aria-label="Prezentace vín">
            <button class="presentation-arrow presentation-arrow--prev" type="button" aria-label="Předchozí obrázek">‹</button>

            <section class="wine-presentation-slider" data-slider="presentation" aria-label="Prezentace vín">

                <div class="presentation-slide is-active">
                    <img src="Images/prezentace/acquaiole-pret.png" alt="">
                </div>

                <div class="presentation-slide">
                    <img src="Images/prezentace/Caroobacoo-pret.png" alt="">
                </div>

                <div class="presentation-slide">
                    <img src="Images/prezentace/sciallebianco-pret.png" alt="">
                </div>

                <div class="presentation-slide">
                    <img src="Images/prezentace/chiacchere-pret.png" alt="">
                </div>

                <div class="presentation-slide">
                    <img src="Images/prezentace/guinzano-pret.png" alt="">
                </div>

                <div class="presentation-slide">
                    <img src="Images/prezentace/stradina-pret.png" alt="">
                </div>

            </section>

            <button class="presentation-arrow presentation-arrow--next" type="button" aria-label="Další obrázek">›</button>
        </div>

        <!-- ===== VYHLEDÁVÁNÍ (toggle) + FILTRY (schované v panelu) ===== -->
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
                        <circle cx="11" cy="11" r="6.5"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"/>
                        <line x1="16" y1="16"
                              x2="21" y2="21"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"/>
                    </g>
                </svg>
            </button>

            <section class="wine-search wine-search--panel" id="wineSearchPanel" hidden>
                <div class="wine-search__label typo-eyebrow" data-wine-search-label>Vyhledat víno</div>

                <div class="wine-search__controls">
                    <input
                            id="wineSearch"
                            class="wine-search__input"
                            type="search"
                            placeholder="Název, profil, párování..."
                            autocomplete="off"
                    >
                    <button id="wineSearchClear" class="wine-search__clear" type="button" data-wine-clear>Vymazat</button>
                </div>

                <p id="wineSearchStatus" class="wine-search__status"></p>

                <div class="wine-filters" aria-label="Kategorie vín">
                    <div class="wine-filters__label typo-meta" data-wine-category-label>Kategorie:</div>
                    <div class="wine-filters__buttons" role="group" aria-label="Filtr kategorií">
                        <button type="button" class="wine-filter-btn is-active" data-filter="all" data-label-cs="Všechna" data-label-en="All">Všechna</button>
                        <button type="button" class="wine-filter-btn" data-filter="white" data-label-cs="Bílá" data-label-en="White">Bílá</button>
                        <button type="button" class="wine-filter-btn" data-filter="rose" data-label-cs="Růžová" data-label-en="Rosé">Růžová</button>
                        <button type="button" class="wine-filter-btn" data-filter="red" data-label-cs="Červená" data-label-en="Red">Červená</button>
                    </div>
                </div>
            </section>
        </div>

    </div>

    <!-- ===== VÍNA (katalog) ===== -->
    <section class="wines" id="vina-katalog" aria-label="Katalog vín">
        <!-- JS fills this from api/wines.php -->
    </section>

    <p id="wineCatalogStatus" class="wine-no-results typo-meta" hidden></p>

    <p id="wineNoResults" class="wine-no-results typo-meta" hidden>
        Žádná vína neodpovídají zadanému hledání.
    </p>

</section>

<!-- ===== MODAL (POPUP DETAIL VÍNA) ===== -->
<div class="modal" id="wineModal" aria-hidden="true">
    <div class="modal__backdrop" data-close="true"></div>

    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button class="modal__close" type="button" aria-label="Zavřít" data-close="true">✕</button>

        <button class="modal__nav modal__nav--prev" type="button" aria-label="Předchozí víno">‹</button>
        <button class="modal__nav modal__nav--next" type="button" aria-label="Další víno">›</button>

        <div class="modal__grid">
            <div class="modal__media">
                <img id="modalImage" src="" alt="">
            </div>

            <div class="modal__content">
                <div class="modal__topline">
                    <h2 class="modal__title typo-h2" id="modalTitle"></h2>
                    <div class="modal__meta typo-meta" id="modalMeta"></div>
                </div>

                <p class="modal__story typo-body" id="modalStory"></p>

                <div class="modal__section">
                    <h3 class="modal__h3 typo-h3" data-modal-specs-title>Specifikace</h3>
                    <ul class="modal__specs" id="modalSpecs"></ul>
                </div>

                <div class="modal__section">
                    <h3 class="modal__h3 typo-h3"></h3>
                    <ul class="modal__specs" id="modalPairing"></ul>
                </div>

                <div class="modal__section">
                    <a id="wineShopBtn"
                       class="wine-shop-btn"
                       href="#"
                       target="_blank"
                       rel="noopener noreferrer"
                       aria-label="Přejít na produkt v e-shopu">
                        Koupit v e-shopu
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>

