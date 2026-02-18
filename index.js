import { initDragDrop } from "./dragdrop.js";

document.addEventListener("DOMContentLoaded", () => {

    /* ================= SLIDESHOW ================= */
    const images = document.querySelectorAll('.image-slide');
    const texts = document.querySelectorAll('.text-slide');
    let index = 0;
    const total = images.length;

    function updateSlides() {
        if (total <= 0) return;

        images.forEach((img, i) => {
            img.className = 'image-slide';
            if (i === index) img.classList.add('active');
            else if (i === (index + 1) % total) img.classList.add('next');
            else if (i === (index - 1 + total) % total) img.classList.add('prev');
        });

        texts.forEach((txt, i) => {
            txt.className = 'text-slide';
            if (i === index) txt.classList.add('active');
            else txt.classList.add('out');
        });
    }

    if (total > 0) {
        setInterval(() => {
            index = (index + 1) % total;
            updateSlides();
        }, 3000);
    }
    initDragDrop(".your-container", ".draggable");

    /* ================= STICKY NAV ================= */
    const nav = document.getElementById('heroNav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* ================= SCROLL CROSSFADE (hero background) ================= */
    const heroBg = document.querySelector(".hero-bg");

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

            if (heroBg) heroBg.style.setProperty("--blend", t);

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

        btn.addEventListener('click', (e) => {
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