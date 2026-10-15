// The ?print view: an A4 sheet of planet cut-outs in true size ratio, for a school project.
import { bn, PLANETS, PRINT_EARTH_MM, printMm, SATURN_RING, SUN_KM, type Planet } from "../lib/planets";
import { PlanetArt } from "./art";

/** Centre (mm) of each cut-out on the 190×204 mm drawing; Jupiter and the ice giants on top, Saturn with its ring, the small four below. */
const PLACE: Record<Planet["id"], { x: number; y: number }> = {
  jupiter: { x: 50, y: 46 }, uranus: { x: 125, y: 40 }, neptune: { x: 166, y: 40 },
  saturn: { x: 100, y: 134 },
  mercury: { x: 15, y: 188 }, venus: { x: 45, y: 188 }, earth: { x: 150, y: 188 }, mars: { x: 178, y: 188 },
};

function CutOut({ planet, index }: { planet: Planet; index: number }) {
  const r = printMm(planet.diameterKm) / 2, { x, y } = PLACE[planet.id];
  const ring = planet.id === "saturn" ? r * SATURN_RING : 0;
  return <g>
    {/* The drawing art is 80 units with the planet's radius filling it; scale it to the true size. */}
    <svg x={x - r} y={y - r} width={r * 2} height={r * 2} overflow="visible"><PlanetArt planet={planet} box={80} r={40} ring={SATURN_RING} /></svg>
    <circle cx={x} cy={y} r={r + 1.5} fill="none" stroke="#555" strokeWidth=".3" strokeDasharray="1.2 1" />
    {ring > 0 && <ellipse cx={x} cy={y} rx={ring + 1.5} ry={r * 0.5 + 3} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke="#555" strokeWidth=".3" strokeDasharray="1.2 1" />}
    <text x={x} y={y + r + (planet.id === "saturn" ? 10 : 8)} textAnchor="middle" fontSize="5" fontWeight="700">{bn(index + 1)}. {planet.name}</text>
  </g>;
}

export function PrintSheet() {
  const jupiter = printMm(PLANETS[4].diameterKm), sunCm = printMm(SUN_KM) / 10;
  return <div className="sj-print">
    <div className="sj-print-bar">
      <button type="button" className="kit-primary" onClick={() => window.print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/sourojogot">খেলায় ফিরে যাও</a>
    </div>
    <article className="sj-sheet" aria-label="গ্রহের কাট-আউটের পাতা">
      <h2>সৌরজগতের ৮ গ্রহ: কেটে নাও</h2>
      <p>মাপ আসল অনুপাতে: পৃথিবী {bn(PRINT_EARTH_MM)} মিমি হলে বৃহস্পতি {bn(Math.round(jupiter))} মিমি। এই মাপে সূর্য হতো প্রায় {bn(Math.round(sunCm))} সেমি চওড়া। ছোট গ্রহগুলো কাটতে বড়দের সাহায্য নাও।</p>
      <svg className="sj-sheet-art" viewBox="0 0 190 204" role="img" aria-label="আট গ্রহ আসল মাপের অনুপাতে, কাটার দাগসহ">
        {PLANETS.map((planet, index) => <CutOut key={planet.id} planet={planet} index={index} />)}
      </svg>
      <ol className="sj-facts">{PLANETS.map(planet => <li key={planet.id}><b>{planet.name}:</b> {planet.fact}</li>)}</ol>
      <p className="sj-source">তথ্য: NASA (science.nasa.gov) · একটুখানি</p>
    </article>
  </div>;
}
