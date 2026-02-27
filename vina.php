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

                <!-- LANG SWITCHER -->
                <div class="lang-switcher" aria-label="Přepínač jazyka">
                    <button type="button" class="lang-btn" data-lang="cs">CS</button>
                    <button type="button" class="lang-btn" data-lang="en">EN</button>
                </div>

                <!-- NAV -->
                <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
                    <a href="index.php" data-key="home">Domů</a>
                    <a href="kontakt.php" data-key="contact">Kontakt</a>
                    <a href="aktuality.php" data-key="aktuality">Aktuality</a>
                    <a href="https://www.alabarte.cz/vino/" data-key="eshop" target="_blank" rel="noopener">E-shop</a>
                </nav>

            </div>

            <!-- ===== TITLE + LOGA (✅ VŠE UVNITŘ HEADERU) ===== -->
            <header class="vina-header" aria-label="Nadpis sekce Vína">
                <h1 class="vina-title typo-h1" data-key="vina_title">
                    <span class="vina-title__small">Naše</span>
                    <span class="vina-title__big">vína</span>
                </h1>

                <!-- ✅ LOGA JSOU TADY (už ne pod headerem) -->
                <div class="vina-brands" aria-label="Loga značek">
                    <div class="vina-brand vina-brand--left">
                        <img src="Images/Alabarte-logo.webp" alt="Alabarte logo">
                    </div>

                    <div class="vina-brand vina-brand--right">
                        <img src="Images/fattoria.png" alt="Fattoria La Torre logo">
                    </div>
                </div>
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
                <div class="wine-search__label typo-eyebrow">Vyhledat víno</div>

                <div class="wine-search__controls">
                    <input
                            id="wineSearch"
                            class="wine-search__input"
                            type="search"
                            placeholder="Název, profil, párování..."
                            autocomplete="off"
                    >
                    <button id="wineSearchClear" class="wine-search__clear" type="button">Vymazat</button>
                </div>

                <p id="wineSearchStatus" class="wine-search__status"></p>

                <div class="wine-filters" aria-label="Kategorie vín">
                    <div class="wine-filters__label typo-meta">Kategorie:</div>
                    <div class="wine-filters__buttons" role="group" aria-label="Filtr kategorií">
                        <button type="button" class="wine-filter-btn is-active" data-filter="all">Všechna</button>
                        <button type="button" class="wine-filter-btn" data-filter="white">Bílá</button>
                        <button type="button" class="wine-filter-btn" data-filter="rose">Růžová</button>
                        <button type="button" class="wine-filter-btn" data-filter="red">Červená</button>
                    </div>
                </div>
            </section>
        </div>

    </div>

    <!-- ===== VÍNA (katalog) ===== -->
    <section class="wines" id="vina-katalog" aria-label="Katalog vín">

        <!-- 1) Vermentino -->
        <article class="wine-card wine-card--catalog" data-wine="vermentino" tabindex="0" role="button"
                 aria-label="Detail vína Vermentino IGT Toscana 2023 BAGIOGIE">
            <div class="wine-media">
                <img src="Images/Vína/vermetinoigt23.png" alt="Vermentino IGT Toscana 2023 BAGIOGIE">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">VERMENTINO 2023</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">IGT TOSCANA</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2023 • suché bílé • Itálie</span>
                <span class="wine-story sr-only">citrusy, bylinky, mineralita</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: citrusy, bylinky, mineralita</li>
                    <li>Párování: ryby, mořské plody</li>
                </ul>
            </div>
        </article>

        <!-- 2) Chianti -->
        <article class="wine-card wine-card--catalog" data-wine="chianti" tabindex="0" role="button"
                 aria-label="Detail vína Chianti Colli Senesi DOCG 2023 La Villa">
            <div class="wine-media">
                <img src="Images/Vína/chiantisenesi23.png" alt="Chianti Colli Senesi DOCG 2023 La Villa">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">CHIANTI 2023</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">CHIANTI COLLI SENESI DOCG</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2023 • suché červené • Itálie</span>
                <span class="wine-story sr-only">červené ovoce, koření, jemné třísloviny</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: červené ovoce, koření</li>
                    <li>Párování: těstoviny, uzeniny, sýry</li>
                </ul>
            </div>
        </article>

        <!-- 3) Rosato -->
        <article class="wine-card wine-card--catalog" data-wine="rosato" tabindex="0" role="button"
                 aria-label="Detail vína Rosato IGT Toscana 2023 Badalui">
            <div class="wine-media">
                <img src="Images/Vína/rosatoigt23.png" alt="Rosato IGT Toscana 2023 Badalui">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">ROSATO 2023</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">IGT TOSCANA</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2023 • růžové • Itálie</span>
                <span class="wine-story sr-only">červené ovoce, svěžest, lehkost</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: červené ovoce, svěžest</li>
                    <li>Párování: pizza, těstoviny</li>
                </ul>
            </div>
        </article>

        <!-- 4) Vernaccia -->
        <article class="wine-card wine-card--catalog" data-wine="vernaccia" tabindex="0" role="button"
                 aria-label="Detail vína Vernaccia di San Gimignano DOCG 2024">
            <div class="wine-media">
                <img src="Images/Vína/vernaccia24.png" alt="Vernaccia di San Gimignano DOCG 2024">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">VERNACCIA 2024</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">VERNACCIA DI SAN GIMIGNANO DOCG</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2024 • suché bílé • Itálie</span>
                <span class="wine-story sr-only">citrusy, zelené jablko, mineralita</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: citrusy, mineralita</li>
                    <li>Párování: ryby, mořské plody</li>
                </ul>
            </div>
        </article>

        <!-- 5) Rosso (Guinzano) -->
        <article class="wine-card wine-card--catalog" data-wine="guinzano" tabindex="0" role="button"
                 aria-label="Detail vína San Gimignano Rosso DOC 2022 Guinzano">
            <div class="wine-media">
                <img src="Images/Vína/rossodoc22.png" alt="San Gimignano Rosso DOC 2022 Guinzano">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">ROSSO 2022</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">SAN GIMIGNANO ROSSO DOC</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2022 • suché červené • Itálie</span>
                <span class="wine-story sr-only">zralé červené ovoce, jemné dřevo</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: zralé ovoce, dřevo</li>
                    <li>Párování: maso, těstoviny</li>
                </ul>
            </div>
        </article>

        <!-- 6) Sciallebiancho Riserva -->
        <article class="wine-card wine-card--catalog" data-wine="sciallebiancho" tabindex="0" role="button"
                 aria-label="Detail vína Vernaccia di San Gimignano Riserva DOCG 2022 Sciallebiancho">
            <div class="wine-media">
                <img src="Images/Vína/vernacciadocg22.png" alt="Vernaccia di San Gimignano Riserva DOCG 2022 Sciallebiancho">
            </div>

            <div class="wine-info">
                <h3 class="wine-name typo-h3">RISERVA 2022</h3>
                <div class="wine-divider" aria-hidden="true"></div>

                <p class="wine-appellation typo-meta">VERNACCIA DI SAN GIMIGNANO RISERVA DOCG</p>
                <p class="wine-price">€—</p>

                <span class="wine-meta sr-only">2022 • suché bílé • Itálie</span>
                <span class="wine-story sr-only">mineralita, citrusová kůra, jemná krémovost</span>
                <ul class="wine-notes sr-only">
                    <li>Profil: mineralita, krémovost</li>
                    <li>Párování: ryby, bílé maso</li>
                </ul>
            </div>
        </article>

    </section>

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
                    <h3 class="modal__h3 typo-h3">Specifikace</h3>
                    <ul class="modal__specs" id="modalSpecs"></ul>
                </div>

                <div class="modal__section">
                    <h3 class="modal__h3 typo-h3">Chuť a párování</h3>
                    <ul class="modal__specs" id="modalPairing"></ul>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>