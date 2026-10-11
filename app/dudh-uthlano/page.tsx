import Product from '../../tools/dudh-uthlano/page';
import { site } from '../../tools/dudh-uthlano/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dudh-uthlano"><Product /></div>;
}
