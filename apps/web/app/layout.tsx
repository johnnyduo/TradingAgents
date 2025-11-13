'use client';

import '../styles/globals.css';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.title = 'TradingAgents - AI-Powered Trading Analysis';
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="description" content="Multi-agent AI system for comprehensive stock trading analysis" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
