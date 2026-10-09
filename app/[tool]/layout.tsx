import type { ReactNode } from 'react';
import { toolSlugs } from '../../lib/tool-content';

export const dynamicParams = false;
export function generateStaticParams() {
  return toolSlugs.map(tool => ({ tool }));
}

export default async function ToolLayout({ children, params }: { children: ReactNode; params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return <div className={`tool-${tool}`}>{children}</div>;
}
