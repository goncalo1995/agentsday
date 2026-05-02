import type { Metadata } from "next";
import Link from "next/link";
import { Link2 } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "éFacil — Creator Travel Affiliate Platform",
  description: "Create travel posts, compare Viator alternatives, and track slot-level affiliate performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <meta name="talentapp:project_verification" content="666c8033e6501691f9a4568b19d1da069f6dfe846aaa4691e8f3f4169b0957d04ea0c464a7520c8f62cef6694a1cfec0036cc90d2fa42cc7c918b5bf826237ed"></meta>
      </head>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <span className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-sm">
                <Link2 className="w-4 h-4 text-white" />
              </span>
              <span className="font-semibold text-base tracking-tight">éFacil</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/discover"
                className="text-sm font-medium text-muted hover:text-foreground px-4 py-2 rounded-full hover:bg-surface-alt transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/saved"
                className="text-sm font-medium text-muted hover:text-foreground px-4 py-2 rounded-full hover:bg-surface-alt transition-colors"
              >
                Saved Deals
              </Link>
              <Link
                href="/posts"
                className="text-sm font-medium text-muted hover:text-foreground px-4 py-2 rounded-full hover:bg-surface-alt transition-colors"
              >
                Posts
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
