import '@silverpoint/example-harness/harness.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'silverpoint · Next.js', icons: { icon: 'data:,' } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
