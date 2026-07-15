// app/layout.tsx
import "./globals.css";
import QueryProvider from "@/lib/query-provider";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`}>
      <body className={plusJakartaSans.className}>
        <div className="flex min-h-screen w-full bg-background text-zinc-800 antialiased overflow-hidden">
          {/* Sidebar Keuangan */}
          {/* <Sidebar /> */}

          {/* Sisi Kanan: Header + Konten Halaman Aktif */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <Header /> */}

            {/* Tempat Masuknya isi dari page.tsx */}
            <div className="flex-col flex overflow-hidden w-full mx-auto">
              <QueryProvider>{children}</QueryProvider>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}