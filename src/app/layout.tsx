import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WanderLust - Find Your Perfect Stay",
    template: "%s | WanderLust",
  },
  description: "Discover unique accommodations around the world. Book your perfect stay with WanderLust.",
  keywords: ["travel", "accommodation", "bookings", "stays", "vacation", "rentals"],
  authors: [{ name: "WanderLust" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wanderlust.com",
    siteName: "WanderLust",
    title: "WanderLust - Find Your Perfect Stay",
    description: "Discover unique accommodations around the world.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WanderLust - Find Your Perfect Stay",
    description: "Discover unique accommodations around the world.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}