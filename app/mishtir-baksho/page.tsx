import Product from '../../tools/mishtir-baksho/page';
import { site } from '../../tools/mishtir-baksho/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mishtir-baksho"><Product /></div>;
}
