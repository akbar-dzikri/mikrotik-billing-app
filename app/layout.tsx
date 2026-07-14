import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ARNET BILLING — Billing System Hotspot Mikrotik & Voucher Online',
  description:
    'Sistem billing hotspot untuk RT/RW Net & reseller. Integrasi Mikrotik REST API, Midtrans, QRIS, WhatsApp Cloud API. Voucher otomatis, laporan realtime.',
  authors: [{ name: 'ARNET BILLING' }],
  openGraph: {
    title: 'ARNET BILLING — Billing System Hotspot Mikrotik',
    description:
      'Kelola voucher hotspot, pembayaran online, dan router Mikrotik dari satu dashboard. Otomatis, terintegrasi, siap pakai.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
