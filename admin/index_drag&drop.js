// admin-dragdrop.js
// Figma-like smooth reorder for admin sections

(function () {
    const container = document.getElementById("sectionsContainer");
    if (!container) return;

    const bar = document.getElementById("reorderBar");
    const btnSave = document.getElementById("btnSaveOrder");
    const btnCancel = document.getElementById("btnCancelOrder");

    let dragged = null;
    let startY = 0;
    let offsetY = 0;
    let placeholder = null;
    let initialRect = null;

    const originalOrder = [...container.querySelectorAll(".section-dnd")]
        .map(el => el.dataset.sortOrder);

    function setDirty(v) {
        if (bar) bar.style.display = v ? "block" : "none";
    }

    function createPlaceholder(height) {
        const ph = document.createElement("div");
        ph.className = "section-placeholder";
        ph.style.height = height + "px";
        return ph;
    }

    function pointerDown(e) {
        const handle = e.target.closest("[data-drag-handle]");
        if (!handle) return;

        const item = handle.closest(".section-dnd");
        if (!item) return;

        dragged = item;
        initialRect = item.getBoundingClientRect();
        offsetY = e.clientY - initialRect.top;

        placeholder = createPlaceholder(initialRect.height);
        container.insertBefore(placeholder, item.nextSibling);

        item.classList.add("dragging");
        item.style.width = initialRect.width + "px";
        item.style.position = "fixed";
        item.style.top = initialRect.top + "px";
        item.style.left = initialRect.left + "px";
        item.style.zIndex = "9999";
        item.style.pointerEvents = "none";

        document.body.style.userSelect = "none";

        window.addEventListener("pointermove", pointerMove);
        window.addEventListener("pointerup", pointerUp);
    }

    function pointerMove(e) {
        if (!dragged) return;

        const newY = e.clientY - offsetY;
        dragged.style.transform = `translateY(${newY - initialRect.top}px)`;

        // Spočítáme střed taženého prvku BEZ getBoundingClientRect (rychlejší)
        const draggedTop = newY;
        const draggedCenter = draggedTop + dragged.offsetHeight / 2;

        const siblings = [...container.querySelectorAll(".section-dnd")]
            .filter(el => el !== dragged);

        for (let sibling of siblings) {
            const rect = sibling.getBoundingClientRect();

            const upperZone = rect.top + rect.height * 0.25;
            const lowerZone = rect.bottom - rect.height * 0.25;

            // Pokud jsme nad horní 25 % zóny → vlož před
            if (draggedCenter < upperZone) {
                container.insertBefore(placeholder, sibling);
                return;
            }

            // Pokud jsme uvnitř prostřední zóny → nic nedělej
            if (draggedCenter >= upperZone && draggedCenter <= lowerZone) {
                return;
            }

            // Pokud jsme pod dolní 25 % zóny → pokračuj dál
        }

        // Pokud jsme pod všemi → append
        container.appendChild(placeholder);
    }


    function pointerUp() {
        if (!dragged) return;

        container.insertBefore(dragged, placeholder);
        placeholder.remove();

        dragged.classList.remove("dragging");

        dragged.style.position = "";
        dragged.style.top = "";
        dragged.style.left = "";
        dragged.style.width = "";
        dragged.style.transform = "";
        dragged.style.zIndex = "";
        dragged.style.pointerEvents = "";

        document.body.style.userSelect = "";

        dragged = null;
        placeholder = null;

        setDirty(true);

        window.removeEventListener("pointermove", pointerMove);
        window.removeEventListener("pointerup", pointerUp);
    }

    function buildOrderInputs() {
        const inputsWrap = document.getElementById("reorderInputs");
        if (!inputsWrap) return;
        inputsWrap.innerHTML = "";

        [...container.querySelectorAll(".section-dnd")]
            .forEach(el => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "order[]";
                input.value = el.dataset.sortOrder;
                inputsWrap.appendChild(input);
            });
    }

    if (btnSave) {
        btnSave.addEventListener("click", () => {
            buildOrderInputs();
            document.getElementById("reorderForm").submit();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            const map = new Map();
            container.querySelectorAll(".section-dnd")
                .forEach(el => map.set(el.dataset.sortOrder, el));

            originalOrder.forEach(k => {
                const el = map.get(k);
                if (el) container.appendChild(el);
            });

            setDirty(false);
        });
    }

    container.addEventListener("pointerdown", pointerDown);
})();
