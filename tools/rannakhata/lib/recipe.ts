export type RecipeDraft = {
  title: string;
  learnedFrom: string;
  servings: string;
  ingredients: string;
  steps: string;
  memory: string;
};

export const recipeLimits = { title: 80, learnedFrom: 60, servings: 40, ingredients: 3000, steps: 6000, memory: 800 } as const;
export const MAX_INGREDIENTS = 30;
export const MAX_STEPS = 20;
const recipeFields = ["title", "learnedFrom", "servings", "ingredients", "steps", "memory"] as const;
const number = new Intl.NumberFormat("bn-BD");

export function emptyRecipe(): RecipeDraft {
  return { title: "", learnedFrom: "", servings: "", ingredients: "", steps: "", memory: "" };
}

export function recipeLines(text: string): string[] {
  return text.split(/\r\n?|\n/).map((line) => line.trim()).filter(Boolean);
}

export function validateRecipe(draft: RecipeDraft): Partial<Record<keyof RecipeDraft, string>> {
  const errors: Partial<Record<keyof RecipeDraft, string>> = {};
  if (!draft.title.trim()) errors.title = "রান্নার নাম লিখুন।";
  if (!draft.ingredients.trim()) errors.ingredients = "অন্তত একটি উপকরণ লিখুন।";
  if (!draft.steps.trim()) errors.steps = "অন্তত একটি ধাপ লিখুন।";
  for (const field of recipeFields) {
    if (draft[field].length > recipeLimits[field]) errors[field] = `এই ঘরে সর্বোচ্চ ${number.format(recipeLimits[field])} অক্ষর লিখুন।`;
  }
  if (recipeLines(draft.ingredients).length > MAX_INGREDIENTS) errors.ingredients = "সর্বোচ্চ ৩০টি উপকরণ আলাদা লাইনে লিখুন।";
  if (recipeLines(draft.steps).length > MAX_STEPS) errors.steps = "সর্বোচ্চ ২০টি ধাপ আলাদা লাইনে লিখুন।";
  return errors;
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

export function recipeText(draft: RecipeDraft): string {
  const errors = Object.values(validateRecipe(draft));
  if (errors.length) throw new RangeError(errors[0]);
  const card = recipeCard(draft);
  return [
    card.title,
    ...(card.learnedFrom ? [`যাঁর কাছে শেখা: ${card.learnedFrom}`] : []),
    ...(card.servings ? [`কতজনের জন্য: ${card.servings}`] : []),
    "\nউপকরণ",
    ...card.ingredients.map((ingredient) => `• ${ingredient}`),
    "\nযেভাবে রান্না করবেন",
    ...card.steps.map((step, index) => `${number.format(index + 1)}. ${step}`),
    ...(card.memory ? ["\nএই রান্নার সঙ্গে যে গল্প", card.memory] : []),
    "\nআমাদের রান্নাখাতা",
  ].join("\n");
}

export const exampleRecipe: RecipeDraft = {
  title: "শসা-টমেটোর সালাদ (নমুনা)",
  learnedFrom: "",
  servings: "২ জন (নমুনা)",
  ingredients: "শসা — ১টি\nটমেটো — ১টি\nলেবুর রস — ১ চা-চামচ\nলবণ — স্বাদমতো",
  steps: "শসা ও টমেটো ভালো করে ধুয়ে নিন।\nশসা ও টমেটো ছোট টুকরো করে কাটুন।\nলেবুর রস ও লবণ মিশিয়ে পরিবেশন করুন।",
  memory: "",
};
