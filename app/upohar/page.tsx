import Product from '../../tools/upohar/page';
import { site } from '../../tools/upohar/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-upohar"><Product /></div>;
}
