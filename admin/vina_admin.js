// admin/vina_admin.js — Wine admin editor
(() => {
    "use strict";

    /* =========================================================
       STATE
       ========================================================= */
    let wines = [];
    let currentEditId = null;
    let pendingImagePath = null;
    let modalMode = "edit";
    let activeFormLang = "cs";
    let draftTranslations = {
        cs: { name: "", text: "", zeme: "", region: "" },
        en: { name: "", text: "", zeme: "", region: "" }
    };
    let selectedCertifications = new Set();
    let selectedStyles = new Set();
    let priceBounds = { min: 0, max: 0, selectedMin: 0, selectedMax: 0 };

    const catalogEl = document.getElementById("vina-katalog");
    const modal = document.getElementById("wineEditModal");
    const modalBackdrop = modal?.querySelector(".wine-edit-modal__backdrop");
    const modalClose = modal?.querySelector(".wine-edit-modal__close");
    const modalTitle = document.getElementById("editModalTitle");
    const modalImage = document.getElementById("editWineImage");
    const modalImageInput = document.getElementById("editWineImageInput");
    const modalImageBtn = document.getElementById("editWineImageBtn");
    const addWineBtn = document.getElementById("addWineBtn");
    const saveBtn = document.getElementById("editWineSave");
    const statusEl = document.getElementById("editWineStatus");
    const langButtons = Array.from(document.querySelectorAll(".wine-form-lang-btn[data-form-lang]"));
    const certificationFiltersEl = document.getElementById("wineCertificationFilters");
    const styleFiltersEl = document.getElementById("wineStyleFilters");
    const priceMinInput = document.getElementById("winePriceMin");
    const priceMaxInput = document.getElementById("winePriceMax");
    const priceStatusEl = document.getElementById("winePriceStatus");
    const priceRangeFillEl = document.getElementById("winePriceRangeFill");

    // Form fields
    const fName = document.getElementById("editName");
    const fText = document.getElementById("editText");
    const fCena = document.getElementById("editCena");
    const fOdruda = document.getElementById("editOdruda");
    const fRocnik = document.getElementById("editRocnik");
    const fZeme = document.getElementById("editZeme");
    const fRegion = document.getElementById("editRegion");
    const fObjem = document.getElementById("editObjem");
    const fAlkohol = document.getElementById("editAlkohol");
    const fOdkaz = document.getElementById("editOdkaz");
    const fCert = document.getElementById("editCertifikace");
    const fStyl = document.getElementById("editStyl");

    /* =========================================================
       HELPERS
       ========================================================= */
    const esc = (s) => {
        const d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
    };

    const formatPrice = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? `${Math.round(n)} Kč` : "";
    };

    const normalizeText = (value) =>
        String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const certLabel = (c) => {
        if (!c || c === "none") return "Bez certifikace";
        return c;
    };

    const showStatus = (msg, isError = false) => {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.classList.toggle("is-error", isError);
        statusEl.classList.add("is-visible");
        setTimeout(() => statusEl.classList.remove("is-visible"), 3000);
    };

    const persistCurrentLanguageDraft = () => {
        if (!draftTranslations[activeFormLang]) {
            draftTranslations[activeFormLang] = { name: "", text: "", zeme: "", region: "" };
        }
        draftTranslations[activeFormLang].name = fName?.value ?? "";
        draftTranslations[activeFormLang].text = fText?.value ?? "";
        draftTranslations[activeFormLang].zeme = fZeme?.value ?? "";
        draftTranslations[activeFormLang].region = fRegion?.value ?? "";
    };

    const renderLanguageDraft = () => {
        const draft = draftTranslations[activeFormLang] ?? { name: "", text: "", zeme: "", region: "" };
        if (fName) fName.value = draft.name || "";
        if (fText) fText.value = draft.text || "";
        if (fZeme) fZeme.value = draft.zeme || "";
        if (fRegion) fRegion.value = draft.region || "";
        langButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.formLang === activeFormLang));
        if (fName) fName.placeholder = activeFormLang === "en" ? "Wine name" : "Název vína";
        if (fText) fText.placeholder = activeFormLang === "en" ? "Wine description..." : "Popis vína...";
        if (fZeme) fZeme.placeholder = activeFormLang === "en" ? "Country" : "Země";
        if (fRegion) fRegion.placeholder = "Region";
    };

    const switchFormLang = (lang) => {
        const next = lang === "en" ? "en" : "cs";
        persistCurrentLanguageDraft();
        activeFormLang = next;
        renderLanguageDraft();
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
        const certificationValues = [...new Set(wines.map((wine) => String(wine.certifikace || "none")))].sort();
        const styleValues = [...new Set(wines.map((wine) => String(wine.styl || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "cs"));
        renderCheckboxGroup(certificationFiltersEl, certificationValues, selectedCertifications, "wineCertification", certLabel);
        renderCheckboxGroup(styleFiltersEl, styleValues, selectedStyles, "wineStyle", (value) => value);
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
        priceStatusEl.textContent = `Cenové rozmezí: ${priceBounds.selectedMin} Kč – ${priceBounds.selectedMax} Kč`;
    };

    const initPriceBounds = () => {
        const prices = wines.map((wine) => Number(wine.cena)).filter((price) => Number.isFinite(price));
        const min = prices.length ? Math.min(...prices) : 0;
        const max = prices.length ? Math.max(...prices) : 0;
        priceBounds = { min, max, selectedMin: min, selectedMax: max };
        syncPriceInputs();
        updatePriceStatus();
    };

    const resetForm = () => {
        draftTranslations = {
            cs: { name: "", text: "", zeme: "", region: "" },
            en: { name: "", text: "", zeme: "", region: "" }
        };
        activeFormLang = "cs";
        if (fName) fName.value = "";
        if (fText) fText.value = "";
        if (fCena) fCena.value = "";
        if (fOdruda) fOdruda.value = "";
        if (fRocnik) fRocnik.value = "";
        if (fZeme) fZeme.value = "";
        if (fRegion) fRegion.value = "";
        if (fObjem) fObjem.value = "";
        if (fAlkohol) fAlkohol.value = "";
        if (fOdkaz) fOdkaz.value = "";
        if (fCert) fCert.value = "none";
        if (fStyl) fStyl.value = "bílé";
        if (modalImage) {
            modalImage.src = "";
            modalImage.alt = "";
        }
        if (modalImageInput) {
            modalImageInput.value = "";
        }
        renderLanguageDraft();
    };

    /* =========================================================
       RENDER CARDS
       ========================================================= */
    const renderCards = () => {
        if (!catalogEl) return;
        catalogEl.innerHTML = "";

        wines.forEach((w) => {
            const price = formatPrice(w.cena);
            const cert = certLabel(w.certifikace);
            const shortName = w.translations?.cs?.name || w.name || "Bez názvu";

            const card = document.createElement("article");
            card.className = "wine-card wine-card--catalog";
            card.setAttribute("data-wine-id", w.id);

            // DnD is enabled only via handle in initDragAndDrop()
            card.setAttribute("aria-grabbed", "false");

            card.innerHTML = `
                <button type="button" class="wine-drag-handle" aria-label="Přesunout víno" title="Přesunout">⋮⋮</button>
                <div class="wine-media">
                    <img src="../${esc(w.image || "")}" alt="${esc(shortName)}">
                </div>
                <div class="wine-info">
                    <h3 class="wine-name typo-h3">${esc(shortName)}</h3>
                    <div class="wine-divider" aria-hidden="true"></div>
                    <p class="wine-appellation typo-meta">${esc(cert)}</p>
                    ${price ? `<p class="wine-price">${esc(price)}</p>` : ""}
                </div>
                <div class="wine-card-actions">
                    <button type="button" class="wine-edit-btn" data-edit-id="${w.id}">Upravit</button>
                    <button type="button" class="wine-delete-btn" data-delete-id="${w.id}">Smazat</button>
                </div>
            `;

            catalogEl.appendChild(card);
        });

        initDragAndDrop();
    };

    /* =========================================================
       DRAG & DROP ORDERING
       ========================================================= */
    let draggingEl = null;
    let dragOverEl = null;
    let isPersistingOrder = false;

    const getVisibleCards = () => Array.from(catalogEl?.querySelectorAll(".wine-card[data-wine-id]:not(.is-filtered-out)") ?? []);

    const persistOrderFromDom = async () => {
        if (!catalogEl || isPersistingOrder) return;

        const visibleCards = getVisibleCards();
        if (visibleCards.length <= 1) return;

        const visibleIds = visibleCards.map((el) => Number(el.dataset.wineId)).filter((n) => Number.isFinite(n) && n > 0);

        // Merge: new visible order first, then rest in their current order.
        const visibleSet = new Set(visibleIds.map(String));
        const restIds = wines
            .map((w) => String(w.id))
            .filter((id) => !visibleSet.has(id))
            .map((id) => Number(id));

        const order = [...visibleIds, ...restIds].filter((id) => Number.isFinite(id) && id > 0);

        // Update local array immediately so filtering keeps stable order.
        const indexById = new Map(wines.map((w, i) => [String(w.id), i]));
        const next = [];
        order.forEach((id) => {
            const idx = indexById.get(String(id));
            if (idx != null) next.push(wines[idx]);
        });
        if (next.length === wines.length) {
            wines = next;
        }

        isPersistingOrder = true;
        try {
            const res = await fetch("api/wines_reorder.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ order }),
            });

            const raw = await res.text();
            let json = null;
            try {
                json = JSON.parse(raw);
            } catch {
                json = null;
            }

            if (!res.ok || !json?.ok) {
                console.error("Failed to persist wines order", { status: res.status, raw, json });
                showStatus("Nepodařilo se uložit pořadí", true);
                // Reload from server to return to canonical order.
                await loadWines();
                applyFilter();
                return;
            }

            showStatus("Pořadí uloženo ✓");
        } catch (e) {
            console.error(e);
            showStatus("Nepodařilo se uložit pořadí", true);
            await loadWines();
            applyFilter();
        } finally {
            isPersistingOrder = false;
        }
    };

    const initDragAndDrop = () => {
        if (!catalogEl) return;

        const cards = Array.from(catalogEl.querySelectorAll(".wine-card[data-wine-id]"));
        cards.forEach((card) => {
            card.removeEventListener("dragstart", onDragStart);
            card.removeEventListener("dragend", onDragEnd);
            card.removeEventListener("dragover", onDragOver);
            card.removeEventListener("dragleave", onDragLeave);
            card.removeEventListener("drop", onDragDrop);

            card.addEventListener("dragstart", onDragStart);
            card.addEventListener("dragend", onDragEnd);
            card.addEventListener("dragover", onDragOver);
            card.addEventListener("dragleave", onDragLeave);
            card.addEventListener("drop", onDragDrop);

            // Default: block dragging unless explicitly started from handle.
            card.draggable = false;
            card.dataset.dragEnabled = "0";

            const handle = card.querySelector('.wine-drag-handle');
            if (handle) {
                // Enable dragging only when user starts interaction on the handle.
                const enable = () => {
                    card.dataset.dragEnabled = "1";
                    card.draggable = true;
                };
                const disable = () => {
                    card.dataset.dragEnabled = "0";
                    card.draggable = false;
                };

                handle.addEventListener("pointerdown", enable);
                // If the user clicks but doesn't drag, disable again.
                handle.addEventListener("pointerup", disable);
                handle.addEventListener("pointercancel", disable);
                handle.addEventListener("lostpointercapture", disable);

                // Safety: also disable when leaving card.
                card.addEventListener("pointerup", disable);
                card.addEventListener("pointercancel", disable);
            }
        });
    };

    const onDragStart = (e) => {
        const card = e.currentTarget;
        if (!(card instanceof HTMLElement)) return;

        if (card.dataset.dragEnabled !== "1") {
            e.preventDefault();
            return;
        }

        draggingEl = card;
        card.classList.add("is-dragging");
        card.setAttribute("aria-grabbed", "true");

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", card.dataset.wineId || "");

            // Make drag image small-ish (some browsers otherwise drag the whole card).
            const handle = card.querySelector('.wine-drag-handle');
            if (handle instanceof HTMLElement && e.dataTransfer.setDragImage) {
                e.dataTransfer.setDragImage(handle, 18, 18);
            }
        }
    };

    const onDragEnd = async () => {
        if (draggingEl) {
            draggingEl.classList.remove("is-dragging");
            draggingEl.setAttribute("aria-grabbed", "false");
            // Disable dragging again after drag finishes.
            draggingEl.dataset.dragEnabled = "0";
            draggingEl.draggable = false;
        }
        if (dragOverEl) dragOverEl.classList.remove("is-drag-over");

        draggingEl = null;
        dragOverEl = null;

        await persistOrderFromDom();
    };

    const onDragOver = (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        if (!draggingEl || target === draggingEl) return;
        if (target.classList.contains("is-filtered-out") || draggingEl.classList.contains("is-filtered-out")) return;

        if (dragOverEl && dragOverEl !== target) dragOverEl.classList.remove("is-drag-over");
        dragOverEl = target;
        target.classList.add("is-drag-over");

        const rect = target.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        const parent = target.parentNode;
        if (!parent) return;

        if (before) {
            parent.insertBefore(draggingEl, target);
        } else {
            parent.insertBefore(draggingEl, target.nextSibling);
        }
    };

    const onDragLeave = (e) => {
        const target = e.currentTarget;
        target.classList.remove("is-drag-over");
    };

    const onDragDrop = (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        target.classList.remove("is-drag-over");
    };

    /* =========================================================
       LOAD WINES
       ========================================================= */
    const loadWines = async () => {
        try {
            const res = await fetch("api/wines.php", {
                headers: { "Accept": "application/json" }
            });
            const raw = await res.text();
            let json = null;

            try {
                json = JSON.parse(raw);
            } catch (parseError) {
                console.error("Failed to parse wines JSON", {
                    status: res.status,
                    contentType: res.headers.get("content-type"),
                    body: raw
                });
                throw parseError;
            }

            if (!res.ok || !json.ok || !Array.isArray(json.items)) {
                console.error("Wine API returned error", { status: res.status, json });
                showStatus("Nepodařilo se načíst vína", true);
                return;
            }

            wines = json.items;
            selectedCertifications = new Set();
            selectedStyles = new Set();
            renderCards();
            renderCheckboxFilters();
            initPriceBounds();
        } catch (e) {
            console.error("Failed to load wines", e);
            showStatus("Nepodařilo se načíst vína", true);
        }
    };

    /* =========================================================
       OPEN / CLOSE EDIT MODAL
       ========================================================= */
    const openCreate = () => {
        if (!modal) return;
        modalMode = "create";
        currentEditId = null;
        pendingImagePath = null;
        resetForm();
        if (modalTitle) modalTitle.textContent = "Upravit víno";
        modal.classList.add("is-open");
        document.body.classList.add("modal-open");
        fName?.focus();
    };

    const openEdit = (id) => {
        const wine = wines.find((w) => String(w.id) === String(id));
        if (!wine || !modal) return;

        modalMode = "edit";
        currentEditId = wine.id;
        pendingImagePath = null;
        resetForm();

        draftTranslations = {
            cs: {
                name: wine.translations?.cs?.name || wine.name || "",
                text: wine.translations?.cs?.text || wine.text || "",
                zeme: wine.translations?.cs?.zeme || wine.zeme || "",
                region: wine.translations?.cs?.region || wine.region || "",
            },
            en: {
                name: wine.translations?.en?.name || "",
                text: wine.translations?.en?.text || "",
                zeme: wine.translations?.en?.zeme || "",
                region: wine.translations?.en?.region || "",
            }
        };
        activeFormLang = "cs";
        renderLanguageDraft();

        if (modalTitle) modalTitle.textContent = "Upravit víno";
        if (fCena) fCena.value = wine.cena || "";
        if (fOdruda) fOdruda.value = wine.odruda || "";
        if (fRocnik) fRocnik.value = wine.rocnik || "";
        if (fObjem) fObjem.value = wine.objem || "";
        if (fAlkohol) fAlkohol.value = wine.alkohol || "";
        if (fOdkaz) fOdkaz.value = wine.odkaz || "";
        if (fCert) fCert.value = wine.certifikace || "none";
        if (fStyl) fStyl.value = wine.styl || "bílé";

        if (modalImage) {
            modalImage.src = wine.image ? "../" + wine.image : "";
            modalImage.alt = wine.translations?.cs?.name || wine.name || "";
        }

        modal.classList.add("is-open");
        document.body.classList.add("modal-open");
    };

    const closeEdit = () => {
        if (!modal) return;
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
        currentEditId = null;
        pendingImagePath = null;
        modalMode = "edit";
        resetForm();
        if (modalTitle) modalTitle.textContent = "Upravit víno";
    };

    /* =========================================================
       IMAGE UPLOAD
       ========================================================= */
    const handleImageUpload = async (file) => {
        if (!file) return;

        const fd = new FormData();
        fd.append("image", file);

        try {
            const res = await fetch("api/wine_image_upload.php", {
                method: "POST",
                body: fd,
                headers: { "Accept": "application/json" }
            });
            const raw = await res.text();
            const json = JSON.parse(raw);
            if (json.ok && json.path) {
                pendingImagePath = json.path;
                if (modalImage) {
                    modalImage.src = "../" + json.path;
                }
                showStatus("Obrázek nahrán");
            } else {
                showStatus(json.error || json.errors?.[0] || "Chyba nahrávání", true);
            }
        } catch (e) {
            showStatus("Chyba nahrávání obrázku", true);
        }
    };

    /* =========================================================
       SAVE WINE
       ========================================================= */
    const saveWine = async () => {
        persistCurrentLanguageDraft();
        const isCreate = modalMode === "create";
        const name = draftTranslations.cs?.name?.trim() ?? "";
        if (!name) {
            activeFormLang = "cs";
            renderLanguageDraft();
            showStatus("Zadej český název vína", true);
            fName?.focus();
            return;
        }

        const payload = {
            cena: parseInt(fCena?.value ?? "0", 10) || 0,
            odruda: fOdruda?.value ?? "",
            rocnik: parseInt(fRocnik?.value ?? "0", 10) || 0,
            objem: fObjem?.value ?? "",
            alkohol: fAlkohol?.value ?? "",
            odkaz: fOdkaz?.value ?? "",
            certifikace: fCert?.value ?? "none",
            styl: fStyl?.value ?? "bílé",
            translations: {
                cs: {
                    name: draftTranslations.cs?.name ?? "",
                    text: draftTranslations.cs?.text ?? "",
                    zeme: draftTranslations.cs?.zeme ?? "",
                    region: draftTranslations.cs?.region ?? "",
                },
                en: {
                    name: draftTranslations.en?.name ?? "",
                    text: draftTranslations.en?.text ?? "",
                    zeme: draftTranslations.en?.zeme ?? "",
                    region: draftTranslations.en?.region ?? "",
                }
            }
        };

        if (!isCreate && currentEditId) {
            payload.id = currentEditId;
        }
        if (pendingImagePath) {
            payload.image = pendingImagePath;
        }

        if (saveBtn) saveBtn.disabled = true;

        try {
            const res = await fetch("api/wine_update.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload),
            });
            const raw = await res.text();
            const json = JSON.parse(raw);
            if (json.ok) {
                currentEditId = json.id ?? currentEditId;
                showStatus(isCreate ? "Víno přidáno ✓" : "Uloženo ✓");
                await loadWines();
                applyFilter();
                if (isCreate) {
                    const created = wines.find((w) => String(w.id) === String(json.id));
                    if (created) {
                        openEdit(created.id);
                    } else {
                        closeEdit();
                    }
                } else {
                    const updated = wines.find((w) => String(w.id) === String(currentEditId));
                    if (updated && modalImage) {
                        modalImage.src = updated.image ? "../" + updated.image : "";
                        modalImage.alt = updated.translations?.cs?.name || updated.name || "";
                    }
                }
            } else {
                showStatus(json.error || json.errors?.[0] || "Chyba ukládání", true);
            }
        } catch (e) {
            showStatus("Chyba při ukládání", true);
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    };

    /* =========================================================
       DELETE WINE
       ========================================================= */
    const deleteWine = async (id) => {
        const wine = wines.find((w) => String(w.id) === String(id));
        if (!wine) {
            showStatus("Víno nebylo nalezeno", true);
            return;
        }

        const label = wine.translations?.cs?.name || wine.name || "Bez názvu";
        const confirmed = window.confirm(`Opravdu smazat víno „${label}“?`);
        if (!confirmed) return;

        try {
            const res = await fetch("api/wine_delete.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ id: wine.id })
            });
            const raw = await res.text();
            const json = JSON.parse(raw);

            if (json.ok) {
                if (String(currentEditId) === String(wine.id)) {
                    closeEdit();
                }
                await loadWines();
                applyFilter();
                showStatus("Víno smazáno ✓");
            } else {
                showStatus(json.error || json.errors?.[0] || "Chyba mazání", true);
            }
        } catch (e) {
            showStatus("Chyba při mazání", true);
        }
    };

    /* =========================================================
       SEARCH & FILTER
       ========================================================= */
    const updateUi = (shownCount, totalCount, queryRaw) => {
        const statusSearch = document.getElementById("wineSearchStatus");
        const noResultsEl = document.getElementById("wineNoResults");
        const clearBtn = document.getElementById("wineSearchClear");
        const q = String(queryRaw ?? "").trim();

        if (statusSearch) {
            statusSearch.textContent = q
                ? `Zobrazeno ${shownCount} z ${totalCount} vín pro „${q}“.`
                : `Zobrazeno ${shownCount} z ${totalCount} vín.`;
        }
        if (noResultsEl) noResultsEl.hidden = shownCount !== 0;
        if (clearBtn) clearBtn.disabled = !q && selectedCertifications.size === 0 && selectedStyles.size === 0 && priceBounds.selectedMin === priceBounds.min && priceBounds.selectedMax === priceBounds.max;
        updatePriceStatus();
    };

    const applyFilter = () => {
        const searchInput = document.getElementById("wineSearch");
        const queryRaw = searchInput?.value ?? "";
        const query = normalizeText(queryRaw);
        const cards = Array.from(catalogEl?.querySelectorAll(".wine-card[data-wine-id]") ?? []);
        let shown = 0;

        cards.forEach((card, index) => {
            const wine = wines[index];
            const matchText = !query || normalizeText(wine?.translations?.cs?.name || wine?.name || "").includes(query);
            const matchCert = selectedCertifications.size === 0 || selectedCertifications.has(String(wine?.certifikace || "none"));
            const matchStyle = selectedStyles.size === 0 || selectedStyles.has(String(wine?.styl || ""));
            const price = Number(wine?.cena) || 0;
            const matchPrice = price >= priceBounds.selectedMin && price <= priceBounds.selectedMax;
            const ok = matchText && matchCert && matchStyle && matchPrice;

            card.classList.toggle("is-filtered-out", !ok);
            if (ok) shown++;
        });

        updateUi(shown, cards.length, queryRaw);
    };

    /* =========================================================
       EVENT LISTENERS
       ========================================================= */
    document.addEventListener("DOMContentLoaded", () => {
        loadWines().then(() => applyFilter());

        addWineBtn?.addEventListener("click", openCreate);
        langButtons.forEach((btn) => {
            btn.addEventListener("click", () => switchFormLang(btn.dataset.formLang));
        });
        fName?.addEventListener("input", persistCurrentLanguageDraft);
        fText?.addEventListener("input", persistCurrentLanguageDraft);
        fZeme?.addEventListener("input", persistCurrentLanguageDraft);
        fRegion?.addEventListener("input", persistCurrentLanguageDraft);

        catalogEl?.addEventListener("click", (e) => {
            const btn = e.target.closest(".wine-edit-btn[data-edit-id]");
            if (btn) {
                e.stopPropagation();
                openEdit(btn.dataset.editId);
                return;
            }

            const deleteBtn = e.target.closest(".wine-delete-btn[data-delete-id]");
            if (deleteBtn) {
                e.stopPropagation();
                deleteWine(deleteBtn.dataset.deleteId);
            }
        });

        modalBackdrop?.addEventListener("click", closeEdit);
        modalClose?.addEventListener("click", closeEdit);
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal?.classList.contains("is-open")) closeEdit();
        });

        modalImageBtn?.addEventListener("click", () => modalImageInput?.click());
        modalImageInput?.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
        });

        saveBtn?.addEventListener("click", saveWine);

        const searchInput = document.getElementById("wineSearch");
        const clearBtn = document.getElementById("wineSearchClear");
        const searchToggle = document.getElementById("wineSearchToggle");
        const searchPanel = document.getElementById("wineSearchPanel");
        const searchWrap = document.getElementById("wineSearchWrap");

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

        if (searchToggle && searchPanel) {
            searchToggle.addEventListener("click", () => {
                const isOpen = searchToggle.getAttribute("aria-expanded") === "true";
                if (isOpen) {
                    searchPanel.hidden = true;
                    searchToggle.setAttribute("aria-expanded", "false");
                    searchWrap?.classList.remove("is-open");
                } else {
                    searchPanel.hidden = false;
                    searchToggle.setAttribute("aria-expanded", "true");
                    searchWrap?.classList.add("is-open");
                    setTimeout(() => searchInput?.focus(), 0);
                }
            });
        }
    });

    /* =========================================================
       JEMNÝ NÁJEZD OBSAHU
       ========================================================= */
    window.addEventListener("load", () => {
        document.querySelector(".vina-header")?.classList.add("is-visible");
        document.querySelector(".wines")?.classList.add("is-visible");
    });
})();

