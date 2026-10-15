// Nine everyday stories, each with one turn (মোড়). Both paths are allowed: each shows how the other person feels and what
// happens next, and ends on an object or an action, never a lesson line. Pure data and helpers; the art reads it.
import { possessive } from "../../../shared/bangla";

export type Mood = "happy" | "sad" | "worried" | "calm" | "surprised" | "shy";
export type Pose = "stand" | "sit" | "run" | "blind";
export type Place = "class" | "home" | "uthan" | "roof" | "math" | "goli" | "stairs";
export type PropKind =
  | "tiffin" | "spill" | "roti" | "cup" | "cupBroken" | "glass" | "ball" | "kite" | "latai" | "note" | "achar"
  | "bat" | "stumps" | "glasses" | "medal" | "tape" | "bag" | "onion" | "mango" | "mangoPlate" | "mangoBig" | "mangoSmall" | "gloves";
export type Hair = "short" | "long" | "braids" | "hijab" | "bun" | "curly" | "pony" | "elder";

export type Person = { name: string; skin: string; hair: Hair; hairColor: string; top: string; bottom: string; dress: boolean; size: "kid" | "small" | "adult"; glasses?: boolean; wheelchair?: boolean; scarf?: string };
/** [who, mood, x (0–320), pose] */
export type Actor = readonly [string, Mood, number, Pose?];
/** [kind, x, y, scale] */
export type Prop = readonly [PropKind, number, number, number?];
export type Panel = { place: Place; text: string; cast: readonly Actor[]; props?: readonly Prop[]; night?: boolean };
export type Choice = { label: string; panels: readonly Panel[]; talk: string };
export type Story = { id: string; title: string; color: string; hero: string; other: string; question: string; intro: readonly Panel[]; choices: readonly [Choice, Choice] };
export type Side = 0 | 1;

export const PEOPLE: Record<string, Person> = {
  nusrat: { name: "নুসরাত", skin: "#b07a52", hair: "hijab", hairColor: "#2b1d14", scarf: "#f4f1ea", top: "#2f6f9e", bottom: "#2f6f9e", dress: true, size: "kid" },
  tanim: { name: "তানিম", skin: "#c48d63", hair: "short", hairColor: "#1f1610", top: "#f2f2ee", bottom: "#33415c", dress: false, size: "kid", glasses: true },
  rafi: { name: "রাফি", skin: "#8f5b3a", hair: "curly", hairColor: "#1a120c", top: "#e0a23a", bottom: "#4b5a3a", dress: false, size: "kid" },
  nanu: { name: "নানু", skin: "#a8724c", hair: "elder", hairColor: "#d9d6cf", scarf: "#f6f3ea", top: "#f6f3ea", bottom: "#6f9b8a", dress: true, size: "adult" },
  arpita: { name: "অর্পিতা", skin: "#7d4b2e", hair: "braids", hairColor: "#1a120c", top: "#d9534f", bottom: "#d9534f", dress: true, size: "kid" },
  mong: { name: "মং", skin: "#d1a077", hair: "short", hairColor: "#16110d", top: "#4f8a5b", bottom: "#2d3a4f", dress: false, size: "kid" },
  priyanka: { name: "প্রিয়াংকা", skin: "#9a6440", hair: "long", hairColor: "#20160f", top: "#8e5bb5", bottom: "#8e5bb5", dress: true, size: "kid" },
  joy: { name: "জয়", skin: "#a36c45", hair: "short", hairColor: "#20160f", top: "#c0392b", bottom: "#3b3f4a", dress: false, size: "kid" },
  mitu: { name: "মিতু", skin: "#a36c45", hair: "pony", hairColor: "#20160f", top: "#f2b632", bottom: "#f2b632", dress: true, size: "small" },
  arif: { name: "আরিফ", skin: "#8a5534", hair: "short", hairColor: "#1a120c", top: "#f2f2ee", bottom: "#33415c", dress: false, size: "kid" },
  sadia: { name: "সাদিয়া", skin: "#b98258", hair: "bun", hairColor: "#24180f", top: "#3a9d8f", bottom: "#3a9d8f", dress: true, size: "kid", wheelchair: true },
  ritu: { name: "ঋতু", skin: "#9c6743", hair: "short", hairColor: "#1d140e", top: "#2e86c1", bottom: "#f2f2ee", dress: false, size: "kid" },
  nafis: { name: "নাফিস", skin: "#b57e55", hair: "curly", hairColor: "#1a120c", top: "#e67e22", bottom: "#3b3f4a", dress: false, size: "kid" },
  imon: { name: "ইমন", skin: "#7f4c2d", hair: "short", hairColor: "#16110d", top: "#f2f2ee", bottom: "#2d3a4f", dress: false, size: "kid" },
  khala: { name: "খালা", skin: "#b07a52", hair: "elder", hairColor: "#2b1d14", scarf: "#c46b8e", top: "#c46b8e", bottom: "#c46b8e", dress: true, size: "adult" },
  riya: { name: "রিয়া", skin: "#8f5b3a", hair: "pony", hairColor: "#1a120c", top: "#5b8def", bottom: "#5b8def", dress: true, size: "kid" },
  tutul: { name: "টুটুল", skin: "#8f5b3a", hair: "curly", hairColor: "#1a120c", top: "#7cb342", bottom: "#4e5d6c", dress: false, size: "small" },
  ammu: { name: "আম্মু", skin: "#9a6440", hair: "long", hairColor: "#1a120c", scarf: "#e7b84a", top: "#e7b84a", bottom: "#b8572e", dress: true, size: "adult" },
};

export const STORIES: readonly Story[] = [
  {
    id: "tiffin", title: "পড়ে যাওয়া টিফিন", color: "#2f6f9e", hero: "nusrat", other: "tanim", question: "নুসরাত কী করবে?",
    intro: [
      { place: "class", text: "টিফিনের ঘণ্টা বাজল। তানিম তার স্টিলের বাটির ঢাকনা খুলল।", cast: [["nusrat", "calm", 95], ["tanim", "happy", 215]], props: [["tiffin", 238, 150]] },
      { place: "class", text: "হাত ফসকে বাটিটা পড়ে গেল। খিচুড়ি সব মেঝেতে। পেছনের বেঞ্চে কে যেন হেসে উঠল।", cast: [["nusrat", "surprised", 95], ["tanim", "surprised", 215]], props: [["spill", 238, 186]] },
      { place: "class", text: "নুসরাতের বাটিতে চারটা রুটি আর আলুভাজি। তানিম মেঝের দিকে তাকিয়ে আছে।", cast: [["nusrat", "worried", 95], ["tanim", "sad", 215]], props: [["tiffin", 125, 150], ["roti", 125, 140, 0.8], ["spill", 238, 186]] },
    ],
    choices: [
      {
        label: "রুটি ভাগ করে দেবে", talk: "তানিম বাটিটা ধুয়ে আনল কেন?",
        panels: [
          { place: "class", text: "নুসরাত বাটিটা দুজনের মাঝখানে রাখল। “দুটো তোমার।”", cast: [["nusrat", "calm", 110], ["tanim", "shy", 210]], props: [["tiffin", 160, 150], ["roti", 160, 140, 0.8]] },
          { place: "class", text: "দুজনে রুটি আর আলুভাজি খেল। টিফিন শেষে তানিম নুসরাতের বাটিটা কলের পানিতে ধুয়ে এনে দিল।", cast: [["nusrat", "happy", 110], ["tanim", "happy", 210]], props: [["tiffin", 236, 150]] },
        ],
      },
      {
        label: "নিজের টিফিন খাবে", talk: "ঘণ্টা বাজা পর্যন্ত তানিমের মনে কী চলছিল?",
        panels: [
          { place: "class", text: "নুসরাত নিজের রুটি খেল, খিদে পেয়েছিল খুব। তানিম খালি বাটিটা কোলে নিয়ে বসে রইল।", cast: [["nusrat", "calm", 95], ["tanim", "sad", 225, "sit"]], props: [["tiffin", 125, 150], ["roti", 125, 140, 0.8]] },
          { place: "class", text: "ঘণ্টা বাজা পর্যন্ত তানিম খাতার একটা কোনা ভাঁজ করল, খুলল, আবার ভাঁজ করল।", cast: [["tanim", "sad", 170, "sit"]] },
        ],
      },
    ],
  },
  {
    id: "notun", title: "নতুন ছেলে মং", color: "#4f8a5b", hero: "arpita", other: "mong", question: "অর্পিতা কী করবে?",
    intro: [
      { place: "class", text: "ক্লাসে নতুন ছেলে এসেছে, নাম মং। আব্বুর বদলির চাকরি, তাই বান্দরবান থেকে এই শহরে।", cast: [["arpita", "calm", 95], ["mong", "shy", 220]] },
      { place: "math", text: "টিফিনে সবাই মাঠে দৌড়াল। মং বসে রইল মাঠের ধারে, ব্যাগের ফিতা আঙুলে পেঁচিয়ে।", cast: [["priyanka", "happy", 70, "run"], ["arpita", "happy", 135, "run"], ["mong", "sad", 262, "sit"]] },
      { place: "math", text: "অর্পিতারা কানামাছি খেলছে। আজ একজন কম।", cast: [["priyanka", "happy", 70, "blind"], ["arpita", "happy", 145], ["mong", "sad", 262, "sit"]] },
    ],
    choices: [
      {
        label: "মংকে খেলায় ডাকবে", talk: "মং পেছনে তাকাল কেন?",
        panels: [
          { place: "math", text: "“এই মং, খেলবে? একজন কম।” মং একবার পেছনে তাকাল, আর কাউকে ডাকছে কি না।", cast: [["arpita", "happy", 150], ["mong", "surprised", 262, "sit"]] },
          { place: "math", text: "চোখ বেঁধে মং প্রথমবারেই অর্পিতার জামার হাতা ধরে ফেলল। ঘণ্টা বাজার আগে সে সবার নাম জেনে গেল।", cast: [["priyanka", "happy", 60], ["arpita", "happy", 150], ["mong", "happy", 235, "blind"]] },
        ],
      },
      {
        label: "খেলায় ফিরে যাবে", talk: "মাঠের ধারে বসে মং কী দেখছিল?",
        panels: [
          { place: "math", text: "অর্পিতা দৌড়ে খেলায় ফিরল। একজন কম নিয়েই খেলা চলল।", cast: [["priyanka", "happy", 60, "blind"], ["arpita", "happy", 140, "run"], ["mong", "sad", 262, "sit"]] },
          { place: "math", text: "ঘণ্টা বাজল। মং উঠে দাঁড়াল। ব্যাগের ফিতাটা তখনো আঙুলে পেঁচানো।", cast: [["mong", "sad", 200]] },
        ],
      },
    ],
  },
  {
    id: "ghuri", title: "লাল ঘুড়ি", color: "#c0392b", hero: "joy", other: "mitu", question: "জয় কী করবে?",
    intro: [
      { place: "roof", text: "শীতের বিকেল। ছাদে জয়ের লাল ঘুড়ি উড়ছে, পানির ট্যাংকের চেয়েও অনেক উঁচুতে।", cast: [["joy", "happy", 175]], props: [["kite", 250, 30], ["latai", 192, 128]] },
      { place: "roof", text: "ছোট বোন মিতু এসে লাটাইয়ের দিকে হাত বাড়াল। “ভাইয়া, আমি একটু ধরি?”", cast: [["mitu", "happy", 110], ["joy", "surprised", 175]], props: [["kite", 250, 30], ["latai", 192, 128]] },
      { place: "roof", text: "মিতু আগে কখনো ঘুড়ি ওড়ায়নি। বেশি টান দিলে সুতা ছিঁড়ে যেতে পারে।", cast: [["mitu", "happy", 110], ["joy", "worried", 175]], props: [["kite", 250, 30], ["latai", 192, 128]] },
    ],
    choices: [
      {
        label: "লাটাই দেবে", talk: "মিতু আম্মুকে ডাকতে দৌড়াল কেন?",
        panels: [
          { place: "roof", text: "জয় মিতুর পেছনে দাঁড়াল। চার হাত এক লাটাইয়ে।", cast: [["joy", "calm", 165], ["mitu", "happy", 195]], props: [["kite", 250, 30], ["latai", 192, 128]] },
          { place: "roof", text: "ঘুড়িটা একবার গোত্তা খেয়ে নামল, তারপর আবার উঠল। মিতু সিঁড়ি দিয়ে দৌড়ে নামল আম্মুকে ডাকতে।", cast: [["joy", "happy", 165], ["mitu", "happy", 95, "run"]], props: [["kite", 250, 30], ["latai", 182, 128]] },
        ],
      },
      {
        label: "নিজেই ওড়াবে", talk: "কোনায় বসে মিতুর কেমন লাগছিল?",
        panels: [
          { place: "roof", text: "“তুমি পারবে না, ছিঁড়ে ফেলবে।” জয় লাটাইটা অন্য দিকে ঘুরিয়ে নিল।", cast: [["mitu", "sad", 110], ["joy", "calm", 175]], props: [["kite", 250, 30], ["latai", 192, 128]] },
          { place: "roof", text: "মিতু ছাদের কোনায় গিয়ে বসল। সেখান থেকে লাল ঘুড়িটা দেখল, সন্ধ্যা পর্যন্ত।", cast: [["mitu", "sad", 70, "sit"], ["joy", "happy", 200]], props: [["kite", 260, 30], ["latai", 217, 128]] },
        ],
      },
    ],
  },
  {
    id: "taka", title: "১০ টাকার নোট", color: "#3a9d8f", hero: "priyanka", other: "arif", question: "প্রিয়াংকা কী করবে?",
    intro: [
      { place: "class", text: "ছুটির পর বেঞ্চের নিচে প্রিয়াংকা একটা ভাঁজ করা ১০ টাকার নোট পেল।", cast: [["priyanka", "surprised", 150]], props: [["note", 190, 140]] },
      { place: "goli", text: "গেটের বাইরে আচারওয়ালা ডাকছে। ১০ টাকায় এক প্যাকেট তেঁতুলের আচার।", cast: [["priyanka", "happy", 130]], props: [["note", 165, 140]] },
      { place: "class", text: "দরজার কাছে আরিফ পকেট উল্টে দেখছে। তারপর ব্যাগ খুলে সব বই বের করল।", cast: [["priyanka", "worried", 95], ["arif", "worried", 225], ["sadia", "calm", 300]] },
    ],
    choices: [
      {
        label: "আরিফকে জিজ্ঞেস করবে", talk: "আরিফ নোটটা পকেটে রেখে বোতাম লাগাল কেন?",
        panels: [
          { place: "class", text: "“তোমার কিছু হারিয়েছে?” আরিফ বলল, “দশ টাকা। কলম কেনার।”", cast: [["priyanka", "calm", 120], ["arif", "worried", 210]], props: [["note", 155, 140]] },
          { place: "class", text: "আরিফ নোটটার ভাঁজ খুলল, আবার ভাঁজ করল। তারপর শার্টের বুকপকেটে রেখে বোতাম লাগিয়ে দিল।", cast: [["priyanka", "happy", 120], ["arif", "happy", 210]] },
        ],
      },
      {
        label: "আচার কিনবে", talk: "আরিফ মাথা নিচু করে হাঁটছিল কেন?",
        panels: [
          { place: "goli", text: "প্রিয়াংকা গেটে গিয়ে আচার কিনল। টক, ঝাল, মিষ্টি।", cast: [["priyanka", "happy", 140]], props: [["achar", 172, 132]] },
          { place: "goli", text: "বাড়ি ফেরার পথে সে দেখল, আরিফ হাঁটছে মাথা নিচু করে। আচারের প্যাকেটটা তখনো অর্ধেক ভরা।", cast: [["priyanka", "worried", 80], ["arif", "sad", 190]], props: [["achar", 112, 132]] },
        ],
      },
    ],
  },
  {
    id: "cup", title: "নানুর কাপ", color: "#3567a8", hero: "rafi", other: "nanu", question: "রাফি কী করবে?",
    intro: [
      { place: "home", text: "নানুর একটা সাদা কাপ আছে, গায়ে নীল ফুল। বিকেলে নানু ওটাতেই চা খান।", cast: [["rafi", "calm", 140], ["nanu", "happy", 225]], props: [["cup", 268, 128]] },
      { place: "home", text: "ঘরের ভেতর বল খেলছিল রাফি। বলটা লাগল টেবিলে। কাপটা পড়ে দুই টুকরা।", cast: [["rafi", "surprised", 160, "run"]], props: [["ball", 236, 160], ["cupBroken", 268, 186]] },
      { place: "home", text: "পাশের ঘর থেকে নানু ডাকলেন, “কিসের শব্দ রে?”", cast: [["rafi", "worried", 170]], props: [["cupBroken", 268, 186]] },
    ],
    choices: [
      {
        label: "সত্যি বলবে", talk: "টুকরা দুটো হাতে নিয়ে নানুর কেমন লাগছিল?",
        panels: [
          { place: "home", text: "রাফি টুকরা দুটো দুই হাতে নিয়ে গেল। “নানু, আমি ভেঙেছি। ঘরে বল খেলছিলাম।”", cast: [["rafi", "worried", 140], ["nanu", "surprised", 225]], props: [["cupBroken", 160, 152, 0.8]] },
          { place: "home", text: "নানু টুকরা দুটো জোড়া লাগিয়ে দেখলেন। ফুলটা মাঝখান দিয়ে ভেঙেছে। তারপর রাফির মাথায় হাত রাখলেন।", cast: [["rafi", "shy", 140], ["nanu", "sad", 225]], props: [["cupBroken", 268, 128]] },
          { place: "home", text: "সেদিন নানু চা খেলেন স্টিলের গ্লাসে। রাফি পাশে বসে রইল, চা শেষ হওয়া পর্যন্ত।", cast: [["rafi", "calm", 150, "sit"], ["nanu", "calm", 225]], props: [["glass", 268, 128]] },
        ],
      },
      {
        label: "চুপ থাকবে", talk: "কাপটা খুঁজে না পেয়ে নানু কী ভাবছিলেন?",
        panels: [
          { place: "home", text: "রাফি টুকরা দুটো খাটের নিচে ঠেলে দিল। “কিছু না, নানু।”", cast: [["rafi", "worried", 120]], props: [["cupBroken", 60, 182, 0.8]] },
          { place: "home", text: "বিকেলে নানু কাপটা খুঁজলেন। তাকে, আলমারিতে, রান্নাঘরে। তারপর চা ঢাললেন স্টিলের গ্লাসে।", cast: [["rafi", "shy", 140], ["nanu", "worried", 225]], props: [["glass", 268, 128]] },
          { place: "home", text: "রাতে রাফির ঘুম আসছিল না। খাটের নিচে কী আছে, সে জানে।", cast: [["rafi", "worried", 150]], night: true },
        ],
      },
    ],
  },
  {
    id: "aam", title: "একটা পাকা আম", color: "#e0a21b", hero: "riya", other: "tutul", question: "রিয়া কোন টুকরাটা নেবে?",
    intro: [
      { place: "uthan", text: "জ্যৈষ্ঠ মাসের দুপুর। উঠানের গাছ থেকে টুপ করে একটা পাকা আম পড়ল।", cast: [["riya", "surprised", 150]], props: [["mango", 220, 178]] },
      { place: "uthan", text: "আম্মু আমটা কেটে প্লেটে রাখলেন। এক টুকরা বড়, এক টুকরা ছোট।", cast: [["riya", "happy", 120], ["ammu", "calm", 205]], props: [["mangoPlate", 162, 172]] },
      { place: "uthan", text: "ছোট ভাই টুটুল তখন কলপাড়ে হাত ধুচ্ছে। প্লেটের সামনে শুধু রিয়া।", cast: [["tutul", "calm", 40], ["riya", "calm", 150]], props: [["mangoPlate", 192, 172]] },
    ],
    choices: [
      {
        label: "বড়টা নেবে", talk: "টুটুল রিয়ার হাতের দিকে তাকাল কেন?",
        panels: [
          { place: "uthan", text: "রিয়া বড় টুকরাটা নিল। এত রস, গড়িয়ে কনুই পর্যন্ত নামল।", cast: [["riya", "happy", 150]], props: [["mangoBig", 172, 128], ["mangoSmall", 205, 172]] },
          { place: "uthan", text: "টুটুল এসে ছোট টুকরাটা নিল। খেতে খেতে একবার রিয়ার হাতের দিকে তাকাল।", cast: [["riya", "happy", 130], ["tutul", "sad", 205]], props: [["mangoBig", 152, 128], ["mangoSmall", 222, 138]] },
        ],
      },
      {
        label: "ছোটটা নেবে", talk: "টুটুল আঁটিটা রিয়াকে দিল কেন?",
        panels: [
          { place: "uthan", text: "রিয়া ছোট টুকরাটা নিল। বড়টা প্লেটে রইল।", cast: [["riya", "calm", 150]], props: [["mangoSmall", 172, 128], ["mangoBig", 205, 172]] },
          { place: "uthan", text: "টুটুল এসে বড়টা নিল। খাওয়া শেষে আঁটিটা রিয়ার দিকে বাড়িয়ে দিল। “আঁটিতে সবচেয়ে মিষ্টি।”", cast: [["riya", "happy", 130], ["tutul", "happy", 205]], props: [["mangoBig", 222, 138, 0.7]] },
        ],
      },
    ],
  },
  {
    id: "dour", title: "দৌড়ের দিন", color: "#d35400", hero: "imon", other: "tanim", question: "ইমন কী করবে?",
    intro: [
      { place: "math", text: "স্কুলের খেলার দিন। ৫০ মিটার দৌড়। ইমনের ঠিক সামনে তানিম।", cast: [["imon", "happy", 90, "run"], ["tanim", "happy", 170, "run"], ["sadia", "happy", 285]] },
      { place: "math", text: "হঠাৎ তানিম হোঁচট খেয়ে ঘাসে পড়ে গেল। চশমাটা ছিটকে গেল দূরে।", cast: [["imon", "surprised", 90, "run"], ["tanim", "surprised", 175, "sit"], ["sadia", "worried", 285]], props: [["glasses", 225, 182]] },
      { place: "math", text: "শেষের ফিতা আর মাত্র কয়েক পা। তানিম ঘাসে হাত বুলিয়ে চশমা খুঁজছে।", cast: [["imon", "worried", 110], ["tanim", "worried", 175, "sit"]], props: [["glasses", 225, 182], ["tape", 280, 140]] },
    ],
    choices: [
      {
        label: "চশমা তুলে দেবে", talk: "চশমা হাতে পেয়ে তানিমের কেমন লাগল?",
        panels: [
          { place: "math", text: "ইমন থামল। চশমাটা তুলে তানিমের হাতে দিল। ততক্ষণে বাকিরা ফিতা পার হয়ে গেছে।", cast: [["imon", "calm", 120], ["tanim", "shy", 185, "sit"]], props: [["tape", 280, 140]] },
          { place: "math", text: "দুজনে একসাথে হেঁটে শেষের দাগ পার হলো। মাঠের ধারে সাদিয়া জোরে জোরে হাততালি দিল।", cast: [["imon", "happy", 110], ["tanim", "happy", 175], ["sadia", "happy", 280]] },
        ],
      },
      {
        label: "দৌড় শেষ করবে", talk: "চশমা ছাড়া তানিম মাঠটা কেমন দেখছিল?",
        panels: [
          { place: "math", text: "ইমন দৌড়ে ফিতা ছুঁল। প্রথম। গলায় উঠল লাল ফিতার মেডেল।", cast: [["imon", "happy", 230]], props: [["medal", 230, 132]] },
          { place: "math", text: "পেছনে তাকিয়ে ইমন দেখল, সাদিয়া হুইলচেয়ার ঠেলে তানিমের দিকে যাচ্ছে। তানিম তখনো ঘাস হাতড়াচ্ছে।", cast: [["tanim", "worried", 90, "sit"], ["sadia", "worried", 165], ["imon", "calm", 265]], props: [["glasses", 130, 184], ["medal", 265, 132]] },
        ],
      },
    ],
  },
  {
    id: "cricket", title: "ব্যাটের কোনা", color: "#2e86c1", hero: "ritu", other: "nafis", question: "ঋতু কী বলবে?",
    intro: [
      { place: "math", text: "বিকেলে মাঠে ক্রিকেট। ব্যাট করছে ঋতু। জিততে লাগবে আর ৩ রান।", cast: [["ritu", "happy", 130], ["nafis", "calm", 235]], props: [["bat", 150, 150], ["stumps", 200, 182]] },
      { place: "math", text: "বলটা ঋতুর ব্যাটের কোনা ছুঁয়ে গেল নাফিসের হাতে। খুব ছোট একটা টুক শব্দ।", cast: [["ritu", "surprised", 130], ["nafis", "surprised", 235]], props: [["bat", 150, 150], ["stumps", 200, 182], ["ball", 252, 140]] },
      { place: "math", text: "নাফিস জিজ্ঞেস করল, “লেগেছে?” কেউ নিশ্চিত না। শব্দটা শুধু ঋতু শুনেছে।", cast: [["ritu", "worried", 130], ["nafis", "worried", 235]], props: [["bat", 150, 150], ["stumps", 200, 182]] },
    ],
    choices: [
      {
        label: "“লেগেছে” বলবে", talk: "নাফিস ঋতুর ব্যাটটা বয়ে দিল কেন?",
        panels: [
          { place: "math", text: "ঋতু ব্যাটটা নামিয়ে রাখল। “লেগেছে। আমি আউট।”", cast: [["ritu", "calm", 130], ["nafis", "surprised", 235]], props: [["bat", 160, 182], ["stumps", 200, 182]] },
          { place: "math", text: "ঋতুর দল ২ রানে হারল। মাঠ থেকে ফেরার সময় নাফিস ঋতুর ব্যাটটা বয়ে দিল গেট পর্যন্ত।", cast: [["ritu", "calm", 130], ["nafis", "happy", 200]], props: [["bat", 222, 150]] },
        ],
      },
      {
        label: "“লাগেনি” বলবে", talk: "জেতার পরও ঋতু চারটার কথা বলল না কেন?",
        panels: [
          { place: "math", text: "“লাগেনি।” পরের বলে ঋতু চার মারল। ঋতুর দল জিতে গেল।", cast: [["ritu", "happy", 130], ["nafis", "sad", 235]], props: [["bat", 150, 150], ["stumps", 200, 182]] },
          { place: "math", text: "নাফিস গ্লাভস খুলে ব্যাগে ঢোকাল, কারও দিকে না তাকিয়ে। সেদিন ঋতু চারটার কথা কাউকে বলল না।", cast: [["ritu", "worried", 110], ["nafis", "sad", 230]], props: [["gloves", 262, 180]] },
        ],
      },
    ],
  },
  {
    id: "bajar", title: "খালার বাজারের ব্যাগ", color: "#8e5bb5", hero: "mong", other: "khala", question: "মং কী করবে?",
    intro: [
      { place: "stairs", text: "বিকেলে মং ব্যাট হাতে সিঁড়ি দিয়ে নামছে। মাঠে সবাই ওর জন্য দাঁড়িয়ে আছে।", cast: [["mong", "happy", 160, "run"]], props: [["bat", 180, 150]] },
      { place: "stairs", text: "নিচতলায় পাশের ফ্ল্যাটের খালা। দুই হাতে দুটো বাজারের ব্যাগ, একটা থেকে লাউয়ের মাথা বেরিয়ে আছে।", cast: [["mong", "calm", 110], ["khala", "calm", 215]], props: [["bag", 186, 160], ["bag", 246, 160]] },
      { place: "stairs", text: "খালা থাকেন পাঁচতলায়। দুই ধাপ উঠে একটু থামলেন, হাঁপাচ্ছেন।", cast: [["mong", "worried", 110], ["khala", "worried", 215]], props: [["bag", 186, 160], ["bag", 246, 160]] },
    ],
    choices: [
      {
        label: "একটা ব্যাগ নেবে", talk: "দুই হাতে দুই ব্যাগ নিয়ে পাঁচতলা উঠতে কেমন লাগে?",
        panels: [
          { place: "stairs", text: "“খালা, একটা আমাকে দিন।” মং ব্যাটটা বগলে নিয়ে লাউয়ের ব্যাগটা তুলল।", cast: [["mong", "calm", 120], ["khala", "surprised", 215]], props: [["bag", 140, 160], ["bag", 246, 160]] },
          { place: "stairs", text: "পাঁচতলায় উঠে খালা বললেন, “আজ একবারও থামিনি।” মং সিঁড়ি দিয়ে দৌড়ে নামল, মাঠের দিকে।", cast: [["khala", "happy", 215], ["mong", "happy", 110, "run"]] },
        ],
      },
      {
        label: "মাঠে চলে যাবে", talk: "খালা পাঁচতলা পর্যন্ত কীভাবে উঠলেন?",
        panels: [
          { place: "math", text: "মং মাঠে দৌড়ে গেল। প্রথম ওভারেই দুটো চার।", cast: [["mong", "happy", 150]], props: [["bat", 170, 150], ["stumps", 220, 182]] },
          { place: "stairs", text: "সন্ধ্যায় ফেরার সময় মং দেখল, তিনতলার সিঁড়িতে একটা পেঁয়াজ পড়ে আছে। খালার ব্যাগ থেকে পড়েছে।", cast: [["mong", "worried", 130]], props: [["onion", 205, 180]], night: true },
        ],
      },
    ],
  },
];

export const STORY_IDS = STORIES.map(story => story.id);
export const storyOf = (id: string) => STORIES.find(story => story.id === id);

/** Every panel of one path, in order: the shared start, then the chosen side. */
export const pathOf = (story: Story, side: Side) => [...story.intro, ...story.choices[side].panels];

/** The other person's face where the path last shows them, for the end screen. */
export function lastMood(story: Story, side: Side): Mood {
  const seen = pathOf(story, side).flatMap(panel => panel.cast).filter(actor => actor[0] === story.other);
  return seen.at(-1)?.[1] ?? "calm";
}

/** "তানিমের", "নানুর". shared possessive() gives "মংের" for a name ending in ং; the spoken form is "মংয়ের". */
export const whose = (name: string) => name.endsWith("ং") ? `${name}য়ের` : possessive(name);
