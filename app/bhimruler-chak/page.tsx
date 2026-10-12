import Product from '../../tools/bhimruler-chak/page';
import { site } from '../../tools/bhimruler-chak/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhimruler-chak"><Product /></div>;
}
