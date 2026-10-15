import Product from '../../tools/dinosaur/page';
import { site } from '../../tools/dinosaur/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dinosaur"><Product /></div>;
}
