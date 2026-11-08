import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prin Chess - Grandmaster Chess Platform",
  description: "Next-generation chess platform featuring celebrity AI bots, pass & play dual boards, boss mode, tactical training, and real-time engine analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

