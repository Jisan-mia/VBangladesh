import Product from '../../tools/moner-rong/page';
import { site } from '../../tools/moner-rong/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-moner-rong"><Product /></div>;
}
