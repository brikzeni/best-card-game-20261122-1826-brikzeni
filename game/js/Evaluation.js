// Evaluation.js — one number for a board position, from the side to move's
// point of view. The AI maximises it; the same function scores every
// candidate play, so the opponent's choices stay readable and consistent.

import { CARD_BY_ID } from './CardDefinitions.js';
import { WIN_STARS, constellationYield } from './GameState.js';

export function evaluate(state, who) {
  const me = state.players[who];
  const foe = state.players[1 - who];
  if (!me || !foe) return 0;
  let score = 0;
  score += (me.ward - foe.ward) * 2.2;
  score += (me.stars - foe.stars) * 6.0;
  score += (me.shield - foe.shield) * 1.1;
  score += constellationYield(me) * 4.0 - constellationYield(foe) * 4.0;
  score += (me.hand.length - foe.hand.length) * 0.7;
  score += me.energy * 0.25;
  // Winning now dwarfs everything; dying now is the worst outcome.
  if (foe.ward <= 0 || me.stars >= WIN_STARS) score += 1000;
  if (me.ward <= 0 || foe.stars >= WIN_STARS) score -= 1000;
  // Urgency: close to the star goal, stars matter more.
  if (me.stars >= WIN_STARS - 3) score += me.stars * 2;
  if (foe.stars >= WIN_STARS - 2) score += foe.stars * -3;
  return score;
}

// Cheap 1-ply value of playing a card, without mutating the real state.
export function scorePlay(state, who, handIndex) {
  const p = state.players[who];
  const card = CARD_BY_ID[p.hand[handIndex]];
  if (!card) return -9999;
  let v = 0;
  const lowWard = p.ward <= 8;
  const foe = state.players[1 - who];
  switch (card.effect) {
    case 'damage': v = card.n * 2.2; break;
    case 'damageStar': v = card.n * 2.2 + 6; break;
    case 'damageStar2': v = card.n * 2.2 + 12; break;
    case 'damageSelf': v = card.n * 2.2 - (lowWard ? 14 : 4); break;
    case 'damageSelf4': v = card.n * 2.2 - (lowWard ? 26 : 8); break;
    case 'wardShield': v = (lowWard ? 16 : 6) + 3.3; break;
    case 'shield': v = lowWard ? 9 : 4.4; break;
    case 'wardStar': v = (lowWard ? 14 : 5) + 6; break;
    case 'shieldDraw': v = 5.5 + 2; break;
    case 'wardDraw': v = (lowWard ? 10 : 4) + 2; break;
    case 'draw': v = 3.5; break;
    case 'steal': v = Math.min(card.n, foe.stars) * 12; break;
    case 'align': v = (2 + p.board.filter((b) => b.kind === 'chart').length) * 6; break;
    case 'constellation': v = p.board.length >= 3 ? -50 : 4 + (8 - state.turn); break;
    case 'well': v = foe.hand.length >= 4 ? 6 : 2; break;
    case 'observatory': v = p.board.length >= 3 ? -50 : 8 + (8 - state.turn); break;
    case 'nova': v = foe.board.length ? 10 + foe.board.length * 4 : -50; break;
    default: v = 0;
  }
  // Lethal or star-winning plays jump the queue.
  if ((card.effect.startsWith('damage') || card.effect === 'damageSelf' || card.effect === 'damageSelf4') && foe.ward - card.n <= 0) v += 1000;
  if (p.stars + card.n >= WIN_STARS && (card.effect === 'damageStar' || card.effect === 'damageStar2' || card.effect === 'wardStar')) v += 1000;
  // Opportunity cost: never waste the whole turn on a 1-energy filler
  // when a big card is affordable next turn — handled by cost ratio.
  v -= card.cost * 0.6;
  return v;
}
