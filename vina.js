// vina.js
(() => {
    "use strict";

    const UI_TEXT = {
        cs: {
            titleSmall: "Naše",
            titleBig: "vína",
            searchLabel: "Vyhledat víno",
            searchPlaceholder: "Název vína...",
            clear: "Vymazat",
            certification: "Certifikace:",
            styleLabel: "Styl:",
            price: "Cena:",
            priceFrom: "Od",
            priceTo: "Do",
            loading: "Načítám vína…",
            empty: "Žádná vína zatím nejsou k dispozici.",
            loadError: "Nepodařilo se načíst vína.",
            noResults: "Žádná vína neodpovídají zadanému hledání.",
            shown: (shown, total) => `Zobrazeno ${shown} z ${total} vín.`,
            shownQuery: (shown, total, q) => `Zobrazeno ${shown} z ${total} vín pro „${q}“.`,
            priceRange: (min, max) => `Cenové rozmezí: ${min} Kč – ${max} Kč`,
            noCertification: "Bez certifikace",
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
            searchPlaceholder: "Wine name...",
            clear: "Clear",
            certification: "Certification:",
            styleLabel: "Style:",
            price: "Price:",
            priceFrom: "From",
            priceTo: "To",
            loading: "Loading wines…",
            empty: "No wines are available yet.",
            loadError: "Failed to load wines.",
            noResults: "No wines match your search.",
            shown: (shown, total) => `Showing ${shown} of ${total} wines.`,
            shownQuery: (shown, total, q) => `Showing ${shown} of ${total} wines for “${q}”.`,
            priceRange: (min, max) => `Price range: ${min} CZK – ${max} CZK`,
            noCertification: "No certification",
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

    const getUi = () => UI_TEXT[currentLang] || UI_TEXT.cs;

    const getWineTitle = (wine) => {
        if (wine.name) return wine.name;
        const year = wine.rocnik ? ` ${wine.rocnik}` : "";
        return `${getUi().wineFallback}${year}`;
    };

    const getCertificationValue = (wine) => String(wine.certifikace || "none");
    const getStyleValue = (wine) => String(wine.styl || "");

    const getCertificationLabel = (value) => {
        if (!value || value === "none") return getUi().noCertification;
        return value;
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
        /* =========================================================
           1) PREZENTAČNÍ SLIDER – stejně jako na indexu
           ========================================================= */
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

            const resetClasses = (el) => {
                el.classList.remove("is-enter", "is-exit", "is-animating", "is-active");
            };

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

            const goNext = (fromAuto = false) => {
                goTo((current + 1) % slides.length);
                if (!fromAuto) startAuto();
            };

            const goPrev = () => {
                goTo((current - 1 + slides.length) % slides.length);
                startAuto();
            };

            const stopAuto = () => {
                if (timer) clearInterval(timer);
                timer = null;
            };

            const startAuto = () => {
                stopAuto();
                timer = window.setInterval(() => goNext(true), INTERVAL);
            };

            nextBtn?.addEventListener("click", () => goNext(false));
            prevBtn?.addEventListener("click", goPrev);

            slider.addEventListener("mouseenter", stopAuto);
            slider.addEventListener("mouseleave", startAuto);

            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            const SWIPE_THRESHOLD = 50;
            const SWIPE_RESTRAINT_Y = 80;

            slider.addEventListener("touchstart", (e) => {
                const touch = e.changedTouches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchEndX = touch.clientX;
                touchEndY = touch.clientY;
            }, { passive: true });

            slider.addEventListener("touchmove", (e) => {
                const touch = e.changedTouches[0];
                touchEndX = touch.clientX;
                touchEndY = touch.clientY;
            }, { passive: true });

            slider.addEventListener("touchend", () => {
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;

                if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffY) < SWIPE_RESTRAINT_Y) {
                    if (diffX < 0) goNext(false);
                    else goPrev();
                }
            }, { passive: true });

            startAuto();
        }

        /* =========================================================
           2) PREZENTAČNÍ MODAL PRO OBRÁZKY SLIDERU
           ========================================================= */
        const presentationModal = document.getElementById("presentationModal");
        const presentationModalImage = document.getElementById("presentationModalImage");
        const presentationZoomButtons = document.querySelectorAll(".presentation-zoom");

        let lastPresentationTrigger = null;

        const openPresentationModal = (imgEl, triggerEl = null) => {
            if (!presentationModal || !presentationModalImage || !imgEl) return;

            const source = imgEl.currentSrc || imgEl.src;
            const alt = imgEl.getAttribute("alt") || "";

            presentationModalImage.src = source;
            presentationModalImage.alt = alt;

            presentationModal.classList.add("is-open");
            presentationModal.setAttribute("aria-hidden", "false");
            document.body.classList.add("presentation-modal-open");

            lastPresentationTrigger = triggerEl;
        };

        const closePresentationModal = () => {
            if (!presentationModal || !presentationModalImage) return;

            presentationModal.classList.remove("is-open");
            presentationModal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("presentation-modal-open");

            presentationModalImage.src = "";
            presentationModalImage.alt = "";

            if (lastPresentationTrigger) {
                lastPresentationTrigger.focus();
            }
        };

        presentationZoomButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const img = btn.querySelector("img");
                openPresentationModal(img, btn);
            });
        });

        presentationModal?.addEventListener("click", (e) => {
            if (!(e.target instanceof Element)) return;
            const closeTarget = e.target.closest("[data-close-presentation='true']");
            if (closeTarget) {
                closePresentationModal();
            }
        });

        /* =========================================================
           3) KATALOG VÍN
           ========================================================= */
        const titleSmallEl = document.querySelector("[data-vina-title-small]");
        const titleBigEl = document.querySelector("[data-vina-title-big]");
        const searchLabelEl = document.querySelector("[data-wine-search-label]");
        const searchInput = document.getElementById("wineSearch");
        const clearBtn = document.getElementById("wineSearchClear");
        const certificationLabelEl = document.querySelector("[data-wine-certification-label]");
        const styleLabelEl = document.querySelector("[data-wine-style-label]");
        const priceLabelEl = document.querySelector("[data-wine-price-label]");
        const priceMinLabelEl = document.querySelector("[data-wine-price-min-label]");
        const priceMaxLabelEl = document.querySelector("[data-wine-price-max-label]");
        const certificationFiltersEl = document.getElementById("wineCertificationFilters");
        const styleFiltersEl = document.getElementById("wineStyleFilters");
        const priceMinInput = document.getElementById("winePriceMin");
        const priceMaxInput = document.getElementById("winePriceMax");
        const priceStatusEl = document.getElementById("winePriceStatus");
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
        const priceRangeFillEl = document.getElementById("winePriceRangeFill");

        const modalReady = !!(modal && panel && modalImage && modalTitle && modalMeta && modalStory && modalSpecs);

        let wines = [];
        let cardIndex = [];
        let currentIndex = 0;
        let selectedCertifications = new Set();
        let selectedStyles = new Set();
        let priceBounds = { min: 0, max: 0, selectedMin: 0, selectedMax: 0 };
        let lastFocusedCard = null;
        let isModalSwitching = false;

        const applyStaticTranslations = () => {
            const ui = getUi();

            document.documentElement.lang = currentLang;

            if (titleSmallEl) titleSmallEl.textContent = ui.titleSmall;
            if (titleBigEl) titleBigEl.textContent = ui.titleBig;
            if (searchLabelEl) searchLabelEl.textContent = ui.searchLabel;
            if (searchInput) searchInput.placeholder = ui.searchPlaceholder;
            if (clearBtn) clearBtn.textContent = ui.clear;
            if (certificationLabelEl) certificationLabelEl.textContent = ui.certification;
            if (styleLabelEl) styleLabelEl.textContent = ui.styleLabel;
            if (priceLabelEl) priceLabelEl.textContent = ui.price;
            if (priceMinLabelEl) priceMinLabelEl.textContent = ui.priceFrom;
            if (priceMaxLabelEl) priceMaxLabelEl.textContent = ui.priceTo;
            if (noResultsEl) noResultsEl.textContent = ui.noResults;
            if (modalSpecsTitle) modalSpecsTitle.textContent = ui.specs;
            if (modalShopBtn) modalShopBtn.textContent = ui.shop;

            renderCheckboxFilters();
            updatePriceStatus();
        };

        const setCatalogStatus = (message = "", isVisible = false) => {
            if (!catalogStatusEl) return;
            catalogStatusEl.textContent = message;
            catalogStatusEl.hidden = !isVisible;
        };

        const renderCheckboxGroup = (mountEl, values, selectedSet, groupName, labelResolver) => {
            if (!mountEl) return;

            mountEl.innerHTML = "";

            values.forEach((value) => {
                const label = document.createElement("label");
                label.className = "wine-checkbox";

                const input = document.createElement("input");
                input.type = "checkbox";
                input.name = groupName;
                input.value = value;
                input.checked = selectedSet.has(value);

                input.addEventListener("change", () => {
                    if (input.checked) selectedSet.add(value);
                    else selectedSet.delete(value);
                    applyFilter();
                });

                const text = document.createElement("span");
                text.textContent = labelResolver(value);

                label.appendChild(input);
                label.appendChild(text);
                mountEl.appendChild(label);
            });
        };

        const renderCheckboxFilters = () => {
            const certificationValues = [...new Set(wines.map(getCertificationValue))].sort();
            const styleValues = [...new Set(wines.map(getStyleValue).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b, currentLang));

            renderCheckboxGroup(
                certificationFiltersEl,
                certificationValues,
                selectedCertifications,
                "wineCertification",
                getCertificationLabel
            );

            renderCheckboxGroup(
                styleFiltersEl,
                styleValues,
                selectedStyles,
                "wineStyle",
                (value) => value
            );
        };

        const syncPriceInputs = () => {
            if (!priceMinInput || !priceMaxInput) return;

            priceMinInput.min = String(priceBounds.min);
            priceMinInput.max = String(priceBounds.max);
            priceMaxInput.min = String(priceBounds.min);
            priceMaxInput.max = String(priceBounds.max);

            priceMinInput.value = String(priceBounds.selectedMin);
            priceMaxInput.value = String(priceBounds.selectedMax);

            const span = Math.max(1, priceBounds.max - priceBounds.min);
            const startPct = ((priceBounds.selectedMin - priceBounds.min) / span) * 100;
            const endPct = ((priceBounds.selectedMax - priceBounds.min) / span) * 100;

            if (priceRangeFillEl) {
                priceRangeFillEl.style.left = `${startPct}%`;
                priceRangeFillEl.style.right = `${100 - endPct}%`;
            }
        };

        const updatePriceStatus = () => {
            if (!priceStatusEl) return;
            priceStatusEl.textContent = getUi().priceRange(priceBounds.selectedMin, priceBounds.selectedMax);
        };

        const initPriceBounds = () => {
            const prices = wines
                .map((wine) => Number(wine.cena))
                .filter((price) => Number.isFinite(price));

            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;

            priceBounds = {
                min,
                max,
                selectedMin: min,
                selectedMax: max
            };

            syncPriceInputs();
            updatePriceStatus();
        };

        const renderCards = () => {
            if (!catalogEl) return;

            catalogEl.innerHTML = "";

            wines.forEach((wine, index) => {
                const card = document.createElement("article");
                const title = getWineTitle(wine);
                const cert = wine.certifikace && wine.certifikace !== "none"
                    ? wine.certifikace
                    : getCertificationLabel("none");
                const price = formatPrice(wine.cena);
                const meta = [wine.rocnik, wine.styl, wine.zeme].filter(Boolean).join(" • ");

                card.className = "wine-card wine-card--catalog";
                card.dataset.wineId = String(wine.id ?? index);
                card.dataset.origTabindex = "0";
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
                        <p class="wine-appellation typo-meta">${escapeHtml(cert)}</p>
                        <p class="wine-price">${escapeHtml(price)}</p>
                        <span class="wine-meta sr-only">${escapeHtml(meta)}</span>
                    </div>
                `;

                card.addEventListener("click", () => {
                    lastFocusedCard = card;
                    openModalByIndex(index);
                });

                card.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        lastFocusedCard = card;
                        openModalByIndex(index);
                    }
                });

                catalogEl.appendChild(card);
            });

            cardIndex = Array.from(catalogEl.querySelectorAll(".wine-card[data-wine-id]"))
                .map((card, index) => ({
                    el: card,
                    wine: wines[index],
                    name: normalizeText(getWineTitle(wines[index]))
                }));
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

        const fillModalContent = (wine) => {
            modalTitle.textContent = getWineTitle(wine);

            const priceText = formatPrice(wine.cena);
            const metaText = buildMeta(wine);
            modalMeta.textContent = priceText
                ? [metaText, priceText].filter(Boolean).join(" • ")
                : metaText;

            modalImage.src = wine.image || "";
            modalImage.alt = getWineTitle(wine);
            modalStory.textContent = wine.text || "";
            modalSpecs.innerHTML = buildSpecs(wine)
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("");

            if (modalPairing) {
                modalPairing.innerHTML = "";
            }

            updateShopButton(wine);
        };

        const openModalByIndex = (index) => {
            if (!modalReady || index < 0 || index >= wines.length) return;

            const wine = wines[index];
            currentIndex = index;

            modal.classList.remove("is-closing");
            fillModalContent(wine);
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
                modalImage.alt = "";

                if (modalShopBtn) {
                    modalShopBtn.href = "#";
                }

                if (lastFocusedCard instanceof HTMLElement) {
                    lastFocusedCard.focus();
                }
            }, 250);
        };

        const switchToWine = (nextIndex, direction = "right") => {
            if (!modalReady || wines.length === 0 || isModalSwitching) return;

            isModalSwitching = true;

            const cls = direction === "left" ? "is-switching-left" : "is-switching-right";
            panel.classList.remove("is-switching-left", "is-switching-right");
            panel.classList.add(cls);

            window.setTimeout(() => {
                currentIndex = nextIndex;
                fillModalContent(wines[nextIndex]);
                panel.scrollTop = 0;

                requestAnimationFrame(() => {
                    panel.classList.remove(cls);
                    isModalSwitching = false;
                });
            }, 140);
        };

        const showNextWine = () => {
            if (!wines.length) return;
            switchToWine((currentIndex + 1) % wines.length, "right");
        };

        const showPrevWine = () => {
            if (!wines.length) return;
            switchToWine((currentIndex - 1 + wines.length) % wines.length, "left");
        };

        const setCardVisible = (cardEl, visible) => {
            if (visible) {
                cardEl.classList.remove("is-filtered-out");
                cardEl.setAttribute("aria-hidden", "false");

                const orig = cardEl.dataset.origTabindex;
                if (orig === "" || orig == null) cardEl.removeAttribute("tabindex");
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
                statusEl.textContent = q
                    ? ui.shownQuery(shownCount, totalCount, q)
                    : ui.shown(shownCount, totalCount);
            }

            if (noResultsEl) {
                noResultsEl.hidden = shownCount !== 0 || totalCount === 0;
            }

            if (clearBtn) {
                clearBtn.disabled =
                    !String(queryRaw ?? "").trim() &&
                    selectedCertifications.size === 0 &&
                    selectedStyles.size === 0 &&
                    priceBounds.selectedMin === priceBounds.min &&
                    priceBounds.selectedMax === priceBounds.max;
            }
        };

        const applyFilter = () => {
            const total = cardIndex.length;
            const queryRaw = searchInput?.value ?? "";
            const query = normalizeText(queryRaw);
            let shownCount = 0;

            for (const item of cardIndex) {
                const wine = item.wine;
                const cert = getCertificationValue(wine);
                const style = getStyleValue(wine);
                const price = Number(wine.cena) || 0;

                const matchText = !query || item.name.includes(query);
                const matchCertification = selectedCertifications.size === 0 || selectedCertifications.has(cert);
                const matchStyle = selectedStyles.size === 0 || selectedStyles.has(style);
                const matchPrice = price >= priceBounds.selectedMin && price <= priceBounds.selectedMax;

                const match = matchText && matchCertification && matchStyle && matchPrice;

                setCardVisible(item.el, match);
                if (match) shownCount++;
            }

            updateUi(shownCount, total, queryRaw);
            updatePriceStatus();
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
                selectedCertifications = new Set();
                selectedStyles = new Set();

                renderCards();
                renderCheckboxFilters();
                initPriceBounds();
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

        /* =========================================================
           4) SEARCH PANEL
           ========================================================= */
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
                if (isOpen) closeSearch();
                else openSearch();
            });

            document.addEventListener("click", (e) => {
                if (!searchWrap || searchPanel.hidden) return;
                if (e.target instanceof Element && !searchWrap.contains(e.target)) {
                    closeSearch();
                }
            });

            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && !searchPanel.hidden) {
                    closeSearch();
                    searchToggle.focus();
                }
            });
        }

        searchInput?.addEventListener("input", applyFilter);

        clearBtn?.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";

            selectedCertifications = new Set();
            selectedStyles = new Set();

            renderCheckboxFilters();

            priceBounds.selectedMin = priceBounds.min;
            priceBounds.selectedMax = priceBounds.max;

            syncPriceInputs();
            applyFilter();
            searchInput?.focus();
        });

        priceMinInput?.addEventListener("input", () => {
            const nextValue = Number(priceMinInput.value);
            priceBounds.selectedMin = Math.min(nextValue, priceBounds.selectedMax);
            syncPriceInputs();
            applyFilter();
        });

        priceMaxInput?.addEventListener("input", () => {
            const nextValue = Number(priceMaxInput.value);
            priceBounds.selectedMax = Math.max(nextValue, priceBounds.selectedMin);
            syncPriceInputs();
            applyFilter();
        });

        document.addEventListener("langchange", (event) => {
            const nextLang = event.detail?.lang === "en" ? "en" : "cs";
            if (nextLang === currentLang) return;

            currentLang = nextLang;
            loadWines();
        });

        /* =========================================================
           5) MODAL KATALOGU
           ========================================================= */
        if (modalReady) {
            modal.querySelectorAll("[data-close='true']").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    closeModal();
                });
            });

            modal.addEventListener("click", (e) => {
                if (!(e.target instanceof Element)) return;
                if (e.target.closest("[data-close='true']")) {
                    closeModal();
                }
            });

            modal.querySelector(".modal__nav--next")?.addEventListener("click", showNextWine);
            modal.querySelector(".modal__nav--prev")?.addEventListener("click", showPrevWine);

            let modalTouchStartX = 0;
            let modalTouchStartY = 0;
            let modalTouchEndX = 0;
            let modalTouchEndY = 0;

            const MODAL_SWIPE_THRESHOLD = 50;
            const MODAL_SWIPE_RESTRAINT_Y = 80;

            panel.addEventListener("touchstart", (e) => {
                const touch = e.changedTouches[0];
                modalTouchStartX = touch.clientX;
                modalTouchStartY = touch.clientY;
                modalTouchEndX = touch.clientX;
                modalTouchEndY = touch.clientY;
            }, { passive: true });

            panel.addEventListener("touchmove", (e) => {
                const touch = e.changedTouches[0];
                modalTouchEndX = touch.clientX;
                modalTouchEndY = touch.clientY;
            }, { passive: true });

            panel.addEventListener("touchend", () => {
                const diffX = modalTouchEndX - modalTouchStartX;
                const diffY = modalTouchEndY - modalTouchStartY;

                if (Math.abs(diffX) > MODAL_SWIPE_THRESHOLD && Math.abs(diffY) < MODAL_SWIPE_RESTRAINT_Y) {
                    if (diffX < 0) showNextWine();
                    else showPrevWine();
                }
            }, { passive: true });
        }

        /* =========================================================
           6) GLOBÁLNÍ ESC
           ========================================================= */
        window.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;

            if (presentationModal?.classList.contains("is-open")) {
                closePresentationModal();
                return;
            }

            if (modal?.classList.contains("is-open")) {
                closeModal();
            }
        });

        applyStaticTranslations();
        loadWines();
    });

    window.addEventListener("load", () => {
        document.querySelector(".vina-header")?.classList.add("is-visible");
        document.querySelector(".vina-content")?.classList.add("is-visible");
        document.querySelector(".wines")?.classList.add("is-visible");
    });
})();