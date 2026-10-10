import Product from '../../tools/bangla-typing/page';
import { site } from '../../tools/bangla-typing/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bangla-typing"><Product /></div>;
}
