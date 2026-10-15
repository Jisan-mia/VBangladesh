import Product from '../../tools/mongole-rover/page';
import { site } from '../../tools/mongole-rover/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mongole-rover"><Product /></div>;
}
