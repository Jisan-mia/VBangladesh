# Copy review: batches and status

Agents use Sonnet 5.5 with `research/copy-review-agent-prompt.md`; up to 5 run at a time. Finish each batch with `python3 scripts/finish-copy.py "<batch>" <slugs…>`. The site-wide batch is committed by hand (lib/catalog.ts, lib/brand.ts, components/, shared/, app/).

| batch | tools | status |
|---|---|---|
| B0 site-wide | lib/catalog.ts descriptions+actions, lib/brand.ts, components/, shared/ strings, app/ pages | done |
| B1 স্মৃতি | bhashar-chhobi amar-chhotobela himu amar-bochhor tokhon-ekhon cassette mess-jibon ghuri | building |
| B2 আঁকো+খাবার | chhotto-para alpana riksharong cinema-poster namer-design studior-chhobi rannakhata mishtir-baksho | building |
| B3 খাবার+পরিবার | pitha tong mache-bhate jibh deshe-fera upohar dawat chithi | building |
| B4 পরিবার+হিসাব | attiyo probash prothom-ay bazar-note bhara bhagabhagi boyos bhori | todo |
| B5 হিসাব | matir-bank dhoyahin jomi rokto current-gelo betoner-bhag bidyut-bill | todo |
| B6 খেলা ১ | cholo-kheli argentina-na-brazil amar-jersey dom-atkano golir-ain shesh-bol | todo |
| B7 খেলা ২+উৎসব | ami-bolechhilam matcher-mon ekadosh raat-jaga shubhechha koto-din-baki iftar-plate salami-chek | todo |
| B8 উৎসব+ভাষা | sehri-iftar eider-din eidjatra gorur-ojon mondop shobdo-khela gpa taka-kothay | todo |
| B9 ভাষা+মজা | banan desh-cheno bagdhara bangla-typing namta komon-porlo eta-na-ota cha-mudra | todo |
| B10 মজা | flames jam ganer-koli dhadha ek-koti mama-jaben mishron grade-dao | todo |
| B11 নিজেকে জানো | biye-kobe daknam moner-boyos bhorta koto-cheno char-priyo projonmo starter-pack adda | todo |

## Marketing (research/marketing/)

| step | output | status |
|---|---|---|
| M1 Facebook groups map | channels-facebook.md | building |
| M2 other channels + virality | channels-other.md | building |
| M3 strategy, funnel, calendar, measurement, runbook | README.md, calendar.md, runbook.md | todo (after M1+M2) |
| M4–M6 Bangla post copy per category | posts/*.md | todo (after M1+M2) |
