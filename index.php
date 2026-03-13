<?php
// DB-driven content for page-content sections (CS/EN)
declare(strict_types=1);

require_once __DIR__ . '/admin/db.php';
/** @var PDO $pdo */
require_once __DIR__ . '/admin/content/page_sections.php';
require_once __DIR__ . '/admin/content/ui_texts.php';

$lang = get_lang();
$ui = load_ui_texts($pdo, $lang);
$sections = load_page_sections($pdo, $lang);
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($lang, ENT_QUOTES, 'UTF-8'); ?>">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo htmlspecialchars((string)$ui['site_title'], ENT_QUOTES, 'UTF-8'); ?></title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="style.css?v=<?= filemtime(__DIR__ . '/style.css') ?>">
    <script src="index.js?v=<?= filemtime(__DIR__ . '/index.js') ?>" defer></script>
</head>
<body>
<section class="hero">
    <div class="hero-bg">
        <div class="hero-overlay">

            <div class="hero-top">
                <div class="lang-switcher">
                    <a class="lang-btn" href="?lang=cs" data-lang="cs">CS</a>
                    <a class="lang-btn" href="?lang=en" data-lang="en">EN</a>
                </div>

                <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
                    <a href="index.php">Domů</a>
                    <a href="vina.php">Vína</a>
                    <a href="#partner-section">Fattoria La Torre</a>
                    <a href="aktuality.php">Novinky</a>
                    <a href="https://www.alabarte.cz/vino/">E-Shop</a>
                </nav>

                <button
                    class="mobile-nav-toggle"
                    type="button"
                    aria-label="Otevřít navigaci"
                    aria-expanded="false"
                    aria-controls="mobileNavPanel"
                    data-nav-toggle
                >
                    <span class="mobile-nav-toggle__icon" aria-hidden="true"></span>
                </button>

                <div class="mobile-nav" data-mobile-nav>
                    <div class="mobile-nav__backdrop" data-nav-close tabindex="-1"></div>
                    <div class="mobile-nav__panel" id="mobileNavPanel" role="dialog" aria-modal="true" aria-label="Menu">
                        <nav class="hero-nav" id="heroNav" aria-label="Hlavní navigace">
                            <a href="index.php">Domů</a>
                            <a href="vina.php">Vína</a>
                            <a href="#partner-section">Fattoria La Torre</a>
                            <a href="aktuality.php">Novinky</a>
                            <a href="https://www.alabarte.cz/vino/">E-Shop</a>
                        </nav>
                    </div>
                </div>
            </div>

            <div class="hero-content hero-content--reference">
                <header class="hero-header hero-header--reference">
                    <div class="hero-logo hero-logo--reference">
                        <a href="index.php" aria-label="Alabarte">
                            <img src="Images/alabarte-red.png" alt="Alabarte">
                        </a>

                        <!-- klik v hero jen posune na sekci partnera -->
                        <a class="hero-fattoria-inline js-scroll-to-partner" href="#partner-section" aria-label="Přejít na sekci o našem partnerovi">
                            <img src="Images/fattoriaLogo.png" alt="Fattoria La Torre">
                        </a>
                    </div>

                    <h1 class="hero-headline">Víno. Historie.<br>Umění.</h1>
                    <p class="hero-subtitle">Toskánská vína s otiskem tradice, krajiny a umění.</p>

                    <div class="hero-cta">
                        <a href="vina.php" class="cta-btn cta-btn--primary"><?php echo htmlspecialchars((string)$ui['cta_wines'], ENT_QUOTES, 'UTF-8'); ?></a>
                        <a href="https://www.alabarte.cz/vino/" class="cta-btn cta-btn--ghost"><?php echo htmlspecialchars((string)$ui['cta_shop'], ENT_QUOTES, 'UTF-8'); ?></a>
                    </div>
                </header>
            </div>

            <div class="hero-divider"></div>
            <div class="scroll-hint" aria-hidden="true">
                <span class="scroll-hint__text"><?php echo htmlspecialchars((string)$ui['scroll_hint'], ENT_QUOTES, 'UTF-8'); ?></span>
                <span class="scroll-hint__arrow">↓</span>
            </div>
        </div>
    </div>
</section>

<div class="page-content page-content--bordeaux">

    <section class="home-texts-endcap home-texts-endcap--intro">
        <div class="info-wrapper">
            <section class="home-intro-block" aria-label="ALABARTE – z Toskánska až k vám">
                <div class="home-intro-block__card">
                    <h2 class="home-intro-block__title">ALABARTE – z Toskánska až k vám</h2>
                    <p class="home-intro-block__text">Do České republiky přinášíme toskánská vína s historií, charakterem a kulturním přesahem. Stojí za námi konkrétní lidé a osobní vztahy. Spolupracujeme napřímo s naším toskánským partnerem, se kterým každé víno pečlivě vybíráme.</p>
                    <p class="home-intro-block__text">Zakládáme si na spolupráci založené na důvěře, otevřenosti a pravidelném kontaktu. Stejný přístup uplatňujeme i vůči klientům – ať už jde o soukromé zákazníky, restaurace nebo firemní partnery.</p>
                </div>
            </section>
        </div>
    </section>
    <section class="home-index-presentation" aria-label="Prezentace vín">
        <div class="presentation-shell home-presentation-shell">
            <button class="presentation-arrow presentation-arrow--prev" type="button" aria-label="Předchozí obrázek">‹</button>

            <section class="wine-presentation-slider" data-slider="presentation" aria-label="Prezentace vín">
                <div class="presentation-slide is-active">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Acquaiole ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/acquaiole_m-pret.png">
                            <img src="Images/prezentace/acquaiole-pret.png" alt="Prezentace vína Acquaiole" class="presentation-image">
                        </picture>
                    </button>
                </div>

                <div class="presentation-slide">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Caroobacoo ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/caroobacoo_m-pret.png">
                            <img src="Images/prezentace/Caroobacoo-pret.png" alt="Prezentace vína Caroobacoo" class="presentation-image">
                        </picture>
                    </button>
                </div>

                <div class="presentation-slide">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Sciallebianco ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/sciallebiancom-pret.png">
                            <img src="Images/prezentace/sciallebianco-pret.png" alt="Prezentace vína Sciallebianco" class="presentation-image">
                        </picture>
                    </button>
                </div>

                <div class="presentation-slide">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Chiacchere ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/chiacchere_m-pret.png">
                            <img src="Images/prezentace/chiacchere-pret.png" alt="Prezentace vína Chiacchere" class="presentation-image">
                        </picture>
                    </button>
                </div>

                <div class="presentation-slide">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Guinzano ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/guinzano_m-pret.png">
                            <img src="Images/prezentace/guinzano-pret.png" alt="Prezentace vína Guinzano" class="presentation-image">
                        </picture>
                    </button>
                </div>

                <div class="presentation-slide">
                    <button class="presentation-zoom" type="button" aria-label="Otevřít obrázek vína Stradina ve větším zobrazení">
                        <picture class="presentation-picture">
                            <source media="(max-width: 768px)" srcset="Images/prezentace/stradina_m-pret.png">
                            <img src="Images/prezentace/stradina-pret.png" alt="Prezentace vína Stradina" class="presentation-image">
                        </picture>
                    </button>
                </div>
            </section>

            <button class="presentation-arrow presentation-arrow--next" type="button" aria-label="Další obrázek">›</button>
        </div>
    </section>

    <div class="presentation-modal" id="presentationModal" aria-hidden="true">
        <div class="presentation-modal__backdrop" data-close-presentation="true"></div>

        <div class="presentation-modal__panel" role="dialog" aria-modal="true" aria-label="Zvětšený náhled prezentace vína">
            <button class="presentation-modal__close" type="button" aria-label="Zavřít zvětšený obrázek" data-close-presentation="true">✕</button>

            <div class="presentation-modal__media">
                <img id="presentationModalImage" src="" alt="">
            </div>
        </div>
    </div>
    </section>
    <section class="home-partner" id="partner-section">
        <h2 class="home-partner__title">Fattoria La Torre, San Gimignano – domov našich vín</h2>

        <div class="partner-card">
            <div class="partner-card__media">
                <img src="Images/fattoria.jpg" alt="Fattoria La Torre">
            </div>
            <div class="partner-card__body">
                <h3 class="partner-card__headline">Náš partner v Toskánsku</h3>
                <p class="partner-card__text">Fattoria La Torre se nachází poblíž San Gimignana v krajině toskánských kopců pokrytých vinicemi a olivovými háji. Celému panství dominuje středověká věž z 10. století, která je symbolem místní historické kontinuity.</p>
                <p class="partner-card__text">Rodina Angiolini zde od roku 1960 rozvíjí vlastní vinařství s důrazem na kvalitu, pečlivou práci a osobní přístup.</p>
                <p class="partner-card__text">Vznikají zde především historicky významná vína Vernaccia di San Gimignano a Chianti doplněná o další toskánské odrůdy.</p>
                <p class="partner-card__text">Silnou součástí identity je propojení vína a umění. Etikety nesou fragmenty děl toskánských malířů Macchiaioli z rodinné sbírky a připomínají každodenní život v krajině kolem San Gimignana.</p>
                <p class="partner-card__text">Fattoria La Torre představuje autentické toskánské vinařství, kde se víno, historie a umění přirozeně prolínají.</p>

                <p class="partner-card__actions">
                    <a class="cta-btn cta-btn--ghost" href="https://latorrefattoria.it/en/" target="_blank" rel="noopener noreferrer" aria-label="Otevřít latorrefattoria.it (nové okno)">
                        Otevřít web La Torre
                    </a>
                </p>
            </div>
        </div>
    </section>

    <section class="home-texts-endcap">
        <div class="info-wrapper">
            <?php foreach ($sections as $i => $s): ?>
                <?php
                    $sectionClass = section_style_class((int)$i);
                    $innerClass = section_inner_class((int)$i);
                    $cardClass = section_card_class((int)$i);
                    $eyebrowClass = section_eyebrow_class((int)$i);
                    $titleClass = section_title_class((int)$i);
                    $pClass = section_p_class((int)$i);

                    $anchor = isset($s['anchor']) && is_string($s['anchor']) && $s['anchor'] !== ''
                        ? $s['anchor']
                        : null;

                    $img = (string)($s['image_path'] ?? '');
                    $alt = (string)($s['image_alt'] ?? '');
                    $eyebrow = (string)($s['eyebrow'] ?? '');
                    $title = (string)($s['title'] ?? '');
                    $body1 = (string)($s['body1'] ?? '');
                    $body2 = (string)($s['body2'] ?? '');
                ?>

                <section class="<?php echo htmlspecialchars($sectionClass, ENT_QUOTES, 'UTF-8'); ?>"<?php echo $anchor ? ' id="' . htmlspecialchars($anchor, ENT_QUOTES, 'UTF-8') . '"' : ''; ?>>
                    <div class="<?php echo htmlspecialchars($innerClass, ENT_QUOTES, 'UTF-8'); ?>">
                        <?php if ($sectionClass === 'info-section'): ?>
                            <div class="info-media">
                                <img src="<?php echo htmlspecialchars($img, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'); ?>">
                            </div>
                            <div class="info-text">
                                <div class="<?php echo htmlspecialchars($cardClass, ENT_QUOTES, 'UTF-8'); ?>">
                                    <span class="<?php echo htmlspecialchars($eyebrowClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8'); ?></span>
                                    <h2 class="<?php echo htmlspecialchars($titleClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h2>
                                    <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo nl2br(htmlspecialchars($body1, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php if ($body2 !== ''): ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo nl2br(htmlspecialchars($body2, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="winery-text">
                                <div class="<?php echo htmlspecialchars($cardClass, ENT_QUOTES, 'UTF-8'); ?>">
                                    <span class="<?php echo htmlspecialchars($eyebrowClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8'); ?></span>
                                    <h2 class="<?php echo htmlspecialchars($titleClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h2>
                                    <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo nl2br(htmlspecialchars($body1, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php if ($body2 !== ''): ?>
                                        <p class="<?php echo htmlspecialchars($pClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo nl2br(htmlspecialchars($body2, ENT_QUOTES, 'UTF-8')); ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="winery-media">
                                <img src="<?php echo htmlspecialchars($img, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'); ?>">
                            </div>
                        <?php endif; ?>
                    </div>
                </section>
            <?php endforeach; ?>
        </div>
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

</body>
</html>

