import Product from '../../tools/ek-koti/page';
import { site } from '../../tools/ek-koti/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ek-koti"><Product /></div>;
}
