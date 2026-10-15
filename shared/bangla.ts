// Bangla possessive: vowel endings take "র" (রাফির), consonants "এর" (জাহিদের), ৎ becomes ত (শরতের); Latin names and ং ঃ ঁ endings (মং) take "-এর".
export function possessive(name: string) {
  if (!/[ঀ-৿]$/.test(name) || /[ঁংঃ]$/.test(name)) return name + "-এর";
  if (name.endsWith("ৎ")) return name.slice(0, -1) + "তের";
  return /[অ-ঔা-ৌৗ]$/.test(name) ? name + "র" : name + "ের";
}
