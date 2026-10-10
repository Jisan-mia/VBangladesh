import type { ToolShare } from "../../shared/share-types";
import { cowHash, parseCow, previewTitle } from "./lib/ojon";

// No tally: nothing here is a fixed pick worth counting.
export const share: ToolShare = {
  normalize(state) {
    const cow = parseCow(state);
    return cow ? cowHash(cow) : null;
  },
  preview(state) {
    const cow = parseCow(state);
    return {
      title: cow ? previewTitle(cow) : "ফিতা দিয়ে মাপো, গরুর ওজন কত?",
      description: "দর্জির ফিতায় বুকের বেড় আর দৈর্ঘ্য মাপো, আনুমানিক ওজন দেখো মণ আর কেজিতে। মাংসের তিন ভাগের হিসাবও করো। তোমাদের গরুর নাম কী?",
    };
  },
};
