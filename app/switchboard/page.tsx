import Product from '../../tools/switchboard/page';
import { site } from '../../tools/switchboard/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-switchboard"><Product /></div>;
}
