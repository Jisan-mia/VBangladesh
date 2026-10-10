import Product from '../../tools/dhoyahin/page';
import { site } from '../../tools/dhoyahin/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dhoyahin"><Product /></div>;
}
