# First-load JS budgets (2026-11-04)

`npm run budget` runs `scripts/budget.mjs` after a build. It compares every route with `scripts/budget.json`, prints a table of the routes that are over or near their budget, and exits 1 when a route goes over its budget plus `toleranceKb` (1 KB).

To build, measure and lint in one step, run `npm run build:check`. It runs `npm run build` (`next build --webpack`), restores `next-env.d.ts` with `git checkout`, and then runs `budget` and `lint:games`. `npm run build` doesn't run the budget check yet.

## How it measures

Next 16 removed the `First Load JS` column from `next build` and dropped `app-build-manifest.json`. For details, see `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. The budget script reads what a browser actually downloads:

- every prerendered page in `.next/server/app/**/*.html` (493 routes);
- every `<script src>` and `<link rel=preload as=script>` that points to `/_next/static/**.js`, without the `noModule` polyfills;
- each chunk gzipped at level 9 and summed for each route. 1 KB = 1024 bytes.

**Own** is the gzipped JS that only this route loads. It is the game's own cost on top of the shared shell.

The script measures only prerendered pages. Dynamic routes have no prerendered HTML: today that is only `/s/[id]`, and the script lists it as unmeasured. If the last build failed and left no HTML, the script exits 2.

## How budget.json is laid out

```json
{
  "toleranceKb": 1,
  "default": 154,                      // any route with no other entry (guide, privacy, 404)
  "routes": { "/": 154, "/adda": 177 },  // per-route overrides for non-game pages
  "groups": {
    "games": {
      "categories": ["গেম", "ছোটদের জন্য"],  // membership comes from lib/catalog.ts
      "default": 181,                  // a new game with no entry
      "routes": { "/carrom": 183 }     // the budget for /<game>
    }
  }
}
```

The script looks up a budget in this order:
1. `routes[route]`;
2. the group's `routes[route]`;
3. the group's `default`;
4. the top-level `default`.

A new tool in a game category gets the games default, 181 KB, without any edit.

## Seed

`node scripts/budget.mjs --seed` set each budget to the measured size + 10%, rounded up to a whole KB, from the first build of the session (Next 16.4.5, webpack):

| Group | Budget |
|---|---|
| default (guide, privacy, `/_not-found`, 322 routes, all 139.2 KB at seed time) | 154 KB |
| games default | 181 KB, the 75th percentile of the games + 10% |
| 75 games (50 `গেম` + 25 `ছোটদের জন্য`) | per route, 168–190 KB |
| 95 other pages | per route, 154–186 KB |

What we found:
- The shared shell is about 139–141 KB gzipped: React, Next and the site layout. `/` and every guide or privacy page load only the shell.
- A game's own JS is small. The median is 12.3 KB and the largest is 24.7 KB (`/prithibi-ghuri`). tibo.dog's whole first download is about 124 KB, so most of our weight is the shell, not the games.
- The 10% headroom is about 15–17 KB on a game page. That is as much as a whole game's own JS, so the budget stops runaway growth but not a doubling of a game's code. When a game is rewritten, lower its entry to its new size + a few KB, and write down why.
- Other agents edited tools while this was set up. Between the seed build and the check build, `/o-te-ojogor` grew from 166.5 to 174.6 KB (budget 184), and the shell grew by 1.3 KB. Both are still in budget.

## For rewrite agents

- Before you report, run `npm run build:check`, or `npm run build && npm run budget`. Look at the **own** column for your route.
- If you go over, cut the code first. Lazy-load rare screens with `next/dynamic`, drop a dependency, or draw in code instead of importing data.
- Raise a budget only by editing that one route in `scripts/budget.json`. Add a line to the table below with the reason. Never re-seed to make a build pass.
- After a rewrite makes a game smaller, lower its budget. A lower budget protects the gain.

## Changes to budgets

| Date | Route | Old → new | Why |
|---|---|---|---|
| 2026-11-04 | all | seeded | first budgets, current size + 10% |

## Sizes at the check build (2026-11-04)

The numbers are in KB gzipped. The budget is from the seed build.


### Games

| Route | First load (KB gz) | Own (KB gz) | Budget (KB) |
|---|---|---|---|
| /o-te-ojogor | 174.6 | 8.7 | 184 |
| /bhul-kothay | 173.7 | 23.7 | 190 |
| /prithibi-ghuri | 170.4 | 24.7 | 187 |
| /vo-katta | 169 | 15 | 185 |
| /deri-hoye-gelo | 168.8 | 18.8 | 185 |
| /borno-likhi | 168.5 | 11.4 | 184 |
| /carrom | 167.6 | 17.6 | 183 |
| /jhalmuri-sap | 166.9 | 12.4 | 178 |
| /kagojer-urojahaj | 166.9 | 16.9 | 183 |
| /juktoborno | 166.8 | 9.7 | 182 |
| /chhip-felo | 166.6 | 16.6 | 182 |
| /chhobir-tukro | 166.4 | 16.4 | 182 |
| /kar-chinho | 166.4 | 9.3 | 182 |
| /bostar-pahar | 166.1 | 16.1 | 182 |
| /baicher-nouka | 165.8 | 15.8 | 181 |
| /peoner-cycle | 165.7 | 15.7 | 181 |
| /nodi-par | 165.6 | 15.6 | 181 |
| /kalbaishakhi-aam | 165.3 | 15.3 | 181 |
| /sir-ghurlei-thamo | 165.2 | 15.2 | 181 |
| /churir-bazar | 165.1 | 15.1 | 181 |
| /sudoku | 164.3 | 9.7 | 175 |
| /al-dhore-hati | 164.2 | 14.2 | 180 |
| /latim | 164.1 | 14.2 | 180 |
| /nam-shikhi | 164.1 | 18.3 | 180 |
| /antenna-thik-koro | 164 | 14 | 180 |
| /danguli | 163.9 | 13.9 | 179 |
| /penalty | 163.9 | 14 | 179 |
| /churui-tarao | 163.8 | 13.8 | 179 |
| /sap-ludu | 163.4 | 13.5 | 179 |
| /sat-chara | 163.4 | 13.5 | 179 |
| /nirapode-thaki | 163.3 | 17.5 | 179 |
| /dinosaur | 163.2 | 17.5 | 179 |
| /dudh-uthlano | 163 | 13 | 178 |
| /golir-badminton | 162.7 | 12.7 | 178 |
| /bhangti-nai | 162.6 | 12.7 | 178 |
| /handi-bhanga | 162.6 | 12.7 | 178 |
| /marble-sinri | 162.5 | 12.5 | 178 |
| /moshar-raat | 162.5 | 12.5 | 178 |
| /roshi-tana | 162.3 | 12.3 | 178 |
| /chhok-jora | 162.2 | 12.3 | 178 |
| /baghbandi | 162.1 | 12.1 | 177 |
| /konta-nei | 162.1 | 12.1 | 177 |
| /tarer-fanke-belun | 162.1 | 12.2 | 178 |
| /golper-mor | 162 | 16.2 | 177 |
| /chhobi-photao | 161.9 | 12 | 177 |
| /bhimruler-chak | 161.5 | 11.5 | 177 |
| /jam-chharao | 161.4 | 11.5 | 177 |
| /atir-aam | 161 | 11.1 | 176 |
| /shobdo-khoja | 160.9 | 10.9 | 176 |
| /paka-kancha | 160.8 | 10.8 | 176 |
| /jora-melao | 160.7 | 10.7 | 176 |
| /pati-buni | 160.7 | 10.7 | 176 |
| /ponero-ghor | 160.6 | 10.6 | 176 |
| /golokdhadha | 160.2 | 10.2 | 175 |
| /moner-rong | 160.2 | 14.4 | 175 |
| /hat-dhui | 159.9 | 14.2 | 175 |
| /ki-hobe | 159.9 | 14.2 | 175 |
| /chor-police | 159.8 | 9.8 | 175 |
| /mukhe-mukhe-hisab | 159.4 | 9.4 | 175 |
| /switchboard | 158.1 | 8.1 | 173 |
| /abc-bazar | 157.9 | 12.1 | 173 |
| /ghontar-sur | 157.9 | 7.9 | 173 |
| /sourojogot | 157.6 | 11.9 | 173 |
| /ghori-dekhi | 157.5 | 11.8 | 172 |
| /daripalla | 157.4 | 11.7 | 172 |
| /shoman-bhag | 157.4 | 11.7 | 172 |
| /sat-tukro | 157.3 | 11.6 | 172 |
| /mongole-rover | 157 | 11.2 | 172 |
| /chhaya-melao | 156.7 | 11 | 172 |
| /ulto-khela | 155.6 | 9.8 | 170 |
| /chhorar-tal | 155.3 | 9.5 | 170 |
| /gune-dekhi | 155.1 | 9.3 | 170 |
| /sur-banai | 154.7 | 8.9 | 169 |
| /dosh-ghater-nouka | 154 | 8.3 | 169 |
| /ammur-number | 153.7 | 8 | 168 |

### Other pages

| Route | First load (KB gz) | Own (KB gz) | Budget (KB) |
|---|---|---|---|
| /starter-pack | 169.6 | 19.7 | 186 |
| /bagdhara | 168.3 | 18.3 | 184 |
| /gorur-ojon | 168.2 | 13.4 | 184 |
| /iftar-plate | 168.2 | 13.4 | 184 |
| /cholo-kheli | 166.8 | 16.8 | 183 |
| /mondop | 166.3 | 11.5 | 182 |
| /matir-bank | 165.4 | 10.6 | 181 |
| /mishron | 165.4 | 15.4 | 181 |
| /chhotto-para | 164.6 | 14.6 | 180 |
| /mache-bhate | 164.5 | 14.5 | 180 |
| /pitha | 164.4 | 14.4 | 180 |
| /shobdo-khela | 164.4 | 14.4 | 180 |
| /argentina-na-brazil | 163.3 | 13.3 | 179 |
| /shubhechha | 163.3 | 15.2 | 179 |
| /dhadha | 163.1 | 13.1 | 179 |
| /projonmo | 163.1 | 13.1 | 179 |
| /ami-bolechhilam | 162.4 | 12.4 | 178 |
| /desh-cheno | 162.2 | 12.2 | 178 |
| /jibh | 161.9 | 12 | 177 |
| /adda | 161.4 | 11.5 | 177 |
| /eider-din | 161.2 | 13.1 | 177 |
| /salami-chek | 161.1 | 11.1 | 176 |
| /studior-chhobi | 161.1 | 11.2 | 176 |
| /banan | 161 | 11 | 176 |
| /cassette | 161 | 11 | 176 |
| /alpana | 160.9 | 10.9 | 176 |
| /attiyo | 160.9 | 10.9 | 176 |
| /char-priyo | 160.9 | 10.9 | 176 |
| /mishtir-baksho | 160.8 | 10.8 | 176 |
| /dawat | 160.7 | 10.7 | 176 |
| /namer-design | 160.5 | 10.5 | 176 |
| /chithi | 160.1 | 10.1 | 175 |
| /ek-koti | 160 | 10 | 175 |
| /ekadosh | 160 | 10 | 175 |
| /dom-atkano | 159.9 | 9.9 | 175 |
| /mama-jaben | 159.9 | 9.9 | 175 |
| /current-gelo | 159.8 | 9.8 | 175 |
| /bazar-note | 159.6 | 9.6 | 175 |
| /komon-porlo | 159.6 | 9.6 | 175 |
| /eidjatra | 159.5 | 9.5 | 175 |
| /eta-na-ota | 159.5 | 9.6 | 175 |
| /koto-din-baki | 159.5 | 11.4 | 175 |
| /koto-cheno | 159.4 | 9.4 | 175 |
| /amar-chhotobela | 159.3 | 9.3 | 174 |
| /bangla-typing | 159.3 | 9.3 | 174 |
| /cinema-poster | 159.3 | 9.3 | 174 |
| /bhagabhagi | 159 | 15.7 | 174 |
| /prothom-ay | 159 | 9 | 174 |
| /sehri-iftar | 159 | 10.9 | 174 |
| /dhoyahin | 158.9 | 8.9 | 174 |
| /mess-jibon | 158.9 | 8.9 | 174 |
| /grade-dao | 158.7 | 8.7 | 174 |
| /himu | 158.4 | 8.4 | 173 |
| /matcher-mon | 158.3 | 8.3 | 173 |
| /bhorta | 158.2 | 8.2 | 173 |
| /moner-boyos | 158 | 8 | 173 |
| /namta | 158 | 8 | 173 |
| /shesh-bol | 158 | 8 | 173 |
| /tong | 158 | 8 | 173 |
| /riksharong | 157.8 | 7.8 | 173 |
| /raat-jaga | 157.7 | 7.8 | 173 |
| /bhashar-chhobi | 157.6 | 7.6 | 172 |
| /daknam | 157.5 | 7.5 | 172 |
| /biye-kobe | 157.4 | 7.4 | 172 |
| /ghuri | 157.4 | 3.4 | 172 |
| /cha-mudra | 156.7 | 6.7 | 172 |
| /golir-ain | 156.7 | 6.7 | 172 |
| /upohar | 156.5 | 6.5 | 171 |
| /amar-bochhor | 156.4 | 6.4 | 171 |
| /ganer-koli | 156.3 | 6.3 | 171 |
| /jam | 156.1 | 6.1 | 171 |
| /boyos | 155.9 | 12.6 | 171 |
| /bidyut-bill | 155.3 | 12 | 170 |
| /tools | 155 | 16 | 170 |
| /deshe-fera | 154.4 | 11.1 | 169 |
| /probash | 154.1 | 10.9 | 169 |
| /betoner-bhag | 152.7 | 9.4 | 167 |
| /bhori | 152.4 | 9.1 | 167 |
| /amar-jersey | 152.3 | 9 | 167 |
| /rannakhata | 152.3 | 9.1 | 167 |
| /jomi | 152 | 8.7 | 166 |
| /gpa | 151.9 | 8.6 | 166 |
| /rokto | 151.9 | 8.7 | 166 |
| /taka-kothay | 151.4 | 8.2 | 166 |
| /tokhon-ekhon | 151.3 | 8.1 | 166 |
| /bhara | 151 | 7.8 | 165 |
| /flames | 151 | 7.8 | 165 |
| / | 141 | 0 | 154 |
| /_not-found | 141 | 0 | 154 |
| /about | 140.5 | 1.5 | 154 |
| /chhotoder | 140.5 | 1.5 | 154 |
| /games | 140.5 | 1.5 | 154 |
| /hishab | 140.5 | 1.5 | 154 |
| /privacy | 140.5 | 1.5 | 154 |
| /quiz | 140.5 | 1.5 | 154 |
| /utsob | 140.5 | 1.5 | 154 |
