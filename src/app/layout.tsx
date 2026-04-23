import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import CookieProvider from "@/utils/CookieProvider";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

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
    <html lang="en" className={pretendard.variable}>
      <body>
        <CookieProvider>{children}</CookieProvider>
      </body>
    </html>
  );
}
