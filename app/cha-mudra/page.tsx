import Product from '../../tools/cha-mudra/page';
import { site } from '../../tools/cha-mudra/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-cha-mudra"><Product /></div>;
}
