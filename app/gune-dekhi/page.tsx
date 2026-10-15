import Product from '../../tools/gune-dekhi/page';
import { site } from '../../tools/gune-dekhi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-gune-dekhi"><Product /></div>;
}
