import { useEffect, useRef, useState } from 'react';

/*
 * A photo that turns 3D under the mouse. A grey depth map (white = near, black = far)
 * shifts near things more than far things as the pointer moves, so the scene gains depth.
 *
 * The plain <img> always renders first: it is the fast first paint, the fallback, and what
 * phones, reduced-motion users, data savers and browsers without WebGL keep seeing.
 * The WebGL canvas fades in on top only after both textures have loaded.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec2 uPointer;
uniform float uStrength;
varying vec2 vUv;
void main() {
  vec2 uv = vUv * uScale + uOffset;
  float d = texture2D(uDepth, uv).r;
  vec2 shifted = uv + uPointer * (d - 0.5) * uStrength;
  gl_FragColor = texture2D(uImg, clamp(shifted, 0.0, 1.0));
}`;

// Extra zoom so the shifted edges never show past the frame
const MARGIN = 1.05;

function canRun3D() {
  if (typeof window === 'undefined') return false;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  return finePointer && !reduced && !saveData;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeTexture(gl, img) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return tex;
}

function compile(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * @param src      photo
 * @param depth    matching depth map (white = near)
 * @param focus    [x, y] from 0 to 1: which part of the photo stays in view when the frame crops it
 * @param strength how far near objects travel, as a share of the frame (keep 0.01 to 0.03)
 */
export default function DepthImage({ src, depth, focus = [0.5, 0.5], strength = 0.02 }) {
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);
  const [fx, fy] = focus;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !depth || !canRun3D()) return undefined;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return undefined;

    let disposed = false;
    let raf = 0;
    let imgAspect = 1.5;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const uni = {};

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return undefined;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    ['uImg', 'uDepth', 'uScale', 'uOffset', 'uPointer', 'uStrength'].forEach((n) => { uni[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(uni.uImg, 0);
    gl.uniform1i(uni.uDepth, 1);
    gl.uniform1f(uni.uStrength, strength);

    // "object-fit: cover" with a focus point, done in texture space
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const boxAspect = r.width / r.height;
      let sx = 1;
      let sy = 1;
      if (boxAspect < imgAspect) sx = boxAspect / imgAspect;
      else sy = imgAspect / boxAspect;
      sx /= MARGIN;
      sy /= MARGIN;
      const ox = Math.min(Math.max(fx - sx / 2, 0), 1 - sx);
      const oy = Math.min(Math.max(fy - sy / 2, 0), 1 - sy);
      gl.uniform2f(uni.uScale, sx, sy);
      gl.uniform2f(uni.uOffset, ox, oy);
    };

    const draw = () => {
      gl.uniform2f(uni.uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // Ease toward the pointer, then stop drawing once settled (no idle GPU work)
    const tick = () => {
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      draw();
      raf = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // All panels in one [data-depth-group] react to the same pointer, so the scene moves as one
    const area = canvas.closest('[data-depth-group]') || canvas.parentElement;
    const onMove = (e) => {
      const r = area.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    };
    const onLeave = () => { pointer.tx = 0; pointer.ty = 0; kick(); };
    const ro = new ResizeObserver(() => { fit(); draw(); });

    Promise.all([loadImage(src), loadImage(depth)])
      .then(([img, dep]) => {
        if (disposed) return;
        imgAspect = img.naturalWidth / img.naturalHeight;
        gl.activeTexture(gl.TEXTURE0);
        makeTexture(gl, img);
        gl.activeTexture(gl.TEXTURE1);
        makeTexture(gl, dep);
        fit();
        draw();
        ro.observe(canvas);
        area.addEventListener('pointermove', onMove);
        area.addEventListener('pointerleave', onLeave);
        setLive(true);
      })
      .catch(() => { /* keep the plain photo */ });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [src, depth, fx, fy, strength]);

  return (
    <>
      <img src={src} alt="" decoding="async" style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }} />
      <canvas ref={canvasRef} aria-hidden="true" className="cg-depth" data-live={live || undefined} />
    </>
  );
}
