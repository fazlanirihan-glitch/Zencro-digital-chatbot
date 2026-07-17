import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZenCro Digital | Build. Automate. Grow.",
  description: "ZenCro Digital designs premium websites, develops custom software portals, and engineers intelligent AI chatbot and WhatsApp CRM automation systems.",
  keywords: "web development, custom software, AI chatbots, CRM automation, WhatsApp automation, SEO, Maharashtra, India, Rihan Fazlani",
  authors: [{ name: "Rihan Fazlani" }],
  openGraph: {
    title: "ZenCro Digital | Build. Automate. Grow.",
    description: "Premium web development and operations automation solutions.",
    url: "https://www.zencrodigital.in",
    siteName: "ZenCro Digital",
    locale: "en_US",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className={`${inter.variable} ${outfit.variable} min-h-full bg-[#070b13] flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
