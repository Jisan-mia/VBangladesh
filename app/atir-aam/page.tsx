import Product from '../../tools/atir-aam/page';
import { site } from '../../tools/atir-aam/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-atir-aam"><Product /></div>;
}
