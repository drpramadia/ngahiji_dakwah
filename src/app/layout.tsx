import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ngahiji - Tempat Kebaikan Bertemu',
  description: 'Event, kajian, media, dan komunitas Ngahiji Dakwah Organizer.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
