import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;
export const PER_SET = 10;

export type Kind = "joy" | "heart";
export type Question = {
  id: string;
  kind: Kind;
  /** Short year for the plate under each answer on the card. */
  year: string;
  where: string;
  prompt: string;
  options: readonly [string, string, string];
  answer: 0 | 1 | 2;
  memory: string;
  source: string;
};

// House rules: moments, never people (no player names; several were or are politicians). Venues by city, not stadium names.
// Every fact below was checked against the linked scorecard plus the news report named in the comment (checked Oct 2026).
// Share links store answers by position: once links are public, never edit, reorder or swap a set's questions. Add new sets instead.
export const sets = [
  {
    id: "s1", label: "প্রথম সেট",
    questions: [
      // India won by 1 run; BAN 145/9 chasing 147, needed 2 off the last 3 balls and lost 3 wickets in 3 balls (Dhaka Tribune, Wisden).
      // https://www.espncricinfo.com/series/world-t20-2015-16-901359/india-vs-bangladesh-25th-match-super-10-group-2-951353/full-scorecard
      // https://www.dhakatribune.com/sport/cricket/123832/india-beat-bangladesh-by-1-run
      { id: "q2016blr", kind: "heart", year: "২০১৬", where: "বেঙ্গালুরু", prompt: "টি-টোয়েন্টি বিশ্বকাপে ভারতের বিপক্ষে শেষ ৩ বলে দরকার ২ রান। তারপর?", options: ["শেষ বলে চার, বাংলাদেশের জয়", "পরপর ৩ বলে ৩ উইকেট, ১ রানে হার", "১ রান নিয়ে টাই, সুপার ওভার"], answer: 1, memory: "দরকার ছিল মাত্র ২ রান, তবু ১ রানে হার।", source: "https://www.espncricinfo.com/series/world-t20-2015-16-901359/india-vs-bangladesh-25th-match-super-10-group-2-951353/full-scorecard" },
      // ICC Trophy final, Kuala Lumpur, 12–13 Apr 1997. Rain: 166 in 25 overs (D/L). 11 off the last over, 1 off the last ball, scampered off the pads; won by 2 wickets, 0 balls left. Qualified for the 1999 World Cup.
      // https://espncricinfo.com/ci/engine/match/66792.html
      // https://www.dhakatribune.com/amp/sport/cricket/3520/1997-icc-trophy-the-one-where-it-all-started · https://www.tbsnews.net/node/68416
      { id: "q1997kl", kind: "joy", year: "১৯৯৭", where: "কুয়ালালামপুর", prompt: "আইসিসি ট্রফির ফাইনালে কেনিয়ার বিপক্ষে শেষ বলে দরকার ১ রান। তারপর?", options: ["বোল্ড, কেনিয়া চ্যাম্পিয়ন", "রান আউট, ম্যাচ টাই", "প্যাডে লেগে দৌড়ে ১ রান, বাংলাদেশ চ্যাম্পিয়ন"], answer: 2, memory: "বৃষ্টিতে দুই দিনে গড়ানো ফাইনাল। ওই এক রানেই প্রথম বিশ্বকাপের টিকিট।", source: "https://espncricinfo.com/ci/engine/match/66792.html" },
      // Asia Cup final, Mirpur, 22 Mar 2012. PAK 236/9, BAN 234/8; 9 off the last over, 4 off the last ball, got 1 (leg bye). Lost by 2 runs (Al Jazeera, Gulf Times/AFP).
      // https://www.espncricinfo.com/series/8532/game/535800
      // https://www.aljazeera.com/sport/cricket/2012/03/2012322165855206160.html
      { id: "q2012mir", kind: "heart", year: "২০১২", where: "মিরপুর", prompt: "এশিয়া কাপ ফাইনালে পাকিস্তানের বিপক্ষে শেষ বলে দরকার ৪ রান। তারপর?", options: ["এল মাত্র ১ রান, ২ রানে হার", "চার! বাংলাদেশ চ্যাম্পিয়ন", "৩ রান, ম্যাচ টাই"], answer: 0, memory: "মাত্র ২ রানের জন্য প্রথম এশিয়া কাপ হাতছাড়া, তাও নিজের মাঠে।", source: "https://www.espncricinfo.com/series/8532/game/535800" },
      // World Cup, Northampton, 31 May 1999. BAN 223/9, PAK 161 all out; won by 62 runs. First win over Pakistan (Daily Star).
      // https://www.espncricinfo.com/series/8039/game/65221
      // https://www.thedailystar.net/node/77187
      { id: "q1999nor", kind: "joy", year: "১৯৯৯", where: "নর্দাম্পটন", prompt: "প্রথম বিশ্বকাপেই পাকিস্তানের বিপক্ষে কী হলো?", options: ["বৃষ্টিতে ম্যাচ পরিত্যক্ত", "বাংলাদেশ জিতল ৬২ রানে", "পাকিস্তান জিতল ৬২ রানে"], answer: 1, memory: "২২৩ রান টপকাতে পারেনি পাকিস্তান। ওদের বিপক্ষে প্রথম জয়, তাও বিশ্বকাপে।", source: "https://www.espncricinfo.com/series/8039/game/65221" },
      // NatWest Series, Cardiff, 18 Jun 2005. AUS (2003 world champions) 249/5, BAN 250/5 in 49.2 overs; won by 5 wickets, 4 balls left.
      // https://espncricinfo.com/ci/engine/match/211364.html
      // https://stats.acscricket.com/Archive/Scorecards/82/82650.html
      { id: "q2005car", kind: "joy", year: "২০০৫", where: "কার্ডিফ", prompt: "তখনকার বিশ্বচ্যাম্পিয়ন অস্ট্রেলিয়া করল ২৪৯। তারপর?", options: ["বাংলাদেশ জিতল ৫ উইকেটে", "বাংলাদেশ অলআউট ১০০-র নিচে", "বৃষ্টিতে খেলা আর হলো না"], answer: 0, memory: "৪ বল বাকি থাকতেই জয়। ক্রিকেট ইতিহাসের সবচেয়ে বড় অঘটনগুলোর একটা।", source: "https://espncricinfo.com/ci/engine/match/211364.html" },
      // Women's T20 Asia Cup final, Kuala Lumpur, 10 Jun 2018. IND 112/9, BAN 113/7; 2 off the last ball, ran 2; won by 3 wickets. First title.
      // https://www.espncricinfo.com/series/8659/scorecard/1148063/bangladesh-women-vs-india-women-final-women's-twenty20-asia-cup-2018
      // https://www.dhakatribune.com/sport/cricket/147677/bangladesh-women-become-champions
      { id: "q2018wkl", kind: "joy", year: "২০১৮", where: "কুয়ালালামপুর", prompt: "নারী এশিয়া কাপের ফাইনালে ভারতের বিপক্ষে শেষ বলে দরকার ২ রান। তারপর?", options: ["রান আউট, ভারত চ্যাম্পিয়ন", "১ রান, ম্যাচ টাই", "দৌড়ে ২ রান, বাংলাদেশ চ্যাম্পিয়ন"], answer: 2, memory: "মেয়েদের হাতে প্রথম এশিয়া কাপ। জেতার রানটা এল শেষ বলের দৌড়ে।", source: "https://www.espncricinfo.com/series/8659/scorecard/1148063/bangladesh-women-vs-india-women-final-women's-twenty20-asia-cup-2018" },
      // Asia Cup final, Dubai, 28 Sep 2018. BAN 222, IND 223/7; India won by 3 wickets with 0 balls remaining.
      // https://www.espncricinfo.com/series/asia-cup-2018-1153237/bangladesh-vs-india-final-1153255/ball-by-ball-commentary
      // https://www.dhakatribune.com/sport/cricket/156804/another-heartbreak-as-tigers-lose-asia-cup-final
      { id: "q2018dxb", kind: "heart", year: "২০১৮", where: "দুবাই", prompt: "এশিয়া কাপ ফাইনালে বাংলাদেশের ২২২ রান তাড়ায় নামল ভারত। ফল?", options: ["বাংলাদেশ জিতল ৩ রানে", "ম্যাচ টাই", "ভারত জিতল একেবারে শেষ বলে"], answer: 2, memory: "৩ উইকেটে হার, বাকি ছিল না একটা বলও।", source: "https://www.espncricinfo.com/series/asia-cup-2018-1153237/bangladesh-vs-india-final-1153255/ball-by-ball-commentary" },
      // World Cup, Port of Spain, 17 Mar 2007. IND 191 all out, BAN 192/5; won by 5 wickets. India out in the first round, Bangladesh to the Super Eight.
      // https://www.espncricinfo.com/series/8039/game/247464
      // https://www.thedailystar.net/sports/bangladesh%E2%80%99s-top-ten-moments-against-india-4-92587
      { id: "q2007pos", kind: "joy", year: "২০০৭", where: "পোর্ট অব স্পেন", prompt: "বিশ্বকাপে কোন দলকে ৫ উইকেটে হারিয়ে সবাইকে চমকে দিল বাংলাদেশ?", options: ["ভারত", "অস্ট্রেলিয়া", "ইংল্যান্ড"], answer: 0, memory: "ভারত অলআউট ১৯১ রানে। সেবার ভারত প্রথম পর্বেই বিদায়, বাংলাদেশ গেল সুপার এইটে।", source: "https://www.espncricinfo.com/series/8039/game/247464" },
      // U19 World Cup final, Potchefstroom, 9 Feb 2020. IND 177, BAN 170/7 (D/L target 170); won by 3 wickets. First ICC title at any level (Gulf News).
      // https://www.espncricinfo.com/series/under-19-world-cup-2019-20-1204639/bangladesh-under-19s-vs-india-under-19s-final-1204722/full-scorecard
      // https://gulfnews.com/sport/cricket/icc/bangladesh-stop-india-to-lift-under-19-world-cup-1.69599623
      { id: "q2020pot", kind: "joy", year: "২০২০", where: "পচেফস্ট্রুম", prompt: "যুব (অনূর্ধ্ব-১৯) বিশ্বকাপের ফাইনালে কাকে হারিয়ে চ্যাম্পিয়ন বাংলাদেশ?", options: ["পাকিস্তান", "ভারত", "অস্ট্রেলিয়া"], answer: 1, memory: "বৃষ্টির বাধা পেরিয়ে ৩ উইকেটে জয়। যেকোনো পর্যায়ে বাংলাদেশের প্রথম আইসিসি শিরোপা।", source: "https://www.espncricinfo.com/series/under-19-world-cup-2019-20-1204639/bangladesh-under-19s-vs-india-under-19s-final-1204722/full-scorecard" },
      // 1st Test, Mount Maunganui, 1–5 Jan 2022. NZ 328 & 169, BAN 458 & 42/2; won by 8 wickets. First win in New Zealand in any format (ESPNcricinfo stats piece).
      // https://www.espncricinfo.com/series/bangladesh-in-new-zealand-2021-22-1288977/new-zealand-vs-bangladesh-1st-test-1288979/full-scorecard
      // https://www.espncricinfo.com/story/new-zealand-vs-bangladesh-1st-test-mount-maunganui-stats-a-rare-overseas-high-for-bangladesh-s-batters-1295341
      { id: "q2022mtm", kind: "joy", year: "২০২২", where: "মাউন্ট মঙ্গানুই", prompt: "নতুন বছরের পাঁচ দিনের মাথায় নিউজিল্যান্ডের মাটিতে টেস্টে কী হলো?", options: ["ইনিংস ব্যবধানে হার", "৮ উইকেটে জয়", "শেষ দিনে ড্র"], answer: 1, memory: "নিউজিল্যান্ডে যেকোনো ফরম্যাটে বাংলাদেশের প্রথম জয়। বছরটা শুরু হলো এভাবেই।", source: "https://www.espncricinfo.com/series/bangladesh-in-new-zealand-2021-22-1288977/new-zealand-vs-bangladesh-1st-test-1288979/full-scorecard" },
    ],
  },
  {
    id: "s2", label: "দ্বিতীয় সেট",
    questions: [
      // Nidahas Trophy final, Colombo, 18 Mar 2018. BAN 166/8, IND 168/6; 5 off the last ball, hit for six; India won by 4 wickets, 0 balls left.
      // https://www.espncricinfo.com/series/nidahas-t20-series-2017-18-1133811/bangladesh-vs-india-final-1133823/full-scorecard
      // https://www.thedailystar.net/sports/bangladesh-cricket/bangladesh-vs-india-final-nidahas-trophy-2018-live-score-updates-1549984
      { id: "q2018col", kind: "heart", year: "২০১৮", where: "কলম্বো", prompt: "নিদাহাস ট্রফির ফাইনালে ভারতের দরকার শেষ বলে ৫ রান। তারপর?", options: ["ডট বল, বাংলাদেশ চ্যাম্পিয়ন", "ছক্কা, ভারত চ্যাম্পিয়ন", "চার, সুপার ওভার"], answer: 1, memory: "এক বলেই শিরোপা হাতছাড়া। সেই থেকে শেষ বলে চোখ খোলা রাখা কঠিন।", source: "https://www.espncricinfo.com/series/nidahas-t20-series-2017-18-1133811/bangladesh-vs-india-final-1133823/full-scorecard" },
      // Only Test, Dhaka, 10–13 Nov 2000: Bangladesh's first Test, as the tenth Test nation. BAN 400 & 91, IND 429 & 64/1; India won by 9 wickets.
      // https://www.espncricinfo.com/series/india-tour-of-bangladesh-2000-01-62353/bangladesh-vs-india-only-test-63898/full-scorecard
      { id: "q2000dha", kind: "joy", year: "২০০০", where: "ঢাকা", prompt: "নভেম্বরে বাংলাদেশের প্রথম টেস্ট। প্রতিপক্ষ কে?", options: ["পাকিস্তান", "জিম্বাবুয়ে", "ভারত"], answer: 2, memory: "দশম টেস্ট খেলুড়ে দেশ হিসেবে প্রথম পা। প্রথম ইনিংসেই ৪০০ রান, শেষে হার ৯ উইকেটে।", source: "https://www.espncricinfo.com/series/india-tour-of-bangladesh-2000-01-62353/bangladesh-vs-india-only-test-63898/full-scorecard" },
      // World Cup, Mirpur, 4 Mar 2011. BAN 58 all out in 18.5 overs; WI won by 9 wickets.
      // https://espncricinfo.com/ci/engine/match/433576.html
      // https://www.aljazeera.com/amp/sports/2011/3/4/west-indies-crush-bangladesh
      { id: "q2011mir", kind: "heart", year: "২০১১", where: "মিরপুর", prompt: "নিজের মাঠের বিশ্বকাপে ওয়েস্ট ইন্ডিজের বিপক্ষে বাংলাদেশ অলআউট কত রানে?", options: ["৫৮", "৭৮", "৯৮"], answer: 0, memory: "১৯ ওভারও টেকেনি ইনিংস, হার ৯ উইকেটে। স্কোরবোর্ডের দিকে তাকানো যাচ্ছিল না।", source: "https://espncricinfo.com/ci/engine/match/433576.html" },
      // 1st Test, Chattogram, 6–10 Jan 2005. Won by 226 runs: first Test win, in the 35th Test, after 31 defeats and 3 draws.
      // https://www.espncricinfo.com/series/14914/game/64121
      // https://www.espncricinfo.com/print/story/237510
      { id: "q2005ctg", kind: "joy", year: "২০০৫", where: "চট্টগ্রাম", prompt: "৩৫তম টেস্টে এসে বাংলাদেশের প্রথম টেস্ট জয়। প্রতিপক্ষ কে?", options: ["জিম্বাবুয়ে", "নিউজিল্যান্ড", "ওয়েস্ট ইন্ডিজ"], answer: 0, memory: "৩১টা হার আর ৩টা ড্রয়ের পর অবশেষে জয়, ২২৬ রানে।", source: "https://www.espncricinfo.com/series/14914/game/64121" },
      // World Cup, Chattogram, 11 Mar 2011. ENG 225; BAN slid from 155/3 to 169/8, then an unbroken 58 for the 9th wicket; won by 2 wickets, 6 balls left.
      // https://www.espncricinfo.com/series/8039/game/433585
      // https://mg.co.za/2011-03-11-fearless-bangladesh-down-england/
      { id: "q2011ctg", kind: "joy", year: "২০১১", where: "চট্টগ্রাম", prompt: "বিশ্বকাপে ইংল্যান্ডের ২২৫ রান তাড়ায় ১৬৯ রানে ৮ উইকেট নেই। তারপর?", options: ["৯ রানে হার", "অবিচ্ছিন্ন ৫৮ রানের জুটি, ২ উইকেটে জয়", "১৮০ রানে অলআউট"], answer: 1, memory: "৮ উইকেট পড়ার পরও হাল ছাড়েনি কেউ। ৬ বল বাকি থাকতে জয়।", source: "https://www.espncricinfo.com/series/8039/game/433585" },
      // World Cup, Adelaide, 9 Mar 2015. BAN 275/7, ENG 260; won by 15 runs. First World Cup quarter-final; England out in the group stage.
      // https://stats.espncricinfo.com/ci/engine/match/656463.html
      // https://www.aljazeera.com/sports/2015/3/9/bangladesh-knock-england-out-of-cricket-world-cup
      { id: "q2015adl", kind: "joy", year: "২০১৫", where: "অ্যাডিলেড", prompt: "বিশ্বকাপে ইংল্যান্ডকে ১৫ রানে হারিয়ে কী পেল বাংলাদেশ?", options: ["প্রথম বিশ্বকাপ সেমিফাইনাল", "প্রথম বিশ্বকাপ কোয়ার্টার ফাইনাল", "বিশ্বকাপে প্রথম জয়"], answer: 1, memory: "ইংল্যান্ড প্রথম পর্ব থেকেই বিদায়, আর বাংলাদেশ প্রথমবার শেষ আটে।", source: "https://stats.espncricinfo.com/ci/engine/match/656463.html" },
      // 2nd Test, Mirpur, 28–30 Oct 2016. Target 273; ENG 100/0 at tea on day 3, all out 164; won by 108 runs. First Test win over England.
      // https://www.espncricinfo.com/series/england-tour-of-bdesh-2016-17-1029813/bangladesh-vs-england-2nd-test-1029827/full-scorecard
      // https://www.espncricinfo.com/series/england-tour-of-bdesh-2016-17-1029813/bangladesh-vs-england-2nd-test-1029827/match-report
      { id: "q2016mir", kind: "joy", year: "২০১৬", where: "মিরপুর", prompt: "টেস্টে ২৭৩ রান তাড়ায় চা-বিরতিতে ইংল্যান্ড বিনা উইকেটে ১০০। তারপর?", options: ["শেষ সেশনেই ১০ উইকেট, বাংলাদেশ জিতল ১০৮ রানে", "ইংল্যান্ড জিতল ৮ উইকেটে", "শেষ দিনে ম্যাচ ড্র"], answer: 0, memory: "৬৪ রানে পড়ল ১০ উইকেট। টেস্টে ইংল্যান্ডের বিপক্ষে প্রথম জয়।", source: "https://www.espncricinfo.com/series/england-tour-of-bdesh-2016-17-1029813/bangladesh-vs-england-2nd-test-1029827/full-scorecard" },
      // Champions Trophy, Cardiff, 9 Jun 2017. NZ 265/8; BAN 33/4, then a 224 stand (Bangladesh's highest ODI partnership then); 268/5, won by 5 wickets. Reached a first ICC semi-final after England beat Australia.
      // https://www.espncricinfo.com/series/icc-champions-trophy-2017-1022345/bangladesh-vs-new-zealand-9th-match-group-a-1022363/full-scorecard
      // https://www.icc-cricket.com/news/bangladesh-you-beauty
      { id: "q2017car", kind: "joy", year: "২০১৭", where: "কার্ডিফ", prompt: "চ্যাম্পিয়নস ট্রফিতে নিউজিল্যান্ডের ২৬৫ রান তাড়ায় ৩৩ রানে ৪ উইকেট নেই। তারপর?", options: ["১১০ রানে অলআউট", "২২৪ রানের জুটি, ৫ উইকেটে জয়", "বৃষ্টিতে ম্যাচ পরিত্যক্ত"], answer: 1, memory: "তখন ওয়ানডেতে বাংলাদেশের সবচেয়ে বড় জুটি। তারপর প্রথমবার আইসিসি টুর্নামেন্টের সেমিফাইনাল।", source: "https://www.espncricinfo.com/series/icc-champions-trophy-2017-1022345/bangladesh-vs-new-zealand-9th-match-group-a-1022363/full-scorecard" },
      // T20 World Cup, New York, 10 Jun 2024. SA 113/6, BAN 109/7; lost by 4 runs.
      // https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/bangladesh-vs-south-africa-21st-match-group-d-1415721/full-scorecard
      // https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/bangladesh-vs-south-africa-21st-match-group-d-1415721/match-report
      { id: "q2024nyc", kind: "heart", year: "২০২৪", where: "নিউ ইয়র্ক", prompt: "টি-টোয়েন্টি বিশ্বকাপে দক্ষিণ আফ্রিকা করল মাত্র ১১৩। তারপর?", options: ["৪ রানে হার", "৬ উইকেটে জয়", "শেষ বলে টাই"], answer: 0, memory: "লক্ষ্য মাত্র ১১৪, তবু ৪ রান দূরে থেমে যাওয়া।", source: "https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/bangladesh-vs-south-africa-21st-match-group-d-1415721/full-scorecard" },
      // Rawalpindi, Aug–Sep 2024. 1st Test won by 10 wickets (first Test win over Pakistan), 2nd by 6 wickets: 2-0, first series win in Pakistan.
      // https://www.espncricinfo.com/series/bangladesh-in-pakistan-2024-1442203/pakistan-vs-bangladesh-1st-test-1442213/live-cricket-score
      // https://www.espncricinfo.com/series/bangladesh-in-pakistan-2024-1442203/pakistan-vs-bangladesh-2nd-test-1442214/match-report
      { id: "q2024rwp", kind: "joy", year: "২০২৪", where: "রাওয়ালপিন্ডি", prompt: "পাকিস্তানের মাটিতে দুই টেস্টের সিরিজের ফল কী?", options: ["০-২, দুটোতেই হার", "১-১, সমতা", "২-০, দুটোতেই জয়"], answer: 2, memory: "প্রথম টেস্ট ১০ উইকেটে, দ্বিতীয়টা ৬ উইকেটে। পাকিস্তানকে টেস্টে প্রথম হারানো, প্রথম সিরিজ জয়ও।", source: "https://www.espncricinfo.com/series/bangladesh-in-pakistan-2024-1442203/pakistan-vs-bangladesh-2nd-test-1442214/match-report" },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; questions: readonly Question[] }>;

export type SetId = (typeof sets)[number]["id"];
export type Answer = 0 | 1 | 2;
export type Shared = { set: SetId; answers: Answer[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const isSetId = (id: string): id is SetId => sets.some(item => item.id === id);
export const setById = (id: SetId) => sets.find(item => item.id === id)!;
export const questionsOf = (id: SetId): readonly Question[] => setById(id).questions;

/** Anonymous tally ids: "seen:<set>" counts finished sets, each question id counts a right answer. */
export const tallyIds = sets.flatMap(item => [`seen:${item.id}`, ...item.questions.map(question => question.id)]);

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Which answers were right, recomputed from the questions; a passed score is never trusted. */
export function marks(set: SetId, answers: readonly Answer[]) {
  return questionsOf(set).map((question, index) => answers[index] === undefined ? null : answers[index] === question.answer);
}

export const scoreOf = (set: SetId, answers: readonly Answer[]) => marks(set, answers).filter(Boolean).length;

export function rank(score: number) {
  if (score >= 8) return "খাঁটি টাইগার";
  if (score >= 5) return "গ্যালারির টাইগার";
  if (score >= 3) return "রেডিওর শ্রোতা";
  return "নতুন টাইগার";
}

export function humanLine(set: SetId, answers: readonly Answer[]) {
  const right = marks(set, answers);
  const score = right.filter(Boolean).length;
  const all = (kind: Kind) => questionsOf(set).every((question, index) => question.kind !== kind || right[index]);
  if (score === PER_SET) return "১০-এ ১০! প্রতিটা দম আটকানো মুহূর্ত তোমার মুখস্থ।";
  if (score <= 3) return "ভুলে গেছ মানে কষ্টও কম। ভাগ্যবান।";
  if (all("heart")) return "কষ্টের ম্যাচগুলো সবই মনে আছে, তবু খেলা দেখা ছাড়োনি।";
  if (all("joy")) return "জেতার দিনগুলো সবই মনে আছে।";
  return "কিছু মনে আছে, কিছু মনে রাখতে চাওনি।";
}

export function shareHash({ set, answers, name }: Shared) {
  const params = new URLSearchParams({ set, a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Only a finished set (10 digits 0–2) from the fixed list counts as a shared result. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const set = params.get("set") ?? "";
  const code = params.get("a") ?? "";
  if (!isSetId(set) || !/^[0-2]{10}$/.test(code)) return null;
  return { set, answers: [...code].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

export const who = (name: string, fallback = "এক বন্ধু") => name || fallback;

export function caption(shared: Shared, friend?: Shared | null) {
  const score = scoreOf(shared.set, shared.answers);
  const vs = friend && friend.set === shared.set ? ` ${friend.name ? possessive(friend.name) : "বন্ধুর"} ${bn(scoreOf(friend.set, friend.answers))}।` : "";
  return `দম আটকানো ম্যাচগুলোর ১০টা প্রশ্নে আমি পেয়েছি ${bn(score)}, ${rank(score)}!${vs} তুমি কয়টা পারবে?`;
}

export { possessive };
