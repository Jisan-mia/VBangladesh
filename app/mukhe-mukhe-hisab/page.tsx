import Product from '../../tools/mukhe-mukhe-hisab/page';
import { site } from '../../tools/mukhe-mukhe-hisab/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mukhe-mukhe-hisab"><Product /></div>;
}
