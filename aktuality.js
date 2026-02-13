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

    const NEWS = [
        {
            id: "degustace-patek",
            slot: "featured",
            badge: "DEGUSTACE",
            title: "Novinky!",
            title_en: "News!",
            perex: "Novinky z Fattoria La Torre právě dorazily na náš e-shop!",
            perex_en: "News from Fattoria La Torre have just arrived on our shop!",
            date: "12/2025",
            image: "Images/aktuality/al2.png",
            bodyHtml:
                "<p>Ať už hledáte víno, které si otevřete po náročném dni, nebo lahev pro speciální příležitost, určitě si mezi nimi vyberete svého favorita. Více informací o jednotlivých vínech naleznete v jejich popisku na e-shopu. 🍷🍇</p>",
            bodyHtml_en:
                "<p>Whether you want a bottle to unwind after a long day or something special for an occasion, you'll find a favorite among these. Find full descriptions on our shop.</p>"
        },
        {
            id: "z-vinarstvi-1",
            slot: "left",
            badge: "Z VINAŘSTVÍ",
            title: "E-shop!",
            title_en: "Shop is live!",
            perex: "Naše pečlivě vybraná vína jsou odteď i na e-shopu!",
            perex_en: "Our carefully selected wines are now available in the shop!",
            date: "04/2025",
            image: "Images/aktuality/al1.png",
            bodyHtml:
                "<p>S radostí oznamujeme, že toskánská vína z @fattorialatorre najdete nově i na našem e-shopu! Pokud tedy nemáte cestu k nám do Kutné Hory, můžete si je vychutnat i v pohodlí vašeho domova.</p>",
            bodyHtml_en:
                "<p>We are happy to announce that wines from Fattoria La Torre are now on our shop. If you can't visit us in Kutná Hora, enjoy them at home.</p>"
        },
        {
            id: "pinot-nova-sarze",
            slot: "right1",
            badge: "NOVÁ VÍNA",
            title: "Bicchierino ~ Panák",
            title_en: "Bicchierino ~ Shot",
            perex: "Našli jsme pro Vás tyto úžasné a jemné likéry, které zkrátka musíte ochutnat!",
            perex_en: "We've found these delightful, delicate liqueurs you must taste!",
            date: "04/2025",
            image: "Images/aktuality/al3.png",
            bodyHtml:
                "<p>Našli jsme pro Vás tyto úžasné a jemné likéry, které zkrátka musíte ochutnat! Zatím ve formě panáků, ale přijdou i drinky. Švestka, rebarbora nebo voňavý heřmánek!</p>",
            bodyHtml_en:
                "<p>We've discovered exquisite delicate liqueurs to taste — currently served as shots, with cocktails coming soon. Flavours include plum, rhubarb and chamomile.</p>"
        },
        {
            id: "rucne-sbirane-hrozny",
            slot: "right2",
            badge: "Z VINAŘSTVÍ",
            title: "Nově i olivový olej!",
            title_en: "Now also olive oil!",
            perex: "Nově si u nás můžete pořídit i olivový olej!",
            perex_en: "You can now buy olive oil from us!",
            date: "03/2025",
            image: "Images/aktuality/al4.png",
            bodyHtml:
                "<p>Objevte chuť Toskánska s našimi prémiovými olivovými oleji! Seženete u nás nejen klasický extra panenský olivový olej, ale i varianty s různými lahodnými příchutěmi.</p>",
            bodyHtml_en:
                "<p>Discover Tuscan flavour with our premium olive oils — from classic extra virgin to flavored varieties. Available in our gallery in Kutná Hora or on our shop.</p>"
        },
        {
            id: "ochutnavka-praha",
            slot: "bottomLeft",
            badge: "UDÁLOSTI",
            title: "Navštíví nás vinaři",
            title_en: "Winemakers visiting",
            perex: "Na konci března nás navštíví vinaři z naší partnerské vinice Fattoria La Torre.",
            perex_en: "At the end of March, winemakers from Fattoria La Torre will visit us.",
            date: "02/2025",
            image: "Images/aktuality/al5.png",
            bodyHtml:
                "<p>Na konci března nás navštíví vinaři z naší partnerské vinice Fattoria La Torre, aby vám představili vína, která můžete ochutnat v naší galerii ALABARTE.</p>",
            bodyHtml_en:
                "<p>At the end of March, winemakers from our partner Fattoria La Torre will present wines you can taste at ALABARTE gallery. Tasting sessions will be held on March 28 and 29 at 19:00. Price 590 CZK per person includes 10 wine samples, coffee and Italian snacks. Reservations required: info@alabarte.cz.</p>"
        },
        {
            id: "rosato-novinka",
            slot: "bottomRight",
            badge: "NOVÁ VÍNA",
            title: "Blížící se Velikonoce!",
            title_en: "Easter is coming!",
            perex: "Velikonoce nám na zahradě zanechaly překvapení.",
            perex_en: "Easter left a surprise in our garden.",
            date: "03/2025",
            image: "Images/aktuality/al6.png",
            bodyHtml:
                "<p>Blížící se Velikonoce nám na zahradě zanechaly překvapení 🥚🌷 Najdete své velikonoční vajíčko i vy?</p>",
            bodyHtml_en:
                "<p>Easter brought surprises to our garden 🥚🌷 Will you find your Easter egg too? It lasts forever and looks magical in any light.</p>"
        }
    ];

    // Helper to get current language (fallback to document lang or localStorage)
    function getLang() {
        return (document.documentElement && document.documentElement.lang) || localStorage.getItem('lang') || 'cs';
    }

    function localizedField(item, field) {
        const lang = getLang();
        if (lang === 'en' && item[`${field}_en`]) return item[`${field}_en`];
        return item[field] || '';
    }

    // Modal elements and state
    const modal = document.getElementById("newsModal");
    const modalImg = document.getElementById("newsModalImage");
    const modalTitle = document.getElementById("newsModalTitle");
    const modalMeta = document.getElementById("newsModalMeta");
    const modalPerex = document.getElementById("newsModalPerex");
    const modalBody = document.getElementById("newsModalBody");

    let lastFocusEl = null;

    function getItemById(id) {
        return NEWS.find((n) => n.id === id) || null;
    }

    function openModal(item, focusBackTo) {
        if (!modal) return;

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
        // Global click handler for modal close and delegation fallback
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (modal && modal.classList.contains('is-open')) {
                const closeHit = target && target.closest && target.closest("[data-close='true']");
                if (closeHit) {
                    closeModal();
                    return;
                }
            }

            // Delegation fallback: if a card was clicked but per-card listeners were not attached
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

    function localizedField(item, field) {
        const lang = getLang();
        if (lang === 'en' && item[`${field}_en`]) return item[`${field}_en`];
        return item[field] || '';
    }

    const slots = {
        featured: document.getElementById("newsFeatured"),
        left: document.getElementById("newsLeft"),
        right1: document.getElementById("newsRight"),
        right2: document.getElementById("newsRight"),
        bottomLeft: document.getElementById("newsBottomLeft"),
        bottomRight: document.getElementById("newsBottomRight")
    };

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

    function render() {
        const bySlot = new Map(NEWS.map((n) => [n.slot, n]));

        const featured = bySlot.get("featured");
        if (featured && slots.featured) {
            slots.featured.innerHTML = '';
            slots.featured.appendChild(cardTemplate(featured, "news-card--featured"));
        }

        const left = bySlot.get("left");
        if (left && slots.left) {
            slots.left.innerHTML = '';
            slots.left.appendChild(cardTemplate(left, ""));
        }

        const r1 = bySlot.get("right1");
        const r2 = bySlot.get("right2");
        if (slots.right1) {
            slots.right1.innerHTML = '';
            if (r1) slots.right1.appendChild(cardTemplate(r1, "news-card--stack"));
            if (r2) slots.right1.appendChild(cardTemplate(r2, "news-card--stack"));
        }

        const bl = bySlot.get("bottomLeft");
        if (bl && slots.bottomLeft) {
            slots.bottomLeft.innerHTML = '';
            slots.bottomLeft.appendChild(cardTemplate(bl, ""));
        }

        const br = bySlot.get("bottomRight");
        if (br && slots.bottomRight) {
            slots.bottomRight.innerHTML = '';
            slots.bottomRight.appendChild(cardTemplate(br, ""));
        }

        // ensure any fallback listeners are attached (kept for safety)
        attachCardListeners();
    }

    function attachCardListeners() {
        // remove previous listeners by cloning nodes (simple way) or ensure no duplicate handlers
        const cards = document.querySelectorAll('.news-card[data-news-id]');
        cards.forEach(card => {
            // ensure pointer cursor
            card.style.cursor = 'pointer';

            // remove existing marker to avoid double-binding
            if (card.__bound) return;

            card.addEventListener('click', (e) => {
                onCardActivate(card);
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCardActivate(card);
                }
            });

            card.__bound = true;
        });
    }

    // Update modal content if open (used when language changes)
    function refreshModalIfOpen() {
        if (!modal) return;
        if (!modal.classList.contains('is-open')) return;
        // if modal is open, determine which item is shown from modalImg.src or modalTitle
        // prefer lastFocusEl (the card element) if available
        let item = null;
        if (lastFocusEl && lastFocusEl.getAttribute) {
            const id = lastFocusEl.getAttribute('data-news-id');
            if (id) item = getItemById(id);
        }
        // fallback: try to find by matching image src
        if (!item && modalImg && modalImg.src) {
            const src = modalImg.src.replace(window.location.origin + '/', '');
            const normalizedSrc = src.replace(/^\.\//, '');
            item = NEWS.find(n => resolveAssetPath(n.image).replace(/^\.\//, '') === normalizedSrc) || null;
        }
        if (item) {
            // update modal contents with localized fields
            modalImg.src = resolveAssetPath(item.image);
            modalImg.alt = localizedField(item, 'title').replaceAll("\n", " ");
            modalTitle.textContent = localizedField(item, 'title').replaceAll("\n", " ");
            modalMeta.textContent = item.date ? item.date : '';
            modalPerex.textContent = localizedField(item, 'perex');
            modalBody.innerHTML = localizedField(item, 'bodyHtml') || localizedField(item, 'bodyHtml_en') || '';
        }
    }

    // Re-render when language changes
    document.addEventListener('langchange', () => {
        render();
        refreshModalIfOpen();
    });

    render();
    bind();

})();