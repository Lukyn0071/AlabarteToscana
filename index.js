document.addEventListener("DOMContentLoaded", () => {

    /* ================= HERO BACKGROUND ROTATOR (diskphoto) ================= */
    const heroBg = document.querySelector(".hero-bg");

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Používáme URL-encoded názvy (mezery, závorky) – odpovídá tomu, co je v CSS.
    const heroPhotos = [
        // Odebráno: 'Images/diskphoto/La%20torre%20(10).jpg', // (první – "fialové zrno")
        'Images/diskphoto/DJI_0973.jpg',
        'Images/diskphoto/dji_fly_20230422_115722_10_1682166139791_pano%20(1).jpg',
        'Images/diskphoto/P1000081-HDR.jpg'
    ];

    let heroPhotoIndex = 0;

    function setHeroBg(url) {
        if (!heroBg) return;
        heroBg.style.setProperty('--hero-photo', `url("${url}")`);
        heroBg.style.setProperty('--hero-photo-next', `url("${url}")`);
        heroBg.style.setProperty('--hero-photo-blend', '0');
    }

    function rotateHeroBg() {
        if (!heroBg || heroPhotos.length < 2 || prefersReducedMotion) return;

        const next = heroPhotos[(heroPhotoIndex + 1) % heroPhotos.length];

        // preload další fotku, ať crossfade necukne
        const img = new Image();
        img.onload = () => {
            heroBg.style.setProperty('--hero-photo-next', `url("${next}")`);
            // další tick -> zapnout blend
            requestAnimationFrame(() => heroBg.style.setProperty('--hero-photo-blend', '1'));

            // po doběhnutí přechodu nastavíme next jako current
            window.setTimeout(() => {
                heroBg.style.setProperty('--hero-photo', `url("${next}")`);
                heroBg.style.setProperty('--hero-photo-blend', '0');
                heroPhotoIndex = (heroPhotoIndex + 1) % heroPhotos.length;
            }, 1300);
        };
        img.src = next;
    }

    if (heroBg) {
        // úvodní fotka
        setHeroBg(heroPhotos[0]);
        // rotace cca každých 7s (dost dlouho, ať je to luxusní)
        window.setInterval(rotateHeroBg, 7000);
    }

    /* ================= HERO WINES (Top 3 showcase) ================= */
    // Nová varianta: fixní 3-kusový "showcase" bez drag/scroll.
    // (záměrně bez JS animací, aby to působilo prémiově a stabilně)
    // Pokud by někdy přibylo víc lahví, dá se sem doplnit logika.

    /* ================= WINE CAROUSEL (manual) ================= */
    const wineViewport = document.querySelector('.wine-carousel__viewport');
    const wineTrack = document.querySelector('.wine-carousel__track');

    function setActiveWineCard() {
        if (!wineViewport || !wineTrack) return;
        const items = Array.from(wineTrack.querySelectorAll('.wine-carousel__item'));
        if (!items.length) return;

        const vpRect = wineViewport.getBoundingClientRect();
        const vpCenter = vpRect.left + vpRect.width / 2;

        let best = null;
        let bestDist = Infinity;

        for (const it of items) {
            const r = it.getBoundingClientRect();
            const c = r.left + r.width / 2;
            const d = Math.abs(c - vpCenter);
            if (d < bestDist) {
                bestDist = d;
                best = it;
            }
        }

        items.forEach(it => it.classList.toggle('is-active', it === best));
    }

    function getWineItemWidth() {
        if (!wineTrack) return 0;
        const item = wineTrack.querySelector('.wine-carousel__item');
        if (!item) return 0;
        const styles = window.getComputedStyle(wineTrack);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        return item.getBoundingClientRect().width + gap;
    }

    function scrollWineBy(dir) {
        if (!wineViewport) return;
        const delta = getWineItemWidth() || 240;
        wineViewport.scrollBy({ left: dir * delta, behavior: 'smooth' });
    }

    document.querySelectorAll('.wine-carousel__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.getAttribute('data-dir') === 'prev' ? -1 : 1;
            scrollWineBy(dir);
        });
    });

    if (wineViewport) {
        // klávesnice (←/→) když je viewport fokusovaný
        wineViewport.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollWineBy(-1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollWineBy(1);
            }
        });

        // při scrollu zvýrazni kartu nejblíž středu
        let wineTick = false;
        const onWineScroll = () => {
            if (wineTick) return;
            wineTick = true;
            requestAnimationFrame(() => {
                setActiveWineCard();
                wineTick = false;
            });
        };

        wineViewport.addEventListener('scroll', onWineScroll, { passive: true });
        window.addEventListener('resize', () => requestAnimationFrame(setActiveWineCard));

        // inicializace
        requestAnimationFrame(setActiveWineCard);
    }

    /* ================= STICKY NAV ================= */
    const nav = document.querySelector('.hero-nav');

    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
        });
    }

    /* ================= SCROLL CROSSFADE (hero background) ================= */
    const heroBgScroll = document.querySelector(".hero-bg");

    function clamp01(v) {
        return Math.max(0, Math.min(1, v));
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const range = 520; // kolik px scrollu = plné prolnutí
            const t = clamp01(window.scrollY / range);

            if (heroBgScroll) heroBgScroll.style.setProperty("--blend", t);

            ticking = false;
        });
    });

    /* ================= LANGUAGE SYSTEM ================= */
    // DB-driven on server side. Here we only store selection and highlight active button.
    const params = new URLSearchParams(window.location.search);
    const currentLang = params.get('lang') || localStorage.getItem('lang') || document.documentElement.lang || 'cs';

    document.querySelectorAll('.lang-btn').forEach(btn => {
        const href = btn.getAttribute('href') || '';
        const url = href ? new URL(href, window.location.href) : null;
        const lang = btn.dataset.lang || (url ? (url.searchParams.get('lang') || '') : '');

        if (lang === currentLang) btn.classList.add('active');

        btn.addEventListener('click', () => {
            try {
                localStorage.setItem('lang', lang);
                document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
            } catch (err) {}

            // Notify listeners (admin preview etc.)
            try {
                document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
            } catch (err2) {
                const ev = document.createEvent('CustomEvent');
                ev.initCustomEvent('langchange', true, true, { lang });
                document.dispatchEvent(ev);
            }

            // update active state immediately
            document.querySelectorAll('.lang-btn').forEach(b => {
                const bhref = b.getAttribute('href') || '';
                const burl = bhref ? new URL(bhref, window.location.href) : null;
                const bland = b.dataset.lang || (burl ? (burl.searchParams.get('lang') || '') : '');
                b.classList.toggle('active', bland === lang);
            });
        });
    });

    /* ================= REVEAL (O NÁS) ================= */
    const revealEls = document.querySelectorAll(".js-reveal");

    if (revealEls.length) {
        const io = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target); // spustí se jen jednou
                });
            },
            {
                threshold: 0.25,          // kolik prvku musí být vidět
                rootMargin: "0px 0px -10% 0px" // spustí o chlup dřív než dojede úplně dolů
            }
        );

        revealEls.forEach((el) => io.observe(el));

        /* ================= REVEAL (VINAŘSTVÍ) – odděleně ================= */
        const wineryRevealEls = document.querySelectorAll(".js-reveal-winery");

        if (wineryRevealEls.length) {
            const ioWinery = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;

                        entry.target.classList.add("is-visible-winery");
                        observer.unobserve(entry.target);
                    });
                },
                {
                    threshold: 0.25,
                    rootMargin: "0px 0px -10% 0px"
                }
            );

            wineryRevealEls.forEach((el) => ioWinery.observe(el));
        }
    }
    /* ================= SCROLL HINT – schovat po prvním scrollu ================= */
    /* ================= SCROLL HINT – schovat po prvním scrollu ================= */
    const scrollHint = document.querySelector(".scroll-hint");

    if (scrollHint) {
        // pokud už uživatel scrolloval (v rámci session), nech to schované i po refreshi
        if (sessionStorage.getItem("scrollHintHidden") === "1") {
            scrollHint.classList.add("is-hidden");
        } else {
            const hideScrollHint = () => {
                scrollHint.classList.add("is-hidden");
                sessionStorage.setItem("scrollHintHidden", "1");
            };

            // schovej až při skutečném pohybu (někdy se vyvolá scroll event i bez posunu)
            const onFirstScroll = () => {
                if (window.scrollY > 5) hideScrollHint();
            };

            window.addEventListener("scroll", onFirstScroll, { passive: true });
        }
    }
});

