import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capture Review Tasks',
  description: 'Mobile-first capture, review, and task workflow UI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
