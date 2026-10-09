import Product from '../../tools/bhara/page';
import { site } from '../../tools/bhara/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhara"><Product /></div>;
}
