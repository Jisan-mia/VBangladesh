import Product from '../../tools/projonmo/page';
import { site } from '../../tools/projonmo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-projonmo"><Product /></div>;
}
