<?php
// aktuality.php

declare(strict_types=1);

require_once __DIR__ . '/admin/db.php';
require_once __DIR__ . '/admin/content/page_content.php';
require_once __DIR__ . '/admin/content/ui_texts.php';

$lang = get_lang();
$ui = load_ui_texts($pdo, $lang);
?>
<!-- aktuality.php -->
<!doctype html>
<html lang="<?php echo htmlspecialchars($lang, ENT_QUOTES, 'UTF-8'); ?>">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ALABARTE – Aktuality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="aktuality.css" />
  <link rel="stylesheet" href="typography.css">

  <script>
    // Inline diagnostics: this MUST show up if the HTML is the one being served.
    (function(){
      var dbg = (new URLSearchParams(window.location.search)).get('debug') === '1';
      if(!dbg) return;
      console.log('[aktuality] inline debug: page loaded', { href: location.href, path: location.pathname });
      window.__aktuality_inline_debug = true;
    })();
  </script>

  <script src="index.js" defer></script>
  <!-- cache-bust to avoid serving stale aktuality.js from cache/CDN -->
  <script src="aktuality.js?v=20260213" defer></script>

  <!-- Keep hero background consistent with admin preview (which overrides due to relative Images path differences) -->
  <style>
    .hero{ background-image: url("Images/Obrázek1.png"); }
  </style>
</head>

<body>
  <section class="hero" aria-label="Aktuality">
    <div class="hero-overlay">

      <div class="hero-top">
        <div class="lang-switcher" aria-label="Přepínač jazyka">
          <a class="lang-btn" href="?lang=cs">CS</a>
          <a class="lang-btn" href="?lang=en">EN</a>
        </div>

        <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
          <a href="index.php" data-key="home"><?php echo htmlspecialchars((string)($ui['nav_home'] ?? 'Domů'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="vina.php" data-key="vina"><?php echo htmlspecialchars((string)($ui['nav_vina'] ?? 'Vína'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="aktuality.php" data-key="aktuality" aria-current="page"><?php echo htmlspecialchars((string)($ui['nav_galerie'] ?? 'Aktuality'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="https://www.alabarte.cz/vino/" data-key="eshop"><?php echo htmlspecialchars((string)($ui['nav_eshop'] ?? 'E-shop'), ENT_QUOTES, 'UTF-8'); ?></a>
        </nav>
      </div>

      <header class="page-head">
        <h1 class="page-title" data-key="aktuality_title"><?php echo htmlspecialchars((string)($ui['aktuality_title'] ?? 'Toskánský deník'), ENT_QUOTES, 'UTF-8'); ?></h1>
        <p class="page-lead" data-key="aktuality_lead"><?php echo htmlspecialchars((string)($ui['aktuality_lead'] ?? 'Novinky z našeho vinařství a život z Toskánska'), ENT_QUOTES, 'UTF-8'); ?></p>
      </header>

        <main class="wrap" aria-label="Obsah aktualit">
            <!-- Preview veřejné mřížky jako na /aktuality.php -->
            <section class="mag" aria-label="Seznam aktualit">
                <div class="news-grid-layout" id="newsGrid" aria-label="Mřížka aktualit"></div>

                <section class="quote" aria-label="Citát">
                    <div class="quote-inner">
                        <div class="quote-leaf" aria-hidden="true"></div>
                        <p class="quote-text"><?php echo htmlspecialchars((string)($ui['quote_text'] ?? 'Víno je poezie uzavřená v lahvi.'), ENT_QUOTES, 'UTF-8'); ?></p>
                        <div class="quote-author"><?php echo htmlspecialchars((string)($ui['quote_author'] ?? '— Robert Louis Stevenson'), ENT_QUOTES, 'UTF-8'); ?></div>
                    </div>
                </section>
            </section>
        </main>


      <footer class="site-footer" id="kontakt" role="contentinfo">
        <div class="site-footer__inner">
          <div class="site-footer__title" data-key="kontakt_title"><?php echo htmlspecialchars((string)($ui['kontakt_title'] ?? 'Kontakt'), ENT_QUOTES, 'UTF-8'); ?></div>

          <div class="contact-card" aria-label="Kontaktní údaje">
            <div class="contact-card__cols">
              <div class="contact-card__col">
                <a class="contact-item" href="tel:+420777123456" aria-label="Telefon: +420 777 123 456">
                  <span class="contact-item__icon" aria-hidden="true">☎</span>
                  <span class="contact-item__text">+420 777 123 456</span>
                </a>

                <a class="contact-item" href="mailto:info@alabarte.cz" aria-label="E‑mail: info@alabarte.cz">
                  <span class="contact-item__icon" aria-hidden="true">✉</span>
                  <span class="contact-item__text">info@alabarte.cz</span>
                </a>
              </div>

              <div class="contact-card__col contact-card__col--right">
                <a class="contact-item contact-item--ig"
                   href="https://www.instagram.com/alabarte.cz/?hl=en"
                   target="_blank" rel="noopener noreferrer"
                   aria-label="Alabarte na Instagramu — otevře se nové okno">
                  <span class="contact-item__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.2" fill="none"/>
                      <path d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6z" stroke="currentColor" stroke-width="1.2" fill="none"/>
                      <circle cx="17.6" cy="6.4" r="0.9" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="contact-item__text">@alabarte.cz</span>
                </a>
              </div>
            </div>

            <div class="contact-card__meta">Alabarte</div>
          </div>
        </div>
      </footer>

    </div>
  </section>

  <!-- MODAL (používá se v aktuality.js) -->
  <div class="modal" id="newsModal" aria-hidden="true">
    <div class="modal__backdrop" data-close="true" aria-hidden="true"></div>

    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="newsModalTitle">
      <button class="modal__close" type="button" aria-label="Zavřít" data-close="true">✕</button>

      <div class="modal__grid">
        <div class="modal__media">
          <img id="newsModalImage" src="" alt="" />
        </div>

        <div class="modal__content">
          <div class="modal__topline">
            <h2 class="modal__title" id="newsModalTitle" data-key="modal_title"></h2>
            <div class="modal__meta" id="newsModalMeta"></div>
          </div>

          <p class="modal__story" id="newsModalPerex"></p>

          <div class="modal__section">
            <h3 class="modal__h3"><?php echo htmlspecialchars((string)($ui['modal_detail_h3'] ?? 'Detail'), ENT_QUOTES, 'UTF-8'); ?></h3>
            <div class="modal__body" id="newsModalBody"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>