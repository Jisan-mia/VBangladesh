import Product from '../../tools/churir-bazar/page';
import { site } from '../../tools/churir-bazar/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-churir-bazar"><Product /></div>;
}
