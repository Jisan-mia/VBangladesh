import Product from '../../tools/ammur-number/page';
import { site } from '../../tools/ammur-number/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ammur-number"><Product /></div>;
}
