import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo, Unbounded } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import SmoothScroll from "@/components/smooth-scroll";
import SoundProvider from "@/components/sound-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ContentGuard from "@/components/content-guard";
import BootScreen from "@/components/boot-screen";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const display = Unbounded({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display-en",
});

const SITE_URL = process.env.APP_URL || "https://bk-market-five.vercel.app";
const SITE_IMAGE = "https://c.top4top.io/p_3891uufxn1.png";
const SITE_TITLE = "BK MARKET — متجر المنتجات الرقمية الفاخر";
const SITE_DESC =
  "متجر رقمي متخصص في بطاقات الهدايا والفيزا الافتراضية، اشتراكات المنصات العالمية، الحسابات المميزة، وخدمات البرمجة والتصميم. تسليم فوري، دفع آمن، بائعون معتمدون، ودعم مباشر على مدار الساعة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s" },
  description: SITE_DESC,
  applicationName: "BK MARKET",
  keywords: [
    "BK MARKET",
    "متجر رقمي",
    "بطاقات هدايا",
    "فيزا افتراضية",
    "اشتراكات بريميوم",
    "نيترو ديسكورد",
    "حسابات مميزة",
  ],
  icons: [{ url: SITE_IMAGE }],
  openGraph: {
    type: "website",
    siteName: "BK MARKET",
    locale: "ar_AR",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url: SITE_IMAGE,
        width: 1200,
        height: 630,
        alt: "BK MARKET — متجر المنتجات الرقمية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [SITE_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${display.variable} font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <Providers>
          <SoundProvider>
            <BootScreen />
            <ContentGuard />
            <SmoothScroll />
            <Navbar />
            <main className="relative">{children}</main>
            <Footer />
          </SoundProvider>
        </Providers>
      </body>
    </html>
  );
}
