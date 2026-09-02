# Adding a newsletter issue

This guide is for **exec members** — you do **not** need to know how to code or use
the command line. Everything here is done through the GitHub website in your browser.

Each issue needs **three things**:

1. The **PDF** of the newsletter
2. A **cover image** (a picture of the front page, used as the thumbnail)
3. One new **entry** in the list file `newsletters.json`

---

## Step 1 — Export the PDF from Canva (the right way)

The links inside the newsletter (Linktree, GroupMe, listserv, Instagram, etc.)
**only stay clickable if you export as a PDF**, not as an image.

In Canva:

1. Click **Share** (top right) → **Download**
2. File type: **PDF Standard**
3. Make sure **"Flatten PDF"** is **unchecked** (if you see that option)
4. Click **Download**

You should end up with a file like `FISH Newsletter September 2026.pdf`.

**Rename the file** to this format, all lowercase, words separated by dashes:

```
fish-newsletter-<month>-<year>.pdf
```

Examples:

- `fish-newsletter-september-2026.pdf`
- `fish-newsletter-october-2026.pdf`

---

## Step 2 — Make the cover image

The cover is just a picture of the newsletter's front so it can be shown as a
thumbnail on the website.

Easiest way, also from Canva:

1. **Share** → **Download**
2. File type: **JPG**
3. If the newsletter is more than one page, tick **only the first page**
4. Download

**Rename it** to this format:

```
<month>-<year>.jpg
```

Examples: `september-2026.jpg`, `october-2026.jpg`

> Keep it reasonably small — under ~400 KB is ideal. If Canva's JPG is huge, open
> it in Preview (Mac) → **Tools → Adjust Size** → set width to about **800 px** →
> save. On Windows, use the Photos app's **Resize** option.

---

## Step 3 — Upload the two files to GitHub

You upload each file into a specific folder. Do this once per file.

### Upload the PDF

1. Go to the repository on GitHub and open the folder
   **`newsletter/`** → then the year folder (e.g. **`2026/`**).
   - If the year folder doesn't exist yet: on the `newsletter/` page click
     **Add file → Create new file**, type `2026/placeholder.txt` in the name box,
     then **Commit changes**. You can delete `placeholder.txt` later. GitHub only
     keeps a folder if it has at least one file in it.
2. Click **Add file → Upload files**.
3. Drag in your renamed PDF (`fish-newsletter-september-2026.pdf`).
4. Scroll down, leave the default commit message, click **Commit changes**.

### Upload the cover image

1. Go to the folder **`assets/newsletter/`** → then the year folder (e.g. `2026/`).
   - Create the year folder the same way as above if it's missing.
2. **Add file → Upload files**.
3. Drag in your renamed cover (`september-2026.jpg`).
4. **Commit changes**.

---

## Step 4 — Add the issue to `newsletters.json`

This is the list that tells the website which issues exist. It lives at
**`newsletter/newsletters.json`**.

1. Open that file on GitHub and click the **pencil icon** (Edit this file).
2. Add a new block for your issue. **The newest issue goes first**, right after
   the opening `[`.

Here is the file with one issue already in it:

```json
[
  {
    "title": "Catch of the Week",
    "issue": "September 2026",
    "date": "2026-09-02",
    "slug": "september-2026",
    "pdf": "/newsletter/2026/fish-newsletter-september-2026.pdf",
    "cover": "/assets/newsletter/2026/september-2026.jpg",
    "blurb": "Interest meetings, a first look at the Make-A-Thon, and all the ways to stay connected this year."
  }
]
```

To add **October 2026**, it would become:

```json
[
  {
    "title": "Catch of the Week",
    "issue": "October 2026",
    "date": "2026-10-01",
    "slug": "october-2026",
    "pdf": "/newsletter/2026/fish-newsletter-october-2026.pdf",
    "cover": "/assets/newsletter/2026/october-2026.jpg",
    "blurb": "A short one-sentence summary of what's in this issue."
  },
  {
    "title": "Catch of the Week",
    "issue": "September 2026",
    "date": "2026-09-02",
    "slug": "september-2026",
    "pdf": "/newsletter/2026/fish-newsletter-september-2026.pdf",
    "cover": "/assets/newsletter/2026/september-2026.jpg",
    "blurb": "Interest meetings, a first look at the Make-A-Thon, and all the ways to stay connected this year."
  }
]
```

### What each field means

| Field    | What to put                                                                 |
|----------|----------------------------------------------------------------------------|
| `title`  | Almost always `"Catch of the Week"`. Only change if the newsletter is renamed. |
| `issue`  | The month and year, e.g. `"October 2026"`.                                 |
| `date`   | Publish date as `YYYY-MM-DD`, e.g. `"2026-10-01"`. Controls the ordering.  |
| `slug`   | Lowercase month-year with a dash: `"october-2026"`. Used in the page link. |
| `pdf`    | `/newsletter/<year>/<your-pdf-file-name>`                                  |
| `cover`  | `/assets/newsletter/<year>/<your-cover-file-name>`                         |
| `blurb`  | One sentence describing the issue. Keep it short.                          |

### Punctuation rules (important — JSON is picky)

- Every value is wrapped in `"double quotes"`.
- Put a **comma** after every line **except the last one** inside each `{ }` block.
- Put a **comma** after each `}` **except the last block** before the closing `]`.
- Don't use "smart quotes" (curly quotes). If you paste from Word/Notes and it
  looks fancy, retype the quotes.

3. Scroll down, click **Commit changes**.

---

## Step 5 — Check it worked

- GitHub Pages takes about 1–2 minutes to rebuild after your last commit.
- Visit **https://frugal-innovations.com/newsletter/** — your new issue should be
  at the top of the list.
- Click **Read online** and confirm the pages show and the links inside are
  clickable.
- If something looks broken, the most common cause is a typo in `newsletters.json`
  (a missing comma or quote). Paste the file contents into
  <https://jsonlint.com> — it will point to the bad line.

---

## Quick checklist

- [ ] PDF exported from Canva as **PDF Standard** (not an image)
- [ ] PDF renamed `fish-newsletter-<month>-<year>.pdf`
- [ ] PDF uploaded to `newsletter/<year>/`
- [ ] Cover image renamed `<month>-<year>.jpg`
- [ ] Cover uploaded to `assets/newsletter/<year>/`
- [ ] New block added to the **top** of `newsletter/newsletters.json`
- [ ] All commas and quotes correct
- [ ] Checked the live site after ~2 minutes

---

## For the webmaster

- Archive list page: `newsletter/index.html` + `js/newsletter-index.js`
- Inline reader: `newsletter/view/index.html` + `js/newsletter-view.js`
  (renders the PDF with pdf.js from cdnjs, pinned to `3.11.174`, and overlays
  the PDF's own link annotations as real anchors; it also lists every link
  found in the document under "Links from this issue").
- Styling: the `Newsletter` section at the bottom of `css/styles.css` (`.nl-*`).
- Nav entry: "Newsletter" lives under the **News** dropdown in
  `partials/site-header.html` (and the inline copy in `blog/index.html`).
