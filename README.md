# Frugal Innovations in Sustainable Healthcare (FISH) — Website

This repo contains the public website for **Frugal Innovations in Sustainable Healthcare (FISH)** at the University of Virginia.

**Live site:** https://frugal-innovations-at-uva.github.io

If you’ve never worked on a website before, no worries. You mostly edit text + images in files, then “save your changes” with Git.

---

## What’s in this repo?

Typical folders you’ll see:

- `index.html` — the homepage
- `projects/`, `about/`, etc. — other pages
- `css/` — styling (colors, spacing, fonts)
- `js/` — JavaScript (interactive behavior)
- `assets/` — images and graphics (logos, photos, etc.)

---

## One-time setup (recommended)

Install these:
- **Git** (so you can download/upload changes)
- **Python 3** (to run a simple local web server)
- An editor: **VS Code** or **IntelliJ**

> Why a “local server”?  
> Our site uses paths like `/css/styles.css` (root-relative paths). Opening the file directly (double-clicking `index.html`) can break those paths. A local server makes it behave like GitHub Pages.

---

## Clone the repo (download it to your computer)

### Option A: Clone in VS Code
1. Open **VS Code**
2. Open the Command Palette:
    - Mac: `Cmd + Shift + P`
    - Windows: `Ctrl + Shift + P`
3. Type **Git: Clone** and select it
4. Paste the repo URL:
    - `https://github.com/Frugal-Innovations-at-UVA/frugal-innovations-at-uva.github.io.git`
5. Choose a folder on your computer to save it
6. When it finishes, click **Open** (open the cloned repo)

### Option B: Clone in IntelliJ
1. Open **IntelliJ**
2. Click **Get from VCS** (or **File → New → Project from Version Control**)
3. Paste the repo URL:
    - `https://github.com/Frugal-Innovations-at-UVA/frugal-innovations-at-uva.github.io.git`
4. Choose a folder location and click **Clone**
5. Once opened, IntelliJ should detect it as a Git project automatically

---

## Run / test the website locally (recommended)

From the **repo root** (the folder that contains `index.html`, `css/`, `js/`, `assets/`):
### Start the server
1. Open a terminal and `cd` into the repository folder (the one that contains `index.html`, `css/`, `js/`, and `assets/`).
2. Run:

```bash
python3 -m http.server 8000
```

### View the site
Open these in your browser:
Home: http://localhost:8000/
Example subpage: http://localhost:8000/projects/

### Stop the server
Press Ctrl + C in the terminal window where the server is running.

---

## How we make changes (important): use branches

**Do NOT edit directly on `main`.**  
Instead, create a branch, make changes, then open a Pull Request.

### Branch naming convention
Use: `name/issue` or `name/feature`

Examples:
- `fede/homepage`
- `grace/add-blog-post`
- `cooper/add-project-page-2026`

### Typical workflow

    git checkout -b name/issue
    # edit files
    git add .
    git commit -m "Short message describing what you changed"
    git push -u origin name/issue

Then open a **Pull Request** on GitHub (so someone else can review before it goes live).

---

## Very common Git commands (and when to use them)

You don’t need to memorize these—just copy/paste as needed.

### `git add .`
Stages all your current file changes so they’re included in the next commit.  
Use it when: you’re ready to “package up” your edits.

### `git commit -m "message"`
Creates a saved checkpoint of your staged changes with a short description.  
Use it when: you made a meaningful change and want to save it cleanly.

Example:

    git commit -m "Update About page text and add new team photo"

### `git push origin <branch>`
Uploads your branch commits to GitHub.  
Use it when: you want your work backed up online or you’re ready to open a Pull Request.

Example:

    git push origin fede/fix-footer

Tip: the first time you push a new branch, this is convenient:

    git push -u origin name/issue

After that, you can usually just run:

    git push

### `git fetch`
Downloads updates from GitHub without changing your files.  
Use it when: you want to see what’s new on GitHub before you merge/rebase, or your branch list looks outdated.

### `git merge`
Combines changes from one branch into another.  
Use it when: you want to bring updates from `main` into your branch (or finish a feature into `main` via PR).

Common example (bring latest `main` into your branch):

    git checkout name/issue
    git fetch
    git merge origin/main

### `git rebase`
Re-applies your commits on top of another branch (often makes history cleaner than merge).  
Use it when: your branch is behind `main` and you want a clean, linear history.

Common example:

    git checkout name/issue
    git fetch
    git rebase origin/main

Important warning: Avoid rebasing a branch after other people are working on the same branch, because it rewrites history.

---

## Quick “what do I do right now?” checklist

1. Create a branch:

       git checkout -b name/issue

2. Run the site locally:

       python3 -m http.server 8000

3. Make edits + refresh browser

4. Save work:

       git add .
       git commit -m "…"
       git push -u origin name/issue

5. Open a Pull Request on GitHub

---

## Need help?

If you’re stuck, post a screenshot of:
- the terminal output, and/or
- what you expected vs what happened

Someone can help quickly.
