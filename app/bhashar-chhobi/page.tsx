import Product from '../../tools/bhashar-chhobi/page';
import { site } from '../../tools/bhashar-chhobi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhashar-chhobi"><Product /></div>;
}
