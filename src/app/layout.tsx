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
  icons: {
    icon: [
      { url: "/smart_attendance.png", type: "image/png" },
    ],
    shortcut: [{ url: "/smart_attendance.png", type: "image/png" }],
    apple: [{ url: "/smart_attendance.png", type: "image/png" }],
  },
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
        {/* Desktop Background Image (visible above 480px) */}
        <div
          className="fixed inset-0 z-0 pointer-events-none hidden sm:block"
          style={{
            backgroundImage: "url('/background_image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15,
          }}
        />
        {/* Mobile Background Image (visible below 480px) */}
        <div
          className="fixed inset-0 z-0 pointer-events-none sm:hidden"
          style={{
            backgroundImage: "url('/mobile_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.2,
          }}
        />
        <ParticleBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}