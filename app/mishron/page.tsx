import Product from '../../tools/mishron/page';
import { site } from '../../tools/mishron/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mishron"><Product /></div>;
}
