import Product from '../../tools/sat-chara/page';
import { site } from '../../tools/sat-chara/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sat-chara"><Product /></div>;
}
