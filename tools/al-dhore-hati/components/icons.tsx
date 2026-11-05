// The few icons the game draws itself, as SVG (never emoji or text glyphs): a star, a cross and an arrow.
export const Star = () => <svg className="al-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" /></svg>;
export const Cross = () => <svg className="al-ico al-ico-line" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>;
export const Arrow = ({ down }: { down?: boolean }) => <svg className={down ? "al-ico al-ico-line al-down" : "al-ico al-ico-line"} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
