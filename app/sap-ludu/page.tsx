import Product from '../../tools/sap-ludu/page';
import { site } from '../../tools/sap-ludu/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sap-ludu"><Product /></div>;
}
