import type { ToolShare } from "../../shared/share-types";
import { site } from "./content";

// A children's tool: nothing about a child ever goes into a link, so no link state is accepted and nothing is tallied.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: site.title, description: site.description }),
};
