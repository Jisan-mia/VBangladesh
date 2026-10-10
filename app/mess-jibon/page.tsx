import Product from '../../tools/mess-jibon/page';
import { site } from '../../tools/mess-jibon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mess-jibon"><Product /></div>;
}
