// aktuality.js
(function () {
    "use strict";

    function resolveAssetPath(path) {
        const p0 = String(path || '').trim();
        if (!p0) return '';

        // absolutní URL necháme
        if (/^(https?:)?\/\//i.test(p0)) return p0;

        // odstranit ../ a ./ na začátku
        let p = p0.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');

        // pokud začíná Images/ → přidáme lomítko pro root-relative
        if (/^Images[\/\\]/.test(p)) return '/' + p.replace(/\\/g, '/');

        // pokud už začíná / → necháme
        if (p.startsWith('/')) return p;

        // fallback
        return '/' + p;
    }

    // Loaded dynamically from DB via /api/news.php
    let NEWS = [];
    let CURRENT_IMAGE_INDEX = 0;

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
                    // keep full images array for modal gallery
                    images: Array.isArray(it.images) ? it.images : (it.images ? [it.images] : []),
                    image: it.image || (Array.isArray(it.images) && it.images.length ? it.images[0] : ''),
                    bodyHtml: it.bodyHtml,
                    has_link: !!it.has_link,
                    link_url: it.link_url || '',
                    link_label: it.link_label || '',
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

    // Modal elements and state (use let so we can re-query/create fallback markup)
    let modal = document.getElementById("newsModal");
    let modalImg = document.getElementById("newsModalImage");
    let modalTitle = document.getElementById("newsModalTitle");
    let modalMeta = document.getElementById("newsModalMeta");
    let modalPerex = document.getElementById("newsModalPerex");
    let modalBody = document.getElementById("newsModalBody");
    let modalLink = document.getElementById("newsModalLink");
    let lightbox = document.getElementById("newsImageLightbox");
    let lightboxImg = document.getElementById("newsImageLightboxImg");
    let lightboxLastFocusEl = null;

    // If the page doesn't include the modal markup, create a minimal fallback so gallery still works.
    function ensureModalMarkup() {
        modal = document.getElementById('newsModal');
        if (modal) return; // already exists

        // build minimal modal structure compatible with existing selectors
        modal = document.createElement('div');
        modal.id = 'newsModal';
        modal.className = 'modal';
        modal.setAttribute('aria-hidden', 'true');

        const backdrop = document.createElement('div');
        backdrop.className = 'modal__backdrop';
        modal.appendChild(backdrop);

        const panel = document.createElement('div');
        panel.className = 'modal__panel';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal__close';
        closeBtn.setAttribute('data-close', 'true');
        closeBtn.innerHTML = '✕';
        panel.appendChild(closeBtn);

        const grid = document.createElement('div');
        grid.className = 'modal__grid';

        const media = document.createElement('div');
        media.className = 'modal__media';
        modalImg = document.createElement('img');
        modalImg.id = 'newsModalImage';
        // Wrap image in a slide wrapper so we can animate incoming/outgoing images
        const slideWrap = document.createElement('div');
        slideWrap.className = 'slide-wrap';
        slideWrap.style.width = '100%';
        slideWrap.style.height = '100%';
        slideWrap.style.position = 'relative';
        slideWrap.style.overflow = 'hidden';
        slideWrap.appendChild(modalImg);
        media.appendChild(slideWrap);

        // Prev / Next arrows overlaying the media
        const prevArrow = document.createElement('button');
        prevArrow.className = 'modal__nav-arrow modal__nav-prev';
        prevArrow.type = 'button';
        prevArrow.setAttribute('aria-label', 'Předchozí obrázek');
        prevArrow.innerHTML = '◀';
        media.appendChild(prevArrow);

        const nextArrow = document.createElement('button');
        nextArrow.className = 'modal__nav-arrow modal__nav-next';
        nextArrow.type = 'button';
        nextArrow.setAttribute('aria-label', 'Následující obrázek');
        nextArrow.innerHTML = '▶';
        media.appendChild(nextArrow);

        const content = document.createElement('div');
        content.className = 'modal__content';
        modalTitle = document.createElement('h2'); modalTitle.id = 'newsModalTitle'; modalTitle.className = 'modal__title';
        modalMeta = document.createElement('div'); modalMeta.id = 'newsModalMeta'; modalMeta.className = 'modal__meta';
        modalPerex = document.createElement('p'); modalPerex.id = 'newsModalPerex'; modalPerex.className = 'modal__perex';
        modalBody = document.createElement('div'); modalBody.id = 'newsModalBody'; modalBody.className = 'modal__body';
        modalLink = document.createElement('a'); modalLink.id = 'newsModalLink'; modalLink.className = 'modal__link-btn'; modalLink.href = '#'; modalLink.target = '_blank'; modalLink.rel = 'noopener noreferrer'; modalLink.hidden = true;
        modalLink.textContent = (getLang() === 'en') ? 'Open link' : 'Otevřít odkaz';
        const modalFooter = document.createElement('div'); modalFooter.className = 'modal__footer';

        content.appendChild(modalTitle);
        content.appendChild(modalMeta);
        content.appendChild(modalPerex);
        content.appendChild(modalBody);
        modalFooter.appendChild(modalLink);
        content.appendChild(modalFooter);

        grid.appendChild(media);
        grid.appendChild(content);
        panel.appendChild(grid);
        modal.appendChild(panel);

        document.body.appendChild(modal);
    }

    function ensureLightboxMarkup() {
        lightbox = document.getElementById('newsImageLightbox');
        lightboxImg = document.getElementById('newsImageLightboxImg');
        if (lightbox && lightboxImg) return;

        lightbox = document.createElement('div');
        lightbox.id = 'newsImageLightbox';
        lightbox.className = 'image-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = `
            <div class="image-lightbox__backdrop" data-lightbox-close="true" aria-hidden="true"></div>
            <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Zvětšený obrázek">
                <button class="image-lightbox__close" type="button" aria-label="Zavřít zvětšený obrázek" data-lightbox-close="true">✕</button>
                <img class="image-lightbox__img" id="newsImageLightboxImg" src="" alt="" />
            </div>
        `;
        document.body.appendChild(lightbox);
        lightboxImg = document.getElementById('newsImageLightboxImg');
    }

    function isLightboxOpen() {
        return !!(lightbox && lightbox.getAttribute('aria-hidden') === 'false');
    }

    function openLightbox(src, alt, focusBackTo) {
        ensureLightboxMarkup();
        if (!lightbox || !lightboxImg || !src) return;
        lightboxLastFocusEl = focusBackTo || modalImg || null;
        lightboxImg.src = resolveAssetPath(src);
        lightboxImg.alt = String(alt || '');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('image-lightbox-open');
        const closeBtn = lightbox.querySelector('[data-lightbox-close="true"]');
        if (closeBtn && typeof closeBtn.focus === 'function') {
            setTimeout(() => closeBtn.focus(), 0);
        }
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('image-lightbox-open');
        if (lightboxImg) {
            lightboxImg.removeAttribute('src');
            lightboxImg.alt = '';
        }
        if (lightboxLastFocusEl && typeof lightboxLastFocusEl.focus === 'function') {
            lightboxLastFocusEl.focus();
        }
    }

    // basic load log
    try { console.debug('[aktuality] script loaded'); } catch(e) {}

    const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

    let lastFocusEl = null;

    function getItemById(id) {
        const n = NEWS.find((n) => String(n.id) === String(id)) || null;
        if (!n) return null;

        // If n has no images, try to find full item in window.__newsItems (layout payload)
        try {
            if ((!n.images || !n.images.length) && window.__newsItems && Array.isArray(window.__newsItems)) {
                const raw = window.__newsItems.find(it => String(it.post_id) === String(id));
                if (raw && raw.images && Array.isArray(raw.images) && raw.images.length) {
                    n.images = raw.images;
                    if (!n.image) n.image = raw.images[0];
                }
            }
        } catch (e) { /* ignore */ }

        // As a last resort, try DOM dataset of the card (rendered attribute)
        try {
            if ((!n.images || !n.images.length) && typeof document !== 'undefined') {
                const el = document.querySelector(`.news-card[data-news-id="${String(id)}"]`);
                if (el && el.dataset && el.dataset.newsImages) {
                    try { const parsed = JSON.parse(el.dataset.newsImages); if (Array.isArray(parsed) && parsed.length) { n.images = parsed; if (!n.image) n.image = parsed[0]; } } catch(e){}
                }
            }
        } catch (e) { /* ignore */ }

        return n;
    }

    function openModal(item, focusBackTo) {
        // Ensure modal markup exists (create fallback if necessary) and re-query elements
        try { ensureModalMarkup(); } catch(e) { if (DEBUG) console.warn('[aktuality] ensureModalMarkup failed', e); }
        modal = document.getElementById("newsModal");
        modalImg = document.getElementById("newsModalImage");
        modalTitle = document.getElementById("newsModalTitle");
        modalMeta = document.getElementById("newsModalMeta");
        modalPerex = document.getElementById("newsModalPerex");
        modalBody = document.getElementById("newsModalBody");
        modalLink = document.getElementById("newsModalLink");
        ensureLightboxMarkup();
        // Ensure modalImg is wrapped in .slide-wrap so sliding animations always have a container.
        try {
            if (modalImg && modalImg.parentElement && !modalImg.parentElement.classList.contains('slide-wrap')) {
                const parent = modalImg.parentElement;
                const wrapper = document.createElement('div');
                wrapper.className = 'slide-wrap';
                // preserve inline sizing
                wrapper.style.width = parent.style.width || '100%';
                wrapper.style.height = parent.style.height || '100%';
                wrapper.style.position = 'relative';
                wrapper.style.overflow = 'hidden';
                parent.replaceChild(wrapper, modalImg);
                wrapper.appendChild(modalImg);
            }
        } catch (e) {}
        // Ensure arrows exist in modal (create them if server template omitted them)
        try {
            const mediaEl = modal ? (modal.querySelector('.modal__media') || modal) : null;
            if (mediaEl) {
                if (!mediaEl.querySelector('.modal__nav-prev')) {
                    const prevArrow = document.createElement('button');
                    prevArrow.className = 'modal__nav-arrow modal__nav-prev';
                    prevArrow.type = 'button';
                    prevArrow.setAttribute('aria-label', 'Předchozí obrázek');
                    prevArrow.innerHTML = '◀';
                    mediaEl.appendChild(prevArrow);
                }
                if (!mediaEl.querySelector('.modal__nav-next')) {
                    const nextArrow = document.createElement('button');
                    nextArrow.className = 'modal__nav-arrow modal__nav-next';
                    nextArrow.type = 'button';
                    nextArrow.setAttribute('aria-label', 'Následující obrázek');
                    nextArrow.innerHTML = '▶';
                    mediaEl.appendChild(nextArrow);
                }
            }
        } catch (e) {}
        const prevArrowBtn = modal ? modal.querySelector('.modal__nav-prev') : null;
        const nextArrowBtn = modal ? modal.querySelector('.modal__nav-next') : null;
        if (!modal || !modalImg || !modalTitle || !modalMeta || !modalPerex || !modalBody) {
            if (DEBUG) console.warn('[aktuality] modal markup not available after ensure; skipping modal open');
            return;
        }
        if (DEBUG) console.debug('[aktuality] openModal start', { id: item && item.id, images: (item && item.images && item.images.length) || (item && item.image ? 1 : 0) });

        lastFocusEl = focusBackTo || null;

        // Galerie obrázků
        const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
        CURRENT_IMAGE_INDEX = 0;

        // robust slide state for rapid navigation
        let _slideTimeout = null;
        let _slideTokenSeq = 0;
        let _activeSlide = null;
        let _queuedNavigation = null;
        let _commitRaf = 0;
        const _sessionToken = Date.now() + Math.random();
        try { modal._slideSessionToken = _sessionToken; } catch (e) {}

        function getSlideWrap() {
            try {
                return modalImg && modalImg.parentElement && modalImg.parentElement.classList.contains('slide-wrap')
                    ? modalImg.parentElement
                    : ((modalImg && modalImg.closest('.modal__media')) ? modalImg.closest('.modal__media').querySelector('.slide-wrap') : null);
            } catch (e) {
                return null;
            }
        }

        function normalizeActiveImage(el) {
            if (!el) return;
            try {
                el.id = 'newsModalImage';
                el.classList.remove('slide', 'is-loading');
                el.style.transition = '';
                el.style.transform = '';
                el.style.opacity = '';
                el.style.position = '';
                el.style.top = '';
                el.style.left = '';
                el.style.width = '';
                el.style.height = '';
                el.style.maxWidth = '';
                el.style.maxHeight = '';
                el.style.zIndex = '';
                el.style.willChange = '';
            } catch (e) {}
        }

        function applySlideFrame(el) {
            if (!el) return;
            try {
                el.style.position = 'absolute';
                el.style.top = '0';
                el.style.left = '0';
                el.style.width = '100%';
                el.style.height = '100%';
                el.style.maxWidth = '100%';
                el.style.maxHeight = '100%';
                el.style.objectFit = 'contain';
                el.style.willChange = 'transform, opacity';
            } catch (e) {}
        }

        function cancelActiveSlide() {
            const active = _activeSlide;
            if (!active) return;
            active.cancelled = true;
            if (_slideTimeout) {
                try { clearTimeout(_slideTimeout); } catch (e) {}
                _slideTimeout = null;
            }
            try { if (active.oldEl) normalizeActiveImage(active.oldEl); } catch (e) {}
            try {
                if (active.newEl && active.newEl.parentElement) {
                    active.newEl.onload = null;
                    active.newEl.parentElement.removeChild(active.newEl);
                }
            } catch (e) {}
            _activeSlide = null;
            _queuedNavigation = null;
            if (_slideTimeout) {
                try { clearTimeout(_slideTimeout); } catch (e) {}
                _slideTimeout = null;
            }
            if (_commitRaf) {
                try { cancelAnimationFrame(_commitRaf); } catch (e) {}
                _commitRaf = 0;
            }
        }

        function commitActiveSlide(active) {
            if (!active || _activeSlide !== active || active.cancelled) return;
            if (!modal || modal._slideSessionToken !== _sessionToken) return;
            try {
                if (active.oldEl && active.oldEl.parentElement) active.oldEl.parentElement.removeChild(active.oldEl);
            } catch (e) {}
            try { normalizeActiveImage(active.newEl); } catch (e) {}
            try { modalImg = active.newEl; } catch (e) {}
            try { bindZoomHandler(); } catch (e) {}
            _activeSlide = null;
            if (_slideTimeout) {
                try { clearTimeout(_slideTimeout); } catch (e) {}
                _slideTimeout = null;
            }
            if (_commitRaf) {
                try { cancelAnimationFrame(_commitRaf); } catch (e) {}
                _commitRaf = 0;
            }
            if (_queuedNavigation) {
                const queued = _queuedNavigation;
                _queuedNavigation = null;
                showImage(queued.idx, { dir: queued.dir, force: true });
            }
        }

        function resetSlideWrap() {
            const wrap = getSlideWrap();
            if (!wrap) return;
            try {
                const imgs = Array.from(wrap.querySelectorAll('img'));
                imgs.forEach((img) => {
                    if (img === modalImg) {
                        normalizeActiveImage(img);
                        return;
                    }
                    try { if (img.parentElement) img.parentElement.removeChild(img); } catch (e) {}
                });
                if (modalImg && modalImg.parentElement !== wrap) wrap.appendChild(modalImg);
                if (modalImg) normalizeActiveImage(modalImg);
            } catch (e) {}
        }

        function showImage(idx, opts) {
            opts = opts || {};
            if (!images.length) {
                cancelActiveSlide('no-images');
                try { if (modalImg) { modalImg.removeAttribute('src'); modalImg.style.display = 'none'; } } catch (e) {}
                try {
                    const mediaEl = modal ? (modal.querySelector('.modal__media') || modal) : null;
                    if (mediaEl) {
                        const prevArrow = mediaEl.querySelector('.modal__nav-prev');
                        const nextArrow = mediaEl.querySelector('.modal__nav-next');
                        if (prevArrow) prevArrow.style.display = 'none';
                        if (nextArrow) nextArrow.style.display = 'none';
                    }
                } catch (e) {}
                return;
            }

            try { if (modalImg) modalImg.style.display = ''; } catch (e) {}

            const prevIndex = CURRENT_IMAGE_INDEX;
            const tgt = ((idx % images.length) + images.length) % images.length;
            if (tgt === prevIndex && !opts.force) return;

            let direction = opts.dir;
            if (!direction) {
                try {
                    const n2 = images.length;
                    const forward = (tgt - prevIndex + n2) % n2;
                    const backward = (prevIndex - tgt + n2) % n2;
                    direction = (forward <= backward) ? 'right' : 'left';
                } catch (e) {
                    direction = (tgt > prevIndex) ? 'right' : 'left';
                }
            }

            CURRENT_IMAGE_INDEX = tgt;

            const media = modalImg.closest('.modal__media') || modalImg.parentElement || document.body;
            const slideWrap = getSlideWrap() || media;

            if (_activeSlide) {
                _queuedNavigation = { idx: tgt, dir: direction };
                return;
            }

            if (opts.instant) {
                cancelActiveSlide('instant');
                resetSlideWrap();
                try {
                    modalImg.onload = function(){ try{ modalImg.classList.remove('is-loading'); }catch(e){} modalImg.onload = null; };
                    normalizeActiveImage(modalImg);
                    modalImg.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);
                    if (isLightboxOpen() && lightboxImg) {
                        lightboxImg.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);
                        lightboxImg.alt = modalImg.alt || '';
                    }
                } catch(e){}
                return;
            }

            cancelActiveSlide('replace');
            resetSlideWrap();

            const oldImg = modalImg;
            if (!oldImg) return;

            try { oldImg.classList.add('is-loading'); } catch (e) {}

            const newImg = document.createElement('img');
            newImg.className = oldImg.className || '';
            newImg.classList.add('slide');
            newImg.removeAttribute('id');
            newImg.loading = 'eager';
            newImg.alt = oldImg.alt || '';
            newImg.style.position = 'absolute';
            newImg.style.top = '0';
            newImg.style.left = '0';
            newImg.style.width = '100%';
            newImg.style.height = '100%';
            newImg.style.maxWidth = '100%';
            newImg.style.maxHeight = '100%';
            newImg.style.objectFit = 'contain';
            newImg.style.willChange = 'transform, opacity';
            newImg.style.transform = (direction === 'right') ? 'translateX(100%)' : 'translateX(-100%)';
            newImg.style.opacity = '1';
            newImg.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease';
            newImg.style.zIndex = '50';
            newImg.onload = function () { try { newImg.classList.remove('is-loading'); } catch (e) {} newImg.onload = null; };
            newImg.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);

            try {
                slideWrap.style.position = slideWrap.style.position || 'relative';
                slideWrap.style.overflow = 'hidden';
            } catch (e) {}

            try {
                applySlideFrame(oldImg);
                oldImg.style.zIndex = '40';
            } catch (e) {}

            slideWrap.appendChild(newImg);

            const active = {
                id: ++_slideTokenSeq,
                oldEl: oldImg,
                newEl: newImg,
                cancelled: false,
                sessionToken: _sessionToken,
            };
            _activeSlide = active;

            requestAnimationFrame(() => {
                if (_activeSlide !== active || active.cancelled || !modal || modal._slideSessionToken !== _sessionToken) return;
                try {
                    active.oldEl.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease';
                    active.oldEl.style.transform = (direction === 'right') ? 'translateX(-100%)' : 'translateX(100%)';
                    active.oldEl.style.opacity = '0';
                    active.oldEl.style.zIndex = '40';
                    active.newEl.style.transform = 'translateX(0)';
                    active.newEl.style.opacity = '1';
                } catch (e) { if (DEBUG) console.warn('[aktuality] slide animate failed', e); }
            });

            const finalize = () => commitActiveSlide(active);
            active.newEl.addEventListener('transitionend', finalize, { once: true });
            _commitRaf = requestAnimationFrame(() => {
                _commitRaf = requestAnimationFrame(() => {
                    if (_activeSlide === active && !active.cancelled) finalize();
                });
            });
            _slideTimeout = setTimeout(finalize, 520);
        }

        // Helper to navigate to target index with direction calculated
        function navigateTo(targetIndex, forcedDir) {
            const n = images.length;
            if (n < 2) return; // with 0/1 image there's nothing to navigate
            const tgt = ((targetIndex % n) + n) % n;
            const prev = CURRENT_IMAGE_INDEX;
            // determine direction: if caller forced it, use forcedDir (explicit prev/next buttons)
            let dir = forcedDir;
            if (!dir) {
                try {
                    const n2 = images.length;
                    const forward = (tgt - prev + n2) % n2;
                    const backward = (prev - tgt + n2) % n2;
                    dir = (forward <= backward) ? 'right' : 'left';
                } catch (e) { dir = (tgt > prev) ? 'right' : 'left'; }
            }
            showImage(tgt, { dir: dir });
        }

        function bindZoomHandler() {
            if (!modalImg) return;
            modalImg.alt = (localizedField(item, 'title') || '').split("\n").join(" ");
            modalImg.style.cursor = images.length ? 'zoom-in' : '';
            modalImg.onclick = function(ev) {
                ev && ev.preventDefault && ev.preventDefault();
                ev && ev.stopPropagation && ev.stopPropagation();
                if (!images.length) return;
                openLightbox(images[CURRENT_IMAGE_INDEX] || modalImg.src || '', modalImg.alt || '', modalImg);
            };
        }

        // attach arrow handlers (if present)
        try {
            if (prevArrowBtn) {
                prevArrowBtn.onclick = (ev) => { ev && ev.preventDefault && ev.preventDefault(); navigateTo(CURRENT_IMAGE_INDEX - 1, 'left'); };
            }
            if (nextArrowBtn) {
                nextArrowBtn.onclick = (ev) => { ev && ev.preventDefault && ev.preventDefault(); navigateTo(CURRENT_IMAGE_INDEX + 1, 'right'); };
            }
        } catch (e) {}

        // Toggle arrows visibility depending on image count
        try {
            const mediaEl = modal ? (modal.querySelector('.modal__media') || modal) : null;
            const hasNav = images.length > 1;
            if (mediaEl) {
                const prevArrow = mediaEl.querySelector('.modal__nav-prev');
                const nextArrow = mediaEl.querySelector('.modal__nav-next');
                if (prevArrow) prevArrow.style.display = hasNav ? '' : 'none';
                if (nextArrow) nextArrow.style.display = hasNav ? '' : 'none';
            }
        } catch (e) {}

        // show initial image without animation
        showImage(0, { instant: true, force: true });

        // Naplnění obsahu modalu
        modalTitle.textContent = (localizedField(item, 'title') || '').split("\n").join(" ");
        modalMeta.textContent = item && item.date ? String(item.date) : "";
        modalPerex.textContent = localizedField(item, 'perex') || "";
        modalBody.innerHTML = localizedField(item, 'bodyHtml') || localizedField(item, 'bodyHtml_en') || "";
        bindZoomHandler();

        // Otevření modalu
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        // (Pozn.: thumbnail galerie v modalu byla odstraněna, proto zde nejsou žádné helpery typu updateThumbs/buildFullTrack.)

        // Keyboard navigation for gallery
        function onKeyDown(e) {
            if (images.length < 2) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const isLeft = e.key === 'ArrowLeft';
                const target = isLeft ? (CURRENT_IMAGE_INDEX - 1) : (CURRENT_IMAGE_INDEX + 1);
                navigateTo(target, isLeft ? 'left' : 'right');
                e.preventDefault();
            }
         }
        // Attach handler on document so Arrow keys work even when focus is inside image
        document.addEventListener('keydown', onKeyDown);
        try { modal._aktKeyHandler = onKeyDown; } catch (e) {}

        // Cleanup listener on close (close button)
        const closeEl = modal.querySelector("[data-close='true']");
        if (closeEl) {
            closeEl.onclick = function() {
                closeModal();
                try { if (modal._aktKeyHandler) { document.removeEventListener('keydown', modal._aktKeyHandler); delete modal._aktKeyHandler; } } catch (e) {}
            };
        }
    }

    function closeModal() {
        if (!modal) return;

        closeLightbox();

        // Remove gallery keyboard handler if present
        try { if (modal._aktKeyHandler) { document.removeEventListener('keydown', modal._aktKeyHandler); delete modal._aktKeyHandler; } } catch (e) {}

        // Reset any active slide transition / orphaned slide images
        try {
            if (modal._slideSessionToken) delete modal._slideSessionToken;
            const wrap = modal.querySelector('.slide-wrap');
            const current = modal.querySelector('#newsModalImage');
            if (wrap) {
                const imgs = Array.from(wrap.querySelectorAll('img'));
                imgs.forEach((img) => {
                    if (current && img === current) {
                        try {
                            img.classList.remove('slide', 'is-loading');
                            img.style.transition = '';
                            img.style.transform = '';
                            img.style.opacity = '';
                            img.style.position = '';
                            img.style.top = '';
                            img.style.left = '';
                            img.style.width = '';
                            img.style.height = '';
                            img.style.maxWidth = '';
                            img.style.maxHeight = '';
                            img.style.zIndex = '';
                            img.style.willChange = '';
                        } catch (e) {}
                        return;
                    }
                    try { if (img.parentElement) img.parentElement.removeChild(img); } catch (e) {}
                });
            }
        } catch (e) {}

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        if (lastFocusEl && typeof lastFocusEl.focus === 'function') {
            lastFocusEl.focus();
        }
    }

    function onCardActivate(el) {
        if (!el) return;
        const id = (el.getAttribute && el.getAttribute('data-news-id')) || (el.dataset && el.dataset.newsId) || '';
        if (!id) return;
        const item = getItemById(String(id));
        if (!item) return;
        openModal(item, el);
    }

    function bind() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (isLightboxOpen()) {
                const lightboxCloseHit = target && target.closest && target.closest('[data-lightbox-close="true"]');
                if (lightboxCloseHit) {
                    e.preventDefault();
                    closeLightbox();
                    return;
                }
            }

            if (modal && modal.classList.contains('is-open')) {
                const closeHit = target && target.closest && target.closest("[data-close='true']");
                if (closeHit) {
                    closeModal();
                    return;
                }
            }

            const card = target && target.closest ? target.closest('.news-card[data-news-id]') : null;
            if (card) {
                e.preventDefault();
                onCardActivate(card);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (isLightboxOpen()) {
                    closeLightbox();
                    return;
                }
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
            .split("&").join("&amp;")
            .split("<").join("&lt;")
            .split(">").join("&gt;")
            .split('"').join("&quot;")
            .split("'").join("&#39;");
    }

    function nlToBr(s) {
        return escapeText(s).split("\n").join("<br>");
    }

    function cardTemplate(item, variant) {
        // Build node-based card to avoid template-in-attribute warnings and innerHTML for attributes
        const article = document.createElement('article');
        article.className = ['news-card', variant].filter(Boolean).join(' ');
        article.setAttribute('tabindex', '0');
        article.setAttribute('role', 'button');
        article.setAttribute('aria-label', `Detail aktuality ${escapeText(localizedField(item, 'title')).split('\n').join(' ')}`);
        article.dataset.newsId = String(item.id);
        // If images are provided on the underlying __newsItems, attach them as JSON for modal lookup
        try {
            if (item.images && Array.isArray(item.images) && item.images.length) {
                article.dataset.newsImages = JSON.stringify(item.images);
            }
        } catch (e) { /* ignore */ }

        const bg = document.createElement('div');
        bg.className = 'news-card__bg';
        bg.setAttribute('aria-hidden', 'true');
        bg.style.backgroundImage = `url(${escapeText(resolveAssetPath(item.image || (item.images && item.images[0] ? item.images[0] : '')))})`;

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

        // Modal opening is handled centrally in bind() via event delegation.

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
                images: Array.isArray(it.images) ? it.images : (it.images ? [it.images] : []),
                image: it.image,
                bodyHtml: it.bodyHtml,
                has_link: !!it.has_link,
                link_url: it.link_url || '',
                link_label: it.link_label || '',
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


































































