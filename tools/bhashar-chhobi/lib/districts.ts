// All 64 districts, grouped by division. Ids travel in share links and the district tally: never rename or remove one.
export const divisions = [
  { name: "ঢাকা", districts: [
    { id: "dhaka", name: "ঢাকা" }, { id: "gazipur", name: "গাজীপুর" }, { id: "narayanganj", name: "নারায়ণগঞ্জ" }, { id: "narsingdi", name: "নরসিংদী" },
    { id: "manikganj", name: "মানিকগঞ্জ" }, { id: "munshiganj", name: "মুন্সিগঞ্জ" }, { id: "tangail", name: "টাঙ্গাইল" }, { id: "kishoreganj", name: "কিশোরগঞ্জ" },
    { id: "faridpur", name: "ফরিদপুর" }, { id: "gopalganj", name: "গোপালগঞ্জ" }, { id: "madaripur", name: "মাদারীপুর" }, { id: "rajbari", name: "রাজবাড়ী" },
    { id: "shariatpur", name: "শরীয়তপুর" },
  ] },
  { name: "চট্টগ্রাম", districts: [
    { id: "chattogram", name: "চট্টগ্রাম" }, { id: "coxsbazar", name: "কক্সবাজার" }, { id: "cumilla", name: "কুমিল্লা" }, { id: "feni", name: "ফেনী" },
    { id: "noakhali", name: "নোয়াখালী" }, { id: "lakshmipur", name: "লক্ষ্মীপুর" }, { id: "chandpur", name: "চাঁদপুর" }, { id: "brahmanbaria", name: "ব্রাহ্মণবাড়িয়া" },
    { id: "khagrachhari", name: "খাগড়াছড়ি" }, { id: "rangamati", name: "রাঙ্গামাটি" }, { id: "bandarban", name: "বান্দরবান" },
  ] },
  { name: "রাজশাহী", districts: [
    { id: "rajshahi", name: "রাজশাহী" }, { id: "natore", name: "নাটোর" }, { id: "naogaon", name: "নওগাঁ" }, { id: "chapainawabganj", name: "চাঁপাইনবাবগঞ্জ" },
    { id: "pabna", name: "পাবনা" }, { id: "sirajganj", name: "সিরাজগঞ্জ" }, { id: "bogura", name: "বগুড়া" }, { id: "joypurhat", name: "জয়পুরহাট" },
  ] },
  { name: "খুলনা", districts: [
    { id: "khulna", name: "খুলনা" }, { id: "bagerhat", name: "বাগেরহাট" }, { id: "satkhira", name: "সাতক্ষীরা" }, { id: "jashore", name: "যশোর" },
    { id: "jhenaidah", name: "ঝিনাইদহ" }, { id: "magura", name: "মাগুরা" }, { id: "narail", name: "নড়াইল" }, { id: "kushtia", name: "কুষ্টিয়া" },
    { id: "chuadanga", name: "চুয়াডাঙ্গা" }, { id: "meherpur", name: "মেহেরপুর" },
  ] },
  { name: "বরিশাল", districts: [
    { id: "barishal", name: "বরিশাল" }, { id: "patuakhali", name: "পটুয়াখালী" }, { id: "bhola", name: "ভোলা" },
    { id: "pirojpur", name: "পিরোজপুর" }, { id: "barguna", name: "বরগুনা" }, { id: "jhalokathi", name: "ঝালকাঠি" },
  ] },
  { name: "সিলেট", districts: [
    { id: "sylhet", name: "সিলেট" }, { id: "moulvibazar", name: "মৌলভীবাজার" }, { id: "habiganj", name: "হবিগঞ্জ" }, { id: "sunamganj", name: "সুনামগঞ্জ" },
  ] },
  { name: "রংপুর", districts: [
    { id: "rangpur", name: "রংপুর" }, { id: "dinajpur", name: "দিনাজপুর" }, { id: "kurigram", name: "কুড়িগ্রাম" }, { id: "gaibandha", name: "গাইবান্ধা" },
    { id: "lalmonirhat", name: "লালমনিরহাট" }, { id: "nilphamari", name: "নীলফামারী" }, { id: "panchagarh", name: "পঞ্চগড়" }, { id: "thakurgaon", name: "ঠাকুরগাঁও" },
  ] },
  { name: "ময়মনসিংহ", districts: [
    { id: "mymensingh", name: "ময়মনসিংহ" }, { id: "jamalpur", name: "জামালপুর" }, { id: "netrokona", name: "নেত্রকোনা" }, { id: "sherpur", name: "শেরপুর" },
  ] },
] as const;

type District = (typeof divisions)[number]["districts"][number];
export const districts: readonly District[] = divisions.flatMap<District>(division => division.districts);
export type DistrictId = District["id"];

export const districtName = (id: string) => districts.find(district => district.id === id)?.name ?? "";
export const isDistrictId = (id: string): id is DistrictId => districts.some(district => district.id === id);
