import Product from '../../tools/eider-din/page';
import { site } from '../../tools/eider-din/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-eider-din"><Product /></div>;
}
