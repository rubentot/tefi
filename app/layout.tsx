import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tefi - Finansieringsbekreftelse",
  description: "Sikker elektronisk budgivning og finansieringsbekreftelse med Tefi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className={inter.className}>
        <Providers>  // Wrap here
          {children}
        </Providers>
      </body>
    </html>
  );
}