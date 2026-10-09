import { StudioPage } from "../../shared/studio-page";
import { site } from "./content";

export default function ShubhechhaPage() {
  return <StudioPage site={site}><p>{site.lead}</p></StudioPage>;
}
