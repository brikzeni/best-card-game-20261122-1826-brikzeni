// CardArt.js — original procedural illustration for every card. No stock
// art, no generated portraits: each card draws its own constellation from
// a seed taken from its id, inside a family frame (sun disc, crescent
// shield, ringed star, black crescent) so the family reads by shape.

import { FAMILIES } from './CardDefinitions.js';

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic constellation: 5–8 stars joined by faint lines.
export function constellationSVG(card, w = 200, h = 118) {
  const rnd = mulberry(hashSeed(card.id));
  const pts = [];
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) pts.push([18 + rnd() * (w - 36), 14 + rnd() * (h - 28)]);
  const lines = pts.slice(1).map((p, i) => {
    const a = pts[i];
    return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="rgba(232,214,160,.55)" stroke-width="1"/>`;
  }).join('');
  const stars = pts.map((p, i) => {
    const r = i === 0 ? 4.2 : 1.6 + rnd() * 2.2;
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.toFixed(1)}" fill="#f4e3ac"><animate attributeName="opacity" values="1;.45;1" dur="${(2 + rnd() * 2).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${lines}${stars}</svg>`;
}

// Family emblem drawn as SVG paths — the shape that identifies the suit.
export function emblemSVG(family, size = 54) {
  const f = FAMILIES[family];
  const c = f.color;
  if (family === 'radiance') {
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 27 + Math.cos(a) * 15, y1 = 27 + Math.sin(a) * 15;
      const x2 = 27 + Math.cos(a) * 21, y2 = 27 + Math.sin(a) * 21;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
    }).join('');
    return `<svg viewBox="0 0 54 54" width="${size}" height="${size}">${rays}<circle cx="27" cy="27" r="11" fill="${c}"/><circle cx="27" cy="27" r="6.5" fill="#fff3c4"/></svg>`;
  }
  if (family === 'veil') {
    return `<svg viewBox="0 0 54 54" width="${size}" height="${size}"><path d="M27 6 L44 12 V26 C44 38 36 46 27 49 C18 46 10 38 10 26 V12 Z" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M35 14 A13 13 0 1 0 35 40 A10.5 10.5 0 1 1 35 14 Z" fill="${c}"/></svg>`;
  }
  if (family === 'orbit') {
    return `<svg viewBox="0 0 54 54" width="${size}" height="${size}"><ellipse cx="27" cy="27" rx="21" ry="8" fill="none" stroke="${c}" stroke-width="2.2" transform="rotate(-24 27 27)"/><circle cx="27" cy="27" r="7.5" fill="${c}"/><circle cx="27" cy="27" r="3.4" fill="#efe6ff"/></svg>`;
  }
  return `<svg viewBox="0 0 54 54" width="${size}" height="${size}"><path d="M34 8 A19 19 0 1 0 34 46 A15 15 0 1 1 34 8 Z" fill="${c}"/><circle cx="20" cy="20" r="2.2" fill="#ffd9e2"/><circle cx="24" cy="32" r="1.6" fill="#ffd9e2"/></svg>`;
}
