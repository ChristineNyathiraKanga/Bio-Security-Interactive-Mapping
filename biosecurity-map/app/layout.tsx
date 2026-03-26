import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
