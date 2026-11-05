// Shared colours for the chits, in the page and on the card. Made-up play money: plain colours and big Bangla numerals.

/** Each chit's own colour, plus the big notes customers hand over. Coins (১, ২, ৫) are round, the rest are slips. */
export const CHIT_COLORS: Record<number, string> = { 1: '#d9a27c', 2: '#cdd5dc', 5: '#e8c35a', 10: '#a6dcc7', 20: '#f4ab93', 50: '#c4b5ec', 100: '#8dc4e8', 200: '#efa6c8', 500: '#a9d48f' };
export const isCoin = (value: number) => value < 10;
