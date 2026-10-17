import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chill — On fait quoi aujourd'hui ?",
  description:
    "Chill t'aide à décider ce que tu vas faire à Lomé : idées de sorties selon ton mood et ton budget, programmes multi-étapes, collections d'adresses et événements locaux.",
  applicationName: "Chill",
  manifest: "/manifest.webmanifest",
  keywords: ["Lomé", "Togo", "sorties", "budget FCFA", "loisirs", "Chill"],
  authors: [{ name: "ND Software Studio" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chill",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Chill — On fait quoi aujourd'hui ?",
    description:
      "Idées de sorties, programmes et bonnes adresses à Lomé, adaptées à ton mood et ton budget.",
    siteName: "Chill",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FDF7EF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${quicksand.variable} antialiased bg-background text-foreground font-sans`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
