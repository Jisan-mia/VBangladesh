import Product from '../../tools/golir-ain/page';
import { site } from '../../tools/golir-ain/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-golir-ain"><Product /></div>;
}
