export type SharePreview = { title: string; description: string };

/** What a tool exposes to the server so its cards can get short links, personal link previews and anonymous tallies. */
export type ToolShare = {
  /** Validate and normalize a client-sent state (the part after # in the tool URL). Return null to reject. */
  normalize(state: string): string | null;
  /** Personal link-preview text for a normalized state, e.g. "রাফির ছোটবেলার ২১টা মিলেছে". */
  preview(state: string): SharePreview;
  /** Item ids people may anonymously count for "compare with everyone". Omit if the tool has nothing to count. */
  tally?: readonly string[];
};

export const MAX_SHARE_STATE = 8000;
