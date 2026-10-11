import Product from '../../tools/bostar-pahar/page';
import { site } from '../../tools/bostar-pahar/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bostar-pahar"><Product /></div>;
}
