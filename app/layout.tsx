import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Rubik, Cormorant_Garamond, Frank_Ruhl_Libre, Assistant } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-rubik',
  display: 'swap',
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500'],
  variable: '--font-frank',
  display: 'swap',
});

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-assistant',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Between',
  description: 'Between — the space between sessions',
  applicationName: 'Between',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Between',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#fdf8f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${cormorant.variable} ${frankRuhl.variable} ${assistant.variable}`} suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
        <Script src="/chat.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
