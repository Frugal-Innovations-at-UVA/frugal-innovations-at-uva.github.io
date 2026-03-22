# Blog — How to Add a New Post (Static GitHub Pages)

This site uses a lightweight, **no-build-tools** blog setup:
- **Blog index**: `/blog/` renders a grid of post cards from `/blog/posts.json`
- **Post pages**: `/blog/<year>/<slug>/` (folder route with `index.html`)
- **Post content**: Markdown files stored in `/blog/posts/<year>/<slug>.md`
- Markdown is rendered client-side using JS (`marked`) in `/js/blog-post.js`
- Local preview works with: `python3 -m http.server`

---

## 1) Decide the post info

You’ll need:
- **Title**
- **Author(s)** (as you want it displayed)
- **Date** in `YYYY-MM-DD`
- **Year** (usually the same as the date’s year)
- **Slug** (lowercase, hyphenated, no spaces/punctuation)  
  Example: `hip-knee-inequities`

---

## 2) Add the Markdown file

Create a new Markdown file at:

/blog/posts/<year>/<slug>.md

Example:

/blog/posts/2026/hip-knee-inequities.md

### Markdown formatting tips
- Leave a **blank line** between paragraphs.
- Use `##` for subheadings:
  ## Looking Ahead
- Bullet list:
    - item one
    - item two

### Adding images inside a post (optional)
Store post images here:

/assets/blog/<year>/file.jpg/

Then reference them in Markdown like:

![Caption](/assets/blog/<year>/my-image.jpg)

Example image path:

/assets/blog/2026/team-photo.jpg

> The post renderer automatically fixes relative image links so `assets/...` works.

### Adding references (optional)
At the bottom of the post, add:

## References

<ol class="blog-refs">
  <li>
    Author. (Year). <strong>Title</strong>. <em>Journal</em>.
    <a href="https://doi.org/...">https://doi.org/...</a>
  </li>
</ol>

The `.blog-refs` class makes the references section smaller and nicely formatted.

---

## 3) Create the post route folder + page

Create a folder:

/blog/<year>/<slug>/

Inside it, create:

/blog/<year>/<slug>/index.html

Example:

/blog/2026/hip-knee-inequities/index.html

### Option A (recommended): copy an existing post’s `index.html`
Find any existing post page like:

/blog/2026/some-post/index.html

Copy it into your new folder and you’re done.

### Option B: use the template below (copy/paste)

Create `/blog/<year>/<slug>/index.html` with:

    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Blog | FISH at UVA</title>
    
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="icon" type="image/png" href="/assets/brand/fish-main.png" />
    </head>
    
    <body>
    <header class="site-header">
        <div class="container header-inner">
            <a class="brand" href="/" aria-label="Home">
                <img class="brand-mark" src="/assets/brand/fish-main.png" alt="FISH logo" />
                <div class="brand-meta brand-meta--inline">
                    <div class="brand-name">FISH</div>
                    <div class="brand-tagline brand-meta--inline">
                        Frugal Innovations In Sustainable Healthcare
                    </div>
                </div>
            </a>
    
            <button class="nav-toggle" aria-controls="primary-nav" aria-expanded="false">
                <span class="sr-only">Menu</span> ☰
            </button>
    
            <nav id="primary-nav" class="site-nav" aria-label="Primary navigation">
                <a class="nav-link" href="/">Home</a>
                <a class="nav-link" href="/projects/">Projects</a>
                <div class="nav-dropdown">
                    <a class="nav-link" href="/make-a-thon/">Medical Device Make-A-Thon</a>
                    <div class="dropdown-panel" role="menu" aria-label="Projects submenu">
                        <a class="dropdown-link" href="/make-a-thon/sponsors/">Sponsors</a>
                        <a class="dropdown-link" href="/make-a-thon/students/">Students</a>
                    </div>
                </div>
                <a class="nav-link" href="/events/">Events</a>
                <a class="nav-link" href="/competitions/">Competitions</a>
                <a class="nav-link" href="/blog/">Blog</a>
                <a class="nav-link" href="/donate/">Donate</a>
                <div class="nav-dropdown nav-dropdown--right">
                    <a class="nav-link" href="/about/">About Us</a>
                    <div class="dropdown-panel" role="menu" aria-label="About Us submenu">
                        <a class="dropdown-link" href="/about/officers/">Officers</a>
                        <a class="dropdown-link" href="/about/collaborations/">Collaborations</a>
                    </div>
                </div>
            </nav>
        </div>
    </header>
    
    <main class="page">
        <section class="blog-post-hero" data-blog-hero>
            <div class="container blog-post-hero__inner">
                <a class="blog-back" href="/blog/">← All posts</a>
                <h1 class="blog-post-title" data-blog-title>Loading…</h1>
                <p class="blog-post-meta" data-blog-meta></p>
            </div>
            <div class="blog-post-hero__overlay" aria-hidden="true"></div>
        </section>
    
        <article class="blog-post">
            <div class="blog-post-body" data-blog-body>
                <p>Loading…</p>
            </div>
        </article>
    </main>
    
    <!-- CONTACT (simple footer bar; no form) -->
    <section class="contact-section" id="contact">
        <div class="contact-strip">
            <div class="contact-strip-left">
                <p class="contact-line">
                    <a class="contact-link" href="mailto:frugalinnovations@virginia.edu">frugalinnovations@virginia.edu</a>
                </p>
                <p class="contact-line">Charlottesville, VA, 22904</p>
            </div>
    
            <div class="contact-strip-right" aria-label="Social links">
                <a class="social-icon"
                   href="https://groupme.com/join_group/109354949/YaK5K88R"
                   target="_blank" rel="noopener noreferrer"
                   aria-label="Join our GroupMe">
                    <img src="/assets/icons/groupme-icon-1.png" alt="" />
                </a>
    
                <a class="social-icon"
                   href="https://www.instagram.com/fish_atuva"
                   target="_blank" rel="noopener noreferrer"
                   aria-label="Visit our Instagram">
                    <img src="/assets/icons/instagram-icon.png" alt="" />
                </a>
            </div>
        </div>
    </section>
    
    <footer class="site-footer">
        <div class="container footer-inner">
            <span class="footer-copy">© <span id="year"></span> FISH</span>
    
            <p class="footer-disclaimer">
                Although this organization has members who are University of Virginia students and may have University employees associated or engaged in its activities and affairs, the organization is not a part of or an agency of the University. It is a separate and independent organization, which is responsible for and manages its own activities and affairs. The University does not direct, supervise or control the organization and is not responsible for the organization’s contracts, acts or omissions.
            </p>
        </div>
    </footer>
    
    <script>
        document.getElementById("year").textContent = new Date().getFullYear();
    </script>
    
    <script src="/js/nav.js"></script>
    
    <!-- Markdown renderer -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    
    <script src="/js/blog-post.js"></script>
    </body>
    </html>

---

## 4) Add the post to `/blog/posts.json`

Open:

/blog/posts.json

Add a new object like:

    {
    "title": "Your Post Title",
    "author": "Author Name(s)",
    "date": "2026-03-01",
    "year": "2026",
    "slug": "your-post-slug",
    "url": "/blog/2026/your-post-slug/",
    "md": "/blog/posts/2026/your-post-slug.md",
    "cover": "/assets/blog/covers/your-cover.jpg"
    }

Notes:
- `cover` is optional. If omitted, the card will use a clean placeholder. But it is prefered if the fish-illustration in `assets/brand` is used
- The blog index sorts by date (newest first).

---

## 5) Local preview

From the project root:

python3 -m http.server

Then visit:
- Blog index: http://localhost:8000/blog/
- Your post: http://localhost:8000/blog/<year>/<slug>/

---

## Quick checklist

- [ ] Markdown file exists: `/blog/posts/<year>/<slug>.md`
- [ ] Post page exists: `/blog/<year>/<slug>/index.html`
- [ ] Entry added to `/blog/posts.json`
- [ ] (Optional) Cover image added to `/assets/blog/covers/`
- [ ] (Optional) In-post images added to `/blog/posts/<year>/assets/`