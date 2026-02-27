// vina.js
(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        /* =========================================================
           1) PREZENTAČNÍ SLIDER – čisté třídy, bez inline stylů
           ========================================================= */
        const slider = document.querySelector(".wine-presentation-slider[data-slider='presentation']");
        const slides = slider ? Array.from(slider.querySelectorAll(".presentation-slide")) : [];

        if (slider && slides.length > 1) {
            const shell = slider.closest(".presentation-shell");
            const prevBtn = shell?.querySelector(".presentation-arrow--prev");
            const nextBtn = shell?.querySelector(".presentation-arrow--next");

            const DURATION = 2000;
            const INTERVAL = 7000;

            let current = slides.findIndex(s => s.classList.contains("is-active"));
            if (current < 0) current = 0;

            let isAnimating = false;
            let timer = null;

            const resetClasses = (el) => {
                el.classList.remove(
                    "is-enter",
                    "is-exit",
                    "is-animating",
                    "is-active"
                );
            };

            const goTo = (nextIndex, direction = "right") => {
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

                setTimeout(() => {
                    resetClasses(currentEl);
                    current = nextIndex;
                    isAnimating = false;
                }, DURATION);
            };

            const goNext = (fromAuto = false) => {
                goTo((current + 1) % slides.length, "right");
                if (!fromAuto) startAuto();
            };

            const goPrev = () => {
                goTo((current - 1 + slides.length) % slides.length, "left");
                startAuto();
            };

            const stopAuto = () => {
                if (timer) clearInterval(timer);
                timer = null;
            };

            const startAuto = () => {
                stopAuto();
                timer = setInterval(() => goNext(true), INTERVAL);
            };

            nextBtn?.addEventListener("click", () => goNext(false));
            prevBtn?.addEventListener("click", goPrev);

            slider.addEventListener("mouseenter", stopAuto);
            slider.addEventListener("mouseleave", startAuto);

            startAuto();
        }

        /* =========================================================
           2) MODAL – detail vína + šipky v modalu
           ========================================================= */
        const modal = document.getElementById("wineModal");
        const panel = modal ? modal.querySelector(".modal__panel") : null;

        const modalImage = document.getElementById("modalImage");
        const modalTitle = document.getElementById("modalTitle");
        const modalMeta  = document.getElementById("modalMeta");
        const modalStory = document.getElementById("modalStory");
        const modalSpecs = document.getElementById("modalSpecs");
        const modalPairing = document.getElementById("modalPairing");

        // Pokud modal markup chybí, nebudeme nic lámat
        const modalReady = !!(modal && panel && modalImage && modalTitle && modalMeta && modalStory && modalSpecs && modalPairing);

        const WINES = {
            vermentino: {
                title: "Vermentino IGT Toscana 2023 BAGIOGIE",
                meta: "Suché bílé víno • Itálie • Toskánsko",
                image: "Images/Vína/vermetinoigt23.png",
                story:
                    "Svěží, minerální a chuťově výrazné bílé víno z Toskánska vyrobené z odrůdy Vermentino. " +
                    "Ve vůni i chuti dominují tóny citrusových plodů, především citronu a limetky, " +
                    "doplněné o jemné bylinné nuance a typickou středomořskou mineralitu. " +
                    "Víno působí lehce, elegantně a má suchý, osvěžující závěr.",
                specs: [
                    "Odrůda: Vermentino",
                    "Ročník: 2023",
                    "Klasifikace: IGT Toscana",
                    "Styl: suché bílé víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 13 %"
                ],
                pairing: [
                    "Profil: citrusy, bylinky, mineralita",
                    "Párování: ryby, mořské plody, lehké těstoviny",
                    "Charakter: svěží a elegantní víno"
                ]
            },
            chianti: {
                title: "Chianti Colli Senesi DOCG 2023 La Villa",
                meta: "Suché červené víno • Itálie • Toskánsko",
                image: "Images/Vína/chiantisenesi23.png",
                story:
                    "Klasické červené víno Chianti z oblasti Colli Senesi pocházející z vinařství Fattoria La Torre. " +
                    "Vyrobené převážně z odrůdy Sangiovese z mladších vinic přibližně 15 let starých. " +
                    "V chuti je víno harmonické, s tóny červeného ovoce, jemným kořenitým nádechem " +
                    "a vyváženými tříslovinami.",
                specs: [
                    "Odrůda: Sangiovese",
                    "Ročník: 2023",
                    "Klasifikace: DOCG Chianti Colli Senesi",
                    "Styl: suché červené víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 13,5 %"
                ],
                pairing: [
                    "Profil: červené ovoce, koření, jemné třísloviny",
                    "Párování: těstoviny, uzeniny, vyzrálé sýry",
                    "Charakter: tradiční a vyvážené víno"
                ]
            },
            rosato: {
                title: "Rosato IGT Toscana 2023 Badalui",
                meta: "Růžové víno • Itálie • Toskánsko",
                image: "Images/Vína/rosatoigt23.png",
                story:
                    "Svěží růžové víno z oblasti Toskánska vyrobené z odrůdy Sangiovese z mladých vinic. " +
                    "V chuti dominují tóny červeného ovoce, lehká kyselina a suchý, čistý závěr. " +
                    "Víno je velmi dobře pitelné a ideální pro letní gastronomii.",
                specs: [
                    "Odrůda: Sangiovese",
                    "Ročník: 2023",
                    "Klasifikace: IGT Toscana",
                    "Styl: suché růžové víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 13 %"
                ],
                pairing: [
                    "Profil: červené ovoce, svěžest, lehkost",
                    "Párování: těstoviny, pizza, čerstvé sýry",
                    "Charakter: svěží a elegantní rosé"
                ]
            },
            vernaccia: {
                title: "Vernaccia di San Gimignano DOCG 2024",
                meta: "Suché bílé víno • Itálie • Toskánsko",
                image: "Images/Vína/vernaccia24.png",
                story:
                    "Klasické bílé víno z oblasti San Gimignano vyráběné z odrůdy Vernaccia. " +
                    "Hrozny jsou jemně lisovány a víno zraje na jemných kalech, což mu dodává čistotu, " +
                    "svěžest a jemnou strukturu. Ve vůni i chuti dominují citrusové tóny, zelené jablko " +
                    "a typická minerální stopa.",
                specs: [
                    "Odrůda: Vernaccia",
                    "Ročník: 2024",
                    "Klasifikace: DOCG Vernaccia di San Gimignano",
                    "Styl: suché bílé víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 12,5 %"
                ],
                pairing: [
                    "Profil: citrusy, zelené jablko, mineralita",
                    "Párování: ryby, mořské plody, lehká středomořská kuchyně",
                    "Charakter: svěží, elegantní a minerální víno"
                ]
            },
            guinzano: {
                title: "San Gimignano Rosso DOC 2022 GUINZANO",
                meta: "Suché červené víno • Itálie • Toskánsko",
                image: "Images/Vína/rossodoc22.png",
                story:
                    "Víno vzniká z odrůd Sangiovese, Merlot a Cabernet Sauvignon, které se vinifikují samostatně " +
                    "a poté se scelí do výsledného cuvée. Následuje zrání v dubových sudech a další ležení v lahvi, " +
                    "díky čemuž je projev harmonický, elegantní a uhlazený. Ve vůni i chuti najdeš zralé červené ovoce, " +
                    "jemné tóny dřeva a vyváženou strukturu s jemnými tříslovinami a dlouhým závěrem.",
                specs: [
                    "Odrůdy: Sangiovese, Merlot, Cabernet Sauvignon",
                    "Ročník: 2022",
                    "Klasifikace: San Gimignano Rosso DOC",
                    "Styl: suché červené víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 14 %"
                ],
                pairing: [
                    "Profil: zralé červené ovoce, jemné dřevo, struktura",
                    "Párování: maso, těstoviny, vyzrálé sýry",
                    "Charakter: elegantní, středně plné, dlouhý závěr"
                ]
            },
            sciallebiancho: {
                title: "Vernaccia di San Gimignano Riserva DOCG 2022 Sciallebiancho",
                meta: "Suché bílé víno • Itálie • Toskánsko",
                image: "Images/Vína/vernacciadocg22.png",
                story:
                    "Prémiová Vernaccia di San Gimignano Riserva z vinařství Fattoria La Torre. " +
                    "Hrozny pocházejí ze starých vinic přibližně 30 letých. Víno zraje na jemných kalech, " +
                    "což mu dodává hloubku, noblesu a jemnou krémovou strukturu. " +
                    "Ve vůni i chuti se objevují tóny citrusové kůry, minerality, lískových oříšků a jemné vanilky.",
                specs: [
                    "Odrůda: Vernaccia",
                    "Ročník: 2022",
                    "Klasifikace: DOCG Vernaccia di San Gimignano Riserva",
                    "Styl: suché bílé víno",
                    "Země původu: Itálie",
                    "Region: Toskánsko",
                    "Objem: 0,75 l",
                    "Alkohol: 13,5 %"
                ],
                pairing: [
                    "Profil: mineralita, citrusová kůra, jemná krémovost",
                    "Párování: ryby, bílé maso, vyzrálé sýry",
                    "Charakter: komplexní, elegantní, dlouhý závěr"
                ]
            }
        };

        const wineKeys = Object.keys(WINES);
        let currentIndex = 0;

        const openModal = (wineKey) => {
            if (!modalReady) return;

            currentIndex = wineKeys.indexOf(wineKey);
            const data = WINES[wineKey];
            if (!data) return;

            modal.classList.remove("is-closing");

            modalTitle.textContent = data.title;
            modalMeta.textContent = data.meta;

            modalImage.src = data.image;
            modalImage.alt = data.title;

            modalStory.textContent = data.story;

            modalSpecs.innerHTML = data.specs.map(item => `<li>${item}</li>`).join("");
            modalPairing.innerHTML = data.pairing.map(item => `<li>${item}</li>`).join("");

            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
        };

        const closeModal = () => {
            if (!modalReady) return;
            if (modal.classList.contains("is-closing")) return;

            modal.classList.add("is-closing");

            setTimeout(() => {
                modal.classList.remove("is-open", "is-closing");
                modal.setAttribute("aria-hidden", "true");
                document.body.classList.remove("modal-open");
                modalImage.src = "";
            }, 250);
        };

        const switchToWine = (nextKey, direction = "right") => {
            if (!modalReady) return;

            const cls = direction === "left" ? "is-switching-left" : "is-switching-right";

            panel.classList.remove("is-switching-left", "is-switching-right");
            panel.classList.add(cls);

            setTimeout(() => {
                openModal(nextKey);
                panel.scrollTop = 0;

                requestAnimationFrame(() => {
                    panel.classList.remove(cls);
                });
            }, 140);
        };

        const showNextWine = () => {
            currentIndex = (currentIndex + 1) % wineKeys.length;
            switchToWine(wineKeys[currentIndex], "right");
        };

        const showPrevWine = () => {
            currentIndex = (currentIndex - 1 + wineKeys.length) % wineKeys.length;
            switchToWine(wineKeys[currentIndex], "left");
        };

        // Klik/Enter/Space na kartu
        document.querySelectorAll(".wine-card[data-wine]").forEach(card => {
            card.addEventListener("click", () => openModal(card.dataset.wine));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openModal(card.dataset.wine);
                }
            });
        });

        // Zavírání (křížek + backdrop)
        if (modalReady) {
            modal.querySelectorAll("[data-close='true']").forEach(btn => {
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

        /* =========================================================
           3) VYHLEDÁVÁNÍ + FILTRY (karty)
           ========================================================= */
        const searchInput = document.getElementById("wineSearch");
        const clearBtn = document.getElementById("wineSearchClear");
        const statusEl = document.getElementById("wineSearchStatus");
        const noResultsEl = document.getElementById("wineNoResults");
        // Toggle UI pro vyhledávání (tlačítko -> rozbalí panel)
        const searchWrap = document.getElementById("wineSearchWrap");
        const searchToggle = document.getElementById("wineSearchToggle");
        const searchPanel = document.getElementById("wineSearchPanel");

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

            // klik mimo zavře
            document.addEventListener("click", (e) => {
                if (!searchWrap) return;
                if (searchPanel.hidden) return;
                if (e.target instanceof Element && !searchWrap.contains(e.target)) {
                    closeSearch();
                }
            });

            // ESC zavře
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && !searchPanel.hidden) {
                    closeSearch();
                    searchToggle.focus();
                }
            });
        }

        const filterButtons = Array.from(document.querySelectorAll(".wine-filter-btn[data-filter]"));
        let activeCategoryFilter = "all";

        const cards = Array.from(document.querySelectorAll(".wine-card[data-wine]"));

        const normalizeText = (value) => {
            return String(value ?? "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
        };

        const detectCategoryFromMeta = (metaText) => {
            const m = normalizeText(metaText);
            if (m.includes("bile")) return "white";
            if (m.includes("ruzove") || m.includes("rose")) return "rose";
            if (m.includes("cervene")) return "red";
            return "other";
        };

        const cardIndex = cards.map((card) => {
            const name = card.querySelector(".wine-name")?.textContent ?? "";
            const story = card.querySelector(".wine-story")?.textContent ?? "";
            const notes = card.querySelector(".wine-notes")?.textContent ?? "";
            const meta = card.querySelector(".wine-meta")?.textContent ?? "";

            if (!card.hasAttribute("data-orig-tabindex")) {
                card.setAttribute("data-orig-tabindex", card.getAttribute("tabindex") ?? "");
            }

            return {
                el: card,
                haystack: normalizeText(`${name} ${story} ${notes} ${meta}`),
                category: detectCategoryFromMeta(meta)
            };
        });

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
            if (statusEl) {
                const q = String(queryRaw ?? "").trim();
                statusEl.textContent = q
                    ? `Zobrazeno ${shownCount} z ${totalCount} vín pro „${q}“.`
                    : `Zobrazeno ${shownCount} z ${totalCount} vín.`;
            }

            if (noResultsEl) noResultsEl.hidden = shownCount !== 0;
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

        if (filterButtons.length) {
            filterButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    activeCategoryFilter = btn.dataset.filter || "all";
                    filterButtons.forEach(b => b.classList.toggle("is-active", b === btn));
                    applyFilter();
                });
            });
        }

        if (searchInput) searchInput.addEventListener("input", applyFilter);

        if (clearBtn && searchInput) {
            clearBtn.addEventListener("click", () => {
                searchInput.value = "";
                applyFilter();
                searchInput.focus();
            });
        }

        applyFilter(); // init
    });

    /* =========================================================
       4) JEMNÝ NÁJEZD OBSAHU (po načtení všeho, včetně obrázků)
       ========================================================= */
    window.addEventListener("load", () => {
        document.querySelector(".vina-header")?.classList.add("is-visible");
        document.querySelector(".vina-content")?.classList.add("is-visible");
        document.querySelector(".wines")?.classList.add("is-visible");
    });
})();