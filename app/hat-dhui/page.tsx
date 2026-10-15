import Product from '../../tools/hat-dhui/page';
import { site } from '../../tools/hat-dhui/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-hat-dhui"><Product /></div>;
}
