import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { SessionProvider } from '@/lib/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';
import { Nunito } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Informasi Monitoring >> SD IT Ulul Albab Mataram',
  description: 'Sistem Informasi Monitoring Hafalan Siswa SD IT Ulul Albab Mataram',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.className} antialiased`} suppressHydrationWarning={true}>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main>{children}</main>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
