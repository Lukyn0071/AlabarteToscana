// `aktuality.js`
document.addEventListener("DOMContentLoaded", () => {
    /* ===== STICKY NAV ===== */
    const nav = document.getElementById("heroNav");
    if (nav) {
        window.addEventListener("scroll", () => {
            nav.classList.toggle("scrolled", window.scrollY > 40);
        });
    }

    /* ===== (OPTIONAL) LANGUAGE SYSTEM ===== */
    const TRANSLATIONS = {
        cs: {
            home: "Domů",
            vina: "Vína",
            aktuality: "Aktuality",
            eshop: "E-shop",
            aktuality_eyebrow: "Novinky",
            aktuality_title: "Aktuality",
            aktuality_lead: "Co je u nás nového: akce, nová vína a krátké zprávy z vinařství.",
            kontakt_title: "Kontakt",
        },
        en: {
            home: "Home",
            vina: "Wines",
            aktuality: "News",
            eshop: "Shop",
            aktuality_eyebrow: "Updates",
            aktuality_title: "News",
            aktuality_lead: "What’s new: events, new wines, and short updates from the winery.",
            kontakt_title: "Contact",
        },
    };

    function setLanguage(lang) {
        const dict = TRANSLATIONS[lang];
        if (!dict) return;

        document.querySelectorAll("[data-key]").forEach((el) => {
            const key = el.getAttribute("data-key");
            if (key && dict[key]) el.textContent = dict[key];
        });

        document.querySelectorAll(".lang-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.lang === lang);
        });

        document.documentElement.lang = lang;
        localStorage.setItem("lang", lang);
    }

    const savedLang = localStorage.getItem("lang") || "cs";
    setLanguage(savedLang);

    document.querySelectorAll(".lang-btn").forEach((btn) => {
        btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });

    /* ===== NEWS MODAL ===== */
    const modal = document.getElementById("newsModal");
    if (!modal) return;

    const imageEl = document.getElementById("newsModalImage");
    const titleEl = document.getElementById("newsModalTitle");
    const metaEl = document.getElementById("newsModalMeta");
    const perexEl = document.getElementById("newsModalPerex");
    const bodyEl = document.getElementById("newsModalBody");

    const setParagraphs = (root, text) => {
        if (!root) return;
        root.innerHTML = "";
        const raw = String(text || "");
        raw.split(/\n\s*\n/).forEach((chunk) => {
            const t = chunk.trim();
            if (!t) return;
            const p = document.createElement("p");
            p.textContent = t;
            root.appendChild(p);
        });
    };

    // vezme stejné `src` jako má náhled na kartě (včetně relativní cesty)
    const getPreviewImageSrc = (card) => {
        const img = card.querySelector(".news-item__media img");
        if (!img) return "";
        return img.getAttribute("src") || "";
    };

    const openModal = (card) => {
        const title = card.dataset.title || "";
        const date = card.dataset.date || "";
        const perex = card.dataset.perex || "";
        const body = card.dataset.body || "";

        const previewSrc = getPreviewImageSrc(card);
        const dataImage = card.dataset.image || "";
        const image = previewSrc || dataImage;

        if (titleEl) titleEl.textContent = title;
        if (metaEl) metaEl.textContent = date;
        if (perexEl) perexEl.textContent = perex;

        if (imageEl) {
            imageEl.src = image;
            imageEl.alt = title || "Aktualita";
            imageEl.style.display = image ? "" : "none";
        }

        setParagraphs(bodyEl, body);

        modal.classList.remove("is-closing");
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    const closeModal = () => {
        if (!modal.classList.contains("is-open")) return;

        modal.classList.add("is-closing");
        window.setTimeout(() => {
            modal.classList.remove("is-open", "is-closing");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
        }, 250);
    };

    /* Delegace kliků (odolné vůči úpravám DOMu) */
    document.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;

        if (target.closest("[data-close='true']")) {
            closeModal();
            return;
        }

        const card = target.closest(".news-item[data-news]");
        if (card) openModal(card);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();

        if (e.key === "Enter" || e.key === " ") {
            const active = document.activeElement;
            if (active instanceof Element && active.matches(".news-item[data-news]")) {
                e.preventDefault();
                openModal(active);
            }
        }
    });

    modal.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (t.classList.contains("modal__backdrop")) closeModal();
    });
});
