import Product from '../../tools/latim/page';
import { site } from '../../tools/latim/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-latim"><Product /></div>;
}
