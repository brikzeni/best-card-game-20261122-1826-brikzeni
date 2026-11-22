// main.js — boots The Astral Court: wires the state machine to the board,
// handles input (mouse, keyboard, reduced-motion), and runs the rival's
// turn after the player ends theirs. No game logic lives here; that is
// RulesEngine's job, and no rendering lives here; that is GameBoard's.

import { newGame } from './GameState.js';
import { playCard, endTurn, log } from './RulesEngine.js';
import { startMatch, runAiTurn, demoTable, demoWin, demoLoss } from './TurnManager.js';
import { renderTable, renderTitle, renderResult, renderRules } from './GameBoard.js';
import { playSound, unlockAudio, setMuted, isMuted } from './AudioManager.js';

const root = document.getElementById('app');
const state = newGame(Date.now() % 100000);
let seedCounter = 20261122;
let aiRunning = false;

const params = new URLSearchParams(location.search);
const demo = params.get('demo'); // table | win | loss — screenshot states only

function render() {
  if (state.screen === 'title') renderTitle(root, hooks);
  else if (state.screen === 'table') renderTable(root, state, hooks);
  else renderResult(root, state, hooks);
}

async function afterPlayerEnd() {
  if (aiRunning || state.screen !== 'table') return;
  aiRunning = true;
  playSound('turn');
  await runAiTurn(state, render);
  aiRunning = false;
  if (state.screen === 'table') playSound('turn');
  render();
}

const hooks = {
  onPlay() {
    unlockAudio();
    seedCounter += 17;
    startMatch(state, seedCounter);
    render();
  },
  onPlayAgain() { seedCounter += 29; startMatch(state, seedCounter); render(); },
  onTitle() { state.screen = 'title'; render(); },
  onRestart() { seedCounter += 31; startMatch(state, seedCounter); render(); },
  onRules() { renderRules(root, () => render()); },
  onMute() { setMuted(!isMuted()); },
  muted: () => isMuted(),
  onCardClick(i) {
    if (state.phase !== 'player' || state.screen !== 'table' || aiRunning) return;
    unlockAudio();
    if (state.selected === i) {
      const before = state.players[0].ward;
      const ok = playCard(state, 0, i);
      state.selected = null;
      if (ok) {
        const card = state.lastEvent && state.lastEvent.cardId;
        playSound(card && /mend|ward|sanctuary|veil/.test(card) ? 'heal' : 'play');
        if (state.players[1].ward < before) playSound('damage');
        if (state.screen === 'table' && state.players[0].stars >= 13) playSound('star');
      } else {
        playSound('illegal');
        log(state, `Cannot play that: ${state.lastEvent ? state.lastEvent.why : 'illegal move'}.`);
      }
      render();
      return;
    }
    state.selected = i;
    render();
  },
  onEndTurn() {
    if (state.phase !== 'player' || aiRunning) return;
    if (endTurn(state)) afterPlayerEnd();
  },
};

// Keyboard: 1-7 select, Enter plays the selected card, Space ends turn.
document.addEventListener('keydown', (e) => {
  if (state.screen !== 'table') {
    if ((e.key === 'Enter' || e.key === ' ') && state.screen === 'title') { e.preventDefault(); hooks.onPlay(); }
    if (e.key === 'Enter' && (state.screen === 'won' || state.screen === 'lost')) hooks.onPlayAgain();
    return;
  }
  if (e.key >= '1' && e.key <= '7') {
    const i = Number(e.key) - 1;
    if (state.players[0].hand[i]) { state.selected = i; render(); }
  } else if (e.key === 'Enter' && state.selected !== null) {
    hooks.onCardClick(state.selected);
  } else if (e.key === ' ') {
    e.preventDefault();
    hooks.onEndTurn();
  }
});

// Honest screenshot states: each is built by playing real cards through
// the engine (see TurnManager). Used only with ?demo= in the URL.
if (demo === 'table') demoTable(state);
else if (demo === 'win') demoWin(state);
else if (demo === 'loss') demoLoss(state);

render();

// Debug handle for automated playtests (used by our own QA only).
window.__astral = {
  state,
  start: () => { startMatch(state, seedCounter += 13); render(); },
  play: (i) => { const ok = playCard(state, 0, i); render(); return ok; },
  endTurn: () => hooks.onEndTurn(),
  screen: () => state.screen,
  version: 'astral-court-1.0.0',
};
