import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Store Price Viewer",
  description: "Compare App Store app prices across regions worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
