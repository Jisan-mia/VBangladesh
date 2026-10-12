import Product from '../../tools/chhobir-tukro/page';
import { site } from '../../tools/chhobir-tukro/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhobir-tukro"><Product /></div>;
}
