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

                <nav class="hero-nav" id="heroNav">
                    <a href="vina.php"><?php echo htmlspecialchars((string)$ui['nav_vina'], ENT_QUOTES, 'UTF-8'); ?></a>
                    <a href="aktuality.php"><?php echo htmlspecialchars((string)$ui['nav_galerie'], ENT_QUOTES, 'UTF-8'); ?></a>
                    <a href="https://www.alabarte.cz/vino/"><?php echo htmlspecialchars((string)$ui['nav_eshop'], ENT_QUOTES, 'UTF-8'); ?></a>
                </nav>
            </div>

            <div class="hero-content hero-content--reference">
                <header class="hero-header hero-header--reference">
                    <div class="hero-logo hero-logo--reference">
                        <a href="index.php" aria-label="Alabarte">
                            <img src="Images/Alabarte-logo.webp" alt="Alabarte">
                        </a>

                        <a class="hero-fattoria-inline" href="https://latorrefattoria.it/en/" target="_blank" rel="noopener noreferrer" aria-label="Fattoria La Torre (otevře se nové okno)">
                            <img src="Images/fattoriaLogo.png" alt="Fattoria La Torre">
                        </a>
                    </div>

                    <h1 class="hero-headline">Toskánská tradice.<br>Česká vášeň.</h1>
                    <p class="hero-subtitle">Exkluzivní vína z vinařství Fattoria La Torre, dovážená přímo do České republiky.</p>

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



    <section class="home-partner">
        <h2 class="home-partner__title">Náš partner v Toskánsku</h2>

        <a class="partner-card partner-card--link" href="https://latorrefattoria.it/en/" target="_blank" rel="noopener noreferrer" aria-label="Otevřít latorrefattoria.it">
            <div class="partner-card__media">
                <img src="Images/fattoria.jpg" alt="Fattoria La Torre">
            </div>
            <div class="partner-card__body">
                <h3 class="partner-card__headline">Fattoria La Torre –<br>Srdce našeho vína</h3>
                <p class="partner-card__text">Rodinné vinařství v srdci Toskánska, kde se víno tvoří s respektem k půdě, času, lásce a tradici.</p>
                <p class="partner-card__text">Spolupracujeme s vinařstvím Fattoria La Torre a přinášíme vína.</p>
                <p class="partner-card__signature">"From Tuscany with love, 2023"</p>
            </div>
        </a>
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

