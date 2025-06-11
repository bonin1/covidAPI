import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kosovo COVID-19 Dashboard",
  description: "Real-time COVID-19 statistics and monitoring for Kosovo",
  keywords: "COVID-19, Kosovo, statistics, health, vaccination, hospitals",
  authors: [{ name: "Kosovo COVID Tracking Team" }],
  openGraph: {
    title: "Kosovo COVID-19 Dashboard",
    description: "Real-time COVID-19 statistics and monitoring for Kosovo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
