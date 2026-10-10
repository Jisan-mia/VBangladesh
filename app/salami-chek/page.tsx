import Product from '../../tools/salami-chek/page';
import { site } from '../../tools/salami-chek/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-salami-chek"><Product /></div>;
}
