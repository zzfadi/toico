import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVG to ICO Converter | Defined by Jenna",
  description: "Convert your SVG files to ICO format instantly in your browser. Secure, fast, and client-side conversion tool.",
  keywords: "SVG, ICO, converter, favicon, icon, browser tool",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
