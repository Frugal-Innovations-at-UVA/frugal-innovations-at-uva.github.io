import "./queue.css";
import SiteChrome from "./SiteChrome";

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- intentionally the live FISH stylesheet, not a local asset */}
      <link rel="stylesheet" href="/css/styles.css" />
      <link rel="icon" type="image/png" href="/assets/brand/fish-main.png" />
      <SiteChrome>
        <main className="page">{children}</main>
      </SiteChrome>
    </>
  );
}
