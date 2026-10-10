// Stable facts only: national symbols, geography, nature, culture, fixed national dates.
// No people, parties, 1971/2024 narratives or casualty figures. Every answer checked October 2026; the URL on
// each question is where. Left out on purpose because the claim is disputed: highest peak (Keokradong vs
// Tajingdong vs Saka Haphong), longest river, "longest sea beach in the world", "largest mangrove forest".
// Share links store picks by position: once links are public, never reorder questions or options inside a set.
import type { DoodleKey } from "./doodles";

export type Question = {
  id: string;
  /** Short name of what's asked, for "শুধু <topic>-এর প্রশ্নটা ফসকেছে". Never gives the answer away. */
  topic: string;
  ask: string;
  options: readonly [string, string, string];
  right: 0 | 1 | 2;
  /** One line shown after the pick. */
  fact: string;
  /** Short visible source label. */
  source: string;
  art: DoodleKey;
};

export type QuizSet = { id: string; label: string; short: string; victory?: boolean; questions: readonly Question[] };

const BP = "বাংলাপিডিয়া";

export const quizSets = [
  {
    id: "protik", label: "জাতীয় প্রতীক", short: "প্রতীক",
    questions: [
      // https://en.banglapedia.org/index.php/Bangladesh (National bird: Doel or magpie-robin) · https://en.banglapedia.org/index.php/Magpie-robin
      { id: "pakhi", topic: "জাতীয় পাখি", ask: "জাতীয় পাখি কোনটি?", options: ["কোকিল", "দোয়েল", "ময়না"], right: 1, fact: "সাদা-কালো ছোট্ট দোয়েল, গ্রামে-শহরে সবখানে শিস দেয়।", source: BP, art: "doyel" },
      // https://en.banglapedia.org/index.php/Bangladesh (National flower: Shapla or water lily)
      { id: "phul", topic: "জাতীয় ফুল", ask: "জাতীয় ফুল কোনটি?", options: ["শাপলা", "পদ্ম", "কদম"], right: 0, fact: "বিল-পুকুরের শাপলা। জাতীয় প্রতীকের মাঝখানেও পানিতে ভাসা শাপলা।", source: BP, art: "shapla" },
      // https://en.banglapedia.org/index.php/Bangladesh (National fruit: Kanthal or jackfruit)
      { id: "phol", topic: "জাতীয় ফল", ask: "জাতীয় ফল কোনটি?", options: ["আম", "লিচু", "কাঁঠাল"], right: 2, fact: "কাঁঠাল জাতীয় ফল। আম না, তবে আমগাছ জাতীয় গাছ, তাই গুলিয়ে যায়।", source: BP, art: "kathal" },
      // https://en.banglapedia.org/index.php/Bangladesh (National fish: Ilish hilsa)
      { id: "mach", topic: "জাতীয় মাছ", ask: "জাতীয় মাছ কোনটি?", options: ["রুই", "ইলিশ", "পাঙাশ"], right: 1, fact: "রুপালি ইলিশ, পদ্মা-মেঘনার মাছ।", source: BP, art: "ilish" },
      // https://en.banglapedia.org/index.php/Bangladesh (National animal: Royal Bengal Tiger)
      { id: "poshu", topic: "জাতীয় পশু", ask: "জাতীয় পশু কোনটি?", options: ["রয়েল বেঙ্গল টাইগার", "হাতি", "চিত্রা হরিণ"], right: 0, fact: "রয়েল বেঙ্গল টাইগার, থাকে সুন্দরবনে।", source: BP, art: "thaba" },
      // https://teachers.gov.bd/content/details/1581840 ("বাংলাদেশের জাতীয় গাছ": আম গাছ) · https://bangla.thedailystar.net/news/diverse/news-498631
      { id: "gach", topic: "জাতীয় গাছ", ask: "জাতীয় গাছ কোনটি?", options: ["বটগাছ", "আমগাছ", "তালগাছ"], right: 1, fact: "আমগাছ। ফল কাঁঠাল, গাছ আম: দুটো আলাদা।", source: "শিক্ষক বাতায়ন (teachers.gov.bd)", art: "gach" },
      // https://en.banglapedia.org/index.php/Bangladesh ("Kabadi is the national game")
      { id: "khela", topic: "জাতীয় খেলা", ask: "জাতীয় খেলা কোনটি?", options: ["ক্রিকেট", "ফুটবল", "কাবাডি"], right: 2, fact: "কাবাডি, গ্রামে যার নাম হা-ডু-ডু।", source: BP, art: "tara" },
      // https://bn.banglapedia.org/index.php/জাতীয়_প্রতীক (two stars on each side of the jute leaves: four)
      { id: "protik-tara", topic: "জাতীয় প্রতীক", ask: "জাতীয় প্রতীকে কয়টা তারা আছে?", options: ["দুইটা", "চারটা", "পাঁচটা"], right: 1, fact: "পানিতে ভাসা শাপলা, দুই পাশে ধানের শীষ, ওপরে তিনটা পাটপাতা, তার দুই পাশে দুটো করে চারটা তারা।", source: BP, art: "tara" },
      // https://en.banglapedia.org/index.php/National_Flag ("rectangular in size in the proportion of 10:6")
      { id: "potaka-map", topic: "পতাকার মাপ", ask: "জাতীয় পতাকার দৈর্ঘ্য আর প্রস্থের অনুপাত কত?", options: ["১০:৬", "৩:২", "১:১"], right: 0, fact: "১০:৬। যেমন ১০ ফুট লম্বা হলে ৬ ফুট চওড়া।", source: BP, art: "potaka" },
      // https://en.banglapedia.org/index.php/National_Anthem
      { id: "songit", topic: "জাতীয় সংগীত", ask: "জাতীয় সংগীত কোনটি?", options: ["ধনধান্য পুষ্পভরা", "একতারা তুই দেশের কথা", "আমার সোনার বাংলা"], right: 2, fact: "‘আমার সোনার বাংলা’, স্কুলের অ্যাসেম্বলিতে রোজ যেটা গাইতে।", source: BP, art: "potaka" },
    ],
  },
  {
    id: "nodi", label: "নদী, বন আর দ্বীপ", short: "নদী",
    questions: [
      // https://en.banglapedia.org/index.php?title=Bangladesh_Geography
      { id: "sagor", topic: "সাগর", ask: "বাংলাদেশের দক্ষিণে কোন সাগর?", options: ["আরব সাগর", "বঙ্গোপসাগর", "লোহিত সাগর"], right: 1, fact: "বঙ্গোপসাগর। দেশের পুরো দক্ষিণটাই সাগরের পাড়।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Buriganga_River (runs along Dhaka's west and south)
      { id: "buriganga", topic: "ঢাকার নদী", ask: "ঢাকার পাশ দিয়ে বয়ে গেছে কোন নদী?", options: ["বুড়িগঙ্গা", "কর্ণফুলী", "সুরমা"], right: 0, fact: "বুড়িগঙ্গা, ঢাকার পশ্চিম আর দক্ষিণ পাশ ঘেঁষে।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Karnafuli_River (Chittagong city and port on its bank)
      { id: "karnaphuli", topic: "কর্ণফুলী", ask: "কর্ণফুলী নদীর পাড়ে কোন শহর?", options: ["সিলেট", "খুলনা", "চট্টগ্রাম"], right: 2, fact: "চট্টগ্রাম। শহর আর বন্দর দুটোই কর্ণফুলীর পাড়ে।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Surma_River ("flows west and then southwest to Sylhet town")
      { id: "surma", topic: "সুরমা", ask: "সুরমা নদীর পাড়ে কোন শহর?", options: ["সিলেট", "রাজশাহী", "বরিশাল"], right: 0, fact: "সিলেট শহর সুরমার পাড়ে।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Ganges-Padma_River_System ("The Jamuna meets the Ganges at goalandaghat ... joins the Meghna at chandpur")
      { id: "padma-jamuna", topic: "পদ্মা-যমুনার মিলন", ask: "পদ্মা আর যমুনা কোথায় মিলেছে?", options: ["চাঁদপুর", "গোয়ালন্দ", "ভৈরব"], right: 1, fact: "গোয়ালন্দে যমুনা মেশে পদ্মায়। চাঁদপুরে পদ্মা গিয়ে মেশে মেঘনায়।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Sundarbans,_The · https://whc.unesco.org/en/list/798/ (inscribed 1997)
      { id: "sundarban", topic: "সুন্দরবন", ask: "সুন্দরবন কোন ধরনের বন?", options: ["শালবন", "ম্যানগ্রোভ বন", "পাহাড়ি বন"], right: 1, fact: "জোয়ার-ভাটার লোনা পানির ম্যানগ্রোভ বন। ১৯৯৭ সালে ইউনেস্কোর বিশ্ব ঐতিহ্য।", source: `${BP}, ইউনেস্কো`, art: "gach" },
      // https://en.banglapedia.org/index.php/Coral ("the only island in Bangladesh where coral was formed") · http://en.banglapedia.org/index.php?title=St_Martin's_Island
      { id: "saint-martin", topic: "প্রবাল দ্বীপ", ask: "দেশের একমাত্র প্রবাল দ্বীপ কোনটি?", options: ["ভোলা", "হাতিয়া", "সেন্টমার্টিন"], right: 2, fact: "সেন্টমার্টিন, স্থানীয় নাম নারিকেল জিঞ্জিরা।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Kaptai_Lake (reservoir made by damming the Karnafuli, mostly in Rangamati)
      { id: "kaptai", topic: "কাপ্তাই হ্রদ", ask: "কাপ্তাই হ্রদ কোন জেলায়?", options: ["রাঙ্গামাটি", "সুনামগঞ্জ", "কক্সবাজার"], right: 0, fact: "রাঙ্গামাটি। কর্ণফুলী নদীতে বাঁধ দিয়ে বানানো, মানুষের তৈরি হ্রদ।", source: BP, art: "nodi" },
      // https://en.banglapedia.org/index.php/Tanguar_Haor · https://rsis.ramsar.org/ris/1031 (Ramsar site, 2000)
      { id: "tanguar", topic: "টাঙ্গুয়ার হাওর", ask: "টাঙ্গুয়ার হাওর কোন জেলায়?", options: ["নেত্রকোনা", "সুনামগঞ্জ", "হবিগঞ্জ"], right: 1, fact: "সুনামগঞ্জ। শীতে হাজার হাজার অতিথি পাখি নামে।", source: `${BP}, রামসার`, art: "doyel" },
      // https://en.banglapedia.org/index.php/Kuakata (Kalapara upazila; "both sunrise and sunset can be enjoyed")
      { id: "kuakata", topic: "কুয়াকাটা", ask: "সাগরে সূর্যোদয় আর সূর্যাস্ত দুটোই দেখা যায় কুয়াকাটা থেকে। কুয়াকাটা কোন জেলায়?", options: ["বরগুনা", "ভোলা", "পটুয়াখালী"], right: 2, fact: "পটুয়াখালীর কলাপাড়ায়, দেশের একেবারে দক্ষিণে।", source: BP, art: "rritu" },
    ],
  },
  {
    id: "riti", label: "ঋতু আর ঐতিহ্য", short: "ঋতু",
    questions: [
      // https://en.banglapedia.org/index.php/Season (six seasons, two months each)
      { id: "ritu", topic: "ঋতু", ask: "বাংলায় ঋতু কয়টা?", options: ["চারটা", "ছয়টা", "আটটা"], right: 1, fact: "ছয়টা: গ্রীষ্ম, বর্ষা, শরৎ, হেমন্ত, শীত, বসন্ত। প্রতিটা দুই মাসের।", source: BP, art: "rritu" },
      // https://en.banglapedia.org/index.php/Season (Barsa: Asadh and Shraban)
      { id: "borsha", topic: "বর্ষাকাল", ask: "বর্ষাকাল কোন দুই মাস?", options: ["আষাঢ়-শ্রাবণ", "ভাদ্র-আশ্বিন", "বৈশাখ-জ্যৈষ্ঠ"], right: 0, fact: "আষাঢ়-শ্রাবণ। ভাদ্র-আশ্বিন শরৎ, বৈশাখ-জ্যৈষ্ঠ গ্রীষ্ম।", source: BP, art: "rritu" },
      // https://en.banglapedia.org/index.php/Season (Hemanta: Kartik and Agrahayan) · https://www.prothomalo.com/lifestyle/recipe/আমাদের-নবান্ন
      { id: "hemonto", topic: "অগ্রহায়ণ", ask: "নবান্নের মাস অগ্রহায়ণ কোন ঋতুতে?", options: ["শীত", "শরৎ", "হেমন্ত"], right: 2, fact: "কার্তিক-অগ্রহায়ণ হেমন্তকাল। নতুন ধান ওঠে, তাই নবান্ন।", source: BP, art: "rritu" },
      // https://en.wikipedia.org/wiki/Pohela_Boishakh (Bangla Academy fixed 14 April as 1 Baishakh)
      { id: "boishakh", topic: "বছরের প্রথম মাস", ask: "বাংলা বছরের প্রথম মাস কোনটি?", options: ["চৈত্র", "বৈশাখ", "মাঘ"], right: 1, fact: "বৈশাখ। পহেলা বৈশাখ প্রতি বছর ১৪ এপ্রিল।", source: "বাংলা একাডেমির বর্ষপঞ্জি", art: "rritu" },
      // Revised Bangla Academy calendar: Baishakh–Ashwin 31 days, Kartik–Magh 30, so 1 Falgun = 14 April + 306 days = 14 Feb.
      // https://www.prothomalo.com/bangladesh/article/1565143/ · https://teachers.gov.bd/index.php/blog/details/837208
      { id: "falgun", topic: "পহেলা ফাল্গুন", ask: "পহেলা ফাল্গুন ইংরেজি কোন তারিখে?", options: ["১৪ ফেব্রুয়ারি", "২১ ফেব্রুয়ারি", "১ মার্চ"], right: 0, fact: "১৪ ফেব্রুয়ারি, বসন্তের প্রথম দিন।", source: "বাংলা একাডেমির বর্ষপঞ্জি", art: "shapla" },
      // https://ich.unesco.org/en/state/bangladesh-BD ("Traditional art of Jamdani weaving", 2013)
      { id: "jamdani", topic: "জামদানি", ask: "জামদানি কী?", options: ["একরকম পিঠা", "হাতে বোনা শাড়ি", "নৌকার নাম"], right: 1, fact: "হাতে বোনা শাড়ি। জামদানি বুনন ২০১৩ সালে ইউনেস্কোর অধরা ঐতিহ্যের তালিকায় ওঠে।", source: "ইউনেস্কো", art: "tara" },
      // https://ich.unesco.org/en/state/bangladesh-BD ("Traditional art of Shital Pati weaving of Sylhet", 2017)
      { id: "shitalpati", topic: "শীতলপাটি", ask: "শীতলপাটির জন্য কোন অঞ্চল বিখ্যাত?", options: ["সিলেট", "রাজশাহী", "দিনাজপুর"], right: 0, fact: "সিলেট। সিলেটের শীতলপাটি বুনন ২০১৭ সালে ইউনেস্কোর তালিকায়।", source: "ইউনেস্কো", art: "tara" },
      // https://ich.unesco.org/en/state/bangladesh-BD ("Rickshaws and rickshaw painting in Dhaka", 2023)
      { id: "rickshaw", topic: "ঢাকার শিল্প", ask: "২০২৩ সালে ঢাকার কোন শিল্প ইউনেস্কোর তালিকায় উঠেছে?", options: ["নকশিকাঁথা", "রিকশা আর রিকশাচিত্র", "পোড়ামাটির পুতুল"], right: 1, fact: "রিকশা আর রিকশার গায়ের রংচঙে ছবি।", source: "ইউনেস্কো", art: "tara" },
      // https://en.banglapedia.org/index.php/Paharpur (Badalgachhi, Naogaon) · https://en.banglapedia.org/index.php/World_Heritage_Sites (1985)
      { id: "paharpur", topic: "পাহাড়পুর", ask: "পাহাড়পুর বৌদ্ধবিহার কোন জেলায়?", options: ["বগুড়া", "দিনাজপুর", "নওগাঁ"], right: 2, fact: "নওগাঁ। ১৯৮৫ সালে ইউনেস্কোর বিশ্ব ঐতিহ্য।", source: BP, art: "tara" },
      // https://en.banglapedia.org/index.php/World_Heritage_Sites (Mosque City of Bagerhat, 1985)
      { id: "shatgombuj", topic: "ষাট গম্বুজ মসজিদ", ask: "ষাট গম্বুজ মসজিদ কোন জেলায়?", options: ["খুলনা", "যশোর", "বাগেরহাট"], right: 2, fact: "বাগেরহাট। ‘মসজিদের শহর বাগেরহাট’ ১৯৮৫ সালে ইউনেস্কোর বিশ্ব ঐতিহ্য।", source: BP, art: "tara" },
    ],
  },
  {
    id: "v55", label: "বিজয়ের ৫৫ বছর", short: "বিজয়", victory: true,
    questions: [
      // https://en.banglapedia.org/index.php/National_Days (Victory Day, 16 December)
      { id: "bijoy", topic: "বিজয় দিবস", ask: "বিজয় দিবস কোন তারিখে?", options: ["২৬ মার্চ", "১৬ ডিসেম্বর", "২১ ফেব্রুয়ারি"], right: 1, fact: "১৬ ডিসেম্বর। ২৬ মার্চ স্বাধীনতা দিবস, ২১ ফেব্রুয়ারি শহীদ দিবস।", source: BP, art: "potaka" },
      // 1971 + 55 = 2026.
      { id: "bijoy-55", topic: "বিজয়ের বছর", ask: "২০২৬ সালের ১৬ ডিসেম্বর বিজয়ের কত বছর পূর্তি?", options: ["৫০", "৫৪", "৫৫"], right: 2, fact: "১৯৭১ থেকে ২০২৬, পুরো ৫৫ বছর।", source: "হিসাব: ১৯৭১ + ৫৫", art: "tara" },
      // Revised Bangla Academy calendar sets 16 December = 1 Poush (14 April + 246 days).
      // https://www.prothomalo.com/bangladesh/article/1565143/ · https://bangla.thedailystar.net/top-news/news-559336
      { id: "poush", topic: "বাংলা তারিখ", ask: "বাংলা বর্ষপঞ্জিতে বিজয় দিবস কোন দিন?", options: ["১ পৌষ", "১ মাঘ", "১৫ অগ্রহায়ণ"], right: 0, fact: "১ পৌষ। সংশোধিত বর্ষপঞ্জিতে ১৬ ডিসেম্বর সবসময় পৌষের প্রথম দিন।", source: "বাংলা একাডেমির বর্ষপঞ্জি", art: "rritu" },
      // https://en.banglapedia.org/index.php/Season (Shhit: Paus and Magh)
      { id: "poush-ritu", topic: "পৌষ মাস", ask: "পৌষ কোন ঋতুর মাস?", options: ["হেমন্ত", "শীত", "বসন্ত"], right: 1, fact: "শীত। পৌষ-মাঘ শীতকাল, তাই বিজয় দিবস আসে কুয়াশা নিয়ে।", source: BP, art: "rritu" },
      // https://en.banglapedia.org/index.php/National_Martyrs%E2%80%99_Memorial (about 35 km northwest of Dhaka, at Savar)
      { id: "smritisoudho", topic: "জাতীয় স্মৃতিসৌধ", ask: "জাতীয় স্মৃতিসৌধ কোথায়?", options: ["গাজীপুর", "মুন্সীগঞ্জ", "সাভার"], right: 2, fact: "সাভার, ঢাকা থেকে প্রায় ৩৫ কিলোমিটার।", source: BP, art: "tara" },
      // https://en.banglapedia.org/index.php/National_Martyrs%E2%80%99_Memorial ("seven isosceles triangular planes", 150 feet)
      { id: "soudho-deyal", topic: "স্মৃতিসৌধের দেয়াল", ask: "স্মৃতিসৌধে ত্রিভুজ আকারের দেয়াল কয়টা?", options: ["পাঁচটা", "সাতটা", "নয়টা"], right: 1, fact: "সাতটা, ছোট থেকে বড়। চূড়া ১৫০ ফুট উঁচু।", source: BP, art: "tara" },
      // https://en.banglapedia.org/index.php/National_Days ("The first ray of the morning is heralded with a 31 gun-salute")
      { id: "topdhoni", topic: "তোপধ্বনি", ask: "বিজয় দিবসের ভোর শুরু হয় কত বার তোপধ্বনিতে?", options: ["৩১ বার", "২১ বার", "৫৫ বার"], right: 0, fact: "৩১ বার তোপধ্বনি দিয়ে বিজয় দিবসের সকাল শুরু।", source: BP, art: "rritu" },
      // https://en.banglapedia.org/index.php/National_Flag (green base, red circle)
      { id: "potaka-rong", topic: "পতাকার রং", ask: "জাতীয় পতাকা দেখতে কেমন?", options: ["লাল জমিনে সবুজ বৃত্ত", "সবুজ-লাল দুই ডোরা", "সবুজ জমিনে লাল বৃত্ত"], right: 2, fact: "সবুজ জমিনে লাল বৃত্ত। বৃত্তটা ঠিক মাঝে না, একটু খুঁটির দিকে সরানো।", source: BP, art: "potaka" },
      // https://en.banglapedia.org/index.php/National_Flag ("radius of one-fifth of the length of the flag")
      { id: "brittho", topic: "লাল বৃত্তের মাপ", ask: "পতাকার লাল বৃত্তের ব্যাসার্ধ দৈর্ঘ্যের কত ভাগ?", options: ["পাঁচ ভাগের এক ভাগ", "তিন ভাগের এক ভাগ", "অর্ধেক"], right: 0, fact: "পাঁচ ভাগের এক ভাগ। ১০ ফুট পতাকায় বৃত্তের ব্যাসার্ধ ২ ফুট।", source: BP, art: "potaka" },
      // https://en.banglapedia.org/index.php/National_Days (independence declared 26 March 1971)
      { id: "shadhinota", topic: "স্বাধীনতা দিবস", ask: "স্বাধীনতা দিবস কোন তারিখে?", options: ["১৪ এপ্রিল", "২৬ মার্চ", "১৬ ডিসেম্বর"], right: 1, fact: "২৬ মার্চ। ১৪ এপ্রিল পহেলা বৈশাখ।", source: BP, art: "potaka" },
    ],
  },
] as const satisfies readonly QuizSet[];

export type SetId = (typeof quizSets)[number]["id"];
