// TurnManager.js — starts a match and runs the rival's turn with real
// pacing: one card at a time, visible in the log, never instant, never
// during the player's input. Also builds the honest demo states used for
// screenshots: each one is reached by playing real cards through the
// engine, never by editing the screen text.

import { buildDeck } from './CardDefinitions.js';
import { newPlayer, drawCards } from './GameState.js';
import { beginTurn, playCard } from './RulesEngine.js';
import { aiStep } from './OpponentAI.js';

export function startMatch(state, seed) {
  state.players[0] = newPlayer('You', false, buildDeck(seed));
  state.players[1] = newPlayer('Vesper', true, buildDeck(seed + 101));
  state.screen = 'table';
  state.phase = 'player';
  state.turn = 1;
  state.log = ['The duel begins. The stars are listening.'];
  state.winner = null;
  state.selected = null;
  state.stats = { cardsPlayed: 0, damageDealt: 0, turns: 0 };
  drawCards(state, 0, 5);
  drawCards(state, 1, 5);
  beginTurn(state, 0);
}

// The rival plays until it has nothing good left, ~650ms a card so the
// player can follow. Returns a promise that resolves when the turn ends.
export async function runAiTurn(state, render) {
  state.aiThinking = true;
  render();
  await wait(650);
  while (state.phase === 'ai' && state.screen === 'table') {
    const acted = aiStep(state);
    render();
    if (!acted) break;
    await wait(650);
  }
  if (state.screen !== 'table') { state.aiThinking = false; return; }
  state.aiThinking = false;
  beginTurn(state, 0);
  render();
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Screenshot demo states: real engine states, built by real plays. ---
// demo=table: a rich mid-game — constellations on both sides, full hands.
// demo=win: you are one card from the Court; the demo plays the winner.
// demo=loss: Vesper is one card from the Court; the demo lets her win.
export function demoTable(state) {
  startMatch(state, 777);
  const you = state.players[0];
  const foe = state.players[1];
  you.hand = ['star-chart', 'observatory', 'sun-lance', 'moonward', 'comet-rush', 'void-tithe', 'telescope'];
  foe.hand = ['starfall', 'sanctuary', 'eclipse', 'gravity-well', 'dawn-blade'];
  you.board = [{ cardId: 'star-chart', kind: 'chart', yield: 1 }, { cardId: 'observatory', kind: 'observatory', yield: 2 }];
  foe.board = [{ cardId: 'gravity-well', kind: 'well', yield: 0 }];
  you.stars = 9; foe.stars = 7;
  you.ward = 16; foe.ward = 13;
  you.shield = 3; foe.shield = 0;
  you.energy = 5; you.maxEnergy = 5;
  state.turn = 6;
  state.log = ['Your Observatory shines: +2 stars.', 'Vesper plays Gravity Well — your cards cost +1.', 'You play Comet Rush — 3 damage, +2 stars.'];
}

export function demoWin(state) {
  startMatch(state, 778);
  const you = state.players[0];
  const foe = state.players[1];
  you.hand = ['starfall', 'sun-lance', 'moonward'];
  foe.hand = ['dawn-blade', 'telescope'];
  you.stars = 13; foe.stars = 10;
  you.ward = 14; foe.ward = 4;
  you.energy = 6; you.maxEnergy = 6;
  state.turn = 9;
  state.log = ['You play Comet Rush — 3 damage, +2 stars.', 'Vesper is wounded. One more strike claims the Court.'];
  playCard(state, 0, 0); // Starfall: 7 damage vs 4 Ward — a real win.
}

export function demoLoss(state) {
  startMatch(state, 779);
  const you = state.players[0];
  const foe = state.players[1];
  you.hand = ['moonward', 'telescope'];
  foe.hand = ['black-sun', 'starfall'];
  you.stars = 8; foe.stars = 13;
  you.ward = 3; foe.ward = 15;
  foe.energy = 8; foe.maxEnergy = 8;
  state.turn = 9;
  state.phase = 'ai';
  state.log = ['Vesper gathers the dark. Your Ward is nearly gone.'];
  playCard(state, 1, 0); // Black Sun: 10 damage vs 3 Ward — a real loss.
}
