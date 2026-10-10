import Product from '../../tools/matir-bank/page';
import { site } from '../../tools/matir-bank/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-matir-bank"><Product /></div>;
}
