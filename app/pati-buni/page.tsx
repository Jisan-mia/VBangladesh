import Product from '../../tools/pati-buni/page';
import { site } from '../../tools/pati-buni/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-pati-buni"><Product /></div>;
}
