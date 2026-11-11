/**
 * Flat illustrations for the three kinds of gathering.
 * Used on the home page until real photos or clips are set in src/data/landingMedia.js.
 * Decorative only: every scene is aria-hidden and its panel carries the real label.
 */

const svgProps = {
  viewBox: '0 0 240 360',
  preserveAspectRatio: 'xMidYMax slice',
  className: 'absolute inset-0 h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
};

/** People as simple shapes: a head and rounded shoulders. */
function Person({ x, y, s = 1, body = '#fff', head = '#7a4a2a' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-15" r="4.2" fill={head} />
      <path d="M-6 0 Q-6 -10 0 -10 Q6 -10 6 0 Z" fill={body} />
    </g>
  );
}

export function PilgrimageScene() {
  return (
    <svg {...svgProps}>
      <rect width="240" height="360" fill="#FCDDBB" />
      <circle cx="158" cy="96" r="26" fill="#F6A33B" />
      <circle cx="158" cy="96" r="38" fill="#F6A33B" opacity="0.18" />
      {/* temple */}
      <g transform="translate(18 0)">
        <path d="M34 214 L34 150 Q72 52 110 150 L110 214 Z" fill="#B4530F" />
        <path d="M48 150 Q72 82 96 150" fill="none" stroke="#E7914A" strokeWidth="2" />
        <path d="M58 150 Q72 106 86 150" fill="none" stroke="#E7914A" strokeWidth="2" />
        <rect x="62" y="182" width="20" height="32" rx="10" fill="#6E300A" />
        <circle cx="72" cy="88" r="4" fill="#F6C243" />
        <line x1="72" y1="84" x2="72" y2="58" stroke="#6E300A" strokeWidth="1.6" />
        <path d="M72 58 L94 64 L72 71 Z" fill="#E36F1E" />
      </g>
      {/* trees */}
      <circle cx="160" cy="196" r="16" fill="#2E7D4B" />
      <circle cx="176" cy="204" r="12" fill="#3A9259" />
      <rect x="164" y="204" width="4" height="12" fill="#5B3A1E" />
      {/* ghat steps */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="0" y={214 + i * 11} width="240" height="11" fill={i % 2 ? '#E2BE93' : '#EDD0AC'} />
      ))}
      <Person x={30} y={232} body="#E36F1E" />
      <Person x={46} y={236} s={0.85} body="#FFFDF8" />
      <Person x={118} y={246} body="#FFFDF8" />
      <Person x={132} y={248} s={0.8} body="#138A43" />
      <Person x={196} y={236} body="#E36F1E" head="#5b3720" />
      <Person x={212} y={258} s={0.9} body="#1F3F8F" />
      {/* river */}
      <rect x="0" y="269" width="240" height="91" fill="#2B5BA8" />
      {[288, 308, 330, 348].map((y, i) => (
        <path key={y} d={`M${-10 + i * 12} ${y} q 15 -5 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0`} fill="none" stroke="#FFFDF8" strokeOpacity="0.28" strokeWidth="1.6" />
      ))}
      {/* floating diyas */}
      {[[40, 300], [92, 322], [150, 296], [200, 334], [66, 346]].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path d="M-7 0 Q0 7 7 0 Z" fill="#C8691E" />
          <path d="M0 -8 Q3 -3 0 -1 Q-3 -3 0 -8 Z" fill="#FFC94A" />
        </g>
      ))}
    </svg>
  );
}

export function PublicScene() {
  return (
    <svg {...svgProps}>
      <rect width="240" height="360" fill="#1F3F8F" />
      {/* stars */}
      {[[30, 40], [80, 26], [150, 50], [210, 30], [190, 80], [52, 90]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#FFFDF8" opacity="0.7" />
      ))}
      {/* string lights */}
      <path d="M0 70 Q120 130 240 70" fill="none" stroke="#0F2557" strokeWidth="1.4" />
      {Array.from({ length: 11 }).map((_, i) => {
        const t = i / 10;
        const x = t * 240;
        const y = (1 - t) * (1 - t) * 70 + 2 * (1 - t) * t * 130 + t * t * 70;
        return <circle key={i} cx={x} cy={y + 3} r="3" fill={i % 3 === 0 ? '#F6A33B' : i % 3 === 1 ? '#FFE6A8' : '#7FD39B'} />;
      })}
      {/* spotlight beams */}
      <path d="M60 110 L18 260 L102 260 Z" fill="#FFFDF8" opacity="0.10" />
      <path d="M180 110 L138 260 L222 260 Z" fill="#FFFDF8" opacity="0.10" />
      {/* stage */}
      <rect x="22" y="150" width="196" height="110" rx="6" fill="#142B66" />
      <rect x="38" y="164" width="164" height="70" rx="4" fill="#E36F1E" />
      <path d="M38 234 L76 196 L104 216 L140 182 L170 210 L202 192 L202 234 Z" fill="#B4530F" />
      <circle cx="170" cy="182" r="8" fill="#FFE6A8" />
      <rect x="22" y="252" width="196" height="10" fill="#0F2557" />
      <Person x={104} y={250} s={1.3} body="#FFFDF8" head="#6a3f22" />
      <Person x={136} y={250} s={1.3} body="#138A43" head="#6a3f22" />
      {/* crowd */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Person key={`a${i}`} x={14 + i * 27} y={312} s={1.8} body={['#0B1C45', '#16306E', '#0F2557'][i % 3]} head="#0B1C45" />
      ))}
      <path d="M58 270 l4 -18 l4 18 Z" fill="#0B1C45" />
      <path d="M178 272 l-3 -20 l6 2 Z" fill="#0B1C45" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Person key={`b${i}`} x={28 + i * 27} y={352} s={2.2} body={['#081536', '#0B1C45'][i % 2]} head="#081536" />
      ))}
    </svg>
  );
}

export function CorporateScene() {
  return (
    <svg {...svgProps}>
      <rect width="240" height="360" fill="#E5F3EA" />
      <rect x="0" y="238" width="240" height="122" fill="#CFE6D7" />
      {/* screen with a simple chart */}
      <rect x="54" y="60" width="96" height="92" rx="8" fill="#FFFDF8" stroke="#0D6331" strokeWidth="2" />
      <rect x="64" y="72" width="44" height="6" rx="3" fill="#1B1E28" opacity="0.8" />
      <rect x="64" y="118" width="14" height="24" rx="2" fill="#E36F1E" />
      <rect x="84" y="100" width="14" height="42" rx="2" fill="#1F3F8F" />
      <rect x="104" y="88" width="14" height="54" rx="2" fill="#138A43" />
      <rect x="124" y="108" width="14" height="34" rx="2" fill="#F6A33B" />
      {/* speaker */}
      <rect x="92" y="196" width="28" height="42" rx="4" fill="#0D6331" />
      <circle cx="106" cy="212" r="5" fill="#FFFDF8" />
      <Person x={106} y={198} s={1.1} body="#1F3F8F" head="#6a3f22" />
      {/* badge on a lanyard */}
      <path d="M158 0 L172 96 M186 0 L172 96" stroke="#1F3F8F" strokeWidth="3" fill="none" />
      <rect x="156" y="94" width="32" height="44" rx="5" fill="#FFFDF8" stroke="#1B1E28" strokeWidth="1.5" />
      <rect x="162" y="101" width="20" height="20" fill="#1B1E28" />
      <rect x="165" y="104" width="5" height="5" fill="#FFFDF8" />
      <rect x="173" y="112" width="5" height="5" fill="#FFFDF8" />
      <rect x="162" y="126" width="20" height="4" rx="2" fill="#138A43" />
      {/* plants */}
      <rect x="52" y="214" width="20" height="24" rx="3" fill="#B4530F" />
      <path d="M62 214 q-14 -22 -4 -36 q2 18 4 36 q2 -26 12 -32 q0 20 -12 32 Z" fill="#138A43" />
      {/* audience rows */}
      {[0, 1, 2].map((r) =>
        Array.from({ length: 6 }).map((_, i) => (
          <g key={`${r}-${i}`}>
            <Person x={26 + i * 38 + (r % 2) * 8} y={278 + r * 30} s={1.5} body={['#1F3F8F', '#138A43', '#E36F1E', '#FFFDF8', '#1B1E28'][(i + r) % 5]} head="#5b3720" />
            <rect x={14 + i * 38 + (r % 2) * 8} y={278 + r * 30} width="24" height="8" rx="2" fill="#0D6331" />
          </g>
        )),
      )}
    </svg>
  );
}

