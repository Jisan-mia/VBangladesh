import Product from '../../tools/adda/page';
import { site } from '../../tools/adda/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-adda"><Product /></div>;
}
