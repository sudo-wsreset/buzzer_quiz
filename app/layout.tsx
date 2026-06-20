import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🔔 Buzzer Quiz",
  description: "Real-time buzzer system for offline quiz nights",
  keywords: ["quiz", "buzzer", "game", "real-time", "multiplayer"],
  authors: [{ name: "Buzzer Quiz" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "🔔 Buzzer Quiz",
    description: "Real-time buzzer system for offline quiz nights",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Buzzer Quiz" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
