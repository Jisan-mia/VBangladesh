import Product from '../../tools/chhorar-tal/page';
import { site } from '../../tools/chhorar-tal/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhorar-tal"><Product /></div>;
}
