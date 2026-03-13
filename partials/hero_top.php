<?php
// partials/hero_top.php
// Shared top bar (language switcher + desktop nav + mobile nav) for public + admin pages.
//
// Inputs:
// - $baseHref: string prefix for internal links (e.g. '' or '../')
// - $active: one of: home|vina|partner|aktuality|eshop (optional)
// - $lang: current lang (optional; used for lang switch links)
// - $ui: UI texts array (optional; falls back to hardcoded Czech labels)

$baseHref = isset($baseHref) ? (string)$baseHref : '';
$active = isset($active) ? (string)$active : '';

$labelHome = (string)($ui['nav_home'] ?? 'Domů');
$labelVina = (string)($ui['nav_vina'] ?? 'Vína');
$labelPartner = (string)($ui['nav_partner'] ?? 'Fattoria La Torre');
$labelAktuality = (string)($ui['nav_galerie'] ?? $ui['nav_aktuality'] ?? 'Novinky');
$labelEshop = (string)($ui['nav_eshop'] ?? 'E-Shop');

$hrefHome = $baseHref . 'index.php';
$hrefVina = $baseHref . 'vina.php';
$hrefPartner = $baseHref . 'index.php#partner-section';
$hrefAktuality = $baseHref . 'aktuality.php';
$hrefEshop = 'https://www.alabarte.cz/vino/';

$ariaCurrent = function (string $key) use ($active): string {
    return $key === $active ? ' aria-current="page"' : '';
};
?>
<div class="hero-top">
    <div class="lang-switcher" aria-label="Přepínač jazyka">
        <a class="lang-btn" href="?lang=cs" data-lang="cs">CS</a>
        <a class="lang-btn" href="?lang=en" data-lang="en">EN</a>
    </div>

    <nav class="hero-nav" aria-label="Hlavní navigace">
        <a href="<?php echo htmlspecialchars($hrefHome, ENT_QUOTES, 'UTF-8'); ?>" data-key="home"<?php echo $ariaCurrent('home'); ?>><?php echo htmlspecialchars($labelHome, ENT_QUOTES, 'UTF-8'); ?></a>
        <a href="<?php echo htmlspecialchars($hrefVina, ENT_QUOTES, 'UTF-8'); ?>" data-key="vina"<?php echo $ariaCurrent('vina'); ?>><?php echo htmlspecialchars($labelVina, ENT_QUOTES, 'UTF-8'); ?></a>
        <a href="<?php echo htmlspecialchars($hrefPartner, ENT_QUOTES, 'UTF-8'); ?>" data-key="partner"<?php echo $ariaCurrent('partner'); ?>><?php echo htmlspecialchars($labelPartner, ENT_QUOTES, 'UTF-8'); ?></a>
        <a href="<?php echo htmlspecialchars($hrefAktuality, ENT_QUOTES, 'UTF-8'); ?>" data-key="aktuality"<?php echo $ariaCurrent('aktuality'); ?>><?php echo htmlspecialchars($labelAktuality, ENT_QUOTES, 'UTF-8'); ?></a>
        <a href="<?php echo htmlspecialchars($hrefEshop, ENT_QUOTES, 'UTF-8'); ?>" data-key="eshop"<?php echo $ariaCurrent('eshop'); ?>><?php echo htmlspecialchars($labelEshop, ENT_QUOTES, 'UTF-8'); ?></a>
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
            <nav class="hero-nav" aria-label="Hlavní navigace">
                <a href="<?php echo htmlspecialchars($hrefHome, ENT_QUOTES, 'UTF-8'); ?>" data-key="home"<?php echo $ariaCurrent('home'); ?>><?php echo htmlspecialchars($labelHome, ENT_QUOTES, 'UTF-8'); ?></a>
                <a href="<?php echo htmlspecialchars($hrefVina, ENT_QUOTES, 'UTF-8'); ?>" data-key="vina"<?php echo $ariaCurrent('vina'); ?>><?php echo htmlspecialchars($labelVina, ENT_QUOTES, 'UTF-8'); ?></a>
                <a href="<?php echo htmlspecialchars($hrefPartner, ENT_QUOTES, 'UTF-8'); ?>" data-key="partner"<?php echo $ariaCurrent('partner'); ?>><?php echo htmlspecialchars($labelPartner, ENT_QUOTES, 'UTF-8'); ?></a>
                <a href="<?php echo htmlspecialchars($hrefAktuality, ENT_QUOTES, 'UTF-8'); ?>" data-key="aktuality"<?php echo $ariaCurrent('aktuality'); ?>><?php echo htmlspecialchars($labelAktuality, ENT_QUOTES, 'UTF-8'); ?></a>
                <a href="<?php echo htmlspecialchars($hrefEshop, ENT_QUOTES, 'UTF-8'); ?>" data-key="eshop"<?php echo $ariaCurrent('eshop'); ?>><?php echo htmlspecialchars($labelEshop, ENT_QUOTES, 'UTF-8'); ?></a>
            </nav>
        </div>
    </div>
</div>

