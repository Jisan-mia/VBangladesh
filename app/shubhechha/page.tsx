import Product from '../../tools/shubhechha/page';
import { site } from '../../tools/shubhechha/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-shubhechha"><Product /></div>;
}
