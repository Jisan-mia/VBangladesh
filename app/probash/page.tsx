import Product from '../../tools/probash/page';
import { site } from '../../tools/probash/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-probash"><Product /></div>;
}
