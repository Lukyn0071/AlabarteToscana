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

        content.appendChild(modalTitle);
        content.appendChild(modalMeta);
        content.appendChild(modalPerex);
        content.appendChild(modalBody);

        grid.appendChild(media);
        grid.appendChild(content);
        panel.appendChild(grid);
        modal.appendChild(panel);

        document.body.appendChild(modal);
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

        // internal state for sliding
        let _isSliding = false;
        let _slideTimeout = null;

        function finishSlideCleanup(oldEl, newEl) {
            try {
                if (oldEl && oldEl.parentElement) oldEl.parentElement.removeChild(oldEl);
            } catch (e) {}
            // ensure modalImg points to the active image element and has the same id
            try {
                if (newEl) {
                    // normalize styles so the image sits normally in the flow inside slide-wrap
                    try {
                        newEl.id = 'newsModalImage';
                        newEl.classList.remove('slide');
                        newEl.style.transition = '';
                        newEl.style.transform = '';
                        newEl.style.opacity = '';
                        newEl.style.position = '';
                        newEl.style.top = '';
                        newEl.style.left = '';
                        newEl.style.width = '';
                        newEl.style.height = '';
                        newEl.style.zIndex = '';
                        newEl.style.willChange = '';
                    } catch (ee) {}
                    modalImg = newEl;
                }
            } catch (e) {}
            _isSliding = false;
            if (_slideTimeout) { clearTimeout(_slideTimeout); _slideTimeout = null; }
        }

        function showImage(idx, opts) {
            opts = opts || {};
            if (!images.length) return;
            const prevIndex = CURRENT_IMAGE_INDEX;
            const tgt = ((idx % images.length) + images.length) % images.length;
            // if same index and not forced, no-op
            if (tgt === prevIndex && !opts.force) return;

            // direction: 'right' means image moves from right -> center (we advanced forward), 'left' opposite
            let direction = opts.dir;
            if (!direction) {
                try {
                    const n2 = images.length;
                    const forward = (tgt - prevIndex + n2) % n2;
                    const backward = (prevIndex - tgt + n2) % n2;
                    direction = (forward <= backward) ? 'right' : 'left';
                } catch (e) { direction = (tgt > prevIndex) ? 'right' : 'left'; }
            }

            CURRENT_IMAGE_INDEX = tgt;

            // Visual loading state
            try { if (!opts.instant) modalImg.classList.add('is-loading'); } catch(e){}

            // If instant requested (first show) just swap src without animation
            const media = modalImg.closest('.modal__media') || modalImg.parentElement || document.body;
            const slideWrap = modalImg.parentElement && modalImg.parentElement.classList.contains('slide-wrap') ? modalImg.parentElement : (media.querySelector('.slide-wrap') || null);

            if (opts.instant) {
                try {
                    // reset any previous inline positioning so image displays normally
                    try {
                        modalImg.style.transition = '';
                        modalImg.style.transform = 'translateX(0)';
                        modalImg.style.opacity = '1';
                        modalImg.style.position = '';
                        modalImg.style.top = '';
                        modalImg.style.left = '';
                        modalImg.style.width = '';
                        modalImg.style.height = '';
                        modalImg.style.zIndex = '';
                        modalImg.style.willChange = '';
                    } catch (e) {}
                    modalImg.onload = function(){ try{ modalImg.classList.remove('is-loading'); }catch(e){} modalImg.onload = null; };
                    modalImg.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);
                } catch(e){}
                // update thumbs
                try { if (nav && nav._track) { const track = nav._track; const thumbs = Array.from(track.children); thumbs.forEach((b, i) => { if (i === CURRENT_IMAGE_INDEX) b.classList.add('is-active'); else b.classList.remove('is-active'); }); updateThumbs(); } } catch(e){}
                return;
            }

            // Prevent overlapping animations
            if (_isSliding) {
                // if already sliding, do a hard swap (cancel previous) to keep UI responsive
                try {
                    const current = modalImg;
                    current.onload = null;
                    // reset current positioning so replacement looks correct
                    try {
                        current.style.transition = '';
                        current.style.transform = 'translateX(0)';
                        current.style.opacity = '1';
                        current.style.position = '';
                        current.style.top = '';
                        current.style.left = '';
                        current.style.width = '';
                        current.style.height = '';
                        current.style.zIndex = '';
                        current.classList.remove('slide');
                    } catch (ee) {}
                    current.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);
                    current.classList.remove('is-loading');
                } catch (e) {}
                try { updateThumbs(); } catch(e){}
                return;
            }

            _isSliding = true;

            // create new image element
            const newImg = document.createElement('img');
            newImg.className = modalImg.className || '';
            newImg.classList.add('slide');
            newImg.loading = 'eager';
            newImg.alt = modalImg.alt || '';
            // ensure absolute positioning so transforms move the element cleanly
            newImg.style.position = 'absolute';
            newImg.style.top = '30px';
            newImg.style.left = '35px';
            newImg.style.width = '100%';
            newImg.style.height = '100%';
            newImg.style.objectFit = 'contain';
            newImg.style.willChange = 'transform, opacity';
            newImg.style.transform = (direction === 'right') ? 'translateX(100%)' : 'translateX(-100%)';
            newImg.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease';
            newImg.style.zIndex = '50';

            // ensure new image src loads then animate
            newImg.onload = function () { try{ newImg.classList.remove('is-loading'); }catch(e){} newImg.onload = null; };
            newImg.src = resolveAssetPath(images[CURRENT_IMAGE_INDEX]);

            // put new image into slideWrap (fallback to media if not found)
            const container = slideWrap || media;
            // ensure container is positioned and overflow hidden
            try { container.style.position = container.style.position || 'relative'; container.style.overflow = 'hidden'; } catch(e){}

            // make sure old image is absolute so it animates out predictably
            try {
                if (modalImg && (!modalImg.style.position || modalImg.style.position === 'relative')) {
                    modalImg.style.position = 'absolute';
                    modalImg.style.top = '30px';
                    modalImg.style.left = '35px';
                    modalImg.style.width = '100%';
                    modalImg.style.height = '100%';
                    modalImg.style.objectFit = 'contain';
                    modalImg.style.zIndex = '40';
                }
            } catch (e) {}

            // append new image
            container.appendChild(newImg);

            // force reflow then animate both images
            requestAnimationFrame(() => {
                try {
                    // animate old image out and new image in
                    const old = modalImg;
                    if (old) {
                        old.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease';
                        old.style.transform = (direction === 'right') ? 'translateX(-100%)' : 'translateX(100%)';
                        old.style.opacity = '0';
                        old.style.zIndex = '40';
                    }
                    newImg.style.transform = 'translateX(0)';
                    newImg.style.opacity = '1';
                } catch (e) { if (DEBUG) console.warn('[aktuality] slide animate failed', e); }
            });

            // After animation complete, remove old image and set modalImg to new
            _slideTimeout = setTimeout(() => {
                try {
                    // ensure new image is exactly centered and visible
                    try {
                        if (newImg) {
                            newImg.style.transition = '';
                            newImg.style.transform = 'translateX(0)';
                            newImg.style.opacity = '1';
                            newImg.style.position = '';
                            newImg.style.top = '';
                            newImg.style.left = '';
                            newImg.style.width = '';
                            newImg.style.height = '';
                            newImg.style.zIndex = '';
                            newImg.classList.remove('slide');
                        }
                    } catch (ee) {}
                } catch (e) {}
                try { finishSlideCleanup(modalImg, newImg); } catch (e) {}
                try { updateThumbs(); } catch(e){}
            }, 460);
        }

        // Helper to navigate to target index with direction calculated for thumb update
        function navigateTo(targetIndex, forcedDir) {
            const n = images.length;
            if (!n) return;
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
            // update thumbs (pass direction so it shifts by one step animated)
            try { updateThumbs(dir); } catch (e) { updateThumbs(); }
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

        // show initial image without animation
        showImage(0, { instant: true, force: true });

        // Přidání šipek pro galerii
        let nav = modalImg.closest('.modal__media').querySelector('.modal-gallery-thumbs');
        if (!nav) {
            nav = document.createElement('div');
            nav.className = 'modal-gallery-thumbs';
            modalImg.parentElement.appendChild(nav);
        }

        // Build full thumbs track (all thumbnails). We'll slide the track by one thumb on next/prev.
        function buildFullTrack() {
             nav.innerHTML = '';
             const track = document.createElement('div');
             track.className = 'thumbs-track';

             for (let idx = 0; idx < images.length; idx++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'modal-thumb' + (idx === CURRENT_IMAGE_INDEX ? ' is-active' : '');
                btn.setAttribute('aria-label', `Zobrazit obrázek ${idx+1}`);
                btn.dataset.index = String(idx);

                const imgEl = document.createElement('img');
                imgEl.src = resolveAssetPath(images[idx]);
                imgEl.alt = '';
                imgEl.loading = 'lazy';
                imgEl.className = 'modal-thumb-img';
                btn.appendChild(imgEl);

                btn.onclick = (ev) => {
                    ev && ev.preventDefault && ev.preventDefault();
                    // use navigateTo so sliding animation occurs and thumbs update correctly
                    // determine visual direction based on relative position to current image
                    const forcedDir = (idx < CURRENT_IMAGE_INDEX) ? 'left' : (idx > CURRENT_IMAGE_INDEX ? 'right' : undefined);
                    navigateTo(idx, forcedDir);
                     // center clicked thumb (animate)
                     ensureThumbVisible(idx, false);
                  };

                 track.appendChild(btn);
              }

              nav.appendChild(track);
              nav._track = track;
            if (DEBUG) console.debug('[aktuality] built thumbs track, thumbs=', track.children.length);
            // ensure nav has exact width for visible window so extra thumbs are hidden
            try {
                const firstThumb = track.children[0];
                if (firstThumb) {
                    // compute pixel-accurate step using bounding rects (distance between left edges)
                    const firstRect = firstThumb.getBoundingClientRect();
                    const secondThumb = track.children[1];
                    const step = secondThumb ? Math.round(secondThumb.getBoundingClientRect().left - firstRect.left) : Math.round(firstRect.width || 96);
                     // desired visible count
                     const DESIRED = 3;
                     // Always show up to 3 thumbnails (or fewer when images count < 3)
                     const visible = Math.min(DESIRED, images.length);
                     nav.style.boxSizing = 'content-box';
                     nav.style.width = `${visible * step}px`;
                     nav.style.overflow = 'hidden';
                 }
             } catch (e) {}
             // calculate layout (step size, visible count, maxStart) now that width is set
             calculateThumbLayout();
             if (DEBUG) console.debug('[aktuality] after calculateThumbLayout', { step: nav._step, visible: nav._visible, maxStart: nav._start });
             // position track to current start
              applyTrackPosition(false);
         }

         function calculateThumbLayout() {
             const track = nav._track;
             if (!track) return;
             const thumbs = Array.from(track.children);
             if (!thumbs.length) return;

             // compute pixel-accurate step: difference between left edges of consecutive thumbs
             const firstRect = thumbs[0].getBoundingClientRect();
             const secondRect = thumbs[1] ? thumbs[1].getBoundingClientRect() : null;
             const step = secondRect ? Math.round(secondRect.left - firstRect.left) : Math.round(firstRect.width || 96);

             nav._step = step;
             if (DEBUG) console.debug('[aktuality] calculateThumbLayout', { step, clientWidth: nav.clientWidth });
             // Force visible thumbnails window to exactly 3 (or fewer if fewer thumbnails exist)
             const DESIRED = 3;
             nav._visible = Math.min(DESIRED, thumbs.length);
             nav._maxStart = Math.max(0, thumbs.length - nav._visible);

             // initialize start if not set
             if (typeof nav._start === 'undefined') {
                 // center window around current image where possible
                 nav._start = Math.min(Math.max(0, CURRENT_IMAGE_INDEX - Math.floor(nav._visible / 2)), nav._maxStart);
             } else {
                 // clamp current start
                 nav._start = Math.min(Math.max(0, nav._start), nav._maxStart);
             }
         }

         function applyTrackPosition(animate) {
             const track = nav._track;
             if (!track) return;
            try {
                const thumbs = Array.from(track.children);
                if (!thumbs.length) return;

                const idx = Math.max(0, Math.min(thumbs.length - 1, CURRENT_IMAGE_INDEX));
                const thumb = thumbs[idx];

                // Compute absolute translate so thumb center aligns with container center.
                const thumbCenter = (thumb.offsetLeft || 0) + ((thumb.offsetWidth || (nav._step || 96)) / 2);
                const containerCenter = Math.round(nav.clientWidth / 2);
                let newTx = Math.round(containerCenter - thumbCenter);

                // clamp to prevent empty space on sides
                const totalWidth = track.scrollWidth || (thumbs.length * (nav._step || thumb.offsetWidth || 96));
                const minTx = Math.min(0, nav.clientWidth - totalWidth);
                const maxTx = 0;
                if (newTx < minTx) newTx = minTx;
                if (newTx > maxTx) newTx = maxTx;

                if (animate) track.style.transition = 'transform 520ms cubic-bezier(.2,.9,.2,1)'; else track.style.transition = 'none';
                requestAnimationFrame(() => { track.style.transform = `translateX(${newTx}px)`; });
                if (animate) setTimeout(() => { if (track) track.style.transition = ''; }, 560);

                // update nav._start approximation for other logic
                try {
                    const step = nav._step || Math.round(thumb.offsetWidth || 96);
                    const visible = nav._visible || Math.max(1, Math.floor(nav.clientWidth / step));
                    nav._start = Math.min(nav._maxStart || 0, Math.max(0, CURRENT_IMAGE_INDEX - Math.floor(visible / 2)));
                } catch (e) {}
            } catch (e) {
                if (DEBUG) console.warn('[aktuality] applyTrackPosition failed', e);
            }
         }

        function ensureThumbVisible(idx, instant) {
            if (!nav._track) return;
            calculateThumbLayout();
            // center the idx so that it's in the middle of the visible window
            const visible = nav._visible || 1;
            const desiredStart = Math.min(nav._maxStart || 0, Math.max(0, idx - Math.floor(visible / 2)));
            nav._start = desiredStart;
            // animate unless instant === true
            const animate = !instant;
            applyTrackPosition(animate);
         }

        function updateThumbs(dir) {
            if (!nav._track) buildFullTrack();
            calculateThumbLayout();
            const track = nav._track;
            if (!track) return;

            // update active class on thumbs
            const thumbs = Array.from(track.children);
            thumbs.forEach((b, i) => {
                if (i === CURRENT_IMAGE_INDEX) b.classList.add('is-active'); else b.classList.remove('is-active');
            });

            // shift by one only when navigating with dir: move nav._start one step toward the desired centered start
            if (DEBUG) console.debug('[aktuality] updateThumbs', { dir, start: nav._start, visible: nav._visible, current: CURRENT_IMAGE_INDEX });
            if (dir === 'right' || dir === 'left') {
                try {
                    const DESIRED = 3;
                    const visible = nav._visible || Math.min(DESIRED, Math.max(1, Math.floor(nav.clientWidth / (nav._step || 1))));
                    const desiredStart = Math.min(nav._maxStart || 0, Math.max(0, CURRENT_IMAGE_INDEX - Math.floor(visible / 2)));
                    if (desiredStart > nav._start) {
                        nav._start = Math.min(nav._maxStart, nav._start + 1);
                        applyTrackPosition(true);
                        return;
                    } else if (desiredStart < nav._start) {
                        nav._start = Math.max(0, nav._start - 1);
                        applyTrackPosition(true);
                        return;
                    }
                } catch (e) { /* ignore and fall back */ }
            }

            // otherwise ensure visible without sliding multiple positions
            ensureThumbVisible(CURRENT_IMAGE_INDEX, true);
        }

        // initial build
        buildFullTrack();
        // recalc on resize
        function onThumbsResize(){ try { calculateThumbLayout(); try { if (nav._step && nav._visible) { nav.style.width = `${nav._visible * nav._step}px`; } } catch(e){} applyTrackPosition(false); } catch(e){} }
        window.addEventListener('resize', onThumbsResize);
        try { nav._onResize = onThumbsResize; } catch(e){}

        modalTitle.textContent = localizedField(item, 'title').replaceAll("\n", " ");
        modalMeta.textContent = item.date ? item.date : "";
        modalPerex.textContent = localizedField(item, 'perex');
        modalBody.innerHTML = localizedField(item, 'bodyHtml') || localizedField(item, 'bodyHtml_en') || "";

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        const closeBtn = modal.querySelector("[data-close='true']");
        if (closeBtn) closeBtn.focus();

        // Keyboard navigation for gallery
        function onKeyDown(e) {
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

        // Remove gallery keyboard handler if present
        try { if (modal._aktKeyHandler) { document.removeEventListener('keydown', modal._aktKeyHandler); delete modal._aktKeyHandler; } } catch (e) {}

        // Cleanup thumbs resize listener and track if present
        try {
            const nav = modal.querySelector('.modal-gallery-thumbs');
            if (nav) {
                if (nav._onResize) {
                    try { window.removeEventListener('resize', nav._onResize); } catch (e) {}
                    try { delete nav._onResize; } catch(e){}
                }
                // clear track to release DOM refs
                try { nav.innerHTML = ''; delete nav._track; } catch(e){}
            }
        } catch(e) {}

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
                images: Array.isArray(it.images) ? it.images : (it.images ? [it.images] : []),
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


































































