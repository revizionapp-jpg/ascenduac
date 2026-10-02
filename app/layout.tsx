import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AscendUAC — L\'Outil de l\'Étudiant | EPAC & UAC Bénin',
  description:
    'AscendUAC : Plateforme officielle centralisant les annales d\'examens, devoirs et corrigés, ainsi que le suivi et simulateur de notes pour les étudiants de l\'EPAC et de l\'UAC.',
  keywords: ['AscendUAC', 'annale', 'MBH', 'EPAC', 'UAC', 'Bénin', 'biomédical', 'notes', 'simulateur', 'examens', 'devoirs'],
  authors: [{ name: 'optossou@gmail.com' }],
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1F7A3A' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1510' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="min-h-screen" suppressHydrationWarning>
      <head>
        {/* Script inline anti-flash : appliqué AVANT le premier rendu CSS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ascenduac-theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && systemDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-surface-bg text-ink-primary font-sans transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
