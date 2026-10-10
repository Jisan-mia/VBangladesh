import Product from '../../tools/prothom-ay/page';
import { site } from '../../tools/prothom-ay/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-prothom-ay"><Product /></div>;
}
