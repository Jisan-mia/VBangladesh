'use client';
import { useEffect } from 'react';

// Crawlers read this page's personal preview tags; people are sent straight on to the tool with the card loaded.
export function OpenShared({ href }: { href: string }) {
  useEffect(() => { window.location.replace(href); }, [href]);
  return null;
}
