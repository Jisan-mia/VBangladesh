import { bn, MULTIPLIERS, tableName } from "../lib/namta";

const groups = [
  { title: "১ থেকে ১০-এর নামতা", note: "গুণফল ১ থেকে ১০০ পর্যন্ত", tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { title: "১১ থেকে ২০-এর নামতা", note: "বড় ঘর, ২০০ পর্যন্ত", tables: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
];

/** Plain, server-rendered tables for people who search "নামতা ১ থেকে ২০"; closed by default so the game stays the point. */
export function NamtaList() {
  return (
    <section className="container section nm-list" id="namta-list" aria-labelledby="list-title">
      <h2 id="list-title">নামতা ১ থেকে ২০, বাংলায়</h2>
      <p>১ থেকে ১০-এর নামতায় গুণফল যায় ১০০ পর্যন্ত, যেটাকে অনেকে ‘নামতা ১ থেকে ১০০’ বলে খোঁজে। যে ঘরটা দেখতে চাও খোলো, পাশের ‘খেলো’ চাপলে সেই নামতাটাই ওপরের স্লেটে আসবে।</p>
      {groups.map(group => (
        <details key={group.title}>
          <summary><span>{group.title}</span><small>{group.note}</small></summary>
          <div className="nm-tables">
            {group.tables.map(t => (
              <article key={t} className="nm-table">
                <h3>{tableName(t)}{t > 1 && <a href={`#t=${t}`} aria-label={`${tableName(t)} খেলো`}>খেলো</a>}</h3>
                <ol>{MULTIPLIERS.map(m => <li key={m}>{`${bn(t)} × ${bn(m)} = `}<b>{bn(t * m)}</b></li>)}</ol>
              </article>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
