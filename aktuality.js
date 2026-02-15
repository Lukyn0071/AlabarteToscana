// aktuality.js
(function () {
    "use strict";

    function isAdminPath() {
        return /\/admin\//.test(window.location.pathname.replace(/\\/g, '/'));
    }

    function resolveAssetPath(path) {
        const p = String(path || '');
        if (!p) return p;
        if (/^(https?:)?\/\//i.test(p) || p.startsWith('/')) return p;
        if (isAdminPath() && (p.startsWith('Images/') || p.startsWith('Images\\'))) {
            return '../' + p.replace(/^\.\/+/, '');
        }
        return p;
    }

    // Loaded dynamically from DB via /api/news.php
    let NEWS = [];

    function getLang() {
        return (document.documentElement && document.documentElement.lang) || localStorage.getItem('lang') || 'cs';
    }

    function localizedField(item, field) {
        // API returns already-localized fields (title/perex/bodyHtml).
        // Keep fallback if older shape appears.
        const lang = getLang();
        if (lang === 'en' && item[`${field}_en`]) return item[`${field}_en`];
        return item[field] || '';
    }

    async function loadNews() {
        const lang = getLang();
        const debug = new URLSearchParams(window.location.search).get('debug') === '1';

        // Build URLs robustly (works for both /aktuality.php and /admin/aktuality.php)
        // Prefer resolving relative to this script URL (aktuality.js), not to the current document.
        let scriptBase = null;
        try {
            const scriptEl = document.currentScript || Array.from(document.scripts).find(s => (s.src || '').includes('aktuality.js'));
            if (scriptEl && scriptEl.src) scriptBase = new URL(scriptEl.src, window.location.href);
        } catch (e) {}

        const apiRelativeToScript = (() => {
            try {
                if (!scriptBase) return null;
                return new URL('api/news.php', scriptBase).toString();
            } catch (e) {
                return null;
            }
        })();

        const tryUrls = [
            // 1) Resolve relative to script (most reliable across subdirs)
            apiRelativeToScript ? `${apiRelativeToScript}?lang=${encodeURIComponent(lang)}&t=${Date.now()}` : null,
            // 2) Resolve relative to current document (old behavior)
            `api/news.php?lang=${encodeURIComponent(lang)}&t=${Date.now()}`,
            // 3) Absolute from site root
            `/api/news.php?lang=${encodeURIComponent(lang)}&t=${Date.now()}`,
        ].filter(Boolean);

        let lastErr = null;
        for (const u of tryUrls) {
            try {
                const res = await fetch(u, { headers: { 'Accept': 'application/json' } });
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(`Failed to load news (${res.status}) from ${u}${text ? `: ${text.slice(0, 200)}` : ''}`);
                }
                const data = await res.json();

                // Expected shape: { ok:true, layout:{grid_cols,layout_key}, items:[{post_id,x,y,w,h,...}] }
                if (!(data && data.layout && Array.isArray(data.items))) {
                    throw new Error('Unexpected API response shape');
                }

                if (debug) console.log('[aktuality] news loaded from', u, { items: data.items.length, layout: data.layout });

                window.__newsLayout = data.layout;
                window.__newsItems = data.items;

                // For modal lookup and generic handlers, keep a flat list with string id.
                NEWS = data.items.map(it => ({
                    id: String(it.post_id),
                    slot: '',
                    badge: it.badge,
                    title: it.title,
                    perex: it.perex,
                    date: it.date,
                    image: it.image,
                    bodyHtml: it.bodyHtml,
                }));

                return;
            } catch (e) {
                lastErr = e;
                if (debug) console.warn('[aktuality] load failed for', u, e);
            }
        }

        // total failure
        window.__newsLayout = null;
        window.__newsItems = [];
        NEWS = [];
        throw lastErr || new Error('Failed to load news');
    }

    // Modal elements and state
    const modal = document.getElementById("newsModal");
    const modalImg = document.getElementById("newsModalImage");
    const modalTitle = document.getElementById("newsModalTitle");
    const modalMeta = document.getElementById("newsModalMeta");
    const modalPerex = document.getElementById("newsModalPerex");
    const modalBody = document.getElementById("newsModalBody");

    const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

    let lastFocusEl = null;

    function getItemById(id) {
        return NEWS.find((n) => String(n.id) === String(id)) || null;
    }

    function openModal(item, focusBackTo) {
        // Modal is optional. If markup is missing, don't break the whole page.
        if (!modal || !modalImg || !modalTitle || !modalMeta || !modalPerex || !modalBody) {
            if (DEBUG) console.warn('[aktuality] modal markup not found; skipping modal open');
            return;
        }

        lastFocusEl = focusBackTo || null;

        modalImg.src = resolveAssetPath(item.image);
        modalImg.alt = localizedField(item, 'title').replaceAll("\n", " ");
        modalTitle.textContent = localizedField(item, 'title').replaceAll("\n", " ");
        modalMeta.textContent = item.date ? item.date : "";
        modalPerex.textContent = localizedField(item, 'perex');
        modalBody.innerHTML = localizedField(item, 'bodyHtml') || localizedField(item, 'bodyHtml_en') || "";

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        const closeBtn = modal.querySelector("[data-close='true']");
        if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
        if (!modal) return;

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        if (lastFocusEl && typeof lastFocusEl.focus === 'function') {
            lastFocusEl.focus();
        }
    }

    function onCardActivate(el) {
        const id = el.getAttribute('data-news-id');
        if (!id) return;
        const item = getItemById(id);
        if (!item) return;
        openModal(item, el);
    }

    function bind() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (modal && modal.classList.contains('is-open')) {
                const closeHit = target && target.closest && target.closest("[data-close='true']");
                if (closeHit) {
                    closeModal();
                    return;
                }
            }

            const card = target && target.closest ? target.closest('.news-card[data-news-id]') : null;
            if (card) onCardActivate(card);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal && modal.classList.contains('is-open')) closeModal();
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                const el = document.activeElement;
                if (el && el.classList && el.classList.contains('news-card')) {
                    e.preventDefault();
                    onCardActivate(el);
                }
            }
        });
    }

    function escapeText(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function nlToBr(s) {
        return escapeText(s).replaceAll("\n", "<br>");
    }

    function cardTemplate(item, variant) {
        // Build node-based card to avoid template-in-attribute warnings and innerHTML for attributes
        const article = document.createElement('article');
        article.className = ['news-card', variant].filter(Boolean).join(' ');
        article.setAttribute('tabindex', '0');
        article.setAttribute('role', 'button');
        article.setAttribute('aria-label', `Detail aktuality ${escapeText(localizedField(item, 'title')).replaceAll('\n', ' ')}`);
        article.dataset.newsId = escapeText(item.id);

        const bg = document.createElement('div');
        bg.className = 'news-card__bg';
        bg.setAttribute('aria-hidden', 'true');
        bg.style.backgroundImage = `url(${escapeText(resolveAssetPath(item.image))})`;

        const overlay = document.createElement('div');
        overlay.className = 'news-card__overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const content = document.createElement('div');
        content.className = 'news-card__content';

        const h2 = document.createElement('h2');
        h2.className = 'news-title';
        h2.innerHTML = nlToBr(localizedField(item, 'title'));

        const p = document.createElement('p');
        p.className = 'news-perex';
        p.textContent = localizedField(item, 'perex');

        const cta = document.createElement('span');
        cta.className = 'news-cta';
        cta.setAttribute('aria-hidden', 'true');
        // localized CTA
        cta.textContent = (getLang() === 'en') ? 'Read' : 'Přečíst';

        content.appendChild(h2);
        content.appendChild(p);
        content.appendChild(cta);

        article.appendChild(bg);
        article.appendChild(overlay);
        article.appendChild(content);

        // attach event listeners directly to the created element
        article.addEventListener('click', () => onCardActivate(article));
        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardActivate(article);
            }
        });

        return article;
    }

    function clearEl(el) {
        if (!el) return;
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function computeVariantFromSize(w, h) {
        const ww = Number(w || 1);
        const hh = Number(h || 1);
        if (ww >= 2 || hh >= 2) return 'news-card--featured';
        return '';
    }

    function maxBottomY(items){
        let m = 0;
        for(const it of (items || [])){
            const y = Number(it.y || 0);
            const h = Math.max(1, Number(it.h || 1));
            m = Math.max(m, y + h);
        }
        return m;
    }

    function renderLayoutGrid(layout, items) {
        const gridMount = document.getElementById('newsGrid');
        if (!gridMount) {
            if (DEBUG) console.warn('[aktuality] #newsGrid mount not found; cannot render');
            return false;
        }

        clearEl(gridMount);

        const gridCols = (layout && Number(layout.grid_cols)) ? Number(layout.grid_cols) : 2;
        const gridRowsFromApi = (layout && Number(layout.grid_rows)) ? Number(layout.grid_rows) : 0;
        const neededRows = maxBottomY(items);
        // Keep the container height consistent with saved layout, but we'll render placeholders only up to needed rows.
        const gridRows = Math.max(gridRowsFromApi, neededRows, 1);

        // Keep CSS vars aligned with admin grid
        gridMount.style.setProperty('--grid-cols', String(gridCols)); // backward-compat
        gridMount.style.setProperty('--cols', String(gridCols));
        gridMount.style.setProperty('--rows', String(gridRows));
        gridMount.style.setProperty('--grid-rows', String(gridRows));

        // --- Admin-like empty cells (public, inert) ---
        // Enable by adding data-admin-grid="1" to #newsGrid
        const adminLike = gridMount.getAttribute('data-admin-grid') === '1';
        if (adminLike) {
            const occ = new Set();
            for (const it of (items || [])) {
                const x0 = Number(it.x || 0);
                const y0 = Number(it.y || 0);
                const w0 = Math.max(1, Number(it.w || 1));
                const h0 = Math.max(1, Number(it.h || 1));
                for (let dy = 0; dy < h0; dy++) {
                    for (let dx = 0; dx < w0; dx++) {
                        occ.add(`${x0 + dx}:${y0 + dy}`);
                    }
                }
            }

            // Render placeholders only up to the last row that contains any post.
            // This removes empty rows under the last post completely.
            const placeholderRows = Math.max(neededRows, 1);

            for (let y = 0; y < placeholderRows; y++) {
                for (let x = 0; x < gridCols; x++) {
                    const key = `${x}:${y}`;
                    if (occ.has(key)) continue;

                    const cell = document.createElement('button');
                    cell.type = 'button';
                    cell.className = 'ng-cell ng-cell--public';
                    cell.disabled = true;
                    cell.setAttribute('aria-hidden', 'true');
                    // Make placeholders invisible (but they still occupy grid tracks)
                    cell.style.opacity = '0';
                    cell.style.gridColumn = `${x + 1} / span 1`;
                    cell.style.gridRow = `${y + 1} / span 1`;
                    cell.innerHTML = '<span class="ng-plus">+</span>';
                    gridMount.appendChild(cell);
                }
            }
        }

        // Ensure stable ordering (top-left first)
        const ordered = [...(items || [])].sort((a, b) => {
            const ay = Number(a.y || 0), by = Number(b.y || 0);
            const ax = Number(a.x || 0), bx = Number(b.x || 0);
            if (ay !== by) return ay - by;
            if (ax !== bx) return ax - bx;
            return Number(a.post_id || 0) - Number(b.post_id || 0);
        });

        for (const it of ordered) {
            const item = {
                id: String(it.post_id),
                badge: it.badge,
                title: it.title,
                perex: it.perex,
                date: it.date,
                image: it.image,
                bodyHtml: it.bodyHtml,
            };

            const variant = computeVariantFromSize(it.w, it.h);
            const card = cardTemplate(item, variant);

            const x = Number(it.x || 0);
            const y = Number(it.y || 0);
            const w = Math.max(1, Number(it.w || 1));
            const h = Math.max(1, Number(it.h || 1));

            // CSS Grid is 1-based
            card.style.gridColumn = `${x + 1} / span ${w}`;
            card.style.gridRow = `${y + 1} / span ${h}`;

            gridMount.appendChild(card);
        }

        if (DEBUG) console.log('[aktuality] rendered cards', ordered.length, { gridCols, gridRows, adminLike });

        return true;
    }

    function render() {
        if (window.__newsLayout && Array.isArray(window.__newsItems)) {
            renderLayoutGrid(window.__newsLayout, window.__newsItems);
        }
    }

    async function renderAll() {
        await loadNews();
        render();
    }

    // Allow other scripts (admin preview/editor) to force refresh.
    window.aktuality = window.aktuality || {};
    window.aktuality.refresh = function () {
        return renderAll().catch((e) => {
            console.error(e);
        });
    };

    // Live update when admin saves layout (same-origin tabs)
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('alabarte_news_layout');
            ch.addEventListener('message', (ev) => {
                if (!ev || !ev.data || ev.data.type !== 'layout_saved') return;
                window.aktuality.refresh();
            });
        }
    } catch (e) {}

    // auto-load and render
    loadNews()
        .then(render)
        .catch(e => console.error('[aktuality] load error', e));

    bind();
})();