import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import '../styles/globals.css';

const notoSans = Noto_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TradingAgents - AI-Powered Trading Analysis',
  description: 'Multi-agent AI system for comprehensive stock trading analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={notoSans.className}>{children}</body>
    </html>
  );
}
