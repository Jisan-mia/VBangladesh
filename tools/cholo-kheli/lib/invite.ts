import { EQUIPMENT, games, SPACE_IDS, type Game } from "./games";

export const MAX_TIME = 24;
export const MAX_PLACE = 30;
export const MAX_NAME = 30;

export const WHEN = [{ id: "aj", label: "আজ" }, { id: "kal", label: "কাল" }, { id: "shukro", label: "শুক্রবার" }] as const;
export const SPACES = [
  { id: "seated", label: "ঘরে", detail: "বসে খেলা", place: "আমাদের বাসায়" },
  { id: "courtyard", label: "উঠোনে", detail: "লাফানোর জায়গা", place: "বাড়ির উঠোনে" },
  { id: "field", label: "মাঠে", detail: "দৌড়ানোর জায়গা", place: "স্কুলের মাঠে" },
] as const;
export const DEFAULT_TIME = "বিকেল ৪টায়";

export type Space = (typeof SPACE_IDS)[number];
export type WhenId = (typeof WHEN)[number]["id"];
export type Invite = { game: string; players: number; space: Space; when: WhenId; time: string; place: string; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
export const gameById = (id: string) => games.find(game => game.id === id);

/** NFC, no control or bidi-override characters (a shared link must not scramble the poster), single spaces, capped. */
export function cleanText(text: string, max: number) {
  return text.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, max);
}

/** Pulls the player count and place into what the game allows, so a link always reopens a valid invitation. */
export function fitToGame(invite: Invite): Invite {
  const game = gameById(invite.game);
  if (!game) return invite;
  let players = Math.min(game.maxPlayers, Math.max(game.minPlayers, invite.players));
  if (game.evenTeams && players % 2) players = players + 1 <= game.maxPlayers ? players + 1 : players - 1;
  const space = game.spaces.includes(invite.space) ? invite.space : game.spaces[game.spaces.length - 1] as Space;
  return { ...invite, players, space };
}

export function inviteHash(invite: Invite) {
  const params = new URLSearchParams({ g: invite.game, p: String(invite.players), s: invite.space, w: invite.when });
  const time = cleanText(invite.time, MAX_TIME), place = cleanText(invite.place, MAX_PLACE), name = cleanText(invite.name, MAX_NAME);
  if (time) params.set("t", time);
  if (place) params.set("l", place);
  if (name) params.set("n", name);
  return "#" + params.toString();
}

export function parseInvite(hash: string): Invite | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const game = gameById(params.get("g") ?? "");
  if (!game) return null;
  const players = Number(params.get("p"));
  const space = params.get("s") ?? "";
  const when = params.get("w") ?? "";
  return fitToGame({
    game: game.id,
    players: Number.isInteger(players) ? players : game.minPlayers,
    space: (SPACE_IDS as readonly string[]).includes(space) ? space as Space : game.spaces[game.spaces.length - 1] as Space,
    when: WHEN.some(item => item.id === when) ? when as WhenId : "aj",
    time: cleanText(params.get("t") ?? "", MAX_TIME),
    place: cleanText(params.get("l") ?? "", MAX_PLACE),
    name: cleanText(params.get("n") ?? "", MAX_NAME),
  });
}

/** "আজ বিকেল ৪টায়" */
export function headline(invite: Invite) {
  return `${WHEN.find(item => item.id === invite.when)!.label} ${cleanText(invite.time, MAX_TIME) || DEFAULT_TIME}`;
}

export const placeOf = (invite: Invite) => cleanText(invite.place, MAX_PLACE) || SPACES.find(space => space.id === invite.space)!.place;

export function bringList(game: Game) {
  const items = game.equipment.map(id => EQUIPMENT.find(item => item.id === id)?.label).filter(Boolean);
  return items.length ? `সাথে এনো: ${items.join(", ")}` : "কিছুই আনতে হবে না, শুধু চলে এসো";
}

/** Post/message text that goes with the poster or link. */
export function inviteCaption(invite: Invite, game: Game) {
  return `${headline(invite)} ${game.title} খেলব, ${placeOf(invite)}। ${bn(invite.players)} জন হলেই জমবে। আসছ তো?`;
}

export function inviteTitle(invite: Invite, game: Game) {
  const who = cleanText(invite.name, MAX_NAME);
  return `${who ? `${who} ডাকছে` : "খেলার দাওয়াত"}: ${headline(invite)} ${game.title}, ${placeOf(invite)} — আসছ তো?`;
}
