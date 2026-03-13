import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";

// 1. Configure the font to use a CSS variable
const leagueSpartan = League_Spartan({ 
  subsets: ["latin"],
  variable: "--font-league-spartan", // Create a custom CSS variable
  display: "swap",
});

export const metadata: Metadata = {
  title: "HU Digital Twin - Login",
  description: "Digital Twin dashboard for Habib University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 2. Inject the CSS variable into the body */}
      <body className={leagueSpartan.variable}>
        {children}
      </body>
    </html>
  );
}