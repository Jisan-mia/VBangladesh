import Product from '../../tools/o-te-ojogor/page';
import { site } from '../../tools/o-te-ojogor/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-o-te-ojogor"><Product /></div>;
}
