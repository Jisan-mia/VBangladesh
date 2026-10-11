import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, possessive, shareState } from "./lib/card";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareState(shared).state : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const who = shared?.name ? possessive(shared.name) : "এক বন্ধুর";
    return {
      title: `${who} আঁকা আলপনা। তুমিও একটা আঁকো`,
      description: "তৈরি ডিজাইন থেকে শুরু করো বা আঙুলে নিজেই আঁকো। বৈশাখ, একুশে, পূজা বা গায়ে হলুদের আলপনার ছবি বানাও, বন্ধুকে পাঠাও। ফ্রি।",
    };
  },
};
