import { useState } from 'react';

/*
 * "One yatra, many hands": eight folk arts from different parts of India, drawn as original
 * SVG studies (simple geometry in each art's own colours, not copies of any artwork).
 * Each tile turns over in 3D to say where the art is from and how it is made.
 */

const range = (n) => Array.from({ length: n }, (_, i) => i);

function Warli() {
  const dancer = (
    <g>
      <circle cx="0" cy="-13" r="3" />
      <path d="M-5 -9 H5 L0 -2 Z M0 -2 L-5 6 H5 Z" />
      <path d="M-3 6 L-4 13 M3 6 L4 13 M-5 -9 L-11 -4 M5 -9 L11 -4" fill="none" strokeWidth="1.4" />
    </g>
  );
  return (
    <g fill="#fbf3e4" stroke="#fbf3e4">
      <rect width="200" height="140" fill="#8a3a22" stroke="none" />
      <path d="M100 70 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 1 0 7 -7 a11 11 0 1 1 -11 11 a15 15 0 1 0 15 -15" fill="none" strokeWidth="1.5" />
      {range(12).map((i) => (
        <g key={i} transform={`translate(100 70) rotate(${i * 30}) translate(0 -42)`}>{dancer}</g>
      ))}
      {range(14).map((i) => <circle key={i} cx={9 + i * 14} cy="131" r="1.6" stroke="none" />)}
      {range(14).map((i) => <circle key={i} cx={9 + i * 14} cy="9" r="1.6" stroke="none" />)}
    </g>
  );
}

function Kolam() {
  const pts = [];
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 6; c += 1) pts.push([30 + c * 28, 28 + r * 28]);
  return (
    <g>
      <rect width="200" height="140" fill="#6b4636" />
      {pts.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(45)`}>
          <rect x="-11" y="-11" width="22" height="22" rx="9" fill="none" stroke="#fdf8ee" strokeWidth="1.8" />
        </g>
      ))}
      {pts.map(([x, y]) => <circle key={`d${x}-${y}`} cx={x} cy={y} r="2.3" fill="#fdf8ee" />)}
    </g>
  );
}

function Madhubani() {
  return (
    <g stroke="#1d1a17" strokeLinejoin="round">
      <rect width="200" height="140" fill="#f6ecd2" stroke="none" />
      <rect x="6" y="6" width="188" height="128" fill="none" strokeWidth="2" />
      <rect x="11" y="11" width="178" height="118" fill="none" strokeWidth="1" />
      {range(15).map((i) => <path key={`t${i}`} d={`M${14 + i * 11.6} 24 l5.8 -10 l5.8 10 Z`} fill={i % 2 ? '#2f7d4f' : '#d8a81f'} strokeWidth="1" />)}
      {range(15).map((i) => <path key={`b${i}`} d={`M${14 + i * 11.6} 116 l5.8 10 l5.8 -10 Z`} fill={i % 2 ? '#d8a81f' : '#2f7d4f'} strokeWidth="1" />)}
      <path d="M150 70 L176 48 L169 70 L176 92 Z" fill="#d8a81f" strokeWidth="2" />
      <path d="M36 70 C 58 36 126 38 152 70 C 126 102 58 104 36 70 Z" fill="#d9482b" strokeWidth="2.4" />
      <path d="M84 45 C 96 30 112 30 120 46" fill="#2f7d4f" strokeWidth="2" />
      {range(4).map((i) => <path key={`s${i}`} d={`M${78 + i * 16} 50 q 12 20 0 40`} fill="none" strokeWidth="1.6" />)}
      {range(5).map((i) => <path key={`h${i}`} d={`M${86 + i * 14} 60 l 6 10 l -6 10`} fill="none" strokeWidth="0.9" />)}
      <circle cx="58" cy="65" r="6.5" fill="#fdf8ee" strokeWidth="1.8" />
      <circle cx="59" cy="65" r="2.4" fill="#1d1a17" />
    </g>
  );
}

function Pattachitra() {
  return (
    <g stroke="#1d1a17">
      <rect width="200" height="140" fill="#a8261b" stroke="none" />
      <rect y="0" width="200" height="20" fill="#eebc2f" strokeWidth="1.5" />
      <rect y="120" width="200" height="20" fill="#eebc2f" strokeWidth="1.5" />
      {range(11).map((i) => <path key={`a${i}`} d={`M${i * 20 - 10} 20 a10 10 0 0 1 20 0`} fill="#1d1a17" stroke="none" />)}
      {range(11).map((i) => <path key={`c${i}`} d={`M${i * 20 - 10} 120 a10 10 0 0 0 20 0`} fill="#1d1a17" stroke="none" />)}
      {range(10).map((i) => <circle key={`w${i}`} cx={i * 20 + 10} cy="9" r="2.6" fill="#fdf8ee" strokeWidth="0.8" />)}
      {range(10).map((i) => <circle key={`x${i}`} cx={i * 20 + 10} cy="131" r="2.6" fill="#fdf8ee" strokeWidth="0.8" />)}
      {range(12).map((i) => (
        <path key={`p${i}`} transform={`translate(100 70) rotate(${i * 30})`} d="M0 -14 C 9 -24 8 -36 0 -42 C -8 -36 -9 -24 0 -14 Z" fill={i % 2 ? '#eebc2f' : '#fdf8ee'} strokeWidth="1.4" />
      ))}
      <circle cx="100" cy="70" r="14" fill="#eebc2f" strokeWidth="1.6" />
      <circle cx="100" cy="70" r="7" fill="#1d1a17" />
      {[34, 166].map((x) => (
        <g key={x} transform={`translate(${x} 70)`}>
          {range(6).map((i) => <path key={i} transform={`rotate(${i * 60})`} d="M0 -5 C 5 -10 4 -16 0 -19 C -4 -16 -5 -10 0 -5 Z" fill="#fdf8ee" strokeWidth="1" />)}
          <circle r="4.5" fill="#eebc2f" strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}

function Bandhani() {
  const dots = [];
  for (let i = -10; i <= 10; i += 1) for (let j = -7; j <= 7; j += 1) if ((Math.abs(i) + Math.abs(j)) % 4 === 0) dots.push([100 + i * 9.5, 70 + j * 9.5, (Math.abs(i) + Math.abs(j)) % 8 === 0]);
  return (
    <g>
      <rect width="200" height="140" fill="#9c1f2b" />
      {dots.map(([x, y, gold]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="3" fill="none" stroke={gold ? '#f3c84b' : '#fbe9d2'} strokeWidth="1.4" />
          <circle cx={x} cy={y} r="0.9" fill="#fbe9d2" />
        </g>
      ))}
    </g>
  );
}

function Phulkari() {
  const colours = ['#e83e8c', '#f39221', '#f6cf3a', '#fdf8ee'];
  const lines = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      const cx = 20 + c * 40, cy = 17.5 + r * 35;
      const colour = colours[(r + c) % colours.length];
      for (let k = -5; k <= 5; k += 1) {
        const half = (6 - Math.abs(k)) * 2.9;
        lines.push(<line key={`${r}-${c}-${k}`} x1={cx - half} x2={cx + half} y1={cy + k * 2.9} y2={cy + k * 2.9} stroke={colour} strokeWidth="2" strokeLinecap="round" />);
      }
    }
  }
  return (
    <g>
      <rect width="200" height="140" fill="#5a1230" />
      {lines}
    </g>
  );
}

function Alpana() {
  return (
    <g fill="none" stroke="#fdf8ee" strokeWidth="2.2" strokeLinecap="round">
      <rect width="200" height="140" fill="#9b3323" stroke="none" />
      <circle cx="100" cy="70" r="9" fill="#fdf8ee" />
      <circle cx="100" cy="70" r="16" />
      {range(8).map((i) => <path key={i} transform={`translate(100 70) rotate(${i * 45})`} d="M0 -18 C 11 -28 10 -42 0 -50 C -10 -42 -11 -28 0 -18 Z" />)}
      {range(8).map((i) => <circle key={`d${i}`} transform={`translate(100 70) rotate(${i * 45 + 22.5})`} cx="0" cy="-44" r="2.4" fill="#fdf8ee" stroke="none" />)}
      {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => (
        <path key={`${sx}${sy}`} transform={`translate(100 70) scale(${sx} ${sy})`} d="M64 22 c 14 0 24 10 24 22 c 0 10 -8 16 -15 16 c -6 0 -10 -4 -10 -9 c 0 -4 3 -7 7 -7 M60 52 q 6 8 16 10" />
      ))}
    </g>
  );
}

function Gamosa() {
  const buti = (x, y) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="#c8202b">
      <path d="M0 -8 L6 0 L0 8 L-6 0 Z" />
      <path d="M-11 0 l3 -4 l3 4 l-3 4 Z M11 0 l-3 -4 l-3 4 l3 4 Z" />
    </g>
  );
  return (
    <g>
      <rect width="200" height="140" fill="#fbf7ee" />
      <rect x="34" y="0" width="11" height="140" fill="#c8202b" />
      <rect x="155" y="0" width="11" height="140" fill="#c8202b" />
      <rect x="49" y="0" width="2" height="140" fill="#c8202b" />
      <rect x="149" y="0" width="2" height="140" fill="#c8202b" />
      <rect x="51" y="92" width="98" height="3" fill="#c8202b" />
      <rect x="51" y="126" width="98" height="3" fill="#c8202b" />
      {range(4).map((i) => buti(64 + i * 24, 110.5))}
      <rect x="51" y="20" width="98" height="1.6" fill="#c8202b" />
      <rect x="51" y="26" width="98" height="1.6" fill="#c8202b" />
    </g>
  );
}

const CRAFTS = [
  { name: 'Warli', place: 'Maharashtra', Art: Warli, about: 'Painted in white rice paste on earth-red walls by the Warli people of the Sahyadri hills. Circles, triangles and lines make up whole village scenes.' },
  { name: 'Kolam', place: 'Tamil Nadu', Art: Kolam, about: 'Drawn with rice flour at the doorstep at dawn. Lines loop around a grid of dots to welcome the day and every guest.' },
  { name: 'Madhubani', place: 'Mithila, Bihar', Art: Madhubani, about: 'Painting from Mithila that leaves no space empty: fish, sun and lotus inside bold double-line borders.' },
  { name: 'Pattachitra', place: 'Odisha', Art: Pattachitra, about: 'Scroll painting on cloth from the villages around Puri, long tied to the Jagannath temple and its festivals.' },
  { name: 'Bandhani', place: 'Gujarat and Rajasthan', Art: Bandhani, about: 'Cloth is pinched and tied into thousands of tiny knots before dyeing. Each knot leaves one dot.' },
  { name: 'Phulkari', place: 'Punjab', Art: Phulkari, about: '"Flower work": bright silk floss darned across plain cotton, stitched from the reverse side of the cloth.' },
  { name: 'Alpana', place: 'West Bengal', Art: Alpana, about: 'Flowing floor designs painted by hand with white rice paste for pujas, weddings and festivals.' },
  { name: 'Gamosa', place: 'Assam', Art: Gamosa, about: 'A white handwoven cloth with red borders, given as a mark of respect and worn at Bihu.' },
];

export default function CraftsOfIndia() {
  const [open, setOpen] = useState(-1);
  return (
    <section className="hx-crafts" aria-labelledby="hx-crafts-title">
      <div className="hx-crafts-head">
        <h2 id="hx-crafts-title" className="hx-title">One yatra, many hands</h2>
        <p className="hx-lede">
          Pilgrims walk in from every part of India. These are eight of the arts they carry from home. Turn a tile over to read about it.
        </p>
      </div>
      <ul className="hx-crafts-grid" role="list">
        {CRAFTS.map(({ name, place, about, Art }, i) => (
          <li key={name}>
            <button
              type="button"
              className={`hx-tile${open === i ? ' is-open' : ''}`}
              aria-pressed={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span className="hx-tile-inner">
                <span className="hx-face hx-front">
                  <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><Art /></svg>
                  <span className="hx-tile-label">
                    <span className="hx-tile-name">{name}</span>
                    <span className="hx-tile-place">{place}</span>
                  </span>
                </span>
                <span className="hx-face hx-back">
                  <span className="hx-tile-name">{name}</span>
                  <span className="hx-tile-about">{about}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
