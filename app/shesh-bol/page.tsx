import Product from '../../tools/shesh-bol/page';
import { site } from '../../tools/shesh-bol/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-shesh-bol"><Product /></div>;
}
