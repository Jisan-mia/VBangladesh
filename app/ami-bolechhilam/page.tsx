import Product from '../../tools/ami-bolechhilam/page';
import { site } from '../../tools/ami-bolechhilam/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ami-bolechhilam"><Product /></div>;
}
