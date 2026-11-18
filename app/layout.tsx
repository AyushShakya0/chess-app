import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Cinzel, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sovereign Chess - Grandmaster Chess Platform",
  description:
    "Next-generation chess platform featuring celebrity AI bots, pass & play dual boards, boss mode, tactical training, and real-time engine analysis. Think. Move. Win.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${plusJakartaSans.variable} ${cinzel.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#0d0f12] text-slate-100 font-sans antialiased selection:bg-[#d4a359] selection:text-black">
        {children}
      </body>
    </html>
  );
}
