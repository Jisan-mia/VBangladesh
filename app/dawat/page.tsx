import Product from '../../tools/dawat/page';
import { site } from '../../tools/dawat/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dawat"><Product /></div>;
}
