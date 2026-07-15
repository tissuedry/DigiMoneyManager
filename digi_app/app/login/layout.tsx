// app/login/layout.tsx
// Override font untuk halaman login — tetap pakai system font
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {children}
    </div>
  );
}
