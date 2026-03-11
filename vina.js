// vina.js
(() => {
    "use strict";

    const UI_TEXT = {
        cs: {
            titleSmall: "Naše",
            titleBig: "vína",
            searchLabel: "Vyhledat víno",
            searchPlaceholder: "Název, profil, párování...",
            clear: "Vymazat",
            category: "Kategorie:",
            all: "Všechna",
            white: "Bílá",
            rose: "Růžová",
            red: "Červená",
            loading: "Načítám vína…",
            empty: "Žádná vína zatím nejsou k dispozici.",
            loadError: "Nepodařilo se načíst vína.",
            noResults: "Žádná vína neodpovídají zadanému hledání.",
            shown: (shown, total) => `Zobrazeno ${shown} z ${total} vín.`,
            shownQuery: (shown, total, q) => `Zobrazeno ${shown} z ${total} vín pro „${q}“.`,
            wineFallback: "Víno",
            wineType: "víno",
            specs: "Specifikace",
            shop: "Koupit v e-shopu",
            style: "Styl",
            grape: "Odrůda",
            vintage: "Ročník",
            classification: "Klasifikace",
            country: "Země původu",
            region: "Region",
            volume: "Objem",
            alcohol: "Alkohol",
        },
        en: {
            titleSmall: "Our",
            titleBig: "wines",
            searchLabel: "Search wines",
            searchPlaceholder: "Name, profile, pairing...",
            clear: "Clear",
            category: "Category:",
            all: "All",
            white: "White",
            rose: "Rosé",
            red: "Red",
            loading: "Loading wines…",
            empty: "No wines are available yet.",
            loadError: "Failed to load wines.",
            noResults: "No wines match your search.",
            shown: (shown, total) => `Showing ${shown} of ${total} wines.`,
            shownQuery: (shown, total, q) => `Showing ${shown} of ${total} wines for “${q}”.`,
            wineFallback: "Wine",
            wineType: "wine",
            specs: "Specifications",
            shop: "Buy in e-shop",
            style: "Style",
            grape: "Grape",
            vintage: "Vintage",
            classification: "Classification",
            country: "Country of origin",
            region: "Region",
            volume: "Volume",
            alcohol: "Alcohol",
        }
    };

    const getCurrentLang = () => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get("lang") || localStorage.getItem("lang") || document.documentElement.lang || "cs";
        return lang === "en" ? "en" : "cs";
    };

    let currentLang = getCurrentLang();

    const formatPrice = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return "";
        return currentLang === "en" ? `${Math.round(n)} CZK` : `${Math.round(n)} Kč`;
    };

    const escapeHtml = (value) => {
        const div = document.createElement("div");
        div.textContent = String(value ?? "");
        return div.innerHTML;
    };

    const normalizeText = (value) => String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const stylToCategory = (styl) => {
        const s = normalizeText(styl);
        if (s.includes("bile") || s.includes("white")) return "white";
        if (s.includes("ruzove") || s.includes("rose")) return "rose";
        if (s.includes("cervene") || s.includes("red")) return "red";
        return "other";
    };

    const getUi = () => UI_TEXT[currentLang] || UI_TEXT.cs;

    const getWineTitle = (wine) => {
        if (wine.name) return wine.name;
        const year = wine.rocnik ? ` ${wine.rocnik}` : "";
        return `${getUi().wineFallback}${year}`;
    };

    const buildMeta = (wine) => {
        const parts = [];
        if (wine.styl) parts.push(`${wine.styl} ${getUi().wineType}`);
        if (wine.zeme) parts.push(wine.zeme);
        if (wine.region) parts.push(wine.region);
        return parts.join(" • ");
    };

    const buildSpecs = (wine) => {
        const ui = getUi();
        const rows = [];
        if (wine.odruda) rows.push(`${ui.grape}: ${wine.odruda}`);
        if (wine.rocnik) rows.push(`${ui.vintage}: ${wine.rocnik}`);
        if (wine.certifikace && wine.certifikace !== "none") rows.push(`${ui.classification}: ${wine.certifikace}`);
        if (wine.styl) rows.push(`${ui.style}: ${wine.styl} ${ui.wineType}`);
        if (wine.zeme) rows.push(`${ui.country}: ${wine.zeme}`);
        if (wine.region) rows.push(`${ui.region}: ${wine.region}`);
        if (wine.objem) rows.push(`${ui.volume}: ${wine.objem}`);
        if (wine.alkohol) rows.push(`${ui.alcohol}: ${wine.alkohol}`);
        return rows;
    };

    document.addEventListener("DOMContentLoaded", () => {
        const slider = document.querySelector(".wine-presentation-slider[data-slider='presentation']");
        const slides = slider ? Array.from(slider.querySelectorAll(".presentation-slide")) : [];

        if (slider && slides.length > 1) {
            const shell = slider.closest(".presentation-shell");
            const prevBtn = shell?.querySelector(".presentation-arrow--prev");
            const nextBtn = shell?.querySelector(".presentation-arrow--next");
            const DURATION = 2000;
            const INTERVAL = 7000;
            let current = slides.findIndex((s) => s.classList.contains("is-active"));
            if (current < 0) current = 0;
            let isAnimating = false;
            let timer = null;

            const resetClasses = (el) => el.classList.remove("is-enter", "is-exit", "is-animating", "is-active");
            const goTo = (nextIndex) => {
                if (isAnimating || nextIndex === current) return;
                isAnimating = true;
                const currentEl = slides[current];
                const nextEl = slides[nextIndex];
                resetClasses(nextEl);
                nextEl.classList.add("is-enter");
                requestAnimationFrame(() => {
                    currentEl.classList.add("is-exit", "is-animating");
                    nextEl.classList.add("is-animating");
                    nextEl.classList.remove("is-enter");
                    nextEl.classList.add("is-active");
                });
                window.setTimeout(() => {
                    resetClasses(currentEl);
                    current = nextIndex;
                    isAnimating = false;
                }, DURATION);
            };
            const stopAuto = () => {
                if (timer) clearInterval(timer);
                timer = null;
            };
            const startAuto = () => {
                stopAuto();
                timer = setInterval(() => goTo((current + 1) % slides.length), INTERVAL);
            };
            nextBtn?.addEventListener("click", () => {
                goTo((current + 1) % slides.length);
                startAuto();
            });
            prevBtn?.addEventListener("click", () => {
                goTo((current - 1 + slides.length) % slides.length);
                startAuto();
            });
            slider.addEventListener("mouseenter", stopAuto);
            slider.addEventListener("mouseleave", startAuto);
            startAuto();
        }

        const titleSmallEl = document.querySelector("[data-vina-title-small]");
        const titleBigEl = document.querySelector("[data-vina-title-big]");
        const searchLabelEl = document.querySelector("[data-wine-search-label]");
        const searchInput = document.getElementById("wineSearch");
        const clearBtn = document.getElementById("wineSearchClear");
        const categoryLabelEl = document.querySelector("[data-wine-category-label]");
        const catalogEl = document.getElementById("vina-katalog");
        const catalogStatusEl = document.getElementById("wineCatalogStatus");
        const noResultsEl = document.getElementById("wineNoResults");
        const modal = document.getElementById("wineModal");
        const panel = modal ? modal.querySelector(".modal__panel") : null;
        const modalImage = document.getElementById("modalImage");
        const modalTitle = document.getElementById("modalTitle");
        const modalMeta = document.getElementById("modalMeta");
        const modalStory = document.getElementById("modalStory");
        const modalSpecs = document.getElementById("modalSpecs");
        const modalPairing = document.getElementById("modalPairing");
        const modalShopBtn = document.getElementById("wineShopBtn");
        const modalSpecsTitle = document.querySelector("[data-modal-specs-title]");
        const statusEl = document.getElementById("wineSearchStatus");
        const searchWrap = document.getElementById("wineSearchWrap");
        const searchToggle = document.getElementById("wineSearchToggle");
        const searchPanel = document.getElementById("wineSearchPanel");
        const filterButtons = Array.from(document.querySelectorAll(".wine-filter-btn[data-filter]"));

        const modalReady = !!(modal && panel && modalImage && modalTitle && modalMeta && modalStory && modalSpecs && modalPairing);

        let wines = [];
        let cardIndex = [];
        let activeCategoryFilter = "all";
        let currentIndex = 0;

        const applyStaticTranslations = () => {
            const ui = getUi();
            document.documentElement.lang = currentLang;
            if (titleSmallEl) titleSmallEl.textContent = ui.titleSmall;
            if (titleBigEl) titleBigEl.textContent = ui.titleBig;
            if (searchLabelEl) searchLabelEl.textContent = ui.searchLabel;
            if (searchInput) searchInput.placeholder = ui.searchPlaceholder;
            if (clearBtn) clearBtn.textContent = ui.clear;
            if (categoryLabelEl) categoryLabelEl.textContent = ui.category;
            if (noResultsEl) noResultsEl.textContent = ui.noResults;
            if (modalSpecsTitle) modalSpecsTitle.textContent = ui.specs;
            if (modalShopBtn) modalShopBtn.textContent = ui.shop;
            filterButtons.forEach((btn) => {
                btn.textContent = currentLang === "en" ? (btn.dataset.labelEn || btn.textContent) : (btn.dataset.labelCs || btn.textContent);
            });
        };

        const setCatalogStatus = (message = "", isVisible = false) => {
            if (!catalogStatusEl) return;
            catalogStatusEl.textContent = message;
            catalogStatusEl.hidden = !isVisible;
        };

        const renderCards = () => {
            if (!catalogEl) return;
            catalogEl.innerHTML = "";

            wines.forEach((wine, index) => {
                const card = document.createElement("article");
                const title = getWineTitle(wine);
                const cert = wine.certifikace && wine.certifikace !== "none" ? wine.certifikace : "";
                const price = formatPrice(wine.cena);
                const meta = [wine.rocnik, wine.styl, wine.zeme].filter(Boolean).join(" • ");
                const story = wine.text || "";
                const category = stylToCategory(wine.styl);
                const specs = buildSpecs(wine).join(" | ");

                card.className = "wine-card wine-card--catalog";
                card.dataset.wineId = String(wine.id);
                card.dataset.filterCat = category;
                card.dataset.shop = wine.odkaz || "";
                card.setAttribute("tabindex", "0");
                card.setAttribute("role", "button");
                card.setAttribute("aria-label", title);

                card.innerHTML = `
                    <div class="wine-media">
                        <img src="${escapeHtml(wine.image || "")}" alt="${escapeHtml(title)}">
                    </div>
                    <div class="wine-info">
                        <h3 class="wine-name typo-h3">${escapeHtml(title)}</h3>
                        <div class="wine-divider" aria-hidden="true"></div>
                        ${cert ? `<p class="wine-appellation typo-meta">${escapeHtml(cert)}</p>` : ""}
                        <p class="wine-price">${escapeHtml(price)}</p>
                        <span class="wine-meta sr-only">${escapeHtml(meta)}</span>
                        <span class="wine-story sr-only">${escapeHtml(story)}</span>
                        <span class="wine-notes sr-only">${escapeHtml(specs)}</span>
                    </div>
                `;

                card.addEventListener("click", () => openModalByIndex(index));
                card.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openModalByIndex(index);
                    }
                });

                catalogEl.appendChild(card);
            });

            cardIndex = Array.from(catalogEl.querySelectorAll(".wine-card[data-wine-id]")).map((card) => {
                const name = card.querySelector(".wine-name")?.textContent ?? "";
                const story = card.querySelector(".wine-story")?.textContent ?? "";
                const notes = card.querySelector(".wine-notes")?.textContent ?? "";
                const meta = card.querySelector(".wine-meta")?.textContent ?? "";
                card.setAttribute("data-orig-tabindex", card.getAttribute("tabindex") ?? "");
                return {
                    el: card,
                    haystack: normalizeText(`${name} ${story} ${notes} ${meta}`),
                    category: card.getAttribute("data-filter-cat") || "other"
                };
            });
        };

        const updateShopButton = (wine) => {
            if (!modalShopBtn) return;
            const shopUrl = String(wine?.odkaz ?? "").trim();
            modalShopBtn.textContent = getUi().shop;
            if (shopUrl) {
                modalShopBtn.href = shopUrl;
                modalShopBtn.hidden = false;
                modalShopBtn.setAttribute("aria-hidden", "false");
            } else {
                modalShopBtn.href = "#";
                modalShopBtn.hidden = true;
                modalShopBtn.setAttribute("aria-hidden", "true");
            }
        };

        const openModalByIndex = (index) => {
            if (!modalReady || index < 0 || index >= wines.length) return;
            const wine = wines[index];
            currentIndex = index;
            modal.classList.remove("is-closing");
            modalTitle.textContent = getWineTitle(wine);
            const priceText = formatPrice(wine.cena);
            const metaText = buildMeta(wine);
            modalMeta.textContent = priceText ? [metaText, priceText].filter(Boolean).join(" • ") : metaText;
            modalImage.src = wine.image || "";
            modalImage.alt = getWineTitle(wine);
            modalStory.textContent = wine.text || "";
            modalSpecs.innerHTML = buildSpecs(wine).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
            modalPairing.innerHTML = "";
            updateShopButton(wine);
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
        };

        const closeModal = () => {
            if (!modalReady || modal.classList.contains("is-closing")) return;
            modal.classList.add("is-closing");
            window.setTimeout(() => {
                modal.classList.remove("is-open", "is-closing");
                modal.setAttribute("aria-hidden", "true");
                document.body.classList.remove("modal-open");
                modalImage.src = "";
                if (modalShopBtn) modalShopBtn.href = "#";
            }, 250);
        };

        const switchToWine = (nextIndex, direction = "right") => {
            if (!modalReady || wines.length === 0) return;
            const cls = direction === "left" ? "is-switching-left" : "is-switching-right";
            panel.classList.remove("is-switching-left", "is-switching-right");
            panel.classList.add(cls);
            window.setTimeout(() => {
                openModalByIndex(nextIndex);
                panel.scrollTop = 0;
                requestAnimationFrame(() => panel.classList.remove(cls));
            }, 140);
        };

        const showNextWine = () => switchToWine((currentIndex + 1) % wines.length, "right");
        const showPrevWine = () => switchToWine((currentIndex - 1 + wines.length) % wines.length, "left");

        const setCardVisible = (cardEl, visible) => {
            if (visible) {
                cardEl.classList.remove("is-filtered-out");
                cardEl.setAttribute("aria-hidden", "false");
                const orig = cardEl.getAttribute("data-orig-tabindex");
                if (orig === "") cardEl.removeAttribute("tabindex");
                else cardEl.setAttribute("tabindex", orig);
            } else {
                cardEl.classList.add("is-filtered-out");
                cardEl.setAttribute("aria-hidden", "true");
                cardEl.setAttribute("tabindex", "-1");
            }
        };

        const updateUi = (shownCount, totalCount, queryRaw) => {
            const ui = getUi();
            if (statusEl) {
                const q = String(queryRaw ?? "").trim();
                statusEl.textContent = q ? ui.shownQuery(shownCount, totalCount, q) : ui.shown(shownCount, totalCount);
            }
            if (noResultsEl) noResultsEl.hidden = shownCount !== 0 || totalCount === 0;
            if (clearBtn) clearBtn.disabled = !String(queryRaw ?? "").trim();
        };

        const applyFilter = () => {
            const total = cardIndex.length;
            const queryRaw = searchInput?.value ?? "";
            const query = normalizeText(queryRaw);
            let shownCount = 0;
            for (const item of cardIndex) {
                const matchText = !query || item.haystack.includes(query);
                const matchCat = activeCategoryFilter === "all" || item.category === activeCategoryFilter;
                const match = matchText && matchCat;
                setCardVisible(item.el, match);
                if (match) shownCount++;
            }
            updateUi(shownCount, total, queryRaw);
        };

        const loadWines = async () => {
            if (!catalogEl) return;
            applyStaticTranslations();
            setCatalogStatus(getUi().loading, true);
            try {
                const res = await fetch(`api/wines.php?lang=${encodeURIComponent(currentLang)}`, {
                    headers: { "Accept": "application/json" }
                });
                const raw = await res.text();
                let json;
                try {
                    json = JSON.parse(raw);
                } catch (parseError) {
                    console.error("Failed to parse wines JSON", { status: res.status, body: raw });
                    throw parseError;
                }
                if (!res.ok || !json?.ok || !Array.isArray(json.items)) {
                    console.error("Wine API returned error", { status: res.status, json });
                    throw new Error("Wine API error");
                }
                wines = json.items;
                renderCards();
                applyFilter();
                setCatalogStatus(wines.length ? "" : getUi().empty, !wines.length);
            } catch (error) {
                console.error("Failed to load wines", error);
                wines = [];
                cardIndex = [];
                if (catalogEl) catalogEl.innerHTML = "";
                updateUi(0, 0, searchInput?.value ?? "");
                setCatalogStatus(getUi().loadError, true);
            }
        };

        if (searchToggle && searchPanel) {
            const openSearch = () => {
                searchPanel.hidden = false;
                searchToggle.setAttribute("aria-expanded", "true");
                searchWrap?.classList.add("is-open");
                window.setTimeout(() => searchInput?.focus(), 0);
            };
            const closeSearch = () => {
                searchPanel.hidden = true;
                searchToggle.setAttribute("aria-expanded", "false");
                searchWrap?.classList.remove("is-open");
            };
            searchToggle.addEventListener("click", () => {
                const isOpen = searchToggle.getAttribute("aria-expanded") === "true";
                if (isOpen) closeSearch(); else openSearch();
            });
            document.addEventListener("click", (e) => {
                if (!searchWrap || searchPanel.hidden) return;
                if (e.target instanceof Element && !searchWrap.contains(e.target)) closeSearch();
            });
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && !searchPanel.hidden) {
                    closeSearch();
                    searchToggle.focus();
                }
            });
        }

        if (filterButtons.length) {
            filterButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    activeCategoryFilter = btn.dataset.filter || "all";
                    filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
                    applyFilter();
                });
            });
        }

        searchInput?.addEventListener("input", applyFilter);
        clearBtn?.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            applyFilter();
            searchInput?.focus();
        });

        document.addEventListener("langchange", (event) => {
            const nextLang = event.detail?.lang === "en" ? "en" : "cs";
            if (nextLang === currentLang) return;
            currentLang = nextLang;
            loadWines();
        });

        if (modalReady) {
            modal.querySelectorAll("[data-close='true']").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    closeModal();
                });
            });
            modal.addEventListener("click", (e) => {
                if (!(e.target instanceof Element)) return;
                if (e.target.closest("[data-close='true']")) closeModal();
            });
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
            });
            modal.querySelector(".modal__nav--next")?.addEventListener("click", showNextWine);
            modal.querySelector(".modal__nav--prev")?.addEventListener("click", showPrevWine);
        }

        applyStaticTranslations();
        loadWines();
    });

    window.addEventListener("load", () => {
        document.querySelector(".vina-header")?.classList.add("is-visible");
        document.querySelector(".vina-content")?.classList.add("is-visible");
        document.querySelector(".wines")?.classList.add("is-visible");
    });
})();

