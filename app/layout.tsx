import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Assistant } from 'next/font/google';
import './globals.css';

// ששת המשקלים של העיצוב החדש. 200 נושא את הכותרות הגדולות ואת השם Between,
// ו-700 נושא את התוויות ואת שמות הדוברים בתמליל. בלעדיהם הדפדפן נופל
// למשקל הקרוב או מסנתז בולד, וזה מה שהבדיל את הלוקאל מאב הטיפוס.
const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-assistant',
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
    <html lang="he" dir="rtl" className={assistant.variable} suppressHydrationWarning>
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
