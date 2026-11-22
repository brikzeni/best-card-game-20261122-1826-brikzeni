// GameState.js — one explicit state machine for the whole duel.
// Screens: 'title' | 'table' | 'won' | 'lost'.  Phases inside a turn:
// 'player' | 'ai' | 'over'.  Every mutation goes through RulesEngine so
// the UI can never produce an illegal state.

export const WIN_STARS = 15;
export const START_WARD = 20;
export const MAX_HAND = 7;
export const MAX_BOARD = 3;

export function newPlayer(name, isAI, deck) {
  return {
    name, isAI,
    ward: START_WARD,
    shield: 0,
    stars: 0,
    energy: 3,
    maxEnergy: 3,
    deck: deck.slice(),
    hand: [],
    board: [], // placed constellations: { cardId, kind, yield }
    discard: [],
  };
}

export function newGame(seed = 20261122) {
  return {
    seed,
    screen: 'title',
    phase: 'player',
    turn: 1,
    log: [],
    lastEvent: null,
    winner: null,
    players: [null, null], // filled by startMatch
    selected: null, // hand index of the selected card
    aiThinking: false,
    stats: { cardsPlayed: 0, damageDealt: 0, turns: 0 },
  };
}

export function drawCards(state, who, n) {
  const p = state.players[who];
  for (let i = 0; i < n; i++) {
    if (p.hand.length >= MAX_HAND) break;
    if (p.deck.length === 0) {
      p.deck = p.discard.slice();
      p.discard = [];
      shuffleInPlace(p.deck, state.seed + state.turn * 7 + who);
      if (p.deck.length === 0) break;
    }
    p.hand.push(p.deck.pop());
  }
}

export function shuffleInPlace(arr, seed) {
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function constellationYield(p) {
  return p.board.reduce((sum, b) => sum + (b.yield || 0), 0);
}

export function rivalHasWell(state, who) {
  const rival = state.players[1 - who];
  return rival.board.some((b) => b.kind === 'well');
}

export function effectiveCost(state, who, card) {
  return card.cost + (rivalHasWell(state, who) ? 1 : 0);
}

export function checkWinner(state) {
  const [you, foe] = state.players;
  if (!you || !foe) return null;
  if (foe.ward <= 0) return 0;
  if (you.ward <= 0) return 1;
  if (you.stars >= WIN_STARS) return 0;
  if (foe.stars >= WIN_STARS) return 1;
  return null;
}
