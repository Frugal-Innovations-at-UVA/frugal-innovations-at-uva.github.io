# Events Page — How to Add a New Event

This Events page uses **slug-based event cards**, so you **never** have to renumber old events. To add a new event, you copy one card block, paste it into the Events grid, and edit the text + image path.

---

## Files you’ll touch

- **HTML:** `/events/index.html` (add the new event card here)
- **Images:** `/assets/events/` (put your event flyer/poster here)
- **JS (already set up):** `/js/events.js` (controls the “More info” overlay)

> You should not need to edit CSS or JS to add a normal event.

---

## Where to paste new events (HTML)

Open: `/events/index.html`

Find the Events grid (this exact block):

    <div class="events-grid">
      <!-- event cards live here -->
    </div>

Paste the new event `<article>` **inside** that `.events-grid` (usually at the top if it’s the next upcoming event).

---

## Event Card Template (copy/paste)

Copy this entire block and paste it as a new card inside `.events-grid`:

    <article class="event-card" data-event data-slug="fall-bake-sale">
        <div class="event-front" data-event-front>
            <div class="event-image">
                <div class="event-image__viewport">
                    <img src="/assets/events/fall-bake-sale.png" alt="Fall Bake Sale flyer" loading="lazy" />
                </div>
            </div>

            <h3 class="event-title">Fall Bake Sale!!</h3>
            <p class="event-meta">October 18 | 3:00pm</p>
            <p class="event-meta">Outside of Rice Hall</p>

            <button class="event-btn" type="button" data-event-open aria-expanded="false">
                More info
            </button>
        </div>

        <div class="event-details" data-event-details aria-hidden="true">
            <button class="event-close" type="button" data-event-close aria-label="Close">×</button>

            <h3 class="event-title">Fall Bake Sale!!</h3>

            <p class="event-desc">
                Help us raise funds to purchase equipment and tools during our development process.
                Come say hi and grab something sweet!
            </p>

            <p class="event-meta">October 18<br>3:00pm - 6:00pm<br>Outside of Rice Hall</p>

        </div>
    </article>

---

## What you MUST edit in the template

### 1) `data-slug` (unique ID — no renumbering)
Change:

    data-slug="jaws-watch-party"

to something unique and descriptive, like:

- `data-slug="spring-gbm-2026"`
- `data-slug="fusion-workshop"`
- `data-slug="guest-lecture-malek"`

**Slug rules**
- Use **lowercase**
- Use **hyphens** instead of spaces
- Only letters/numbers/hyphens
- Must be **unique** across all event cards

If two events share the same slug, the overlay behavior can break.

---

### 2) Image `src` + `alt`
Update:

    <img src="/assets/events/test.png" alt="Jaws Watch Party poster" loading="lazy" />

- `src` should point to your real image file in `/assets/events/`
- `alt` should describe the image/event (accessibility)

Example:

    <img src="/assets/events/spring-gbm-2026.png" alt="Spring GBM flyer" loading="lazy" />

---

### 3) Front view (the “card face”)
This is what people see before clicking **More info**:

    <h3 class="event-title">Event Name</h3>
    <p class="event-meta">Date | Time</p>
    <p class="event-meta">Building | Room</p>

Keep this short. The front view helps define the card’s layout.

---

### 4) Details view (overlay after clicking “More info”)
This is what appears after clicking **More info**:

- Event title (again)
- Short description
- Formatted date/time/location block (uses `<br>` line breaks)

Example format:

    <p class="event-desc">Short description…</p>
    <p class="event-meta">Date<br>Time range<br>Building<br>Room</p>

If the details content is longer than the card height, it will scroll inside the card.

---

## Adding the flyer/poster image

1) Put the image file here:
- `/assets/events/`

2) Use a web-friendly format:
- `.png` or `.jpg`

3) Reference it in the template `img src`.

**Tip:** If your image has huge transparent padding, it can look “small” inside the square. Trim the image in an editor if needed.

**Tip:** If the image is not a square, only a square portion will be shown. By default, it will crop the bottom edge off, so if needed crop the image yourself to keep information that you want.

---

## Troubleshooting

### The “More info” button doesn’t work
- Make sure `/events/index.html` includes:

    <script src="/js/events.js"></script>

- Make sure your card still includes:
    - `data-event`
    - `data-slug="..."`
    - `data-event-open` on the More info button
    - `data-event-close` on the close button
    - `data-event-front` and `data-event-details` wrappers

### Two cards behave weirdly / wrong info opens
- You probably duplicated a card and forgot to change `data-slug`.
- Give every event a unique slug.

### The image looks wrong or too small
- The layout uses `object-fit: cover` (crops).
- The image defaults to showing the top and cropping the bottom.
- Consider manually trimming the image if you need to see the bottom of the poster
- If it still looks off, your image likely has lots of transparent/empty padding—trim the file.

