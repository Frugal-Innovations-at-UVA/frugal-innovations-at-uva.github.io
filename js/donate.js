const donateTabs = document.querySelectorAll("[data-donate-tab]");
const donatePanels = document.querySelectorAll("[data-donate-panel]");

if (donateTabs.length && donatePanels.length) {
    const setDonatePanel = (target) => {
        donateTabs.forEach((tab) => {
            const isActive = tab.dataset.donateTab === target;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        donatePanels.forEach((panel) => {
            const isActive = panel.dataset.donatePanel === target;
            panel.classList.toggle("is-active", isActive);
            panel.hidden = !isActive;
        });
    };

    donateTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setDonatePanel(tab.dataset.donateTab);
        });
    });
}