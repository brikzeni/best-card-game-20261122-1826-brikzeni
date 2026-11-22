// RulesEngine.js — every legal action, validated before it resolves.
// CardEffects live here so card rules stay testable without any rendering.
// A play is legal only when: it is that side's turn, the card is in hand,
// energy covers the effective cost, and board cards have a free slot.

import { CARD_BY_ID } from './CardDefinitions.js';
import {
  WIN_STARS, MAX_BOARD, drawCards, constellationYield,
  effectiveCost, checkWinner,
} from './GameState.js';

export function log(state, text) {
  state.log.unshift(text);
  if (state.log.length > 40) state.log.length = 40;
}

// Subject-verb agreement for the two Keepers ("You play" / "Vesper plays").
export function say(p, youVerb, otherVerb) {
  return p.name === 'You' ? `You ${youVerb}` : `${p.name} ${otherVerb}`;
}
export function possessive(p) {
  return p.name === 'You' ? 'Your' : `${p.name}'s`;
}

export function dealDamage(state, who, amount) {
  const target = state.players[who];
  let left = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, left);
    target.shield -= blocked;
    left -= blocked;
    if (blocked > 0) log(state, `${target.name}'s Shield blocks ${blocked}.`);
  }
  if (left > 0) {
    target.ward = Math.max(0, target.ward - left);
    log(state, `${target.name} takes ${left} damage.`);
  }
  return left;
}

export function canPlay(state, who, handIndex) {
  const p = state.players[who];
  if (!p) return { ok: false, why: 'no player' };
  if (state.phase !== (who === 0 ? 'player' : 'ai')) return { ok: false, why: 'not your turn' };
  if (state.screen !== 'table') return { ok: false, why: 'not on the table' };
  const cardId = p.hand[handIndex];
  if (!cardId) return { ok: false, why: 'no such card' };
  const card = CARD_BY_ID[cardId];
  const cost = effectiveCost(state, who, card);
  if (p.energy < cost) return { ok: false, why: `needs ${cost} energy` };
  const places = ['constellation', 'well', 'observatory'];
  if (places.includes(card.effect) && p.board.length >= MAX_BOARD) {
    return { ok: false, why: 'board is full (3)' };
  }
  if (card.effect === 'nova' && state.players[1 - who].board.length === 0) {
    return { ok: false, why: 'rival has no constellation to shatter' };
  }
  return { ok: true, card, cost };
}

// Resolve one card. Returns true when the play happened.
export function playCard(state, who, handIndex) {
  const check = canPlay(state, who, handIndex);
  if (!check.ok) { state.lastEvent = { type: 'illegal', why: check.why }; return false; }
  const p = state.players[who];
  const foe = state.players[1 - who];
  const { card, cost } = check;
  p.energy -= cost;
  p.hand.splice(handIndex, 1);
  p.discard.push(card.id);
  state.stats.cardsPlayed += 1;
  state.lastEvent = { type: 'play', who, cardId: card.id };
  log(state, `${say(p, 'play', 'plays')} ${card.name} (${cost}✦).`);

  switch (card.effect) {
    case 'damage':
      state.stats.damageDealt += card.n;
      dealDamage(state, 1 - who, card.n);
      break;
    case 'damageStar':
      state.stats.damageDealt += card.n;
      dealDamage(state, 1 - who, card.n);
      p.stars += 1;
      break;
    case 'damageStar2':
      state.stats.damageDealt += card.n;
      dealDamage(state, 1 - who, card.n);
      p.stars += 2;
      break;
    case 'damageSelf':
      state.stats.damageDealt += card.n;
      dealDamage(state, 1 - who, card.n);
      p.ward = Math.max(0, p.ward - 2);
      log(state, `${say(p, 'lose', 'loses')} 2 Ward to the Eclipse.`);
      break;
    case 'damageSelf4':
      state.stats.damageDealt += card.n;
      dealDamage(state, 1 - who, card.n);
      p.ward = Math.max(0, p.ward - 4);
      log(state, `${say(p, 'lose', 'loses')} 4 Ward to the Black Sun.`);
      break;
    case 'wardShield':
      p.ward = Math.min(20, p.ward + 6);
      p.shield += 3;
      break;
    case 'shield':
      p.shield += 4;
      break;
    case 'wardStar':
      p.ward = Math.min(20, p.ward + 8);
      p.stars += 1;
      break;
    case 'shieldDraw':
      p.shield += 5;
      drawCards(state, who, 1);
      break;
    case 'wardDraw':
      p.ward = Math.min(20, p.ward + 6);
      drawCards(state, who, 1);
      break;
    case 'draw':
      drawCards(state, who, 2);
      break;
    case 'steal': {
      const taken = Math.min(card.n, foe.stars);
      foe.stars -= taken;
      p.stars += taken;
      log(state, `${say(p, 'steal', 'steals')} ${taken} star${taken === 1 ? '' : 's'}.`);
      break;
    }
    case 'align':
      p.stars += 2 + p.board.filter((b) => b.kind === 'chart').length;
      break;
    case 'constellation':
      p.board.push({ cardId: card.id, kind: 'chart', yield: 1 });
      break;
    case 'well':
      p.board.push({ cardId: card.id, kind: 'well', yield: 0 });
      break;
    case 'observatory':
      p.board.push({ cardId: card.id, kind: 'observatory', yield: 2 });
      drawCards(state, who, 1);
      break;
    case 'nova': {
      const hit = foe.board.pop();
      if (hit) log(state, `${say(p, 'shatter', 'shatters')} the rival ${CARD_BY_ID[hit.cardId].name}.`);
      p.stars += 3;
      break;
    }
    default:
      break;
  }
  const winner = checkWinner(state);
  if (winner !== null) endMatch(state, winner);
  return true;
}

export function endMatch(state, winner) {
  state.phase = 'over';
  state.winner = winner;
  state.screen = winner === 0 ? 'won' : 'lost';
  state.stats.turns = state.turn;
  log(state, winner === 0 ? 'You claim the Astral Court!' : 'The rival Keeper claims the Court.');
}

// Start-of-turn: energy refills, constellation yield, draw 2.
export function beginTurn(state, who) {
  const p = state.players[who];
  p.maxEnergy = Math.min(8, 2 + state.turn);
  p.energy = p.maxEnergy;
  const gain = constellationYield(p);
  if (gain > 0) {
    p.stars += gain;
    log(state, `${possessive(p)} constellations shine: +${gain} star${gain === 1 ? '' : 's'}.`);
  }
  drawCards(state, who, 2);
  state.phase = who === 0 ? 'player' : 'ai';
  const winner = checkWinner(state);
  if (winner !== null) endMatch(state, winner);
}

export function endTurn(state) {
  if (state.phase !== 'player' || state.screen !== 'table') return false;
  state.selected = null;
  state.turn += 1;
  beginTurn(state, 1);
  return true;
}
