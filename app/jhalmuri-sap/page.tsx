import Product from '../../tools/jhalmuri-sap/page';
import { site } from '../../tools/jhalmuri-sap/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jhalmuri-sap"><Product /></div>;
}
