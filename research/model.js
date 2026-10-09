function cardContent(name, memories) {
  const cleanName = name.trim();
  return {
    title: cleanName ? cleanName + ' · আমার ছোটবেলা' : 'আমার ছোটবেলা',
    lines: memories.slice(),
    caption: memories.length ? new Intl.NumberFormat('bn-BD').format(memories.length) + 'টি স্মৃতি, একটুকরো আমি' : 'আপনার স্মৃতিগুলো বেছে নিন'
  };
}
function priorityScore(idea, priority) {
  const weights = {
    balanced: {share: .2, utility: .2, impact: .2, ease: .2, evidence: .2},
    share: {share: .55, utility: .1, impact: .05, ease: .2, evidence: .1},
    utility: {share: .05, utility: .5, impact: .1, ease: .15, evidence: .2},
    impact: {share: .05, utility: .2, impact: .5, ease: .1, evidence: .15}
  };
  if (!Object.hasOwn(weights, priority)) throw new Error('Unknown priority');
  return Object.entries(weights[priority]).reduce((score, [key, weight]) => score + idea.scores[key] * weight, 0);
}
