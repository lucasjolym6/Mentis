import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Mentis",
  description: "SaaS d’intelligence cognitive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-[var(--bg)] text-[var(--fg)]`}>
        <ThemeProvider>
          <div className="grid grid-rows-[56px_1fr] grid-cols-[224px_1fr] min-h-screen">
            <div className="col-span-2 row-[1/2]">
              <Topbar />
            </div>
            <div className="row-[2/3]">
              <Sidebar />
            </div>
            <main className="row-[2/3] col-[2/3] p-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
