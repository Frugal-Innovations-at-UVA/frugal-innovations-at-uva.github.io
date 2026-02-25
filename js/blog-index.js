/* /js/blog-index.js */

function formatDate(iso) {
    // iso: YYYY-MM-DD
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function markdownToPlainText(md) {
    // Remove code blocks
    md = md.replace(/```[\s\S]*?```/g, " ");
    // Remove inline code
    md = md.replace(/`[^`]*`/g, " ");
    // Remove images ![alt](url)
    md = md.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
    // Links [text](url) -> text
    md = md.replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1");
    // Headings/blockquote/list markers
    md = md.replace(/^\s{0,3}(#{1,6}|\>|\-|\*|\+|\d+\.)\s+/gm, "");
    // Extra whitespace
    md = md.replace(/\s+/g, " ").trim();
    return md;
}

async function fetchPreviewText(mdPath, maxChars = 520) {
    try {
        const res = await fetch(mdPath, { cache: "no-store" });
        if (!res.ok) return "";
        const md = await res.text();
        const text = markdownToPlainText(md);
        return text.slice(0, maxChars); // NO manual "..." — CSS line-clamp handles ellipsis
    } catch {
        return "";
    }
}

function makeCard(post) {
    const a = document.createElement("a");
    a.className = "blog-card";
    a.href = post.url;

    // Media
    const media = document.createElement("div");
    media.className = "blog-card__media";

    if (post.cover) {
        const img = document.createElement("img");
        img.className = "blog-card__img";
        img.src = post.cover;
        img.alt = ""; // decorative; title already present
        img.loading = "lazy";
        media.appendChild(img);
    } else {
        media.classList.add("blog-card__media--placeholder");
        media.innerHTML = `
      <div class="blog-card__placeholder" aria-hidden="true">
        <span class="blog-card__placeholderMark">FISH</span>
      </div>
    `;
    }

    // Body
    const body = document.createElement("div");
    body.className = "blog-card__body";

    const meta = document.createElement("div");
    meta.className = "blog-card__meta";
    meta.textContent = `${formatDate(post.date)} • ${post.author}`;

    const title = document.createElement("h3");
    title.className = "blog-card__title";
    title.textContent = post.title;

    const excerpt = document.createElement("p");
    excerpt.className = "blog-card__excerpt";
    excerpt.textContent = ""; // filled async

    const cta = document.createElement("div");
    cta.className = "blog-card__cta";
    cta.textContent = "Read more →";

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(excerpt);
    body.appendChild(cta);

    a.appendChild(media);
    a.appendChild(body);

    // Fill excerpt asynchronously
    fetchPreviewText(post.md).then((text) => {
        excerpt.textContent = text || "";
    });

    return a;
}

async function initBlogIndex() {
    const grid = document.querySelector("[data-blog-grid]");
    const empty = document.querySelector("[data-blog-empty]");
    if (!grid) return;

    let posts = [];
    try {
        const res = await fetch("/blog/posts.json", { cache: "no-store" });
        posts = await res.json();
    } catch {
        posts = [];
    }

    // Sort newest first
    posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    if (!posts.length) {
        if (empty) empty.hidden = false;
        return;
    }

    const frag = document.createDocumentFragment();
    for (const post of posts) frag.appendChild(makeCard(post));
    grid.appendChild(frag);
}

initBlogIndex();