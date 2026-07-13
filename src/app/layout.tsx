import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const typewriter = localFont({
  src: "../../public/fonts/TravelingTypewriter.otf",
  variable: "--font-sans",
});

const amsterdam = localFont({
  src: "../../public/fonts/AmsterdamTraveling.ttf",
  variable: "--font-amsterdam",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Diaries",
  description: "Tu diario de viajes: guardá tus recuerdos y aventuras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${typewriter.variable} ${amsterdam.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
