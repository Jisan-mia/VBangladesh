import Product from '../../tools/dom-atkano/page';
import { site } from '../../tools/dom-atkano/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dom-atkano"><Product /></div>;
}
