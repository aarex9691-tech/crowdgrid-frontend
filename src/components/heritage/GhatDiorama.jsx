import { useEffect, useRef } from 'react';
import '../../styles/heritage.css';
import { attachTilt, pauseOffscreen } from '../../lib/tilt';

/*
 * Opening scene of the home page: dawn at the ghats, seen from inside a temple mandapa.
 * Real CSS 3D: every layer sits at its own depth, the river is a receding plane with
 * upright diyas drifting on it, and the whole scene turns a little with the pointer.
 * The skyline carries the three yatras: Nashik (nagara shikhara), Pandharpur and Puri (deula with flag).
 * Purely decorative for screen readers; the caption below names what is shown.
 */

/** A north-Indian (nagara) temple tower: curved sides, ribbed amalaka, kalash on top. */
function Shikhara({ x, base, w, h, flag = false }) {
  const top = base - h;
  const body = `M ${x - w / 2},${base} L ${x - w / 2},${base - h * 0.28}
    C ${x - w * 0.46},${base - h * 0.66} ${x - w * 0.3},${top + h * 0.14} ${x - w * 0.15},${top + h * 0.08}
    L ${x + w * 0.15},${top + h * 0.08}
    C ${x + w * 0.3},${top + h * 0.14} ${x + w * 0.46},${base - h * 0.66} ${x + w / 2},${base - h * 0.28}
    L ${x + w / 2},${base} Z`;
  return (
    <g>
      <path d={body} />
      <ellipse cx={x} cy={top + h * 0.06} rx={w * 0.22} ry={h * 0.035} />
      <circle cx={x} cy={top + h * 0.005} r={w * 0.07} />
      <rect x={x - 1.2} y={top - h * 0.1} width="2.4" height={h * 0.1} />
      {flag && <path d={`M ${x + 1},${top - h * 0.1} l ${w * 0.34},${h * 0.035} l ${-w * 0.34},${h * 0.04} Z`} className="hx-flag" />}
    </g>
  );
}

/** A pillared hall with a stepped roof, the mandapa in front of a tower. */
function Hall({ x, base, w, h }) {
  return (
    <g>
      <rect x={x - w / 2} y={base - h * 0.55} width={w} height={h * 0.55} />
      <path d={`M ${x - w * 0.56},${base - h * 0.55} L ${x - w * 0.36},${base - h * 0.78} L ${x - w * 0.16},${base - h * 0.78} L ${x},${base - h} L ${x + w * 0.16},${base - h * 0.78} L ${x + w * 0.36},${base - h * 0.78} L ${x + w * 0.56},${base - h * 0.55} Z`} />
    </g>
  );
}

/** A small domed pavilion (chhatri) that stands along the ghats. */
function Chhatri({ x, base, s = 1 }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${s})`}>
      <path d="M -16,-30 Q 0,-52 16,-30 Z" />
      <rect x="-19" y="-31" width="38" height="4" />
      <rect x="-15" y="-27" width="3.5" height="27" />
      <rect x="11.5" y="-27" width="3.5" height="27" />
      <rect x="-1" y="-58" width="2" height="9" />
    </g>
  );
}

function Diya({ style }) {
  return (
    <span className="hx-diya" style={style}>
      <span className="hx-diya-up">
        <svg viewBox="0 0 40 46" aria-hidden="true">
          <ellipse cx="20" cy="24" rx="17" ry="17" className="hx-diya-glow" />
          <path d="M20 6 C 26 15 25.5 21 20 25 C 14.5 21 14 15 20 6 Z" className="hx-flame" />
          <path d="M5 28 Q 20 46 35 28 Q 20 33 5 28 Z" fill="#7a3a1f" />
          <path d="M5 28 Q 20 33 35 28 Q 20 24.5 5 28 Z" fill="#c0703f" />
        </svg>
      </span>
    </span>
  );
}

// left %, start depth %, drift seconds, delay, size
const DIYAS = [
  [24, 6, 46, -4, 0.75], [31, 20, 58, -30, 1], [40, 3, 52, -12, 0.65], [47, 26, 64, -44, 1.15],
  [55, 9, 49, -21, 0.8], [62, 17, 55, -38, 0.95], [70, 5, 60, -9, 0.7], [76, 24, 70, -55, 1.1],
  [36, 13, 62, -18, 0.85], [66, 11, 57, -47, 0.8],
];

export default function GhatDiorama() {
  const ref = useRef(null);
  useEffect(() => {
    const offTilt = attachTilt(ref.current, { max: 5, maxX: 2.5 });
    const offPause = pauseOffscreen(ref.current);
    return () => { offTilt(); offPause(); };
  }, []);

  return (
    <figure className="hx-ghat" ref={ref}>
      <div className="hx-ghat-view" aria-hidden="true">
        <div className="hx-ghat-cam">
        <div className="hx-ghat-stage">
          {/* 1. dawn sky and the rising sun */}
          <div className="hx-layer hx-sky">
            <span className="hx-sun" />
          </div>

          {/* 2. far bank: hills and trees in haze */}
          <svg className="hx-layer hx-far" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
            <path d="M0 300 V236 C 90 214 150 226 230 208 C 320 188 380 214 470 204 C 560 194 640 170 730 196 C 820 220 900 190 990 204 C 1080 218 1140 200 1200 212 V300 Z" />
          </svg>

          {/* 3. the three tirthas on one horizon */}
          <svg className="hx-layer hx-skyline" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
            {/* Nashik: a nagara shikhara with its hall */}
            <Hall x={196} base={262} w={88} h={66} />
            <Shikhara x={274} base={262} w={68} h={146} />
            <Shikhara x={338} base={262} w={38} h={78} />
            {/* Pandharpur: clustered spires */}
            <Shikhara x={572} base={262} w={42} h={88} />
            <Shikhara x={622} base={262} w={62} h={128} flag />
            <Shikhara x={672} base={262} w={42} h={88} />
            <Hall x={622} base={262} w={164} h={48} />
            {/* Puri: the tall deula with its flag, and stepped halls before it */}
            <Hall x={826} base={262} w={66} h={60} />
            <Hall x={886} base={262} w={72} h={80} />
            <Shikhara x={962} base={262} w={80} h={170} flag />
            <rect x="0" y="258" width="1200" height="42" />
          </svg>

          {/* 4. the ghat: pavilions and steps going down to the water */}
          <svg className="hx-layer hx-steps" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
            <g className="hx-steps-fill">
              <Chhatri x={120} base={236} s={1.15} />
              <Chhatri x={470} base={236} s={0.95} />
              <Chhatri x={760} base={236} s={1.05} />
              <Chhatri x={1090} base={236} s={1.2} />
              <rect x="0" y="234" width="1200" height="66" />
            </g>
            {[244, 254, 265, 277, 290].map((y) => <line key={y} x1="0" x2="1200" y1={y} y2={y} className="hx-step-line" />)}
          </svg>

          {/* 5. the river: a real receding plane, with diyas standing upright on it */}
          <div className="hx-river">
            <span className="hx-river-shine" />
            <span className="hx-sun-path" />
          </div>
          <div className="hx-diyas">
            {DIYAS.map(([left, top, dur, delay, size], i) => (
              <Diya key={i} style={{ left: `${left}%`, top: `${top}%`, '--dur': `${dur}s`, '--delay': `${delay}s`, '--size': size }} />
            ))}
          </div>

          {/* 6. the mandapa we are standing in: cusped arch and pillars, closest to the eye */}
          <div className="hx-layer hx-frame">
            <svg className="hx-arch" viewBox="0 0 1200 150" preserveAspectRatio="none">
              <path d="M0 0 H1200 V150 C 1200 96 1168 70 1130 70 C 1118 34 1066 26 1040 54 C 1012 14 940 12 908 46 C 868 4 780 2 742 38 C 700 -2 500 -2 458 38 C 420 2 332 4 292 46 C 260 12 188 14 160 54 C 134 26 82 34 70 70 C 32 70 0 96 0 150 Z" className="hx-arch-fill" />
              <path d="M0 150 C 0 96 32 70 70 70 C 82 34 134 26 160 54 C 188 14 260 12 292 46 C 332 4 420 2 458 38 C 500 -2 700 -2 742 38 C 780 2 868 4 908 46 C 940 12 1012 14 1040 54 C 1066 26 1118 34 1130 70 C 1168 70 1200 96 1200 150" className="hx-arch-edge" />
            </svg>
            <span className="hx-pillar hx-pillar-l" />
            <span className="hx-pillar hx-pillar-r" />
          </div>
        </div>
        </div>
      </div>
      <figcaption className="hx-ghat-caption">
        <span className="hx-ghat-sanskrit" lang="sa">अतिथि देवो भव</span>
        <span className="hx-ghat-gloss">The guest is divine. Nashik, Pandharpur and Puri share one horizon here.</span>
      </figcaption>
    </figure>
  );
}
