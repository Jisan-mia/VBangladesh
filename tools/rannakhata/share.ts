import { MAX_SHARE_STATE, type ToolShare } from "../../shared/share-types";
import { dishHeadline, parseRecipeHash, RECIPE_ASK, recipeHash } from "./lib/recipe";

export const share: ToolShare = {
  normalize(state) {
    const recipe = parseRecipeHash(state);
    const normalized = recipe && recipeHash(recipe).slice(1);
    return normalized && normalized.length <= MAX_SHARE_STATE ? normalized : null;
  },
  preview(state) {
    const recipe = parseRecipeHash(state);
    if (!recipe) return { title: `আমাদের রান্নাখাতা। ${RECIPE_ASK}`, description: "পরিবারের রান্না উপকরণ আর ধাপসহ লিখে রাখো, লিংকে পাঠাও।" };
    const story = recipe.memory.replace(/\s+/g, " ");
    const quote = story ? `“${story.length > 90 ? story.slice(0, 90).trimEnd() + "…" : story}” ` : "";
    return {
      title: `${dishHeadline(recipe)}। ${RECIPE_ASK}`,
      description: `${quote}উপকরণ আর ধাপসহ পুরো রেসিপিটা খুলে পড়ো, কপি বা প্রিন্ট করো।`,
    };
  },
};
