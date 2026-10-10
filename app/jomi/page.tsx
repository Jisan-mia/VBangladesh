import Product from '../../tools/jomi/page';
import { site } from '../../tools/jomi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jomi"><Product /></div>;
}
