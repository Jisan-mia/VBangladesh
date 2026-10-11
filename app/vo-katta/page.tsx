import Product from '../../tools/vo-katta/page';
import { site } from '../../tools/vo-katta/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-vo-katta"><Product /></div>;
}
