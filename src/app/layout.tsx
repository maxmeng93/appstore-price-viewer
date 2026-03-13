import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Store Price Viewer - 全球内购价格查询",
  description: "查询 App Store 应用在全球各地区的内购价格对比",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
