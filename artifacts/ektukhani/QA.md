# একটুখানি: এক অ্যাপে আনার পর যাচাই

৯ অক্টোবর ২০২৬। স্থানীয় production server: http://127.0.0.1:3100।

- একটি Next.js অ্যাপ, ১৩টি সরাসরি tool route, ২৬টি guide/privacy route এবং home/about/privacy—মোট ৪২টি পাতা। পুরোনো স্বতন্ত্র apps ও workspace launchers সরানো হয়েছে।
- মূল component, calculation, data ও test ফাইলগুলো সরানোর সময় byte-for-byte মিলিয়ে দেখা হয়েছে। source briefs সংরক্ষিত আছে। পুরোনো পোর্টে রাখা browser data মুছে ফেলা হয়নি; নতুন origin-এ সেই data স্বয়ংক্রিয়ভাবে আসে না।
- ১১১টি unit/regression test পাস। TypeScript ও production build পাস। npm ci dry run-ও পাস।
- ৪২টি production পাতা এবং ৫২টি asset-এর HTTP পরীক্ষা পাস। বাংলা title/description/H1, nested internal links, visible FAQ-এর সঙ্গে JSON-LD, social image, canonical/indexing rules, fonts, robots/sitemap এবং বাংলা ৪০৪ দেখা হয়েছে। ফল `pages-check.txt`-এ।
- Production Chrome-এ ১৩টি টুলের home → tool → guide → privacy → home চলাচল পরীক্ষা হয়েছে। window marker দিয়ে পূর্ণ page reload ছাড়া Next.js navigation নিশ্চিত করা হয়েছে। ৩২০ ও ১২৮০ পিক্সেলে horizontal overflow নেই। প্রতিটি প্রধান CTA সঠিক কাজের অংশে যায়।
- নতুন landing page-এ শুরুতেই ১৩টি link আছে। প্রতিটি category filter, selected state এবং ফলাফল পরীক্ষা হয়েছে। ৩২০, ৩৬০, ৭৬৮ ও ১৪৪০ পিক্সেলে overflow নেই।
- সব tool stylesheet ব্যবহারের পরে ছয়টি PNG export পরীক্ষা হয়েছে: ছোট্ট পাড়ার post/story ও অন্য চারটি visual tool। PNG dimensions live SVG-এর সঙ্গে মেলে।
- একই browser session-এ সব tool ঘুরে আসার পর কাগজের মেলা, আলপনা, ভাষার ছবিখাতা ও সবুজ কোণ প্রত্যেকে ঠিক একটি A4 পাতা দেয়। প্রতিটির নিজস্ব named page সক্রিয়। অন্য tool-এর print CSS মিশে যায় না।
- সম্পূর্ণ navigation/export/print run-এ browser error বা HTTP error পাওয়া যায়নি। ফল `navigation-results.json`-এ। উদাহরণ PNG/PDF `exports/`-এ আছে।

## সীমা

Public deployment, বাস্তব ফোনের native share sheet, Safari এবং কাগজের পাখি হাতে কেটে জোড়া দেওয়া পরীক্ষা করা হয়নি। নিজের HTTPS domain দিয়ে SITE_URL বসিয়ে build ও deployment-এর পরে production-origin checks চালাতে হবে। বর্তমান local preview noindex।
