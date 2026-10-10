import { GI_REGISTER_URL, places } from "../lib/jibh";
import { DishIcon } from "./dish-icon";

const divisions = [...new Set(places.map(place => place.division))];

/** All twenty destinations with their food and source, so anyone can check where a claim comes from. */
export function PlacesList() {
  return <div className="jb-places">
    {divisions.map(division => (
      <section key={division} aria-labelledby={`division-${division}`}>
        <h3 id={`division-${division}`}>{division} বিভাগ</h3>
        <ul>
          {places.filter(place => place.division === division).map(place => (
            <li key={place.id}>
              <span className="jb-places-art">{place.art.map(art => <DishIcon key={art} art={art} />)}</span>
              <span><strong>{place.name}</strong> {place.foods}<small>সূত্র: {place.source}</small></span>
            </li>
          ))}
        </ul>
      </section>
    ))}
    <p className="jb-places-note">‘জিআই নং’ মানে পেটেন্ট, শিল্প-নকশা ও ট্রেডমার্কস অধিদপ্তরের <a href={GI_REGISTER_URL} target="_blank" rel="noopener">নিবন্ধিত জিআই পণ্যের তালিকায়</a> রেজিস্ট্রেশন নম্বর। ইলিশ নিজেই ‘বাংলাদেশ ইলিশ’ নামে সারা দেশের জিআই, শুধু চাঁদপুরের না। বাকিগুলো বাংলাপিডিয়া আর জাতীয় পত্রিকার প্রতিবেদন থেকে। মিষ্টি এখানে রাখিনি, ওগুলোর জন্য আছে <a href="/mishtir-baksho">মিষ্টির বাক্স</a>।</p>
  </div>;
}
