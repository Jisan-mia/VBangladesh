import Product from '../../tools/bhangti-nai/page';
import { site } from '../../tools/bhangti-nai/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhangti-nai"><Product /></div>;
}
