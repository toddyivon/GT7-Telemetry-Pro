import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import MaterialLayout from '@/components/layout/MaterialLayout';
import { ConvexClientProvider } from '@/lib/convex-client-provider';
import { QueryProvider } from '@/components/providers/QueryProvider';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GT7 Data Analysis - Professional Racing Telemetry',
  description: 'Advanced telemetry analysis for Gran Turismo 7. Analyze lap times, racing lines, tire performance, and optimize your racing strategy with professional-grade data visualization.',
  keywords: ['GT7', 'Gran Turismo 7', 'telemetry', 'racing', 'lap analysis', 'data visualization'],
  authors: [{ name: 'GT7 Analytics Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className={roboto.className} style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <QueryProvider>
            <ConvexClientProvider>
              <MaterialLayout>
                {children}
              </MaterialLayout>
            </ConvexClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
