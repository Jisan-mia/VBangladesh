import Product from '../../tools/kalbaishakhi-aam/page';
import { site } from '../../tools/kalbaishakhi-aam/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-kalbaishakhi-aam"><Product /></div>;
}
