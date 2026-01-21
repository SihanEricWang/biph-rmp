// app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Rate My Teacher",
  description: "BIPH internal RMT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
