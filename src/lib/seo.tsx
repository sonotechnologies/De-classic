import type { Branch } from "@/db/schema";
import { displayInternational } from "./phone";

export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (env || "http://localhost:3000").replace(/\/$/, "");
}

/** schema.org Hotel data for one branch, embedded on the home and location pages. */
export function hotelJsonLd(branch: Branch, prices: number[], hotelName = "De Classic Hotel") {
  const naira = prices.map((p) => Math.round(p / 100));
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": `${url}/locations/${branch.slug}#hotel`,
    name: `${hotelName}, ${branch.name}`,
    url: `${url}/locations/${branch.slug}`,
    image: `${url}/opengraph-image`,
    telephone: displayInternational(branch.phone),
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address.split(",")[0]?.trim(),
      addressLocality: "Ikorodu",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
    ...(naira.length
      ? {
          priceRange: `₦${Math.min(...naira).toLocaleString("en-NG")} – ₦${Math.max(...naira).toLocaleString("en-NG")} per night`,
        }
      : {}),
    checkinTime: branch.checkInTime,
    checkoutTime: branch.checkOutTime,
    ...(branch.mapUrl ? { hasMap: branch.mapUrl } : {}),
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Bar", value: true },
      {
        "@type": "LocationFeatureSpecification",
        name: "Free Wi-Fi",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Free parking",
        value: true,
      },
    ],
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
