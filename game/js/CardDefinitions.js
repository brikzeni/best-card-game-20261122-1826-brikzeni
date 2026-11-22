// CardDefinitions.js — the 20 original cards of The Astral Court.
// Four families, each with its own colour AND shape so suits are never
// told apart by colour alone: Radiance (sun disc), Veil (crescent shield),
// Orbit (ringed star), Eclipse (black crescent).
// Every card has a cost, a power number and a distinct effect id.

export const FAMILIES = {
  radiance: { name: 'Radiance', color: '#e8b64c', dark: '#8a6a1f', glyph: '☀', shape: 'sun' },
  veil:     { name: 'Veil',     color: '#4fc3b8', dark: '#1f6a63', glyph: '◐', shape: 'moon' },
  orbit:    { name: 'Orbit',    color: '#9a7ee8', dark: '#4d3a8a', glyph: '◎', shape: 'ring' },
  eclipse:  { name: 'Eclipse',  color: '#e86a8a', dark: '#7a2440', glyph: '☾', shape: 'crescent' },
};

// effect ids are resolved in CardEffects (engine.js). `n` is the headline number.
export const CARDS = [
  { id: 'sun-lance',    name: 'Sun Lance',     family: 'radiance', cost: 2, n: 4,  effect: 'damage',       text: 'Deal 4 damage to the rival Keeper.' },
  { id: 'starfall',     name: 'Starfall',      family: 'radiance', cost: 4, n: 7,  effect: 'damage',       text: 'Deal 7 damage to the rival Keeper.' },
  { id: 'dawn-blade',   name: 'Dawn Blade',    family: 'radiance', cost: 1, n: 2,  effect: 'damageStar',   text: 'Deal 2 damage. Gain 1 star.' },
  { id: 'solar-flare',  name: 'Solar Flare',   family: 'radiance', cost: 3, n: 5,  effect: 'damage',       text: 'Deal 5 damage to the rival Keeper.' },
  { id: 'comet-rush',   name: 'Comet Rush',    family: 'radiance', cost: 3, n: 3,  effect: 'damageStar2',  text: 'Deal 3 damage. Gain 2 stars.' },
  { id: 'moonward',     name: 'Moonward',      family: 'veil',     cost: 2, n: 6,  effect: 'wardShield',   text: 'Restore 6 Ward. Gain a 3 Shield.' },
  { id: 'silver-veil',  name: 'Silver Veil',   family: 'veil',     cost: 1, n: 4,  effect: 'shield',       text: 'Gain a 4 Shield. It blocks damage.' },
  { id: 'sanctuary',    name: 'Sanctuary',     family: 'veil',     cost: 3, n: 8,  effect: 'wardStar',     text: 'Restore 8 Ward. Gain 1 star.' },
  { id: 'warding-sigil',name: 'Warding Sigil', family: 'veil',     cost: 2, n: 5,  effect: 'shieldDraw',   text: 'Gain a 5 Shield. Draw a card.' },
  { id: 'lunar-mend',   name: 'Lunar Mend',    family: 'veil',     cost: 2, n: 6,  effect: 'wardDraw',     text: 'Restore 6 Ward. Draw a card.' },
  { id: 'star-chart',   name: 'Star Chart',    family: 'orbit',    cost: 2, n: 1,  effect: 'constellation',text: 'Place a Chart: +1 star at each of your turns.' },
  { id: 'telescope',    name: 'Telescope',     family: 'orbit',    cost: 1, n: 2,  effect: 'draw',         text: 'Draw 2 cards.' },
  { id: 'gravity-well', name: 'Gravity Well',  family: 'orbit',    cost: 3, n: 1,  effect: 'well',         text: 'Place a Well: rival cards cost +1 energy.' },
  { id: 'alignment',    name: 'Alignment',     family: 'orbit',    cost: 2, n: 2,  effect: 'align',        text: 'Gain 2 stars, plus 1 per Chart you hold.' },
  { id: 'observatory',  name: 'Observatory',   family: 'orbit',    cost: 4, n: 2,  effect: 'observatory',  text: 'Place an Observatory: +2 stars each turn. Draw 1.' },
  { id: 'eclipse',      name: 'Eclipse',       family: 'eclipse',  cost: 3, n: 6,  effect: 'damageSelf',   text: 'Deal 6 damage. Lose 2 Ward.' },
  { id: 'void-tithe',   name: 'Void Tithe',    family: 'eclipse',  cost: 1, n: 2,  effect: 'steal',        text: 'Steal 2 stars from the rival.' },
  { id: 'black-sun',    name: 'Black Sun',     family: 'eclipse',  cost: 5, n: 10, effect: 'damageSelf4',  text: 'Deal 10 damage. Lose 4 Ward.' },
  { id: 'umbral-swap',  name: 'Umbral Swap',   family: 'eclipse',  cost: 2, n: 3,  effect: 'steal',        text: 'Steal 3 stars from the rival.' },
  { id: 'nova-rebirth', name: 'Nova Rebirth',  family: 'eclipse',  cost: 4, n: 3,  effect: 'nova',         text: 'Shatter a rival constellation. Gain 3 stars.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A shuffled deck: two copies of every card, 40 cards. Deterministic with a seed.
export function buildDeck(seed) {
  const deck = [];
  for (const c of CARDS) { deck.push(c.id); deck.push(c.id); }
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
