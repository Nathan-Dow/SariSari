import type { Metadata } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Omega POS — Management Console',
  description: 'Real-time POS management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      // Add suppressHydrationWarning here
      <html lang="en" suppressHydrationWarning className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-background text-on-background font-body-md text-body-md antialiased">
      {children}
      </body>
      </html>
  );
}