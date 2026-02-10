document.addEventListener("DOMContentLoaded", () => {

    /* ================= SLIDESHOW ================= */
    const images = document.querySelectorAll('.image-slide');
    const texts = document.querySelectorAll('.text-slide');
    let index = 0;
    const total = images.length;

    function updateSlides() {
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

    setInterval(() => {
        index = (index + 1) % total;
        updateSlides();
    }, 3000);

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
    const TRANSLATIONS = {
        cs: {
            hero_title: "ALABARTE",
            kontakt: "Kontakt",
            vina: "Vína",
            aktuality: "Aktuality",
            eshop: "E-shop",
            read: "Přečíst",
            detail_label: "Detail",

            text1_h2: "Vernaccia di San Gimignano",
            text1_p: "Svěží bílé víno s minerálním charakterem, jemnými citrusovými tóny a typickou elegancí toskánské krajiny.",

            text2_h2: "Rosso Toscana",
            text2_p: "Vyvážené červené víno s tóny zralého ovoce a jemného koření, které spojuje tradici Toskánska s moderním projevem.",

            text3_h2: "Sangiovese z Toskánska",
            text3_p: "Charakteristické červené víno s jemnými tříslovinami, ovocným profilem a dlouhým, harmonickým závěrem.",

            about_eyebrow: "O nás",
            about_title: "Alabarte – Toskánsko v každé lahvi",
            about_p1: "Jsme česká firma, která dováží pečlivě vybraná vína z Toskánska do České republiky. Zaměřujeme se na charakter, čistotu a příběh každé lahve – od vinice až po váš stůl.",
            about_p2: "Spolupracujeme s vinařstvím Fattoria La Torre a přinášíme vína, která vynikají elegancí, typickým projevem regionu a poctivou prací ve vinici.",

            winery_eyebrow: "Vinařství",
            winery_title: "Fattoria La Torre",
            winery_p1: "Rodinné vinařství v srdci Toskánska, kde se potkává tradice s moderním přístupem. Důraz je kladen na práci ve vinici, šetrné zpracování a styl vín, který je věrný místu původu.",
            winery_li1: "Typický projev Toskánska a odrůd jako Sangiovese či Vernaccia",
            winery_li2: "Důraz na čistotu, eleganci a vyváženost",
            winery_li3: "Vína vhodná k jídlu i k samostatnému vychutnání",
            winery_p2: "Hrozny se sbírají ve správný okamžik a zpracovávají šetrně, aby v lahvi zůstala čistota, elegance a opravdový „sense of place“. Výsledkem jsou vína, která skvěle fungují u stolu — od svěžích bílých po strukturovaná červená.",
        },

        en: {
            hero_title: "ALABARTE",
            kontakt: "Contact",
            vina: "Wines",
            aktuality: "News",
            eshop: "Shop",
            read: "Read",
            detail_label: "Detail",

            text1_h2: "Vernaccia di San Gimignano",
            text1_p: "Fresh white wine with a mineral character, gentle citrus notes, and the signature elegance of Tuscany.",

            text2_h2: "Rosso Toscana",
            text2_p: "Balanced red wine with ripe fruit and subtle spice, blending Tuscan tradition with a modern expression.",

            text3_h2: "Sangiovese from Tuscany",
            text3_p: "A distinctive red with smooth tannins, a fruity profile, and a long, harmonious finish.",

            about_eyebrow: "About",
            about_title: "Alabarte – Tuscany in every bottle",
            about_p1: "We are a Czech company bringing carefully selected Tuscan wines to the Czech Republic. We focus on character, purity, and the story behind each bottle—from vineyard to table.",
            about_p2: "We work with Fattoria La Torre, offering wines defined by elegance, a true sense of place, and honest vineyard craft.",

            winery_eyebrow: "Winery",
            winery_title: "Fattoria La Torre",
            winery_p1: "A family winery in the heart of Tuscany where tradition meets a modern approach. The focus is on vineyard work, gentle processing, and a style that stays true to its origin.",
            winery_li1: "A true Tuscan expression of varieties like Sangiovese and Vernaccia",
            winery_li2: "Focus on purity, elegance, and balance",
            winery_li3: "Wines made for food and for pure enjoyment",
            winery_p2: "Grapes are picked at the right moment and handled gently to preserve purity, elegance, and a true sense of place. The result is food-friendly wines—from vibrant whites to structured reds.",
        }
    };

    function setLanguage(lang) {
        const dict = TRANSLATIONS[lang];
        if (!dict) return;

        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        document.documentElement.lang = lang;
        localStorage.setItem('lang', lang);
        // notify other scripts (e.g. aktuality.js) that language changed
        try {
            document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
        } catch (e) {
            // older browsers fallback
            const ev = document.createEvent('CustomEvent');
            ev.initCustomEvent('langchange', true, true, { lang });
            document.dispatchEvent(ev);
        }
    }

    // init jazyk
    const savedLang = localStorage.getItem('lang') || 'cs';
    setLanguage(savedLang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
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
});