import Product from '../../tools/shoman-bhag/page';
import { site } from '../../tools/shoman-bhag/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-shoman-bhag"><Product /></div>;
}
