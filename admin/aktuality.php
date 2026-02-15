<?php
// admin/aktuality.php

declare(strict_types=1);

require_once __DIR__ . '/auth/bootstrap.php';
require_login();

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/content/page_content.php';
require_once __DIR__ . '/content/ui_texts.php';

$lang = get_lang();
$ui = load_ui_texts($pdo, $lang);

// Cache-bust helper: use each file's mtime if available, otherwise fallback to current time.
// Using a per-file version avoids the situation where a single max(...) value hides updates
// to individual files and also makes it easier to debug caching issues on hosting/CDN.
function asset_ver(string $filePath): string {
    $t = @filemtime($filePath);
    if ($t && is_int($t)) return (string)$t;
    return (string)time();
}

// Precompute versions for the assets we include on this page
$ver_aktuality_css = asset_ver(__DIR__ . '/../aktuality.css');
$ver_typography_css = asset_ver(__DIR__ . '/../typography.css');
$ver_admin_css = asset_ver(__DIR__ . '/admin.css');
$ver_grid_css = asset_ver(__DIR__ . '/aktuality_grid.css');
$ver_index_js = asset_ver(__DIR__ . '/../index.js');
$ver_aktuality_js = asset_ver(__DIR__ . '/../aktuality.js');
$ver_grid_js = asset_ver(__DIR__ . '/aktuality_grid.js');
?>
<!doctype html>
<html lang="<?php echo htmlspecialchars($lang, ENT_QUOTES, 'UTF-8'); ?>">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ALABARTE – Aktuality (Admin)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="../aktuality.css?v=<?php echo urlencode($ver_aktuality_css); ?>" />
  <link rel="stylesheet" href="../typography.css?v=<?php echo urlencode($ver_typography_css); ?>">
  <link rel="stylesheet" href="admin.css?v=<?php echo urlencode($ver_admin_css); ?>">
  <link rel="stylesheet" href="aktuality_grid.css?v=<?php echo urlencode($ver_grid_css); ?>">

  <script src="../index.js?v=<?php echo urlencode($ver_index_js); ?>" defer></script>
  <script src="../aktuality.js?v=<?php echo urlencode($ver_aktuality_js); ?>" defer></script>
  <!-- Load grid script as module to ensure consistent execution timing (avoids cases where deferred script doesn't run until reload) -->
  <script type="module" src="aktuality_grid.js?v=<?php echo urlencode($ver_grid_js); ?>"></script>

  <!-- Fix background image path for admin context (aktuality.css uses relative Images/...) -->
  <style>
    .hero{ background-image: url("../Images/Obrázek1.png"); }
  </style>

  <!-- Ensure the public news modal (used on the public page) is hidden in admin unless opened. -->
  <style>
    /* Keep modal hidden unless scripts open it */
    #newsModal[aria-hidden="true"] { display: none; pointer-events: none; }
    #newsModal[aria-hidden="false"] { display: block; pointer-events: auto; }

    /* Prevent the inserter pseudo-element from capturing clicks */
    #newsGridAdmin .ng-row-inserter::before { pointer-events: none; }

    /* Make the inserter container itself non-intercepting, but keep its button clickable. */
    #newsGridAdmin .ng-row-inserter { pointer-events: none; }
    #newsGridAdmin .ng-row-inserter .ng-row-btn { pointer-events: auto; }

    /* Keep grid positioning modest — the editor panel has a very high z-index in CSS so it will sit above. */
    #newsGridAdmin { position: relative; z-index: 10; }
    #newsGridAdmin .ng-actions--overlay { z-index: 80; }
  </style>

  <!-- Debug: expose actual per-file asset version values in browser console to help detect caching/CDN issues -->
  <script>
    (function(){
      try{
        var __ASSET_VERSIONS = {
          aktuality_css: <?php echo json_encode($ver_aktuality_css); ?>,
          typography_css: <?php echo json_encode($ver_typography_css); ?>,
          admin_css: <?php echo json_encode($ver_admin_css); ?>,
          grid_css: <?php echo json_encode($ver_grid_css); ?>,
          index_js: <?php echo json_encode($ver_index_js); ?>,
          aktuality_js: <?php echo json_encode($ver_aktuality_js); ?>,
          grid_js: <?php echo json_encode($ver_grid_js); ?>
        };
        console.log('admin asset versions:', __ASSET_VERSIONS);
      }catch(e){/* ignore */}
    })();
  </script>
</head>

<body>
  <div class="admin-panel">
    Přihlášen jako <strong><?php echo htmlspecialchars((string)current_admin_username(), ENT_QUOTES, 'UTF-8'); ?></strong>
    | <a href="index.php">Administrace</a>
    | <a href="logout.php">Odhlásit</a>

    <div class="toast" id="toastOk" style="display:none;"></div>
  </div>

  <section class="hero" aria-label="Aktuality">
    <div class="hero-overlay">

      <div class="hero-top">
        <div class="lang-switcher" aria-label="Přepínač jazyka">
          <a class="lang-btn" href="?lang=cs" data-lang="cs">CS</a>
          <a class="lang-btn" href="?lang=en" data-lang="en">EN</a>
        </div>

        <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
          <a href="index.php" aria-current="page">Admin</a>
          <a href="../index.php" data-key="home"><?php echo htmlspecialchars((string)($ui['nav_home'] ?? 'Domů'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="../vina.php" data-key="vina"><?php echo htmlspecialchars((string)($ui['nav_vina'] ?? 'Vína'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="aktuality.php" data-key="aktuality"><?php echo htmlspecialchars((string)($ui['nav_galerie'] ?? 'Aktuality'), ENT_QUOTES, 'UTF-8'); ?></a>
          <a href="https://www.alabarte.cz/vino/" data-key="eshop"><?php echo htmlspecialchars((string)($ui['nav_eshop'] ?? 'E-shop'), ENT_QUOTES, 'UTF-8'); ?></a>
        </nav>
      </div>

      <header class="page-head">
        <h1 class="page-title" data-key="aktuality_title"><?php echo htmlspecialchars((string)($ui['aktuality_title'] ?? 'Toskánský deník'), ENT_QUOTES, 'UTF-8'); ?></h1>
        <p class="page-lead" data-key="aktuality_lead"><?php echo htmlspecialchars((string)($ui['aktuality_lead'] ?? 'Novinky z našeho vinařství a život z Toskánska'), ENT_QUOTES, 'UTF-8'); ?></p>
      </header>

      <!-- Interactive admin grid editor (requested to be on this page) -->
      <section id="aktualityAdminGrid" data-grid-cols="2" data-grid-rows="8" aria-label="Editor mřížky aktualit">
        <div class="ng-head">
          <h2>Mřížka aktualit</h2>
          <div class="ng-actionsbar">
             <button type="button" class="ng-btn ng-btn--primary" id="btnNewsGridSave">Uložit</button>
           </div>
        </div>
        <div class="ng-grid" id="newsGridAdmin" aria-label="Mřížka"></div>
        <div class="ng-status" id="newsGridStatus" aria-live="polite"></div>
      </section>

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

  <!-- Debug helper: when visiting with ?dbg=1, log elementAtPoint on clicks to help find overlays that block clicks -->
  <script>
    (function(){
      if(!/([?&])dbg=1($|&)/.test(location.search)) return;
      console.log('[DBG] admin debug enabled');

      function describeEl(el){
        if(!el) return null;
        return {
          tag: el.tagName,
          id: el.id || null,
          cls: el.className || null,
          rect: el.getBoundingClientRect ? el.getBoundingClientRect().toJSON() : null
        };
      }

      // Create a visual overlay to show the element under the cursor
      var dbgOverlay = document.createElement('div');
      dbgOverlay.id = 'dbg-overlay';
      dbgOverlay.style.position = 'fixed';
      dbgOverlay.style.pointerEvents = 'none';
      dbgOverlay.style.zIndex = '25000';
      dbgOverlay.style.border = '3px solid rgba(255,0,0,0.9)';
      dbgOverlay.style.background = 'rgba(255,0,0,0.06)';
      dbgOverlay.style.display = 'none';
      dbgOverlay.style.transition = 'none';
      document.body.appendChild(dbgOverlay);

      function updateOverlayFor(el){
        if(!el || !el.getBoundingClientRect) { dbgOverlay.style.display = 'none'; return; }
        var r = el.getBoundingClientRect();
        dbgOverlay.style.left = (r.left) + 'px';
        dbgOverlay.style.top = (r.top) + 'px';
        dbgOverlay.style.width = (r.width) + 'px';
        dbgOverlay.style.height = (r.height) + 'px';
        dbgOverlay.style.display = 'block';
      }

      document.addEventListener('mousemove', function(ev){
        try{
          var x = ev.clientX, y = ev.clientY;
          var top = document.elementFromPoint(x,y);
          updateOverlayFor(top);
        }catch(e){}
      }, {passive:true});

      document.addEventListener('click', function(ev){
        try{
          var x = ev.clientX, y = ev.clientY;
          var top = document.elementFromPoint(x,y);
          console.log('[DBG] click at', x, y, 'event.target:', describeEl(ev.target), 'elementFromPoint:', describeEl(top));

          if(top){
            var cs = getComputedStyle(top);
            console.log('[DBG] top computed style zIndex=', cs.zIndex, 'pointerEvents=', cs.pointerEvents, 'position=', cs.position);
          }

          // show ancestor chain up to body
          var chain = [];
          var e = top;
          var depth = 0;
          while(e && e !== document.body && depth < 32){
            var c = getComputedStyle(e);
            chain.push({desc: (e.tagName + (e.id?('#'+e.id):'') + (e.className?('.'+String(e.className).replace(/\s+/g,'.')):'')), z: c.zIndex, pe: c.pointerEvents});
            e = e.parentElement;
            depth++;
          }
          console.log('[DBG] ancestor chain:', chain);

        }catch(err){ console.warn('[DBG] error', err); }
      }, true);

      // Hide overlay if mouse leaves window
      window.addEventListener('mouseout', function(ev){
        dbgOverlay.style.display = 'none';
      });

      // Additional: temporarily isolate pointer events so only admin grid and admin UI receive clicks.
      // This is a destructive but temporary diagnostic: it helps confirm if an external element is stealing clicks.
      try {
        var s = document.createElement('style');
        s.id = 'dbg-pointer-isolate';
        s.textContent = '\n          body.dbg-pointer-test * { pointer-events: none !important; }\n          body.dbg-pointer-test #newsGridAdmin, body.dbg-pointer-test #newsGridAdmin * { pointer-events: auto !important; }\n          body.dbg-pointer-test .admin-panel, body.dbg-pointer-test .admin-panel * { pointer-events: auto !important; }\n          body.dbg-pointer-test #newsModal[aria-hidden="false"], body.dbg-pointer-test #newsModal[aria-hidden="false"] * { pointer-events: auto !important; }\n          body.dbg-pointer-test #newsGridAdmin { z-index: 25000 !important; }\n        ';
        document.head.appendChild(s);
        document.documentElement.classList.add('dbg-pointer-test');
        console.log('[DBG] pointer isolation enabled: only #newsGridAdmin and .admin-panel accept pointer events. Remove ?dbg=1 to revert.');
      } catch(e) { console.warn('[DBG] pointer isolation failed', e); }

    })();
  </script>

</body>
</html>