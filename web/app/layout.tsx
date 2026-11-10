import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Asisten K3 Peledakan Tambang",
  description:
    "Chatbot panduan keselamatan kerja peledakan tambang terbuka batubara berbasis RAG dengan sitasi resmi Kepmen ESDM 1827 dan SOP site.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground" suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
