<?php
// DB-driven content for page-content sections (CS/EN)
declare(strict_types=1);

require_once __DIR__ . '/admin/db.php';
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

    <link rel="stylesheet" href="style.css">
    <script src="index.js" defer></script>
</head>
<body>

<section class="hero">
    <!-- ✅ jen tato část má pozadí -->
    <div class="hero-bg">
        <div class="hero-overlay">

            <!-- ===== TOP BAR ===== -->
            <div class="hero-top">
                <div class="lang-switcher">
                    <a class="lang-btn" href="?lang=cs">CS</a>
                    <a class="lang-btn" href="?lang=en">EN</a>
                </div>

                <!-- NAV -->
                <nav class="hero-nav" id="heroNav">
                    <a href="#kontakt"><?php echo htmlspecialchars((string)$ui['nav_kontakt'], ENT_QUOTES, 'UTF-8'); ?></a>
                    <a href="vina.php"><?php echo htmlspecialchars((string)$ui['nav_vina'], ENT_QUOTES, 'UTF-8'); ?></a>
                    <a href="aktuality.php"><?php echo htmlspecialchars((string)$ui['nav_galerie'], ENT_QUOTES, 'UTF-8'); ?></a>
                    <a href="https://www.alabarte.cz/vino/"><?php echo htmlspecialchars((string)$ui['nav_eshop'], ENT_QUOTES, 'UTF-8'); ?></a>
                </nav>
            </div>

            <!-- ===== HERO HEADER ===== -->
            <header class="hero-header">
                <div class="hero-logo">
                    <a href="index.php">
                        <img src="Images/Alabarte-logo.webp" alt="Alabarte">
                    </a>
                </div>
            </header>
            <p class="hero-tagline"><?php echo htmlspecialchars((string)$ui['hero_tagline'], ENT_QUOTES, 'UTF-8'); ?></p>
            <!-- ✅ WRAPPER pro vše, co se může zmenšovat -->
            <div class="hero-content">

                <!-- ===== SLIDES ===== -->
                <div class="hero-slides">

                    <!-- IMAGES (klik -> https://www.alabarte.cz/vino/) -->
                    <a href="https://www.alabarte.cz/vino/"
                       class="slideshow image-stage hero-wine-link"
                       aria-label="Zobrazit vína">
                        <div class="image-slide active">
                            <img src="Images/Vína/víno1.png" alt="">
                        </div>

                        <div class="image-slide next">
                            <img src="Images/Vína/Víno2.png" alt="">
                        </div>

                        <div class="image-slide prev">
                            <img src="Images/Vína/Víno%203.png" alt="">
                        </div>
                    </a>

                    <!-- TEXTS (DYNAMICKY – funguje na všech rozlišeních) -->
                    <div class="slideshow text-stage">

                        <div class="text-frame">
                            <!-- TEXTY (jen tyhle slidy se animují) -->
                            <div class="text-content">

                                <div class="text-slide active">
                                    <div class="text-bg">
                                        <h2><?php echo htmlspecialchars((string)$ui['slide1_h2'], ENT_QUOTES, 'UTF-8'); ?></h2>
                                        <p><?php echo nl2br(htmlspecialchars((string)$ui['slide1_p'], ENT_QUOTES, 'UTF-8')); ?></p>
                                    </div>
                                </div>

                                <div class="text-slide">
                                    <div class="text-bg">
                                        <h2><?php echo htmlspecialchars((string)$ui['slide2_h2'], ENT_QUOTES, 'UTF-8'); ?></h2>
                                        <p><?php echo nl2br(htmlspecialchars((string)$ui['slide2_p'], ENT_QUOTES, 'UTF-8')); ?></p>
                                    </div>
                                </div>

                                <div class="text-slide">
                                    <div class="text-bg">
                                        <h2><?php echo htmlspecialchars((string)$ui['slide3_h2'], ENT_QUOTES, 'UTF-8'); ?></h2>
                                        <p><?php echo nl2br(htmlspecialchars((string)$ui['slide3_p'], ENT_QUOTES, 'UTF-8')); ?></p>
                                    </div>
                                </div>

                            </div>

                            <!-- CTA (statické – nemění se) -->
                            <div class="text-cta">
                                <a href="vina.php" class="cta-btn cta-btn--primary"><?php echo htmlspecialchars((string)$ui['cta_wines'], ENT_QUOTES, 'UTF-8'); ?></a>
                                <a href="https://www.alabarte.cz/vino/" class="cta-btn cta-btn--ghost"><?php echo htmlspecialchars((string)$ui['cta_shop'], ENT_QUOTES, 'UTF-8'); ?></a>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <!-- ✅ divider mimo hero-content, aby byl vždy dole -->
            <div class="hero-divider"></div>
            <!-- SCROLL HINT -->
            <div class="scroll-hint" aria-hidden="true">
                <span class="scroll-hint__text"><?php echo htmlspecialchars((string)$ui['scroll_hint'], ENT_QUOTES, 'UTF-8'); ?></span>
                <span class="scroll-hint__arrow">↓</span>
            </div>
        </div>
    </div>
</section>

<!-- ✅ odtud už BEZ hero pozadí -->
<div class="page-content">

    <!-- ✅ jeden velký box pro všechny sekce -->
    <div class="info-wrapper">

        <?php foreach ($sections as $i => $s): ?>
            <?php
                $sectionClass = section_style_class((int)$i);
                $innerClass = section_inner_class((int)$i);
                $cardClass = section_card_class((int)$i);
                $eyebrowClass = section_eyebrow_class((int)$i);
                $titleClass = section_title_class((int)$i);
                $pClass = section_p_class((int)$i);

                // optional anchor
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
</div>

</body>
</html>