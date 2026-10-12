import { MAX_SHARE_STATE } from "../../../shared/share-types";
import { possessive } from "../../../shared/bangla";

export type RecipeDraft = {
  title: string;
  /** "কার রেসিপি": আম্মু, নানু… or anything the person types. */
  learnedFrom: string;
  servings: string;
  ingredients: string;
  steps: string;
  memory: string;
};

// Sized so a full Bangla recipe always fits in one share link (MAX_SHARE_STATE).
export const recipeLimits = { title: 80, learnedFrom: 30, servings: 40, ingredients: 1500, steps: 4500, memory: 800 } as const;
export const MAX_INGREDIENTS = 30;
export const MAX_STEPS = 20;
export const whoseChoices = ["আম্মু", "নানু", "দাদু", "খালা", "আব্বু", "নিজের"] as const;
const recipeFields = ["title", "learnedFrom", "servings", "ingredients", "steps", "memory"] as const;
const number = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => number.format(value);
export const RECIPE_ASK = "তোমাদের বাড়ির কোন রান্নাটা লিখে রাখা দরকার?";

export function emptyRecipe(): RecipeDraft {
  return { title: "", learnedFrom: "", servings: "", ingredients: "", steps: "", memory: "" };
}

export function recipeLines(text: string): string[] {
  return text.split(/\r\n?|\n/).map((line) => line.trim()).filter(Boolean);
}

// Control and bidi-override characters could scramble the page for whoever opens a shared link.
const unsafe = /[\u0000-\u0009\u000b-\u001f\u007f‪-‮⁦-⁩]/g;
const oneLine = (text: string) => text.normalize("NFC").replace(unsafe, "").replace(/\s+/g, " ").trim();
const manyLines = (text: string) => text.normalize("NFC").replace(/\r\n?/g, "\n").replace(unsafe, "");

/** The canonical form of a recipe: what the card shows and what a link carries. */
export function cleanRecipe(draft: RecipeDraft): RecipeDraft {
  return {
    title: oneLine(draft.title),
    learnedFrom: oneLine(draft.learnedFrom),
    servings: oneLine(draft.servings),
    ingredients: recipeLines(manyLines(draft.ingredients)).join("\n"),
    steps: recipeLines(manyLines(draft.steps)).join("\n"),
    memory: manyLines(draft.memory).trim().replace(/\n{3,}/g, "\n\n"),
  };
}

// Bangla stays as-is (1 char instead of 9 percent-encoded ones) so a whole recipe fits in a link; only URL syntax is escaped.
const escapeValue = (text: string) => text.replace(/[\s%&=+#]/g, (char) => (char === " " ? "+" : encodeURIComponent(char)));
const keys = { title: "t", learnedFrom: "w", servings: "n", ingredients: "i", steps: "s", memory: "g" } as const;

export function recipeHash(draft: RecipeDraft) {
  const clean = cleanRecipe(draft);
  return "#" + recipeFields.filter((field) => clean[field]).map((field) => `${keys[field]}=${escapeValue(clean[field])}`).join("&");
}

export function validateRecipe(draft: RecipeDraft): Partial<Record<keyof RecipeDraft, string>> {
  const errors: Partial<Record<keyof RecipeDraft, string>> = {};
  if (!draft.title.trim()) errors.title = "রান্নার নামটা লেখো।";
  if (!draft.ingredients.trim()) errors.ingredients = "অন্তত একটা উপকরণ লেখো।";
  if (!draft.steps.trim()) errors.steps = "অন্তত একটা ধাপ লেখো।";
  for (const field of recipeFields) {
    if (draft[field].length > recipeLimits[field]) errors[field] = `এই ঘরে ${number.format(recipeLimits[field])} অক্ষরের মধ্যে লেখো।`;
  }
  if (recipeLines(draft.ingredients).length > MAX_INGREDIENTS) errors.ingredients = "উপকরণ ৩০টার বেশি হয়ে গেছে। ৩০টার মধ্যে রাখো।";
  if (recipeLines(draft.steps).length > MAX_STEPS) errors.steps = "ধাপ ২০টার বেশি হয়ে গেছে। ২০টার মধ্যে রাখো।";
  if (!Object.keys(errors).length && recipeHash(draft).length - 1 > MAX_SHARE_STATE) {
    const longest = recipeFields.reduce((a, b) => (draft[a].length >= draft[b].length ? a : b));
    errors[longest] = "পুরো রেসিপিটা একটা লিংকে ধরছে না। এই ঘরটা একটু ছোট করো।";
  }
  return errors;
}

/** Reads a shared link. Anything that our own editor could not have produced is rejected, not patched. */
export function parseRecipeHash(hash: string): RecipeDraft | null {
  if (hash.length > MAX_SHARE_STATE * 9) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (!params.has(keys.title)) return null;
  const raw = Object.fromEntries(recipeFields.map((field) => [field, params.get(keys[field]) ?? ""])) as RecipeDraft;
  const draft = cleanRecipe(raw);
  return Object.keys(validateRecipe(draft)).length ? null : draft;
}

export function recipeCard(draft: RecipeDraft) {
  return {
    title: draft.title.trim(),
    learnedFrom: draft.learnedFrom.trim(),
    servings: draft.servings.trim(),
    ingredients: recipeLines(draft.ingredients),
    steps: recipeLines(draft.steps),
    memory: draft.memory.replace(/\r\n?/g, "\n").trim(),
  };
}
export type RecipeCard = ReturnType<typeof recipeCard>;


/** "নানুর" / "আমার": who the dish belongs to, ready to put before "হাতের". */
export function whoseWord(whose: string) {
  const name = whose.trim();
  if (!name) return "";
  return name === "নিজের" ? "আমার" : possessive(name);
}

/** "নানুর হাতের খিচুড়ি", unless the person already wrote it that way. */
export function dishHeadline(card: Pick<RecipeCard, "title" | "learnedFrom">) {
  const who = whoseWord(card.learnedFrom);
  if (!who || card.title.includes(who)) return card.title;
  return `${who} হাতের ${card.title}`;
}

export function recipeLine(card: Pick<RecipeCard, "learnedFrom">) {
  const whose = card.learnedFrom.trim();
  if (whose === "নিজের") return "নিজের হাতের রান্না, এবার সবার জন্য খাতায়।";
  if (whose === "আম্মু" || whose === "আব্বু") return `${possessive(whose)} আন্দাজটা এবার কাগজে উঠল।`;
  if (whose === "নানু" || whose === "দাদু") return `${possessive(whose)} হাতের স্বাদটা এবার খাতায় থেকে গেল।`;
  if (whose) return `${possessive(whose)} রান্নাটা এবার পরিবারের সবার কাছে থাকবে।`;
  return "যে রান্না শুধু মনে ছিল, এবার খাতায় উঠল।";
}

export function recipeText(draft: RecipeDraft): string {
  const errors = Object.values(validateRecipe(draft));
  if (errors.length) throw new RangeError(errors[0]);
  const card = recipeCard(draft);
  return [
    dishHeadline(card),
    ...(card.learnedFrom ? [`কার রেসিপি: ${card.learnedFrom}`] : []),
    ...(card.servings ? [`কতজনের জন্য: ${card.servings}`] : []),
    "\nযা যা লাগবে",
    ...card.ingredients.map((ingredient) => `• ${ingredient}`),
    "\nযেভাবে রাঁধবে",
    ...card.steps.map((step, index) => `${number.format(index + 1)}. ${step}`),
    ...(card.memory ? ["\nএই রান্নার গল্প", card.memory] : []),
    "\n— আমাদের রান্নাখাতা",
  ].join("\n");
}

export const exampleRecipe: RecipeDraft = {
  title: "ভুনা খিচুড়ি",
  learnedFrom: "নানু",
  servings: "৪ জন",
  ingredients: "পোলাও চাল — ২ কাপ\nমুগ ডাল — ১ কাপ\nপেঁয়াজ কুচি — ১ কাপ\nআদা-রসুন বাটা — ১ টেবিল চামচ\nহলুদ আর মরিচ গুঁড়া — ১ চা চামচ করে\nকাঁচা মরিচ — ৬-৭টা\nসরিষার তেল — আধা কাপ\nগরম পানি — ৬ কাপ\nলবণ — আন্দাজমতো",
  steps: "ডাল শুকনা কড়াইয়ে লালচে করে ভেজে চালের সাথে ধুয়ে রাখো।\nতেলে পেঁয়াজ লাল করে ভাজো, তারপর আদা-রসুন আর গুঁড়া মসলা দিয়ে কষাও।\nচাল-ডাল দিয়ে ৫ মিনিট নাড়ো, যতক্ষণ না ভাজা ভাজা গন্ধ আসে।\nগরম পানি, লবণ আর কাঁচা মরিচ দিয়ে ঢেকে দাও। আঁচ কমিয়ে ২০ মিনিট রাখো।\nঢাকনা খুলে আলতো করে নেড়ে দাও। ডিম ভাজা আর বেগুন ভাজার সাথে গরম গরম খেতে দাও।",
  memory: "বৃষ্টি নামলেই নানু বলত, ‘আজ খিচুড়ি হবে।’ পিঁড়িতে বসে চুলার পাশে অপেক্ষা করতাম, আর পুরো ঘর ভরে যেত ভাজা ডালের গন্ধে।",
};

export { possessive };
