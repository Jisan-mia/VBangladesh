/** The ghost finger that shows the first tap, so a child who can't read yet knows where to press. */
export function Finger() {
  return <span className="hd-ghost-at" aria-hidden="true"><svg className="hd-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2f2a3a" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}
