import Product from '../../tools/bidyut-bill/page';
import { site } from '../../tools/bidyut-bill/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bidyut-bill"><Product /></div>;
}
