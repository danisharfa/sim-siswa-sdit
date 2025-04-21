import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Overpass_Mono } from 'next/font/google';

export const overpass_Mono = Overpass_Mono({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Informasi Monitoring >> SD IT Ulul Albab Mataram',
  description:
    'Sistem Informasi Monitoring Hafalan Siswa SD IT Ulul Albab Mataram',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={overpass_Mono.className}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
