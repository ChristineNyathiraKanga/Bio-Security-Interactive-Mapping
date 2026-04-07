import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Victory Farms - Biosecurity Site Map",
  description: "Interactive biosecurity zone mapping for Victory Farms aquaculture operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Preconnect to Mapbox tile servers*/}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link rel="preconnect" href="https://tiles.mapbox.com" />
        <link rel="dns-prefetch" href="https://tiles.mapbox.com" />
        {/* Preconnect to CloudFront CDN for GeoJSON + orthophoto tiles */}
        <link rel="preconnect" href="https://d235u1672zhp9j.cloudfront.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://d235u1672zhp9j.cloudfront.net" />
        <Analytics />
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
    
  );
}
