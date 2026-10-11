import Product from '../../tools/danguli/page';
import { site } from '../../tools/danguli/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-danguli"><Product /></div>;
}
