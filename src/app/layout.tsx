import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThemeProvider } from "@/src/components/theme/ThemeProvider";
import { AdminAuthProvider } from "@/src/context/AdminAuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proyecto Z — Panel Administrativo",
  description: "Portal de administración del sistema Explorador de Capacidad Eléctrica RD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdminAuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ style: { fontFamily: "inherit" } }}
          />
        </ThemeProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
