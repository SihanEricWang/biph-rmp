import "./globals.css";

export const metadata = {
  title: "Rate My Teacher",
  description: "Internal RMT for BIPH",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
