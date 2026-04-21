function initPromoBanner() {
    const banner = document.getElementById("promo-banner");
    const textEl = document.getElementById("promo-text");
    const actionsEl = document.getElementById("promo-actions");
    const dotsEl = document.getElementById("promo-dots");
    const prevBtn = document.getElementById("promo-prev");
    const nextBtn = document.getElementById("promo-next");
    const closeBtn = document.getElementById("promo-banner-close");

    if (!banner || !textEl || !actionsEl || !dotsEl || !prevBtn || !nextBtn || !closeBtn) {
        return;
    }

    if (banner.dataset.initialized === "true") {
        return;
    }
    banner.dataset.initialized = "true";

    const announcements = [
        {
            text: "RSVP to FISH Showcase!",
            links: [
                { label: "More Details", href: "/events/#new-events" },
                { label: "RSVP", href: "https://www.eventbrite.com/e/fish-showcase-tickets-1986843013939" }
            ]
        }
    ];

    if (!announcements.length) return;

    let currentIndex = 0;
    let intervalId = null;
    const ROTATE_MS = 5000;

    function renderDots() {
        dotsEl.innerHTML = "";

        announcements.forEach((announcement, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "promo-dot";
            dot.setAttribute("aria-label", `Go to announcement ${index + 1}`);
            dot.setAttribute("aria-pressed", index === currentIndex ? "true" : "false");

            if (index === currentIndex) {
                dot.classList.add("is-active");
            }

            dot.addEventListener("click", () => {
                currentIndex = index;
                renderAnnouncement();
                restartAutoRotate();
            });

            dotsEl.appendChild(dot);
        });
    }

    function renderAnnouncement() {
        const item = announcements[currentIndex];
        if (!item) return;

        textEl.textContent = item.text;
        actionsEl.innerHTML = "";

        (item.links || []).forEach((link) => {
            const a = document.createElement("a");
            a.className = "promo-banner-link";
            a.href = link.href;
            a.textContent = link.label;

            if (/^https?:\/\//i.test(link.href)) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }

            actionsEl.appendChild(a);
        });

        renderDots();
    }

    function goToNext() {
        currentIndex = (currentIndex + 1) % announcements.length;
        renderAnnouncement();
    }

    function goToPrev() {
        currentIndex = (currentIndex - 1 + announcements.length) % announcements.length;
        renderAnnouncement();
    }

    function startAutoRotate() {
        stopAutoRotate();
        intervalId = window.setInterval(goToNext, ROTATE_MS);
    }

    function stopAutoRotate() {
        if (intervalId) {
            window.clearInterval(intervalId);
            intervalId = null;
        }
    }

    function restartAutoRotate() {
        startAutoRotate();
    }

    function syncPromoHeight() {
        if (!document.body.classList.contains("has-promo")) {
            document.body.style.setProperty("--promo-h", "0px");
            return;
        }

        const height = Math.ceil(banner.offsetHeight);
        document.body.style.setProperty("--promo-h", `${height}px`);
    }

    prevBtn.addEventListener("click", () => {
        goToPrev();
        restartAutoRotate();
    });

    nextBtn.addEventListener("click", () => {
        goToNext();
        restartAutoRotate();
    });

    closeBtn.addEventListener("click", () => {
        document.body.classList.remove("has-promo");
        document.body.style.setProperty("--promo-h", "0px");
        stopAutoRotate();
    });

    banner.addEventListener("mouseenter", stopAutoRotate);
    banner.addEventListener("mouseleave", startAutoRotate);
    banner.addEventListener("focusin", stopAutoRotate);
    banner.addEventListener("focusout", startAutoRotate);

    renderAnnouncement();
    document.body.classList.add("has-promo");
    requestAnimationFrame(syncPromoHeight);
    startAutoRotate();

    window.addEventListener("resize", syncPromoHeight);
    window.addEventListener("orientationchange", syncPromoHeight);
}