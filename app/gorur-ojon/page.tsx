import Product from '../../tools/gorur-ojon/page';
import { site } from '../../tools/gorur-ojon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-gorur-ojon"><Product /></div>;
}
