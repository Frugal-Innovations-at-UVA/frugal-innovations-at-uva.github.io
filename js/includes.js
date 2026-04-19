async function loadIncludes() {
    const includeTargets = document.querySelectorAll("[data-include]");

    await Promise.all(
        Array.from(includeTargets).map(async (target) => {
            const url = target.getAttribute("data-include");
            if (!url) return;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load partial: ${url}`);
            }

            target.innerHTML = await response.text();
        })
    );

    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    if (typeof initNav === "function") {
        initNav();
    }

    if (typeof initPromoBanner === "function") {
        initPromoBanner();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadIncludes().catch((error) => {
        console.error("Error loading partials:", error);
    });
});