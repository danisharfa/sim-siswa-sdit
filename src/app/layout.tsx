import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
