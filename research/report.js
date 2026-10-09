'use strict';
const ideas = JSON.parse(document.getElementById('idea-data').textContent);
const priority = document.getElementById('priority');
const track = document.getElementById('track');
const ideaGrid = document.getElementById('idea-grid');
function updateIdeas() {
  const ranked = ideas.slice().sort((left, right) => priorityScore(right, priority.value) - priorityScore(left, priority.value));
  let count = 0;
  for (const idea of ranked) {
    const element = document.getElementById('idea-' + idea.id);
    element.hidden = track.value !== 'all' && track.value !== idea.track;
    element.querySelector('[data-score]').textContent = priorityScore(idea, priority.value).toFixed(2);
    ideaGrid.append(element);
    if (!element.hidden) count++;
  }
  document.getElementById('idea-count').textContent = count + (count === 1 ? ' idea' : ' ideas');
}
priority.addEventListener('change', updateIdeas);
track.addEventListener('change', updateIdeas);
updateIdeas();
function revealLinkedIdea() {
  const element = document.getElementById(location.hash.slice(1));
  if (!element || !element.matches('.idea')) return;
  if (element.hidden) { track.value = 'all'; updateIdeas(); }
  element.querySelector('details').open = true;
  element.scrollIntoView({block: 'start'});
}
window.addEventListener('hashchange', revealLinkedIdea);
revealLinkedIdea();
for (const toggle of document.querySelectorAll('[data-toggle-series]')) {
  toggle.addEventListener('change', () => {
    document.querySelector('[data-series="' + toggle.dataset.toggleSeries + '"]').style.display = toggle.checked ? '' : 'none';
  });
}
const memoryForm = document.getElementById('memory-form');
const downloadButton = document.getElementById('download-card');
const exportStatus = document.getElementById('export-status');
function currentCard() {
  return cardContent(document.getElementById('memory-name').value, Array.from(memoryForm.querySelectorAll('input[name="memory"]:checked'), input => input.value));
}
function updateCard() {
  const card = currentCard();
  document.getElementById('card-title').textContent = card.title;
  document.getElementById('card-caption').textContent = card.caption;
  document.getElementById('card-memories').replaceChildren(...card.lines.map(line => {
    const item = document.createElement('li');
    item.textContent = line;
    return item;
  }));
  downloadButton.disabled = !card.lines.length;
  exportStatus.textContent = '';
}
memoryForm.addEventListener('input', updateCard);
memoryForm.addEventListener('submit', event => event.preventDefault());
// Read the values after the browser applies the form reset.
memoryForm.addEventListener('reset', () => setTimeout(updateCard, 0));
updateCard();
async function downloadCard() {
  downloadButton.disabled = true;
  exportStatus.textContent = 'Preparing your PNG…';
  try {
    await document.fonts.ready;
    const card = currentCard();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    const font = '"Bangla Sangam MN", "Noto Sans Bengali", sans-serif';
    context.fillStyle = '#f9fbf8';
    context.fillRect(0, 0, 1200, 1200);
    context.fillStyle = '#00715b';
    context.fillRect(0, 0, 1200, 22);
    context.strokeStyle = '#abc6bd';
    context.lineWidth = 2;
    context.strokeRect(35, 48, 1130, 1117);
    context.fillStyle = '#004c3c';
    context.font = '28px ' + font;
    context.fillText('স্মৃতির পোস্টকার্ড', 90, 137);
    let titleSize = 60;
    context.font = '600 ' + titleSize + 'px ' + font;
    while (context.measureText(card.title).width > 1020 && titleSize > 24) {
      context.font = '600 ' + --titleSize + 'px ' + font;
    }
    context.fillText(card.title, 90, 269, 1020);
    context.font = '32px ' + font;
    context.fillStyle = '#487367';
    context.fillText(card.caption, 90, 331);
    card.lines.forEach((line, index) => {
      const x = 90 + (index % 2) * 535;
      const y = 445 + Math.floor(index / 2) * 120;
      context.fillStyle = '#004c3c';
      context.font = '36px ' + font;
      context.fillText(line, x, y, 470);
      context.strokeStyle = '#d6e4dc';
      context.beginPath(); context.moveTo(x, y + 25); context.lineTo(x + 470, y + 25); context.stroke();
    });
    context.strokeStyle = '#9dbbad';
    context.setLineDash([8, 8]);
    context.beginPath(); context.moveTo(90, 979); context.lineTo(1110, 979); context.stroke();
    context.fillStyle = '#004c3c';
    context.font = '38px ' + font;
    context.fillText('তোমার ছোটবেলা কেমন ছিল?', 90, 1050);
    context.font = '19px sans-serif';
    context.fillStyle = '#52766d';
    context.fillText('VBANGLADESH / CONCEPT 01', 90, 1120);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Image export failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'amar-chhotobela.png'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    exportStatus.textContent = 'PNG prepared. Check your downloads. The card includes the name you entered.';
  } catch (error) {
    exportStatus.textContent = 'The image could not be prepared. Try another browser or save a screenshot of your card.';
    console.error(error);
  } finally { downloadButton.disabled = !currentCard().lines.length; }
}
downloadButton.addEventListener('click', downloadCard);
const printDetails = new Map();
window.addEventListener('beforeprint', () => {
  for (const detail of document.querySelectorAll('details')) { printDetails.set(detail, detail.open); detail.open = true; }
});
window.addEventListener('afterprint', () => {
  for (const [detail, open] of printDetails) detail.open = open;
  printDetails.clear();
});
document.getElementById('print-report').addEventListener('click', () => window.print());
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const link of document.querySelectorAll('.sidebar nav a')) {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
}, {rootMargin: '-140px 0px -60% 0px'});
for (const section of document.querySelectorAll('main > section')) sectionObserver.observe(section);
