import Product from '../../tools/rokto/page';
import { site } from '../../tools/rokto/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-rokto"><Product /></div>;
}
