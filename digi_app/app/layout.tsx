// app/layout.tsx
import "./globals.css"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen w-full bg-background text-zinc-800 antialiased overflow-hidden">
          
          {/* Sidebar Keuangan */}
          {/* <Sidebar /> */}
        

          {/* Sisi Kanan: Header + Konten Halaman Aktif */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <Header /> */}
            

            {/* Tempat Masuknya isi dari page.tsx */}
            <div className="flex-col flex overflow-hidden w-full mx-auto">
              {children}
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}