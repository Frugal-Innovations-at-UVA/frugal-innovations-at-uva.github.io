import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Print Queue | FISH at UVA",
  description: "Print request queue for the FISH at UVA Medical Device Make-A-Thon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
