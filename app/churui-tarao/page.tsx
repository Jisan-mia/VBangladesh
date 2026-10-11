import Product from '../../tools/churui-tarao/page';
import { site } from '../../tools/churui-tarao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-churui-tarao"><Product /></div>;
}
