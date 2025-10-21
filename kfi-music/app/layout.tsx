import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KFI Music",
  description: "Premium beats with instant delivery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header className="site-header">
            <a href="/" className="brand">
              KFI Music
            </a>
            <nav className="site-nav">
              <a href="/beats">Beats</a>
              <a href="/success">Success</a>
              <a href="/cancel">Cancel</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
