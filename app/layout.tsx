import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import '../shared/base.css';
import '../shared/creative.css';
import '../shared/hub-shell.css';
import '../shared/share-kit.css';
import '../components/home.css';

export const viewport: Viewport = { themeColor: '#1d2b53', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="bn-BD" data-scroll-behavior="smooth"><head><link rel="preload" href="/fonts/bangla.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/fonts/display-bangla.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head><body>{children}</body></html>;
}
