// OpponentAI.js — the rival Keeper. No randomness in what it wants, only a
// little in which near-best move it picks, so its behaviour can be read
// and countered. It plays its best affordable card, re-scores, and repeats
// until nothing good is left, then ends its turn. Same rules as the player.

import { canPlay, playCard, endMatch } from './RulesEngine.js';
import { scorePlay } from './Evaluation.js';
import { checkWinner } from './GameState.js';

// One AI step: play the single best card, or return false to end the turn.
export function aiStep(state) {
  const ai = state.players[1];
  if (!ai || state.phase !== 'ai' || state.screen !== 'table') return false;
  let best = -1;
  let bestScore = 1.2; // below this, holding energy is better than playing
  for (let i = 0; i < ai.hand.length; i++) {
    if (!canPlay(state, 1, i).ok) continue;
    // Small controlled variation: ±0.8 so two identical boards can diverge.
    const s = scorePlay(state, 1, i) + (Math.random() * 1.6 - 0.8);
    if (s > bestScore) { bestScore = s; best = i; }
  }
  if (best < 0) return false;
  playCard(state, 1, best);
  return checkWinner(state) === null;
}

// A short line the UI shows so the player can read the AI's intent.
export function aiIntent(state) {
  const ai = state.players[1];
  if (!ai) return '';
  if (ai.stars >= 12) return 'The rival is one step from the Court — deny their stars!';
  if (ai.ward <= 6) return 'The rival Keeper is wounded. Press the attack.';
  if (ai.board.length >= 2) return 'Rival constellations are shining. Shatter them or outpace them.';
  if (state.players[0].ward <= 6) return 'Your Ward is low — Veil cards can save you.';
  return 'The rival Keeper studies the stars…';
}
