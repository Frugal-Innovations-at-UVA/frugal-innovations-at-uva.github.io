# Contributing Guide — FISH Website

This guide is for contributors of all experience levels (including people with little/no coding background).

## Basic idea
You will:
1) Download the website code (clone)
2) Create a new branch
3) Make edits and preview them locally
4) Commit and push your branch
5) Open a Pull Request (PR) so someone can review before changes go live

---

## 1) Clone (download) the repo

Repo URL:
https://github.com/Frugal-Innovations-at-UVA/frugal-innovations-at-uva.github.io.git

### Option A: Clone in VS Code
1. Open **VS Code**
2. Open the Command Palette:
    - Mac: Cmd + Shift + P
    - Windows: Ctrl + Shift + P
3. Type: `Git: Clone` and select it
4. Paste the repo URL
5. Choose a folder to save it
6. When it finishes, click **Open**

### Option B: Clone in IntelliJ
1. Open **IntelliJ**
2. Click **Get from VCS** (or File → New → Project from Version Control)
3. Paste the repo URL
4. Choose a folder location and click **Clone**
5. IntelliJ should detect it as a Git project automatically

---

## 2) Run the website locally (recommended)

From the repo root (the folder containing `index.html`, `css/`, `js/`, `assets/`):

    python3 -m http.server 8000

Open in your browser:
- http://localhost:8000/
- (example) http://localhost:8000/projects/

Stop the server:
- Ctrl + C

Why we do this:
- It makes root-relative paths like `/css/styles.css` behave correctly (same as GitHub Pages)

---

## 3) Branches (required)

### Do not commit to `main`
Always create a branch first.

Branch naming convention:
- `name/issue`

Examples:
- `fede/fix-navbar-spacing`
- `grace/update-sponsor-logos`
- `alex/add-project-page-2026`

Create a branch:
git checkout -b name/issue

---

## 4) Typical workflow (most common)

    git checkout -b name/issue
    # edit files
    git add .
    git commit -m "Short message describing what you changed"
    git push -u origin name/issue

Then open a Pull Request on GitHub.

---

## 5) Common Git commands (and when to use them)

You don’t need to memorize these — copy/paste is fine.

### `git add .`
Stages all your current file changes so they’re included in the next commit.

Use it when:
- you’re ready to “package up” your edits into a commit

### `git commit -m "message"`
Creates a saved checkpoint of your staged changes.

Use it when:
- you completed a meaningful chunk of work and want a clean save

Example:
git commit -m "Update About page text and add new team photo"

### `git push origin <branch>`
Uploads your branch commits to GitHub.

Use it when:
- you want your work backed up online
- you’re ready to open a Pull Request

Example:
git push origin fede/fix-footer

Tip (first push on a new branch):
git push -u origin name/issue

After that, you can usually just run:
git push

### `git fetch`
Downloads updates from GitHub without changing your files.

Use it when:
- you want to check for updates before merging/rebasing
- your local branch list looks outdated

### `git merge`
Combines changes from one branch into another.

Use it when:
- you want to bring the latest `main` updates into your branch

Common example (bring latest `main` into your branch):
git checkout name/issue
git fetch
git merge origin/main

### `git rebase`
Re-applies your commits on top of another branch (often keeps history cleaner than merge).

Use it when:
- your branch is behind `main` and you want a clean, linear history

Common example:
git checkout name/issue
git fetch
git rebase origin/main

Important warning:
- Avoid rebasing a branch after other people are working on the same branch (it rewrites history).

---

## 6) Opening a Pull Request (PR)

When you’ve pushed your branch:
1) Go to the repo on GitHub
2) You’ll usually see a banner offering to “Compare & pull request” — click it
3) Add a clear title + short description
4) Request a reviewer (if applicable)
5) Wait for approval, then merge

---

## 7) Style / editing tips (so changes don’t break)

- Preview locally after each small change (refresh the browser)
- Keep file paths consistent (images usually go in `assets/`)
- If you move/rename files, double-check links and image paths
- Make commits small and readable (one change per commit when possible)

---

## Getting help

If you’re stuck, share:
- a screenshot of what you see in the browser
- your terminal output (copy/paste is fine)
- what you expected to happen

Someone can usually diagnose it fast.