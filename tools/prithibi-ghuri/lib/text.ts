// The few Bangla lines built from country data: a greeting, a place, a question, and what a wrong picture really was.
import type { Country } from "./countries";
import type { Ask } from "./levels";

/** "জাপানি ভাষায় হ্যালো", "মালয় ভাষায় শুভ সকাল". */
export const helloLine = (country: Country) => `${country.hello.language} ভাষায় ${country.hello.means ?? "হ্যালো"}`;

/** "ভারতে", "কানাডায়", "ইতালিতে": the country as a place. */
export function inside(name: string) {
  const last = name.at(-1);
  return name + (last === "া" ? "য়" : last === "ি" || last === "ী" ? "তে" : "ে");
}
/** "ভারতের", "কানাডার", "ইতালির". */
export function of(name: string) {
  const last = name.at(-1);
  return name + (last === "া" || last === "ি" || last === "ী" ? "র" : "ের");
}

/** The stamp question as a line under the pictures: for a parent or an older child; the pictures carry it for everyone. */
export function questionOf(country: Country, ask: Ask) {
  const asks: Record<Ask, string> = {
    food: `${inside(country.name)} কোন খাবারটা দেখলে?`,
    place: `${inside(country.name)} কোন জায়গাটা দেখলে?`,
    animal: `${inside(country.name)} কোন প্রাণীটা দেখলে?`,
    flag: `কোনটা ${of(country.name)} পতাকা?`,
    hello: `কোন দেশে বলে “${country.hello.word}”?`,
  };
  return asks[ask];
}

/** After a wrong tap: what that picture really was, so a mistake teaches something. */
export function whyLine(picked: Country, ask: Ask) {
  if (ask === "flag") return `এটা ${of(picked.name)} পতাকা। আরেকবার ভাবো।`;
  if (ask === "hello") return `${picked.name}-এ বলে “${picked.hello.word}”। আরেকবার ভাবো।`;
  const item = ask === "food" ? picked.food : ask === "place" ? picked.place : picked.animal;
  // "চীনের মহাপ্রাচীর" already names its country.
  const name = item.name.startsWith(of(picked.name)) ? item.name : `${of(picked.name)} ${item.name}`;
  return `এটা ${name}। আরেকবার ভাবো।`;
}

/** The line on the card and the end screen. */
export const cardTitle = (count: number, bn: (n: number) => string) => `আজ ${bn(count)}টা দেশ ঘুরলাম`;

/** A task off the screen, about the last country: no voice, so a parent can say it. */
export const awayLine = (country: Country | undefined) =>
  country ? `এবার আম্মুকে শোনাও, ${inside(country.name)} কীভাবে হ্যালো বলে।` : "এবার আম্মুকে একটা দেশের গল্প বলো।";

/** After the right picture: what it was, in one line for a parent or an older child. */
export function rightLine(country: Country, ask: Ask) {
  if (ask === "flag") return `ঠিক। এটা ${of(country.name)} পতাকা।`;
  if (ask === "hello") return `ঠিক। ${country.name}-এ বলে “${country.hello.word}”।`;
  const item = ask === "food" ? country.food : ask === "place" ? country.place : country.animal;
  return `ঠিক। ${item.name.startsWith(of(country.name)) ? item.name : `${of(country.name)} ${item.name}`}।`;
}
