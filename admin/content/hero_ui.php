<?php
// admin/content/hero_ui.php
// Provides DB-backed hero UI texts for admin preview switching (CS/EN).

declare(strict_types=1);

require_once __DIR__ . '/ui_texts.php';

function ui_texts_to_hero_client_data(array $ui): array
{
    return [
        'hero_tagline' => (string)($ui['hero_tagline'] ?? ''),
        'scroll_hint' => (string)($ui['scroll_hint'] ?? ''),
        'cta_wines' => (string)($ui['cta_wines'] ?? ''),
        'cta_shop' => (string)($ui['cta_shop'] ?? ''),
        'nav_kontakt' => (string)($ui['nav_kontakt'] ?? ''),
        'nav_vina' => (string)($ui['nav_vina'] ?? ''),
        'nav_galerie' => (string)($ui['nav_galerie'] ?? ''),
        'nav_eshop' => (string)($ui['nav_eshop'] ?? ''),
        'slide1_h2' => (string)($ui['slide1_h2'] ?? ''),
        'slide1_p' => (string)($ui['slide1_p'] ?? ''),
        'slide2_h2' => (string)($ui['slide2_h2'] ?? ''),
        'slide2_p' => (string)($ui['slide2_p'] ?? ''),
        'slide3_h2' => (string)($ui['slide3_h2'] ?? ''),
        'slide3_p' => (string)($ui['slide3_p'] ?? ''),
    ];
}
