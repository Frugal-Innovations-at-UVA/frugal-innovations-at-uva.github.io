/* /js/newsletter-view.js
   Renders one newsletter PDF inline with pdf.js. Every page is drawn to a
   canvas scaled to the container width, and any hyperlinks in the PDF are
   overlaid as real clickable anchors. Links are also collected into a
   "Links from this issue" list below the document as a fallback. */

(function () {
    var PDFJS_VERSION = "3.11.174";

    function getId() {
        var params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    function formatDate(iso) {
        var d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }

    function setStatus(msg) {
        var el = document.querySelector("[data-nl-status]");
        if (el) el.textContent = msg;
    }

    function fail(msg) {
        setStatus(msg);
        var titleEl = document.querySelector("[data-nl-title]");
        if (titleEl && titleEl.textContent === "Loading…") titleEl.textContent = "Newsletter not found";
    }

    async function loadManifestEntry(id) {
        var res = await fetch("/newsletter/newsletters.json", { cache: "no-store" });
        var items = await res.json();
        return items.find(function (it) { return it.slug === id; }) || null;
    }

    function renderLinkList(urls) {
        if (!urls.length) return;
        var wrap = document.querySelector("[data-nl-links]");
        var list = document.querySelector("[data-nl-links-list]");
        if (!wrap || !list) return;

        urls.forEach(function (url) {
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
            li.appendChild(a);
            list.appendChild(li);
        });
        wrap.hidden = false;
    }

    async function renderPdf(pdfUrl) {
        var pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
            fail("Could not load the PDF viewer. Use the Download PDF button above.");
            return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf.worker.min.js";

        var docEl = document.querySelector("[data-nl-doc]");

        var pdf;
        try {
            pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        } catch (e) {
            fail("This newsletter could not be loaded. Use the Download PDF button above.");
            return;
        }

        docEl.innerHTML = "";

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var maxCssWidth = 900;
        var seenUrls = Object.create(null);
        var orderedUrls = [];

        for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            var page = await pdf.getPage(pageNum);
            var baseViewport = page.getViewport({ scale: 1 });

            var cssWidth = Math.min(docEl.clientWidth || maxCssWidth, maxCssWidth);
            var scale = cssWidth / baseViewport.width;
            var viewport = page.getViewport({ scale: scale });

            var pageWrap = document.createElement("div");
            pageWrap.className = "nl-doc__page";
            pageWrap.style.width = viewport.width + "px";
            pageWrap.style.height = viewport.height + "px";

            var canvas = document.createElement("canvas");
            canvas.width = Math.floor(viewport.width * dpr);
            canvas.height = Math.floor(viewport.height * dpr);
            canvas.style.width = viewport.width + "px";
            canvas.style.height = viewport.height + "px";

            var ctx = canvas.getContext("2d");
            pageWrap.appendChild(canvas);
            docEl.appendChild(pageWrap);

            await page.render({
                canvasContext: ctx,
                viewport: viewport,
                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
            }).promise;

            // Clickable link overlay
            var annotations = await page.getAnnotations({ intent: "display" });
            annotations.forEach(function (a) {
                if (a.subtype !== "Link" || !a.url) return;

                if (!seenUrls[a.url]) {
                    seenUrls[a.url] = true;
                    orderedUrls.push(a.url);
                }

                var r = viewport.convertToViewportRectangle(a.rect);
                var x1 = Math.min(r[0], r[2]);
                var y1 = Math.min(r[1], r[3]);
                var w = Math.abs(r[2] - r[0]);
                var h = Math.abs(r[3] - r[1]);

                var link = document.createElement("a");
                link.className = "nl-doc__link";
                link.href = a.url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.style.left = x1 + "px";
                link.style.top = y1 + "px";
                link.style.width = w + "px";
                link.style.height = h + "px";
                link.setAttribute("aria-label", "Open link: " + a.url);
                pageWrap.appendChild(link);
            });
        }

        renderLinkList(orderedUrls);
    }

    async function init() {
        var id = getId();
        if (!id) {
            fail("No newsletter specified.");
            return;
        }

        var entry;
        try {
            entry = await loadManifestEntry(id);
        } catch (e) {
            entry = null;
        }

        if (!entry) {
            fail("This issue isn't listed in /newsletter/newsletters.json.");
            return;
        }

        var heading = entry.issue ? entry.title + " — " + entry.issue : entry.title;
        document.title = heading + " | FISH at UVA";

        var titleEl = document.querySelector("[data-nl-title]");
        var metaEl = document.querySelector("[data-nl-meta]");
        var actionsEl = document.querySelector("[data-nl-actions]");
        var dlEl = document.querySelector("[data-nl-download]");

        if (titleEl) titleEl.textContent = heading;
        if (metaEl) metaEl.textContent = formatDate(entry.date);
        if (dlEl && entry.pdf) dlEl.href = entry.pdf;
        if (actionsEl && entry.pdf) actionsEl.hidden = false;

        if (!entry.pdf) {
            fail("No PDF is attached to this issue yet.");
            return;
        }

        renderPdf(entry.pdf);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
