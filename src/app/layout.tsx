import type { Metadata } from "next";
import "./globals.css";
import CookieProvider from "@/utils/CookieProvider";

export const metadata: Metadata = {
  title: "BIM Search",
  description: "BIM Search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CookieProvider>{children}</CookieProvider>
      </body>
    </html>
  );
}
