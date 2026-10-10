/** A rickshaw facing left, towards the conversation, with mama on the saddle looking at you. */
export function Street() {
  return (
    <svg className="mj-street-art" viewBox="28 30 284 152" aria-hidden="true">
      <defs>
        <pattern id="mj-lungi" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <rect width="7" height="7" fill="#2f5f86" />
          <path d="M0 .6H7M.6 0V7" stroke="#cfe0ee" strokeWidth=".9" opacity=".7" />
          <path d="M0 4H7M4 0V7" stroke="#183e5c" strokeWidth="1.2" />
        </pattern>
        <pattern id="mj-gamchha" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#2e7d4f" />
          <path d="M0 1H6M1 0V6" stroke="#f3f0e4" strokeWidth="1" />
        </pattern>
      </defs>

      <g className="mj-ride">
        <ellipse cx="150" cy="178" rx="128" ry="5" fill="#0b1f27" opacity=".45" />
        <g transform="translate(26 8)">
          {/* hood, folded up over the passenger seat */}
          <path d="M168 98C166 50 206 28 252 34c9 1 14 8 14 18l-8 46z" fill="#1c2730" />
          <path d="M168 98C166 50 206 28 252 34" fill="none" stroke="#f0b429" strokeWidth="4" />
          <path d="M184 96C184 62 210 44 246 44M204 96c2-26 18-40 42-42" fill="none" stroke="#33434f" strokeWidth="2" />
          <g fill="#f0b429">{[[176, 64], [192, 46], [214, 37], [238, 34]].map(([x, y]) => <path key={x} d={`M${x} ${y}l4 6-4 6-4-6z`} />)}</g>

          {/* passenger seat, footboard and the tin plate at the back */}
          <rect x="174" y="94" width="78" height="10" rx="4" fill="#2f8f83" />
          <rect x="178" y="104" width="70" height="16" fill="#24607a" />
          <path d="M160 122h40" stroke="#0e2630" strokeWidth="5" strokeLinecap="round" />
          <path d="M260 106v8M276 106v8" stroke="#8d989e" strokeWidth="1.5" />
          <rect x="254" y="113" width="28" height="18" rx="2" fill="#d5dadd" stroke="#24607a" strokeWidth="2.5" />

          {/* frame */}
          <g fill="none" stroke="#0e2630" strokeWidth="4" strokeLinecap="round">
            <path d="M28 148L42 90" />
            <path d="M42 90l14-6" />
            <path d="M44 98l74 2M46 106l60 34M120 97l-14 43M106 140l108-2M116 112l48 10" />
            <path d="M180 132a34 34 0 0 1 68 0" stroke="#33434f" strokeWidth="3" />
          </g>
          <path d="M108 92h22l-4 6h-16z" fill="#0e2630" />

          {/* wheels */}
          <g className="mj-wheel">
            <circle cx="28" cy="148" r="22" fill="none" stroke="#141a1e" strokeWidth="5" />
            <circle cx="28" cy="148" r="18" fill="none" stroke="#b9c2c7" strokeWidth="1.5" />
            <path d="M28 130v36M10 148h36M15 135l26 26M41 135l-26 26" stroke="#b9c2c7" strokeWidth="1" />
            <circle cx="28" cy="148" r="3" fill="#b9c2c7" />
          </g>
          <g className="mj-wheel">
            <circle cx="214" cy="138" r="32" fill="none" stroke="#141a1e" strokeWidth="6" />
            <circle cx="214" cy="138" r="27" fill="none" stroke="#b9c2c7" strokeWidth="1.5" />
            <path d="M214 111v54M187 138h54M195 119l38 38M233 119l-38 38M204 112l20 52M224 112l-20 52M188 128l52 20M188 148l52-20" stroke="#b9c2c7" strokeWidth="1" />
            <circle cx="214" cy="138" r="4" fill="#b9c2c7" />
          </g>
          <circle cx="106" cy="140" r="7" fill="none" stroke="#0e2630" strokeWidth="3" />

          {/* mama: leaning on the handlebar, turned towards you */}
          <path d="M103 124v22" stroke="#8b5a3c" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="100" cy="149" rx="7" ry="3" fill="#3a2a20" />
          <path d="M128 85L102 89q-10 2-8 12l3 25h14l-3-22 22-6z" fill="url(#mj-lungi)" />
          <path d="M110 93l18-3-20-32q-8-4-16 2z" fill="#9cc3dc" />
          <path d="M94 62l-16 12" stroke="#9cc3dc" strokeWidth="9" strokeLinecap="round" />
          <path d="M90 66l-12 8-24 10" fill="none" stroke="#8b5a3c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M92 55q8-2 12 2l10 18-4 3-12-15z" fill="url(#mj-gamchha)" />
          <rect x="92" y="50" width="8" height="8" rx="2" fill="#8b5a3c" />
          <circle cx="96" cy="42" r="11" fill="#8b5a3c" />
          <path d="M85 41q0-12 11-12t11 11q-4-5-11-5t-11 6z" fill="#1d1a18" />
          <circle cx="92" cy="43" r="1.4" fill="#1d1a18" /><circle cx="100" cy="43" r="1.4" fill="#1d1a18" />
          <path d="M92 47.5q4 3 8 0" fill="none" stroke="#1d1a18" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
