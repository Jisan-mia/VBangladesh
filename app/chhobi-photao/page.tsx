import Product from '../../tools/chhobi-photao/page';
import { site } from '../../tools/chhobi-photao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhobi-photao"><Product /></div>;
}
