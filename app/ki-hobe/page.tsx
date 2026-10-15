import Product from '../../tools/ki-hobe/page';
import { site } from '../../tools/ki-hobe/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ki-hobe"><Product /></div>;
}
