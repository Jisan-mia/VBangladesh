# Copy review: batches and status

Agents use Sonnet 5.5 with `research/copy-review-agent-prompt.md`; up to 5 run at a time. Finish each batch with `python3 scripts/finish-copy.py "<batch>" <slugs…>`. The site-wide batch is committed by hand (lib/catalog.ts, lib/brand.ts, components/, shared/, app/).

| batch | tools | status |
|---|---|---|
| B0 site-wide | lib/catalog.ts descriptions+actions, lib/brand.ts, components/, shared/ strings, app/ pages | done |
| B1 স্মৃতি | bhashar-chhobi amar-chhotobela himu amar-bochhor tokhon-ekhon cassette mess-jibon ghuri | done |
| B2 আঁকো+খাবার | chhotto-para alpana riksharong cinema-poster namer-design studior-chhobi rannakhata mishtir-baksho | done |
| B3 খাবার+পরিবার | pitha tong mache-bhate jibh deshe-fera upohar dawat chithi | done |
| B4 পরিবার+হিসাব | attiyo probash prothom-ay bazar-note bhara bhagabhagi boyos bhori | done |
| B5 হিসাব | matir-bank dhoyahin jomi rokto current-gelo betoner-bhag bidyut-bill | done |
| B6 খেলা ১ | cholo-kheli argentina-na-brazil amar-jersey dom-atkano golir-ain shesh-bol | done |
| B7 খেলা ২+উৎসব | ami-bolechhilam matcher-mon ekadosh raat-jaga shubhechha koto-din-baki iftar-plate salami-chek | done |
| B8 উৎসব+ভাষা | sehri-iftar eider-din eidjatra gorur-ojon mondop shobdo-khela gpa taka-kothay | building |
| B9 ভাষা+মজা | banan desh-cheno bagdhara bangla-typing namta komon-porlo eta-na-ota cha-mudra | building |
| B10 মজা | flames jam ganer-koli dhadha ek-koti mama-jaben mishron grade-dao | building |
| B11 নিজেকে জানো | biye-kobe daknam moner-boyos bhorta koto-cheno char-priyo projonmo starter-pack adda | todo |

## Marketing (research/marketing/)

| step | output | status |
|---|---|---|
| M1 Facebook groups map | channels-facebook.md | done |
| M2 other channels + virality | channels-other.md | done |
| M3 strategy, funnel, calendar, measurement, runbook | README.md, calendar.md, runbook.md | done |
| P1 posts স্মৃতি+আঁকো | posts/smriti-anko.md | done |
| P2 posts খাবার+পরিবার | posts/khabar-poribar.md | building |
| P3 posts হিসাব+উৎসব | posts/hisab-utsob.md | building |
| P4 posts খেলা+ভাষা | posts/khela-bhasha.md | todo |
| P5 posts মজা+নিজেকে জানো | posts/moja-nijeke.md | todo |
