import { League_Spartan } from "next/font/google";
import "./globals.css";

// Load your specific font
const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-league-spartan",
});

export const metadata = {
  title: "HU Digital Twin",
  description: "Facilities Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${leagueSpartan.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}