// Cloudflare Worker: proxies /queue* on frugal-innovations.com to the Vercel
// deployment, leaving every other path to fall through to GitHub Pages.
//
// Setup: Cloudflare dashboard -> Workers & Pages -> Create Worker, paste this
// in, deploy, then add TWO Routes on the frugal-innovations.com zone, both
// pointing at this worker:
//   frugal-innovations.com/queue*
//   frugal-innovations.com/_next/*   (Next.js's own JS/CSS bundles live here,
//                                      not under /queue, so this is required
//                                      too or the app won't hydrate/style)

const VERCEL_HOST = "frugal-innovations-at-uva-github-io.vercel.app";

const worker = {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = VERCEL_HOST;
    url.port = "";
    url.protocol = "https:";

    const proxyRequest = new Request(url, request);
    return fetch(proxyRequest);
  },
};

export default worker;
