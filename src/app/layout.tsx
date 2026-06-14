import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ParticleBackground from "@/components/ParticleBackground";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Attendance System | AI Face Recognition",
  description:
    "A modern, AI-powered attendance system using facial recognition technology. Secure, fast, and contactless attendance marking.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a1a] text-white">
        <ParticleBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
