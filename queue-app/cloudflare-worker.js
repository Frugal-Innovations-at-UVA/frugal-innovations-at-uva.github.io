// Cloudflare Worker: proxies /queue* on frugal-innovations.com to the Vercel
// deployment, leaving every other path to fall through to GitHub Pages.
//
// Setup: Cloudflare dashboard -> Workers & Pages -> Create Worker, paste this
// in, deploy, then add a Route on the frugal-innovations.com zone:
//   Route:  frugal-innovations.com/queue*
//   Worker: (this worker)
//
// Replace VERCEL_HOST below with the real deployment domain once it exists
// (the production domain Vercel gives the project, e.g. queue-fish.vercel.app).

const VERCEL_HOST = "queue-fish.vercel.app";

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
