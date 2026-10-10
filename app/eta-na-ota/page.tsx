import Product from '../../tools/eta-na-ota/page';
import { site } from '../../tools/eta-na-ota/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-eta-na-ota"><Product /></div>;
}
