import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ActionPlanner } from "./components/action-planner";
import { CommunityArt } from "./components/community-art";
import { site } from "./content";
import { getCurrentActivities, type Activity } from "./lib/activities";
import curatedEvents from "./lib/curated-events.json";



const dateFormat = new Intl.DateTimeFormat("bn-BD", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Dhaka" });
const numbers = new Intl.NumberFormat("bn-BD");

function ActivityCard({ activity }: { activity: Activity }) {
  return <article className="action-event-card">
    <p className="eyebrow">{activity.city} · আয়োজক নিশ্চিত করেছেন</p>
    <h3>{activity.title}</h3>
    <p>{activity.organizerName}</p>
    <dl>
      <div><dt>কখন</dt><dd>{dateFormat.format(new Date(activity.startsAt))} থেকে {dateFormat.format(new Date(activity.endsAt))} পর্যন্ত (বাংলাদেশ সময়)</dd></div>
      <div><dt>সময় লাগবে</dt><dd>{numbers.format(activity.durationMinutes)} মিনিট। যাতায়াতের সময় আলাদা।</dd></div>
      <div><dt>কোথায়</dt><dd>{activity.location}</dd></div>
      <div><dt>খরচ</dt><dd>{activity.costDescription}</dd></div>
      <div><dt>কারা যেতে পারবেন</dt><dd>{activity.eligibility}</dd></div>
    </dl>
    <h4>যাওয়ার আগে জেনে নিন</h4>
    <ul>{activity.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
    <a className="button" href={activity.signupUrl} rel="external">আয়োজকের পাতায় নিবন্ধন করুন <span aria-hidden="true">↗</span></a>
    <p className="action-event-source"><a href={activity.sourceUrl} rel="external">মূল বিজ্ঞপ্তি</a> · <a href={activity.organizerUrl} rel="external">আয়োজকের পরিচয়</a></p>
    <p className="action-event-check">যাচাই করেছেন: {activity.checkedBy} · {dateFormat.format(new Date(activity.checkedAt))}। যাওয়ার আগে আয়োজকের সর্বশেষ নির্দেশনা দেখুন।</p>
  </article>;
}

export default function HomePage() {
  const activities = getCurrentActivities(curatedEvents, new Date()).slice(0, 5);
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="action-page">
      <section className="action-hero container" aria-labelledby="hero-heading">
        <div className="action-hero-copy">
          <p className="eyebrow"><span className="action-small-line" aria-hidden="true" /> নিজের উদ্যোগে ছোট কাজ</p>
          <h1 id="hero-heading">হাতে একটু সময়?<br /><span>ছোট একটি কাজে লাগান।</span></h1>
          <p className="action-lead">{site.lead}</p>
          <a className="button action-hero-cta" href="#tool">{site.cta}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" /></svg></a>
          <p className="action-hero-note">নিজের সুবিধামতো · বিনামূল্যে · নিবন্ধন ছাড়াই</p>
        </div>
        <div className="action-hero-visual"><CommunityArt /><p>ঘরে বা পরিচিতদের সঙ্গে, নিজের সুবিধামতো।</p></div>
      </section>

      <section className="action-tool-section section" id="tool" aria-labelledby="tool-heading">
        <div className="container">
          <div className="section-heading action-tool-heading"><div><p className="eyebrow">সময় মিলিয়ে পরিকল্পনা</p><h2 id="tool-heading">আজ কী করতে পারেন?</h2></div><p>সময় ও জায়গা বেছে নিন। কাজের ধাপ নিচে দেখুন।</p></div>
          <ActionPlanner />
          <p className="action-tool-disclaimer">এই কাজগুলো নিজের উদ্যোগে করার জন্য। এগুলো কোনো সংগঠনের নিশ্চিত আয়োজন নয়।</p>
        </div>
      </section>

      <section className="section container action-events-section" id="events" aria-labelledby="events-heading">
        <div className="section-heading"><p className="eyebrow">কোনো সংগঠনের সঙ্গে কাজ করতে চাইলে</p><h2 id="events-heading">নিশ্চিত আয়োজনের খোঁজ</h2><p>আয়োজকের কাছ থেকে তারিখ, সময় ও শর্ত নিশ্চিত করে এখানে দেখানো হবে।</p></div>
        {activities.length > 0 ? <div className="action-event-list">{activities.map((activity) => <ActivityCard activity={activity} key={activity.id} />)}</div> : <div className="action-empty-state">
          <div className="action-empty-symbol" aria-hidden="true"><svg viewBox="0 0 56 56"><rect x="9" y="12" width="38" height="36" rx="4" /><path d="M9 23h38M19 7v10M37 7v10M20 34h16M20 40h10" /></svg></div>
          <div><h3>এখন কোনো আয়োজন নিশ্চিত করা হয়নি</h3><p>কোনো আয়োজকের সঙ্গে আমাদের অংশীদারত্ব এখনো হয়নি। পুরোনো বা নিশ্চিত না হওয়া আয়োজন এখানে দেখানো হয় না।</p><p>বিডি ক্লিনের কাজ সম্পর্কে জানতে তাদের নিজস্ব পরিচিতি পাতা দেখতে পারেন। সেখানে যাওয়ার লিংকটি কোনো আয়োজনের তালিকা বা নিবন্ধনের নিশ্চয়তা নয়।</p><a className="action-text-link" href="https://bdclean.org/about" rel="external">বিডি ক্লিন সম্পর্কে জানুন <span aria-hidden="true">↗</span></a></div>
        </div>}
        <div className="action-check-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 11 3 3 5-5" /></svg><p><strong>প্রতিটি আয়োজন যাচাই করে যোগ করা হবে।</strong> সঙ্গে থাকবে দায়িত্বপ্রাপ্ত সম্পাদকের নাম, আয়োজকের তথ্য ও সর্বশেষ যাচাইয়ের সময়। ২৪ ঘণ্টা পেরিয়ে গেলে আবার যাচাই না করা পর্যন্ত সেটি দেখানো হবে না।</p></div>
      </section>

      <section className="container action-closing-note" aria-labelledby="closing-heading"><div className="action-closing-number" aria-hidden="true">১</div><div><p className="eyebrow">নিজের সুবিধামতো শুরু করুন</p><h2 id="closing-heading">একটি কাজই বেছে নিন</h2><p>যতটুকু স্বচ্ছন্দে করতে পারেন, ততটুকুই করুন। এক ঘণ্টা সাইটের নাম; কাজ শেষ করার সময়সীমা নয়।</p></div></section>
    </div>
    <Faq items={site.faq} />
  </PageFrame>;
}
