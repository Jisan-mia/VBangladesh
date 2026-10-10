import Product from '../../tools/attiyo/page';
import { site } from '../../tools/attiyo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-attiyo"><Product /></div>;
}
