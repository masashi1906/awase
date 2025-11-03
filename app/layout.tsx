import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Awase - スムーズなスケジュール調整",
  description:
    "スマホでサクッと時間調整。ドラッグで簡単に空き時間を選択できるスケジュール調整アプリ。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Awase - スムーズなスケジュール調整",
    description:
      "スマホでサクッと時間調整。ドラッグで簡単に空き時間を選択できるスケジュール調整アプリ。",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJP.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
