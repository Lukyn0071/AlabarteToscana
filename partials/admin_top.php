<?php
// partials/admin_top.php
// Admin top navigation (same visual structure as public hero-top, but links to admin pages).
//
// Inputs:
// - $active: dashboard|aktuality|vina (optional)

$active = isset($active) ? (string)$active : '';

$hrefDashboard = 'index.php';
$hrefAktuality = 'aktuality.php';
$hrefVina = 'vina.php';
$hrefLogout = 'logout.php';

$ariaCurrent = function (string $key) use ($active): string {
    return $key === $active ? ' aria-current="page"' : '';
};
?>
<div class="hero-top">
    <div class="lang-switcher" aria-label="Administrace">
        <span class="lang-btn" style="pointer-events:none;opacity:.9">ADMIN</span>
    </div>

    <nav class="hero-nav" aria-label="Admin navigace">
        <span class="is-disabled" aria-current="page" style="opacity:.8; cursor: default; text-decoration: none;">Administrace</span>
        <a href="<?php echo htmlspecialchars($hrefAktuality, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-aktuality"<?php echo $ariaCurrent('aktuality'); ?>>Novinky</a>
        <a href="<?php echo htmlspecialchars($hrefVina, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-vina"<?php echo $ariaCurrent('vina'); ?>>Vína</a>
        <a href="<?php echo htmlspecialchars($hrefLogout, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-logout">Odhlásit</a>
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
            <nav class="hero-nav" aria-label="Admin navigace">
                <span class="is-disabled" aria-current="page" style="opacity:.8; cursor: default; text-decoration: none;">Administrace</span>
                <a href="<?php echo htmlspecialchars($hrefAktuality, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-aktuality"<?php echo $ariaCurrent('aktuality'); ?>>Novinky</a>
                <a href="<?php echo htmlspecialchars($hrefVina, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-vina"<?php echo $ariaCurrent('vina'); ?>>Vína</a>
                <a href="<?php echo htmlspecialchars($hrefLogout, ENT_QUOTES, 'UTF-8'); ?>" data-key="admin-logout">Odhlásit</a>
            </nav>
        </div>
    </div>
</div>

