import Product from '../../tools/rannakhata/page';
import { site } from '../../tools/rannakhata/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-rannakhata"><Product /></div>;
}
