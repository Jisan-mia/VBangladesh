// The মুদি দোকান's goods: 20 everyday things, each with its own shape and colour. No brands, no packaging names.
// Never reorder ITEMS: the old shelf generator (lib/legacy.ts) shuffles them in this order.

export const ITEMS = [
  { id: "chal", name: "চাল" },
  { id: "dal", name: "ডাল" },
  { id: "tel", name: "তেল" },
  { id: "lobon", name: "লবণ" },
  { id: "cha", name: "চা-পাতা" },
  { id: "biskut", name: "বিস্কুট" },
  { id: "dim", name: "ডিম" },
  { id: "peyaj", name: "পেঁয়াজ" },
  { id: "alu", name: "আলু" },
  { id: "saban", name: "সাবান" },
  { id: "deshlai", name: "দেশলাই" },
  { id: "chini", name: "চিনি" },
  { id: "ata", name: "আটা" },
  { id: "muri", name: "মুড়ি" },
  { id: "dudh", name: "গুঁড়া দুধ" },
  { id: "roshun", name: "রসুন" },
  { id: "morich", name: "শুকনা মরিচ" },
  { id: "kola", name: "কলা" },
  { id: "mombati", name: "মোমবাতি" },
  { id: "narkel", name: "নারকেল" },
] as const;

export type ItemId = (typeof ITEMS)[number]["id"];
export const ITEM_IDS: readonly ItemId[] = ITEMS.map(item => item.id);
const NAMES = Object.fromEntries(ITEMS.map(item => [item.id, item.name])) as Record<ItemId, string>;
export const itemName = (id: ItemId) => NAMES[id];

/**
 * Look-alike families, by what the eye sees first: the white things, the brown and round ones, the red ones and the
 * yellow ones. A look-alike level offers the gone thing's family mates as the wrong pictures.
 */
export type Family = "white" | "brown" | "red" | "yellow";
const FAMILY: Record<ItemId, Family> = {
  lobon: "white", chini: "white", dudh: "white", mombati: "white", roshun: "white", dim: "white", muri: "white",
  alu: "brown", narkel: "brown", biskut: "brown", chal: "brown", ata: "brown",
  morich: "red", cha: "red", peyaj: "red", saban: "red",
  tel: "yellow", kola: "yellow", dal: "yellow", deshlai: "yellow",
};
export const familyOf = (id: ItemId) => FAMILY[id];
