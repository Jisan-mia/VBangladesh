import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { KiHobeGame } from "./components/game";
import { site } from "./content";

export default function KiHobePage() {
  return (
    <GamePage site={site} kids note={<ParentNote
      learns="আগে আন্দাজ, তারপর দেখা, তারপর কেন: বিজ্ঞানের আসল পথ। ভাসা-ডোবা, রোদ-ছায়া, পড়া, চুম্বক, বীজ, শব্দ, আকাশ, বৃষ্টি, চাঁদ।"
      age="৫–১০ বছর। পড়তে জানতে হয় না: ছবি দেখে আন্দাজ বেছে নিলেই চলে। প্রশ্নটা তুমি পড়ে শোনাও।"
      together="পরীক্ষা দেখার আগে জিজ্ঞেস করো, ‘কেন এমন মনে হলো?’ তারপর ‘কেন?’ খুলে এক লাইনে কারণটা পড়ো, আর ‘বাসায় করে দেখো’-র একটা আজই একসাথে করো।"
      school="শ্রেণি ৩–৫ এর প্রাথমিক বিজ্ঞান: পানি, বাতাস, আলো, আবহাওয়া। তথ্য মিলিয়েছি NASA Space Place (আকাশ), NASA Science (চাঁদের কলা), NASA NSSDC (অ্যাপোলো ১৫, হাতুড়ি-পালক), USGS Water Science School (পানিচক্র) আর Britannica থেকে, অক্টোবর ২০২৬।" />}>
      <KiHobeGame />
    </GamePage>
  );
}
