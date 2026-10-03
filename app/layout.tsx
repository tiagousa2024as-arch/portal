import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Primeira Geração",
  description: "A fundação que você constrói, um sábado de cada vez.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Primeira Geração", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1F4D3A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Public+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/portal.css?v=19" />
        <Script src="/motion.js" strategy="beforeInteractive" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <Script id="portal-theme" strategy="beforeInteractive">{`try{var s=JSON.parse(localStorage.getItem("portal-tiago")||"null");if(s&&(s.tema==="light"||s.tema==="dark"))document.documentElement.setAttribute("data-theme",s.tema)}catch(e){}`}</Script>
        {children}
      </body>
    </html>
  );
}
