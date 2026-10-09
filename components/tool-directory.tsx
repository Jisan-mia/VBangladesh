import Image from "next/image";
import Link from "next/link";
import { catalog, categories, flagship } from "../lib/catalog";

const illustratedTools = new Set(["chhotto-para", "alpana", "kagojer-mela", "bhashar-chhobi", "sobuj-kon", "riksharong", "nokshar-khata", "lekhar-poster", "chhobi-jora", "shobdo-khela", "soptaher-chhok", "bhagabhagi"]);

function ToolDrawing({ slug }: { slug: string }) {
  const stroke = "#192943";
  if (slug === "rannakhata") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <g transform="rotate(-6 151 110)">
      <rect x="87" y="25" width="143" height="163" rx="3" fill="#fff" stroke={stroke} strokeWidth="1.5" />
      <path d="M105 25v163" stroke="#e44b32" strokeWidth="1.5" />
      <path d="M118 115h91m-91 17h91m-91 17h64m-64 17h76" stroke="#cbd2df" strokeWidth="1.5" />
      <ellipse cx="159" cy="77" rx="33" ry="20" fill="#ffe2b5" stroke={stroke} strokeWidth="1.5" />
      <path d="M126 77c5 26 62 26 66 0" fill="#e44b32" stroke={stroke} strokeWidth="1.5" />
      <path d="M143 64c-7-8 7-10 0-18m16 18c-7-8 7-10 0-18m16 18c-7-8 7-10 0-18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <path d="M56 48c-14 1-18 34 1 38l-1 73c0 7 9 8 10 1l1-74c20-7 12-40-3-39Z" fill="#b8cef6" stroke={stroke} strokeWidth="1.5" />
    <path d="M248 137c25-6 12 31-15 45 16-23 13-29 15-45Z" fill="#e44b32" />
    <path d="m249 137 7-12" stroke="#387a49" strokeWidth="3" strokeLinecap="round" />
  </svg>;
  if (slug === "bazar-note") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <g transform="rotate(7 198 110)">
      <path d="M155 29h108v149H155Z" fill="#fff" stroke={stroke} strokeWidth="1.5" />
      <path d="M169 55h59m-42 27h52m-52 28h52m-52 28h34" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="m168 80 4 4 7-8m-11 33 4 4 7-8m-11 33 4 4 7-8" stroke="#427350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M52 88h115l-9 94H63Z" fill="#ffcf63" stroke={stroke} strokeWidth="1.5" />
    <path d="M80 110V73c0-34 59-34 59 0v37" stroke={stroke} strokeWidth="2" />
    <path d="m64 79 17 33m-7-48 13 40M126 80c-6-30 29-39 21-3m-15 13c28-22 45-10 24 10" stroke="#508860" strokeWidth="8" strokeLinecap="round" />
    <circle cx="104" cy="94" r="22" fill="#e44b32" /><path d="m96 75 9 7 8-9" stroke="#427350" strokeWidth="3" />
    <path d="M53 108h112l-7 74H63Z" fill="#ffcf63" stroke={stroke} strokeWidth="1.5" />
    <path d="M85 137h46m-34 13h22" stroke="#ba8029" strokeWidth="2" strokeLinecap="round" />
  </svg>;
  if (slug === "deadline") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <g transform="rotate(-5 153 106)">
      <rect x="74" y="39" width="157" height="143" rx="5" fill="#fff" stroke={stroke} strokeWidth="1.5" />
      <path d="M79 39h147a5 5 0 0 1 5 5v27H74V44a5 5 0 0 1 5-5Z" fill="#e44b32" />
      <path d="M106 27v24m95-24v24" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <path d="M98 91h11m18 0h11m18 0h11m18 0h11m-98 26h11m18 0h11m18 0h11m18 0h11m-98 26h11m18 0h11m18 0h11" stroke="#b7c1d1" strokeWidth="5" strokeLinecap="round" />
      <circle cx="161" cy="118" r="16" stroke="#e44b32" strokeWidth="2" />
    </g>
    <circle cx="241" cy="150" r="31" fill="#c6d9fd" stroke={stroke} strokeWidth="1.5" />
    <path d="M241 131v20l12 7" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="m51 86-10-5m13-4-3-11" stroke="#e44b32" strokeWidth="2" strokeLinecap="round" />
  </svg>;
  if (slug === "bhara") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <path d="M35 177h250" stroke={stroke} strokeWidth="2" />
    <path d="M64 63h182a18 18 0 0 1 18 18v70H51V76a13 13 0 0 1 13-13Z" fill="#fff" stroke={stroke} strokeWidth="1.5" />
    <path d="M51 129h213v22H51Z" fill="#45816d" />
    <rect x="69" y="81" width="39" height="32" rx="3" fill="#c6dcf2" stroke={stroke} strokeWidth="1.5" />
    <rect x="120" y="81" width="39" height="32" rx="3" fill="#c6dcf2" stroke={stroke} strokeWidth="1.5" />
    <path d="M173 81h34v69h-34Z" fill="#d9e7f1" stroke={stroke} strokeWidth="1.5" />
    <path d="M190 82v68m33-65h26v27h-26Z" stroke={stroke} strokeWidth="1.5" />
    <circle cx="87" cy="157" r="10" fill={stroke} /><circle cx="229" cy="157" r="10" fill={stroke} />
    <path d="M79 166v9m149-9v9M93 40h124" stroke={stroke} strokeWidth="2" />
    <circle cx="94" cy="40" r="5" fill="#e44b32" /><circle cx="155" cy="40" r="5" fill="#ffca54" /><circle cx="217" cy="40" r="5" fill="#5b80d6" />
  </svg>;
  if (slug === "cholo-kheli") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <g transform="translate(160 106) rotate(-8)">
      <rect x="-81" y="-81" width="162" height="162" rx="7" fill="#d48747" stroke={stroke} strokeWidth="1.5" />
      <rect x="-70" y="-70" width="140" height="140" rx="3" fill="#ffebbe" stroke={stroke} strokeWidth="1.5" />
      <rect x="-50" y="-50" width="100" height="100" rx="10" stroke="#b94e35" strokeWidth="1.5" />
      <circle r="21" stroke="#b94e35" strokeWidth="1.5" /><circle r="5" fill="#e44b32" />
      {[[-61,-61],[61,-61],[-61,61],[61,61]].map(([x,y])=><circle key={x + "," + y} cx={x} cy={y} r="8" fill={stroke} />)}
      <circle cx="-12" cy="4" r="6" fill={stroke} /><circle cx="9" cy="12" r="6" fill="#fff" stroke={stroke} /><circle cx="12" cy="-9" r="6" fill={stroke} />
      <circle cx="-23" cy="48" r="10" fill="#fff" stroke={stroke} strokeWidth="1.5" />
    </g>
    <path d="m56 38-8-9m-2 21-12-2m231 114 10 6m-20 5 3 10" stroke="#5b80d6" strokeWidth="2" strokeLinecap="round" />
  </svg>;
  if (slug === "free-afternoon") return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <circle cx="231" cy="60" r="27" fill="#ffca54" />
    <path d="M52 174h216" stroke={stroke} strokeWidth="1.5" />
    <rect x="80" y="90" width="134" height="15" rx="3" fill="#7e9ddf" stroke={stroke} strokeWidth="1.5" />
    <rect x="80" y="111" width="134" height="15" rx="3" fill="#7e9ddf" stroke={stroke} strokeWidth="1.5" />
    <path d="M71 137h153v12H71Z" fill="#7e9ddf" stroke={stroke} strokeWidth="1.5" />
    <path d="M90 84v53m115-53v53M89 150v23m118-23v23" stroke={stroke} strokeWidth="3" />
    <path d="M143 114h18v22h-18Z" fill="#e44b32" stroke={stroke} strokeWidth="1.5" />
    <path d="M161 117c14-3 14 16 0 13m-15-25c-8-7 8-10 0-17m12 17c-8-7 8-10 0-17" stroke={stroke} strokeWidth="1.5" />
    <path d="M46 168c-8-30-14-49-1-78 10 33 12 49 1 78Zm5-21c9-32 22-39 33-36-6 20-17 32-33 36Z" fill="#76a984" />
  </svg>;
  return <svg viewBox="0 0 320 210" fill="none" aria-hidden="true">
    <path d="M89 58h130v106H89Z" fill="#fff" stroke={stroke} strokeWidth="1.5" />
    <path d="M154 65v95m-48-84h30m-30 16h30m36-16h30m-30 16h30" stroke="#a4b8d8" strokeWidth="2" strokeLinecap="round" />
    <path d="M154 59c-23-14-41-9-65-1m65 1c23-14 41-9 65-1" stroke={stroke} strokeWidth="1.5" />
    <path d="m48 157 33-23c7-5 14 2 9 8l-9 10 39-9c15-3 25 11 14 20l-29 18H71Z" fill="#f8b98b" stroke={stroke} strokeWidth="1.5" />
    <path d="m272 157-33-23c-7-5-14 2-9 8l9 10-39-9c-15-3-25 11-14 20l29 18h34Z" fill="#f8b98b" stroke={stroke} strokeWidth="1.5" />
    <path d="m42 155 22-14 34 46-24 16Z" fill="#5b80d6" stroke={stroke} strokeWidth="1.5" />
    <path d="m278 155-22-14-34 46 24 16Z" fill="#e44b32" stroke={stroke} strokeWidth="1.5" />
    <path d="M145 29c-9-16-28-2-13 11l22 15 22-15c15-13-4-27-13-11l-9 10Z" fill="#e44b32" />
  </svg>;
}

function ToolPreview({ slug }: { slug: string }) {
  if (illustratedTools.has(slug)) return <div className={"home-preview home-preview-" + slug} aria-hidden="true">
    <div className="home-preview-art"><Image src={"/previews/" + slug + ".png"} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, (max-width: 1280px) 33vw, 25vw" /></div>
    <span className="home-example">নমুনা</span>
  </div>;
  return <div className={"home-preview home-preview-" + slug}><ToolDrawing slug={slug} /></div>;
}

export function ToolDirectory() {
  return <section className="home-container home-directory" id="more" aria-labelledby="home-tools-title">
    <div className="home-directory-heading">
      <h2 id="home-tools-title">আরও আছে, একটুখানি সময় পেলেই</h2>
      <p>আঁকাআঁকি, পুরোনো দিনের গল্প, বন্ধুদের সাথে খেলা আর রোজকার হিসাব। যেটা ভালো লাগে, ছুঁয়ে দেখো।</p>
    </div>
    {categories.map(category => <div className="home-group" key={category}>
      <h3>{category}</h3>
      <ul className="home-tool-grid">
        {catalog.filter(tool => tool.category === category && tool.slug !== flagship).map(tool => <li className="home-tool" key={tool.slug}>
          <Link className="home-tool-link" href={"/" + tool.slug} prefetch={false}>
            <ToolPreview slug={tool.slug} />
            <div className="home-tool-copy">
              <h4>{tool.name}</h4>
              <p className="home-tool-description">{tool.description}</p>
              <span className="home-tool-action">{tool.action}<svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            </div>
          </Link>
        </li>)}
      </ul>
    </div>)}
  </section>;
}
