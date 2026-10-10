import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "De Classic Hotel · Rooms and a bar in Agric, Ikorodu",
    template: "%s · De Classic Hotel, Ikorodu",
  },
  description:
    "Clean, modern hotel rooms in Agric, Ikorodu, Lagos, with a bar downstairs. Send a reservation request in under a minute. No account, nothing to pay online.",
  applicationName: "De Classic Hotel",
  openGraph: { siteName: "De Classic Hotel", locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#B1ECEC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${bricolage.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the page as scripted before first paint so scroll motion never hides content when JS is off. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
