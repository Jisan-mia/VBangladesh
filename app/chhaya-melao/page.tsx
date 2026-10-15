import Product from '../../tools/chhaya-melao/page';
import { site } from '../../tools/chhaya-melao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhaya-melao"><Product /></div>;
}
