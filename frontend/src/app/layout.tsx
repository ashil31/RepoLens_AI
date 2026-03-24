import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { getSiteUrl } from "@/lib/site-url";
import { OG_IMAGE } from "@/lib/seo";

const siteUrl = getSiteUrl();
const siteName = "RepoLens";

const defaultDescription =
  "RepoLens analyzes GitHub repositories with AI: architecture notes, dependency graphs, semantic code search, and living documentation—so your team ships faster with clarity.";

const defaultKeywords = [
  "RepoLens",
  "AI codebase analysis",
  "repository analysis",
  "code documentation",
  "dependency graph",
  "semantic code search",
  "GitHub integration",
  "software architecture",
  "developer tools",
  "code intelligence",
  "repository insights",
  "AI documentation",
  "codebase understanding",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — AI Codebase Intelligence & Repository Analysis`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: defaultKeywords,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  /** Defaults for all routes; `/` and others override title/description/url only — images stay here. */
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    url: siteUrl,
    title: `${siteName} — AI Codebase Intelligence & Repository Analysis`,
    description: defaultDescription,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — AI Codebase Intelligence`,
    description: defaultDescription,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
