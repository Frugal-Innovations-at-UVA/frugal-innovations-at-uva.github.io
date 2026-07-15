# Style Guide — FISH Website

This documents the visual design system in `css/styles.css` so new pages/components stay consistent with the rest of the site. It covers colors, typography, spacing, radii, buttons, cards, shadows, transitions, and responsive behavior — with the exact CSS variables/values to reuse.

If you're new to CSS: the `:root { ... }` block at the top of `css/styles.css` defines reusable "tokens" (variables) like `--accent` or `--radius-lg`. Always prefer `var(--token-name)` over typing a raw color/number, so a future palette or spacing change only has to happen in one place.

---

## 1) Colors

All defined in `:root` (`css/styles.css` lines 8–56).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFAF6` | Page background (warm off-white) |
| `--panel` | `#08344E` | Dark navy — headers/footers of dark sections, primary buttons, footer text base |
| `--accent` | `#E65925` | Orange — CTAs, eyebrows/labels, links, highlights |
| `--text` | `#08344E` | Default body/heading text (same navy as `--panel`) |
| `--muted` | `rgba(8,52,78,0.78)` | Secondary text (paragraphs, descriptions) |
| `--muted2` | `rgba(8,52,78,0.65)` | Tertiary text (meta labels, timestamps) |
| `--border` | `rgba(8,52,78,0.14)` | Card/panel borders |
| `--surface` | `#ffffff` | Card backgrounds, button-on-dark backgrounds |
| `--hover-tint` | `rgba(8,52,78,0.05)` | Subtle hover background (e.g. dropdown links) |
| `--card-bg` | `#C7D1D5` | Legacy/alternate card background |
| `--mat` | `rgba(127,182,204,0.65)` | Event card "mat" tint |

**Text-on-dark:** white text is applied directly as `#fff` (not a variable) throughout the stylesheet — e.g. `.title-xl--light`, hero titles on `--panel`/`--accent` backgrounds, footer disclaimer uses literal `#000`. Follow this existing convention: use `#fff` / `rgba(255,255,255,0.8x)` for text sitting on `--panel` or `--accent` backgrounds, and `var(--text)`/`var(--muted)` for text on `--bg`/`--surface`.

**Common translucent overlays built from the navy:**
- `rgba(8, 52, 78, 0.04)` — very light section tint (`*-section--tint`, `.mainpage-values`, `.makeathon-how`)
- `rgba(8, 52, 78, 0.06)` — placeholder media backgrounds, callouts
- `rgba(8, 52, 78, 0.08)` / `0.10` — hover backgrounds, image placeholders

**Shadow color:** shadows are near-black or navy-tinted, never pure black at full opacity:
- Standard card shadow: `0 12px 28px rgba(8, 52, 78, 0.06–0.08)`
- Elevated/hover shadow: `0 14–16px 34–40px rgba(0,0,0,0.08–0.14)`
- Accent button glow: `0 10px 24px rgba(230, 89, 37, 0.22)` (donate accent button only)

---

## 2) Typography

**Font:** `--font: "Roboto", sans-serif`, loaded via `@import` at the top of the file as Inter weights 400–800 (note: the `@import` pulls Inter, but `--font` is actually set to Roboto — see [Known Inconsistencies](#7-known-inconsistencies--things-to-watch) below).

### Font weights (tokens)
| Token | Value | Use |
|---|---|---|
| `--fw-body` | 400 | Body copy (implicit default) |
| `--fw-medium` | 500 | Hero titles (`.mainpage-hero__title`), donate Zelle values |
| `--fw-semibold` | 600 | Nav links, subtitles, `.accent` inline text, contact lines |
| `--fw-bold` | 700 | Buttons, labels, timeline lists |
| `--fw-extrabold` | 800 | All section/card headings, eyebrows, `<strong>` |

Rule of thumb: **headings and buttons are extrabold or bold; body text is regular or semibold; nothing uses weights below 400 or above 800.**

### Type scale
Headings mostly use `clamp(min, preferred-vw, max)` so they scale fluidly with viewport width instead of jumping at breakpoints.

| Role | Size | Weight | Example classes |
|---|---|---|---|
| Page hero title (largest) | `clamp(42–58px, 5.2–6vw, 80–84px)`, line-height ~1.0 | extrabold | `.mainpage-hero__title`, `.projects-hero__title`, `.aboutpage-hero__title`, `.competitions-hero__title`, `.makeathon-hero__title` |
| Section title (large) | `clamp(28–34px, 4vw, 52–62px)`, line-height 1.02–1.08 | extrabold | `.title-lg`, `.mainpage-section-heading__title`, `.mainpage-process__title`, `.donate-section-title` |
| `.title-xl` (utility) | `clamp(50px, 5.3vw, 76px)` | extrabold | Generic oversized title helper |
| Card/subsection title | 24–30px, line-height ~1.1–1.2 | extrabold | `.mainpage-value-card__title`, `.team-card__name`, `.donate-card-title`, `.aboutpage-mini-card__title` |
| Eyebrow / kicker (label above a heading) | 12–14px, uppercase, `letter-spacing: 0.1–0.16em` | extrabold | `.mainpage-section-heading__eyebrow`, `.donate-kicker`, `.competitions-eyebrow`, `.about-officers-eyebrow` |
| Body copy | 16–20px, line-height 1.65–1.9 | regular/semibold | `.mainpage-intro__copy p` (20px), `.projects-intro__copy p` (18px), `p` default (line-height 1.65) |
| Small meta text | 13–15px | semibold | `.blog-card__meta`, `.team-card__meta`, `.footer-copy` |

**Letter-spacing:** large display headings use tight negative tracking, `-0.01em` to `-0.03em`. Uppercase eyebrows/labels use wide positive tracking, `0.1em`–`0.16em`.

**Line-height by role:**
- Big display headings: `1.0`–`1.1` (tight)
- Sub-headings/card titles: `1.15`–`1.2`
- Body paragraphs: `1.65`–`1.9` (generous, for readability)

---

## 3) Border Radius

No literal `border-radius` values should be added ad hoc — use these tokens:

| Token | Value | Typical use |
|---|---|---|
| `--radius-sm` | `10px` | Small UI chips, nav-toggle button, `.event-image__viewport` |
| `--radius-md` | `14px` | Dropdown panels, nested elements |
| `--radius-lg` | `20px` | Mid-size cards |
| `--radius-xl` | `24px` | Large cards/panels |
| `--radius-pill` | `999px` | **All pill buttons** (`.btn`, `.mainpage-btn`, `.donate-btn`, `.*-btn-accent/outline`, promo links, social/close icon circles) |

**In practice**, most cards use one-off values in the `18px`–`28px` range rather than the tokens above (`18px` is the most common card radius; `20–24px` for feature/CTA cards; `28px` for large CTA panels like `.aboutpage-team`/`.aboutpage-collab`). Treat `18px` as the de-facto "standard card radius" and `999px` (`--radius-pill`) as the only radius ever used for buttons and circular icons.

Small inline elements (close buttons, dots, image viewports) use `8–16px` or `50%` for perfect circles (`.aboutpage-timeline__marker`, `.promo-dot`, `.team-card__img` is a square with `object-fit: cover`, not circular).

---

## 4) Buttons

There are several button "families" (`.btn`, `.mainpage-btn`, `.donate-btn`, `.projects-btn-*`, `.makeathon-btn-*`, `.competitions-btn-*`, `.blog-btn-*`, `.collabs-btn-accent`, `.aboutpage-*__button`) — they're duplicated per page/section rather than one shared class, but they all follow the **same visual contract**:

```css
display: inline-flex;
align-items: center;
justify-content: center;
padding: 12–13px 18–24px;
border-radius: 999px;              /* always a pill */
font-weight: var(--fw-bold);       /* 700 */
border: 1px solid transparent;     /* or a visible border for outline variants */
```

### Hover behavior (the "lift")
Every button and most clickable cards use the same micro-interaction: **rise 1px on hover**, on a fast, snappy transition:

```css
.btn:hover,
.mainpage-btn:hover,
.donate-btn:hover,
.social-icon:hover { transform: translateY(-1px); }
```

- Duration: **120ms** (`--duration: 120ms`, or literal `120ms ease`) — this is the standard transition speed used almost everywhere (53 occurrences in the stylesheet). A couple of hover-lift cards use slightly slower easing: `.blog-card:hover` (`160ms`) and the promo banner slide (`260ms`) — those are deliberate exceptions for bigger surfaces.
- Property list on interactive elements: `transform`, plus whichever of `background`, `color`, `border-color`, `box-shadow`, `opacity` actually changes on hover, e.g.:
  ```css
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease;
  ```
- Outline-style buttons (transparent bg, white/navy border) additionally get a faint background wash on hover: `background: rgba(255,255,255,0.08)`.
- Nothing scales or rotates on hover — the **only** transform used site-wide is `translateY(-1px)` (cards that lift further, like `.blog-card`, use `-2px` as a deliberately bigger card-level hover, not a button).

### Button color variants
| Variant | Background | Text | Border |
|---|---|---|---|
| Primary / light-on-dark (`.btn.primary`, `*-btn-light`) | `var(--panel)` or `var(--surface)` | white or `var(--panel)` | matches background |
| Accent (`*-btn-accent`) | `var(--accent)` | `#fff` | `var(--accent)` |
| Outline (on dark sections, `*-btn-outline`) | transparent | `#fff` | `rgba(255,255,255,0.82)` |

### Minimum tap target
Buttons that need a guaranteed height set `min-height: 46–48px` (`.mainpage-btn`, `.aboutpage-hero__button`, `.donate-btn`) even though pill padding alone would usually be close to that already — keep this for touch accessibility on new buttons.

---

## 5) Cards & Shadows

Typical "card" recipe used across stat cards, value cards, team cards, donate cards, timeline items, etc.:

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 18px;                          /* or 20–28px for larger panels */
padding: 22–28px;
box-shadow: 0 12px 28px rgba(8, 52, 78, 0.05–0.08);
```

Variants:
- **Accent top border**: `.mainpage-value-card` adds `border-top: 4px solid var(--accent)`.
- **On dark background**: swap `var(--surface)` for translucent white, e.g. `.mainpage-step-card` uses `background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14)`.
- **Hover-lift cards** (clickable, e.g. `.blog-card`): add `transform: translateY(-2px)` and deepen the shadow on hover, over `160ms ease`.
- **Image/media shadows** (photos, framed screenshots) are darker/neutral: `0 16px 40px rgba(0,0,0,0.10–0.14)`, distinct from the navy-tinted card shadows above.

---

## 6) Layout & Spacing

- **Max content width**: `--max: 1200px`, centered via `.container` (`width: min(var(--max), 100% - 2*var(--pad))`).
- **Page gutter**: `--pad: 24px`.
- **Section vertical padding**: almost always `clamp(min, Nvw, max)`, commonly `clamp(64px, 8vw, 108–110px)` for standard sections, `clamp(84px, 11vw, 146–148px)` for hero sections, `clamp(54px, 7vw, 84px)` for CTA bands.
- **Grid gaps**: 18–24px for tight card grids, `clamp(28px, 4vw, 56px)` for large two-column split layouts (copy + media).
- **Header height**: `--header-h: 92px`, fixed/sticky; pages compensate with `padding-top: var(--header-h)`.
- **Transitions**: `--duration: 120ms` is the shared default; see §4.

### Breakpoints
Consistent across the file (no custom framework, plain `@media` queries):
- `1360px` — nav collapses to hamburger menu
- `1100px` — 3–4 column grids drop to 2 columns
- `980px`–`1000px` — two-column hero/split sections stack to 1 column
- `900px` — feature/timeline split sections stack; 3-col grids → 1 col
- `700px`–`820px` — mobile: button groups go full-width/stacked, hero padding shrinks
- `640px` — blog grid → 1 column, donate hero/section padding tightens

---

## 7) Known Inconsistencies (things to watch)

Found while re-auditing the stylesheet — not necessarily bugs, but worth knowing so new code doesn't accidentally "fix" one instance and leave the rest inconsistent:

1. **Font mismatch**: the `@import` at the top loads **Inter**, but `--font` is set to `"Roboto", sans-serif` — Inter is downloaded but never actually used. If this wasn't intentional, either switch `--font` to `"Inter", sans-serif` or drop the `@import`.
2. **`#fff` / `#000` used as literals** instead of a token, in ~60 places. This matches the existing convention (there's no `--on-dark` token defined), so it's *not* wrong, just worth knowing if a future dark-mode/theming pass happens — those literals would all need to be swapped by hand.
3. **Border-radius values are mostly hand-picked** per component (18px, 20px, 22px, 24px, 28px all appear for "cards") rather than consistently pulling from `--radius-lg`/`--radius-xl`. The tokens exist but are under-used outside of buttons. New cards should default to **18px** to match the majority.
4. **Section-family classes are duplicated per page** (`.mainpage-btn`, `.projects-btn-accent`, `.donate-btn`, `.makeathon-btn-accent`, `.competitions-btn-accent`, `.blog-btn-accent` all define the *same* pill-button look independently). This is a maintenance cost — if the button style ever needs to change, it currently has to change in ~6 places. Consider consolidating onto the base `.btn`/`.mainpage-btn` classes in a future cleanup, but that's a deliberate refactor, not something to do incidentally while adding a new page.
5. Two commented-out CSS blocks remain in the file (an alternate `.promo-banner-inner` responsive rule around line 524, and a gradient background for `.makeathon-subhero--sponsor` around line 1729, plus a hero background-image rule around line 1465) — dead code kept for reference; fine to leave, but don't build on top of them assuming they're active.

---

## 8) Quick checklist for new components

- [ ] Colors come from a `var(--token)`, not a new hex value (except `#fff`/`#000` for text-on-dark/light per existing convention).
- [ ] Buttons: pill radius (`999px`), bold weight, `translateY(-1px)` on hover, `120ms ease` transition.
- [ ] Cards: `18px` radius, `1px solid var(--border)`, navy-tinted shadow (`rgba(8,52,78,0.05–0.08)`).
- [ ] Headings: extrabold weight, tight negative letter-spacing, `clamp()` for fluid sizing.
- [ ] Eyebrows/labels: uppercase, extrabold, wide letter-spacing (`0.1–0.16em`), `var(--accent)` color.
- [ ] Section padding: `clamp(64px, 8vw, 108px)` unless it's a hero (`clamp(84px, 11vw, 146px)`) or CTA band (`clamp(54px, 7vw, 84px)`).
- [ ] Add responsive rules at the existing breakpoints (980px / 900px / 700px) rather than inventing new ones.
