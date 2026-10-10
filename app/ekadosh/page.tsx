import Product from '../../tools/ekadosh/page';
import { site } from '../../tools/ekadosh/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ekadosh"><Product /></div>;
}
