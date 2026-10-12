import { amountFigures, amountWords, giverLabel, possessive, type Cheque } from "../lib/cheque";

/** The on-screen toy cheque. The share card redraws the same cheque on canvas (lib/draw-card). */
export function ChequeView({ cheque, nameFor }: { cheque: Cheque; nameFor?: string }) {
  const giver = giverLabel(cheque.giver);
  const words = amountWords(cheque.amount);
  const summary = `সালামির চেক: প্রিয় ${giver}, সালামি পাবে ${cheque.name || "(নাম নেই)"}, ${amountFigures(cheque.amount)} টাকা, ${words}।${cheque.ok ? ` ${giver} সই করে দিয়েছে।` : ` ${possessive(giver)} সই বাকি।`}`;
  const name = cheque.name || "তোমার নাম";
  return (
    <div className="sc-cheque" data-ok={cheque.ok} role="img" aria-label={summary}>
      <div className="sc-stub" aria-hidden="true">
        <svg viewBox="0 0 40 40"><path d="M24 4a16 16 0 1 0 12 26A13 13 0 0 1 24 4Z" /><path d="m31 9 1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4Z" /></svg>
        <b>ঈদ</b>
        <span>সালামি</span>
      </div>
      <div className="sc-body" aria-hidden="true">
        <div className="sc-top"><strong>ঈদ সালামির চেক</strong><small>তারিখ: ঈদের সকাল</small></div>
        <div className="sc-mid">
          <p className="sc-dear">প্রিয় {giver},</p>
          <p className="sc-amount"><span>৳</span> {amountFigures(cheque.amount)}</p>
        </div>
        <p className="sc-line"><span>সালামি পাবে:</span>{nameFor ? <label htmlFor={nameFor} className="sc-pen" data-empty={!cheque.name}>{name}</label> : <b className="sc-pen" data-empty={!cheque.name}>{name}</b>}</p>
        <p className="sc-line"><span>কথায়:</span><b className="sc-pen sc-words">{words}</b></p>
        <div className="sc-foot">
          <span className="sc-toy">ঈদ মোবারক</span>
          <span className="sc-sign">
            {cheque.ok && <svg viewBox="0 0 140 40"><path d="M4 30C14 4 22 38 34 16s16 18 28 4 18 16 30 2 22-6 44 10" /></svg>}
            <i>{possessive(giver)} সই</i>
          </span>
        </div>
        {cheque.ok && <p className="sc-stamp">অনুমোদিত<small>— {giver}</small></p>}
      </div>
    </div>
  );
}
