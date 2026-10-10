import Product from '../../tools/gpa/page';
import { site } from '../../tools/gpa/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-gpa"><Product /></div>;
}
