/* /js/blog-post.js */

function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function getYearSlugFromPath() {
    // Works for /blog/<year>/<slug>/ and /blog/<year>/<slug>/index.html
    const path = window.location.pathname.replace(/index\.html$/, "");
    const parts = path.split("/").filter(Boolean);
    const blogIdx = parts.indexOf("blog");
    if (blogIdx === -1) return null;
    const year = parts[blogIdx + 1];
    const slug = parts[blogIdx + 2];
    if (!year || !slug) return null;
    return { year, slug };
}

function isRelativeUrl(u) {
    return (
        u &&
        !u.startsWith("http://") &&
        !u.startsWith("https://") &&
        !u.startsWith("/") &&
        !u.startsWith("#") &&
        !u.startsWith("mailto:") &&
        !u.startsWith("tel:")
    );
}

function fixRelativeLinks(container, mdBase) {
    const imgs = container.querySelectorAll("img");
    imgs.forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (isRelativeUrl(src)) img.setAttribute("src", mdBase + src);
    });

    const links = container.querySelectorAll("a");
    links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (isRelativeUrl(href)) a.setAttribute("href", mdBase + href);

        // Open external links safely (optional)
        const finalHref = a.getAttribute("href") || "";
        if (finalHref.startsWith("http://") || finalHref.startsWith("https://")) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener");
        }
    });
}

async function initBlogPost() {
    const titleEl = document.querySelector("[data-blog-title]");
    const metaEl = document.querySelector("[data-blog-meta]");
    const bodyEl = document.querySelector("[data-blog-body]");
    const heroEl = document.querySelector("[data-blog-hero]");

    const ys = getYearSlugFromPath();
    if (!ys) {
        if (titleEl) titleEl.textContent = "Post not found";
        if (bodyEl) bodyEl.innerHTML = "<p>Invalid URL.</p>";
        return;
    }

    // Load registry
    let posts = [];
    try {
        const res = await fetch("/blog/posts.json", { cache: "no-store" });
        posts = await res.json();
    } catch {
        posts = [];
    }

    const post = posts.find((p) => String(p.year) === String(ys.year) && p.slug === ys.slug);
    if (!post) {
        if (titleEl) titleEl.textContent = "Post not found";
        if (bodyEl) bodyEl.innerHTML = "<p>This post isn’t listed in <code>/blog/posts.json</code>.</p>";
        return;
    }

    document.title = `FISH | ${post.title}`;
    if (titleEl) titleEl.textContent = post.title;
    if (metaEl) metaEl.textContent = `${formatDate(post.date)} • ${post.author}`;

    if (heroEl && post.cover) {
        heroEl.classList.add("blog-post-hero--hasCover");
        heroEl.style.backgroundImage = `url("${post.cover}")`;
    }

    // Fetch markdown + render
    try {
        const mdRes = await fetch(post.md, { cache: "no-store" });
        if (!mdRes.ok) throw new Error("Markdown fetch failed");
        const md = await mdRes.text();

        // marked is loaded in the template
        const html = window.marked.parse(md);
        if (bodyEl) bodyEl.innerHTML = html;

        // Fix relative asset links (images/links)
        const mdBase = post.md.replace(/[^/]*$/, ""); // directory of md file
        if (bodyEl) fixRelativeLinks(bodyEl, mdBase);

    } catch (e) {
        if (bodyEl) bodyEl.innerHTML = "<p>Could not load this post.</p>";
    }
}

initBlogPost();