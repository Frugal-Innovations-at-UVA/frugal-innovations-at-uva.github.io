# FISH Website (Frugal Innovations in Sustainable Healthcare @ UVA)

This repository contains the public website for **Frugal Innovations in Sustainable Healthcare (FISH)** at the University of Virginia.

**Live website:** https://frugal-innovations-at-uva.github.io

If you’re new to coding: you’ll mostly be editing text in `.html` files, adjusting styling in `.css`, and adding images in `assets/`. You do *not* need to be an expert to help.

---

## What’s in this repo?

Common folders/files you’ll see:

- `index.html` — homepage
- folders like `projects/`, `about/`, etc. — other pages
- `css/` — styling (colors, spacing, layout)
- `js/` — JavaScript (interactive behavior)
- `assets/` — images, logos, and other media

---

## Run / test the website locally (recommended)

We recommend running a local server so the site behaves the same as GitHub Pages (especially for paths like `/css/styles.css`).

### 1) Open a terminal in the repo root
The “repo root” is the folder that contains `index.html`, `css/`, `js/`, and `assets/`.

### 2) Start the server
    python3 -m http.server 8000

### 3) Open the site in your browser
- Home: http://localhost:8000/
- Example subpage: http://localhost:8000/projects/

### 4) Stop the server
Press **Ctrl + C** in the terminal window where it’s running.

---

## Contributing (how we make changes)

**Please do not edit directly on `main`.**  
Instead: create a branch → make changes → open a Pull Request.

Branch naming convention:

- Use: `name/issue`
- Examples:
    - `fede/fix-navbar-spacing`
    - `grace/update-sponsor-logos`
    - `cooper/add-project-page-2026`

Full step-by-step instructions (including VS Code + IntelliJ cloning and common Git commands) are in:
**`CONTRIBUTING.md`**

---

## Quick “I just want to make a small edit” checklist

1) Create a branch  
   git checkout -b name/issue

2) Run the site locally  
   python3 -m http.server 8000

3) Edit files, refresh the browser to preview

4) Save your work  
   git add .
   git commit -m "Describe what you changed"
   git push -u origin name/issue

5) Open a Pull Request on GitHub

---

## Need help?

If something breaks, share:
- a screenshot of the issue in the browser, and/or
- a screenshot of your terminal output

Someone can help quickly.