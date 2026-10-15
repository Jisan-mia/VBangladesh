import Product from '../../tools/golper-mor/page';
import { site } from '../../tools/golper-mor/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-golper-mor"><Product /></div>;
}
