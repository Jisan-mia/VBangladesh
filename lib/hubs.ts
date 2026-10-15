// Category landing pages for broad searches ("বাংলা গেম", "বাংলা কুইজ", "হিসাব ক্যালকুলেটর", উৎসবের কার্ড).
// Each lists real tools only; a tool may sit in one hub (its breadcrumb points there).
export type Hub = { slug: string; name: string; title: string; description: string; h1: string; intro: string[]; tools: string[]; more?: { heading: string; tools: string[] } };

export const hubs: Hub[] = [
  {
    slug: 'chhotoder',
    name: 'ছোটদের খেলাঘর',
    title: 'ছোটদের শিক্ষামূলক খেলা: বর্ণমালা, অঙ্ক, ধাঁধা আর মহাকাশ',
    description: 'কার-চিহ্ন, যুক্তবর্ণ, ঘড়ি দেখা, গ্রহের নাম, ডাইনোসর আর ছোটদের গল্প। ৩ থেকে ১২ বছরের জন্য শেখার খেলা, ফোনেই। বিজ্ঞাপন নেই, কোনো তথ্য নেওয়া হয় না।',
    h1: 'ছোটদের খেলাঘর: খেলতে খেলতে শেখা',
    intro: [
      'বর্ণ চেনা, যুক্তবর্ণ ভাঙা, ঘড়ি দেখা, গ্রহের নাম, মনের কথা বলা। ৩ থেকে ১২ বছরের ছোটদের জন্য ছোট ছোট খেলা, কিছু বাংলাদেশের, কিছু সারা পৃথিবীর।',
      'প্রতিটা খেলার ওপরে আব্বু-আম্মুর জন্য একটা নোট আছে: কী শেখে, কোন বয়সে, কীভাবে একসাথে খেলবে। নাম লাগে না, বিজ্ঞাপন নেই, খেলার কিছু ফোনের বাইরে যায় না। রোজ ১৫ মিনিট খেলার পর খেলা নিজেই থামতে বলে।',
    ],
    tools: ['kar-chinho', 'nam-shikhi', 'golper-mor', 'moner-rong', 'dosh-ghater-nouka', 'sourojogot'],
    more: { heading: 'আরও খেলা, ছোটরাও খেলতে পারে', tools: ['o-te-ojogor', 'namta', 'jora-melao', 'konta-nei', 'golokdhadha', 'chhobir-tukro', 'chhobi-photao', 'ghontar-sur', 'bhul-kothay', 'sap-ludu', 'alpana', 'chhotto-para'] },
  },
  {
    slug: 'games',
    name: 'বাংলা গেম',
    title: 'বাংলা গেম — ফোনেই দেশি আর পুরোনো দিনের খেলা',
    description: 'সাপলুডু, ক্যারম, বাঘবন্দি থেকে সুডোকু, গোলকধাঁধা আর ঝালমুড়ি সাপ। লেভেল আর তারার বাংলা গেম, ফোনের ব্রাউজারেই খেলো। ডাউনলোড বা অ্যাকাউন্ট লাগে না।',
    h1: 'বাংলা গেম: ফোনেই দেশি খেলা, একদম ফ্রি',
    intro: [
      'ছোটবেলায় উঠোনে বাঘবন্দি, বিকেলে ডাংগুলি, ঈদের ছুটিতে ক্যারম আর সাপলুডু। সেই খেলাগুলো এখন ফোনে। সাথে আছে পুরোনো মোবাইলের ব্রিক গেমের মতো ছোট খেলাও।',
      'কোনো অ্যাপ নামাতে হয় না। লিংক খুললেই খেলা শুরু, এক আঙুলেই চলে। শেষে নিজের স্কোরের ছবি পাবে, আর বন্ধুকে একই খেলা পাঠিয়ে দেখতে পারবে কে বেশি পারে। কয়েকটায় এক ফোনে দুজন বা চারজনও খেলতে পারে। ধাঁধার খেলাগুলোয় লেভেল আছে, প্রতিটায় তিন তারা পর্যন্ত।',
    ],
    tools: ['sap-ludu', 'carrom', 'baghbandi', 'chhok-jora', 'danguli', 'chor-police', 'vo-katta', 'kalbaishakhi-aam', 'jhalmuri-sap', 'dudh-uthlano', 'antenna-thik-koro', 'tarer-fanke-belun', 'sir-ghurlei-thamo', 'deri-hoye-gelo', 'bostar-pahar', 'churui-tarao', 'handi-bhanga', 'peoner-cycle', 'baicher-nouka', 'pati-buni', 'paka-kancha', 'jora-melao', 'jam-chharao', 'shobdo-khoja', 'bhangti-nai', 'sudoku', 'switchboard', 'golokdhadha', 'ponero-ghor', 'chhobi-photao', 'bhul-kothay', 'bhimruler-chak', 'churir-bazar', 'atir-aam', 'chhobir-tukro', 'konta-nei', 'ghontar-sur', 'mukhe-mukhe-hisab', 'sat-chara', 'chhip-felo', 'latim', 'nodi-par', 'penalty', 'golir-badminton', 'kagojer-urojahaj', 'marble-sinri', 'roshi-tana', 'moshar-raat', 'al-dhore-hati', 'o-te-ojogor'],
  },
  {
    slug: 'quiz',
    name: 'বাংলা কুইজ',
    title: 'বাংলা কুইজ — সাধারণ জ্ঞান, বানান, বাগধারা আর মজার প্রশ্ন',
    description: 'বাংলাদেশের সাধারণ জ্ঞান, শুদ্ধ বানান, বাগধারা, ক্রিকেট আর খাবার নিয়ে বাংলা কুইজ। উত্তর মিলিয়ে দেখো, শেষে স্কোর কার্ড পাবে, বন্ধুকেও চ্যালেঞ্জ দিতে পারবে।',
    h1: 'বাংলা কুইজ: কতটা জানো, খেলে দেখো',
    intro: [
      'বিজয় দিবসের প্রশ্ন, পোশাক না পোষাক, ভিজে বিড়াল মানে কী, দম আটকানো কোন ম্যাচে বাংলাদেশ জিতেছিল। এখানকার কুইজগুলো ছোট, দশ প্রশ্নের মধ্যেই শেষ।',
      'যেসব কুইজে তথ্য আছে, সেখানে উত্তরের সাথে সূত্রও দেওয়া। শেষে নিজের স্কোরের ছবি পাবে। বন্ধুকে লিংক পাঠালে সে-ও একই প্রশ্নে খেলবে, তারপর মিলিয়ে দেখো।',
    ],
    tools: ['desh-cheno', 'banan', 'bagdhara', 'dom-atkano', 'dhadha', 'projonmo', 'attiyo', 'koto-cheno', 'flames', 'mache-bhate', 'pitha', 'mishtir-baksho', 'jibh', 'himu'],
  },
  {
    slug: 'hishab',
    name: 'হিসাবের টুল',
    title: 'হিসাব ক্যালকুলেটর — জমি, বিদ্যুৎ বিল, বয়স, জিপিএ বাংলায়',
    description: 'জমির মাপ, বিদ্যুৎ বিল, বয়স, জিপিএ, টাকা কথায় লেখা, নামতা, স্বর্ণের ভরি আর খরচ ভাগাভাগি। বাংলায় সহজ হিসাবের টুল, সূত্রসহ। ফ্রি, অ্যাকাউন্ট লাগে না।',
    h1: 'রোজকার হিসাব, বাংলায় সহজ করে',
    intro: [
      'দলিলে শতাংশ লেখা, কিন্তু কাঠায় কত? এ মাসে বিদ্যুৎ বিল কত আসবে? চাকরির আবেদনের দিন বয়স কত হবে? এমন রোজকার প্রশ্নের হিসাব এক জায়গায়।',
      'উত্তর আসে বাংলা অঙ্কে। যেখানে সরকারি দর বা মাপ লাগে, সেখানে সূত্র আর কবে মিলিয়ে দেখা হয়েছে, দুটোই লেখা থাকে। হিসাব আনুমানিক হলে সেটা স্পষ্ট বলা আছে।',
    ],
    tools: ['jomi', 'bidyut-bill', 'boyos', 'gpa', 'taka-kothay', 'namta', 'bhori', 'bhagabhagi', 'bhara', 'gorur-ojon', 'tokhon-ekhon', 'betoner-bhag', 'matir-bank', 'current-gelo', 'dhoyahin', 'rokto', 'bazar-note'],
  },
  {
    slug: 'utsob',
    name: 'উৎসবের টুল',
    title: 'ঈদ, পূজা, বৈশাখের কার্ড আর উৎসবের টুল',
    description: 'ঈদ মোবারক, শুভ বিজয়া, শুভ নববর্ষের কার্ড, ঈদের সালামি, ইফতারের প্লেট, মণ্ডপ ঘোরা আর উৎসব কত দিন বাকি। সবার উৎসবের ছোট বাংলা টুল এক জায়গায়।',
    h1: 'ঈদ, পূজা, বৈশাখ: উৎসবের ছোট ছোট টুল',
    intro: [
      'ঈদের সালামি, পূজার মণ্ডপ, বৈশাখের আলপনা, সাকরাইনের ঘুড়ি। উৎসবের দিনের জন্য ছোট ছোট টুল: কার্ড বানাও, দিন গোনো, বন্ধু-আত্মীয়দের পাঠাও।',
      'চাঁদ দেখার ওপর নির্ভর করা তারিখগুলো সম্ভাব্য হিসেবে লেখা থাকে। সব উৎসবই সবার জন্য খোলা, কোনো ধর্মীয় বিধান এখানে দেওয়া হয় না।',
    ],
    tools: ['shubhechha', 'koto-din-baki', 'eider-din', 'salami-chek', 'iftar-plate', 'sehri-iftar', 'eidjatra', 'mondop', 'ghuri', 'alpana'],
  },
];

export const hubOf = (slug: string) => hubs.find(hub => hub.tools.includes(slug));
