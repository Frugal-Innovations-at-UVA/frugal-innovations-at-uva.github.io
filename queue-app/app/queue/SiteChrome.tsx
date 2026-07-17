"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type ChromeWindow = Window & {
  initNav?: () => void;
  initPromoBanner?: () => void;
};

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scriptsReady, setScriptsReady] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scriptsReady < 2) return;
    let cancelled = false;

    async function load() {
      const [headerHtml, footerHtml, contactHtml] = await Promise.all([
        fetch("/partials/site-header.html").then((r) => r.text()),
        fetch("/partials/site-footer.html").then((r) => r.text()),
        fetch("/partials/contact-strip.html").then((r) => r.text()),
      ]);

      if (cancelled) return;

      if (headerRef.current) headerRef.current.innerHTML = headerHtml;
      if (footerRef.current) footerRef.current.innerHTML = footerHtml;
      if (contactRef.current) contactRef.current.innerHTML = contactHtml;

      const yearEl = document.getElementById("year");
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());

      const win = window as ChromeWindow;
      win.initNav?.();
      win.initPromoBanner?.();
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [scriptsReady]);

  return (
    <>
      <Script
        src="/js/nav.js"
        strategy="afterInteractive"
        onReady={() => setScriptsReady((n) => n + 1)}
      />
      <Script
        src="/js/promo.js"
        strategy="afterInteractive"
        onReady={() => setScriptsReady((n) => n + 1)}
      />
      <div ref={headerRef} />
      {children}
      <div ref={contactRef} />
      <div ref={footerRef} />
    </>
  );
}
