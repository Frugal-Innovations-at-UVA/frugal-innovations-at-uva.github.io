/* /js/newsletter-index.js
   Builds the newsletter archive: one full-width horizontal card per issue,
   newest first. Data comes from /newsletter/newsletters.json. */

function nlFormatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function nlMakeCard(item) {
    const card = document.createElement("article");
    card.className = "nl-card";

    // --- Thumbnail (links to the reader) ---
    const thumbLink = document.createElement("a");
    thumbLink.className = "nl-card__thumb";
    thumbLink.href = `/newsletter/view/?id=${encodeURIComponent(item.slug)}`;
    thumbLink.setAttribute("aria-label", `Read ${item.title} — ${item.issue}`);

    if (item.cover) {
        const img = document.createElement("img");
        img.className = "nl-card__img";
        img.src = item.cover;
        img.alt = "";
        img.loading = "lazy";
        thumbLink.appendChild(img);
    } else {
        thumbLink.classList.add("nl-card__thumb--placeholder");
        thumbLink.innerHTML = `<span class="nl-card__placeholderMark">FISH</span>`;
    }

    // --- Body ---
    const body = document.createElement("div");
    body.className = "nl-card__body";

    const meta = document.createElement("p");
    meta.className = "nl-card__meta";
    meta.textContent = nlFormatDate(item.date);

    const title = document.createElement("h3");
    title.className = "nl-card__title";
    const titleLink = document.createElement("a");
    titleLink.href = `/newsletter/view/?id=${encodeURIComponent(item.slug)}`;
    titleLink.textContent = item.issue ? `${item.title} — ${item.issue}` : item.title;
    title.appendChild(titleLink);

    body.appendChild(meta);
    body.appendChild(title);

    if (item.blurb) {
        const blurb = document.createElement("p");
        blurb.className = "nl-card__blurb";
        blurb.textContent = item.blurb;
        body.appendChild(blurb);
    }

    const actions = document.createElement("div");
    actions.className = "nl-card__actions";

    const readBtn = document.createElement("a");
    readBtn.className = "nl-btn nl-btn--accent";
    readBtn.href = `/newsletter/view/?id=${encodeURIComponent(item.slug)}`;
    readBtn.textContent = "Read online";
    actions.appendChild(readBtn);

    if (item.pdf) {
        const dlBtn = document.createElement("a");
        dlBtn.className = "nl-btn nl-btn--outline";
        dlBtn.href = item.pdf;
        dlBtn.target = "_blank";
        dlBtn.rel = "noopener noreferrer";
        dlBtn.textContent = "Download PDF";
        actions.appendChild(dlBtn);
    }

    body.appendChild(actions);

    card.appendChild(thumbLink);
    card.appendChild(body);
    return card;
}

async function initNewsletterIndex() {
    const list = document.querySelector("[data-newsletter-list]");
    const empty = document.querySelector("[data-newsletter-empty]");
    if (!list) return;

    let items = [];
    try {
        const res = await fetch("/newsletter/newsletters.json", { cache: "no-store" });
        items = await res.json();
    } catch {
        items = [];
    }

    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    if (!items.length) {
        if (empty) empty.hidden = false;
        return;
    }

    const frag = document.createDocumentFragment();
    for (const item of items) frag.appendChild(nlMakeCard(item));
    list.appendChild(frag);
}

initNewsletterIndex();
