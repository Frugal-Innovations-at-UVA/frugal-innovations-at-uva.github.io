// Mobile menu toggle
const btn = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

btn?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));

    if (!isOpen) {
        document.querySelectorAll(".nav-dropdown.open").forEach(d => d.classList.remove("open"));
    }
});

// Active link highlight
const current = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-link").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const target = href.split("/").pop();
    if (target && target === current) a.classList.add("active");
});

// Mobile dropdowns: first tap opens submenu, second tap follows the link.
const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

document.querySelectorAll(".nav-dropdown > .nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
        if (!isMobile()) return;

        const dropdown = link.parentElement;

        if (!dropdown.classList.contains("open")) {
            e.preventDefault();

            document.querySelectorAll(".nav-dropdown.open").forEach((d) => {
                if (d !== dropdown) d.classList.remove("open");
            });

            dropdown.classList.add("open");
            return;
        }

        // allow navigation
        nav.classList.remove("open");
        btn?.setAttribute("aria-expanded", "false");
        document.querySelectorAll(".nav-dropdown.open").forEach((d) => d.classList.remove("open"));
    });
});

// Footer year
const y = document.getElementById("year");
if (y) y.textContent = String(new Date().getFullYear());
