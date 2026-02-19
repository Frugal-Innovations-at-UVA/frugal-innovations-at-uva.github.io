// /js/events.js
// Slug-based event overlay that keeps card height fixed.

(function () {
    function wireAriaIds() {
        const seen = new Set();
        const cards = document.querySelectorAll("[data-event][data-slug]");

        cards.forEach((card) => {
            const slug = (card.getAttribute("data-slug") || "").trim();
            const openBtn = card.querySelector("[data-event-open]");
            const closeBtn = card.querySelector("[data-event-close]");
            const details = card.querySelector("[data-event-details]");
            const front = card.querySelector("[data-event-front]");

            if (!slug || !openBtn || !details || !front) return;

            if (seen.has(slug)) {
                console.warn(`[events] Duplicate data-slug detected: "${slug}". Slugs must be unique.`);
            }
            seen.add(slug);

            // aria wiring
            const id = `${slug}-details`;
            details.id = id;
            openBtn.setAttribute("aria-controls", id);
            openBtn.setAttribute("aria-expanded", "false");

            // initial state
            card.classList.remove("is-open");
            front.setAttribute("aria-hidden", "false");
            details.setAttribute("aria-hidden", "true");

            // (closeBtn may be missing if someone deletes it)
            if (closeBtn) closeBtn.setAttribute("type", "button");
        });
    }

    function openCard(card) {
        const openBtn = card.querySelector("[data-event-open]");
        const closeBtn = card.querySelector("[data-event-close]");
        const front = card.querySelector("[data-event-front]");
        const details = card.querySelector("[data-event-details]");
        if (!openBtn || !front || !details) return;

        card.classList.add("is-open");
        openBtn.setAttribute("aria-expanded", "true");
        front.setAttribute("aria-hidden", "true");
        details.setAttribute("aria-hidden", "false");

        if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function closeCard(card) {
        const openBtn = card.querySelector("[data-event-open]");
        const front = card.querySelector("[data-event-front]");
        const details = card.querySelector("[data-event-details]");
        if (!openBtn || !front || !details) return;

        card.classList.remove("is-open");
        openBtn.setAttribute("aria-expanded", "false");
        front.setAttribute("aria-hidden", "false");
        details.setAttribute("aria-hidden", "true");

        openBtn.focus({ preventScroll: true });
    }

    // DOMContentLoaded = run after the HTML is parsed and elements exist
    document.addEventListener("DOMContentLoaded", () => {
        wireAriaIds();
    });

    document.addEventListener("click", (e) => {
        const openBtn = e.target.closest("[data-event-open]");
        if (openBtn) {
            const card = openBtn.closest("[data-event]");
            if (card) openCard(card);
            return;
        }

        const closeBtn = e.target.closest("[data-event-close]");
        if (closeBtn) {
            const card = closeBtn.closest("[data-event]");
            if (card) closeCard(card);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;

        // close the most recently opened card
        const openCards = Array.from(document.querySelectorAll(".event-card.is-open"));
        if (openCards.length === 0) return;

        closeCard(openCards[openCards.length - 1]);
    });
})();
