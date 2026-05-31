import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "uPortal | Dashboard",
  description: "Secure and modern portal dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
