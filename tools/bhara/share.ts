import type { ToolShare } from "../../shared/share-types";
import { bn, createTicket, parseTrip, tripHash } from "./lib/ticket";

export const share: ToolShare = {
  normalize(state) {
    const trip = parseTrip(state);
    return trip ? tripHash(trip) : null;
  },
  preview(state) {
    const trip = parseTrip(state);
    const ticket = trip && createTicket(trip);
    if (!ticket) return { title: "মেট্রোরেলের ভাড়া কত?", description: "উত্তরা উত্তর থেকে মতিঝিল, যেকোনো দুই স্টেশনের ভাড়া আর পুরো ভাড়ার তালিকা দেখে নাও।" };
    const group = ticket.total !== ticket.fare ? `${bn(ticket.people)} জন · ${ticket.journey} · মোট ${bn(ticket.total)} টাকা। ` : "";
    return {
      title: `${ticket.fromName} → ${ticket.toName}: ${bn(ticket.fare)} টাকা`,
      description: `${group}মেট্রোরেলে একজনের একক যাত্রার ভাড়া, সরকারি তালিকা থেকে। তোমার স্টেশন থেকে কত, দেখে নাও।`,
    };
  },
};
