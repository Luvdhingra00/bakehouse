import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "@/components/Providers";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata = {
  title: "BakeHouse — Fresh bakes, delivered",
  description: "Order cakes, pastries, cookies, breads and more from BakeHouse.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
