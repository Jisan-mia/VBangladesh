// The 40-level ladder: [grid size, blank cells, seed]. makePuzzle(seed) builds each one in about a millisecond, so nothing
// bigger is stored. Seeds were picked so the blanks come out exactly; the tests re-build every level, prove it has one
// solution reachable by logic, and pin a checksum so a generator change can't quietly swap the puzzles behind old links.
export const LEVELS: ReadonlyArray<readonly [4 | 6 | 9, number, number]> = [
  [4, 4, 1001], [4, 4, 2001], [4, 6, 3001], [4, 6, 4001], [4, 8, 5001],
  [4, 8, 6001], [4, 10, 7001], [4, 10, 8001], [4, 12, 9001], [4, 12, 10001],
  [6, 10, 11001], [6, 12, 12001], [6, 14, 13001], [6, 16, 14001], [6, 18, 15001],
  [6, 18, 16001], [6, 20, 17001], [6, 22, 18001], [6, 22, 19001], [6, 24, 20001],
  [9, 30, 21001], [9, 33, 22006], [9, 36, 23001], [9, 39, 24001], [9, 41, 25003],
  [9, 43, 26002], [9, 45, 27002], [9, 47, 28001], [9, 49, 29002], [9, 51, 30002],
  [9, 52, 31002], [9, 53, 32003], [9, 53, 33004], [9, 54, 34001], [9, 54, 35001],
  [9, 55, 36002], [9, 55, 37001], [9, 56, 38055], [9, 57, 39012], [9, 58, 40934],
];
