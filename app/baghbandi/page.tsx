import Product from '../../tools/baghbandi/page';
import { site } from '../../tools/baghbandi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-baghbandi"><Product /></div>;
}
