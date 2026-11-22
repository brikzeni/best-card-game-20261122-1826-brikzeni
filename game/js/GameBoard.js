// GameBoard.js — renders every screen from the state, nothing else.
// Title, table, win and loss are all real states of the same game; the
// renderer never invents numbers, it only shows what the state holds.

import { CARD_BY_ID, FAMILIES } from './CardDefinitions.js';
import { WIN_STARS, effectiveCost } from './GameState.js';
import { canPlay } from './RulesEngine.js';
import { cardElement, miniCardElement } from './CardRenderer.js';
import { aiIntent } from './OpponentAI.js';
import { playSound } from './AudioManager.js';

export function wardBar(p, label) {
  const pct = Math.max(0, Math.min(100, (p.ward / 20) * 100));
  return `<div class="vitals"><span class="vname">${label}</span>
    <span class="ward"><span class="ward-fill" style="width:${pct}%"></span><b>${p.ward} ♥</b></span>
    <span class="stars">★ ${p.stars}<small> / ${WIN_STARS}</small></span>
    ${p.shield > 0 ? `<span class="shield">🛡 ${p.shield}</span>` : ''}
    <span class="energy">${'✦'.repeat(p.energy)}<small> ${p.energy} energy</small></span></div>`;
}

export function renderTable(root, state, hooks) {
  const you = state.players[0];
  const foe = state.players[1];
  root.innerHTML = `
  <header class="topbar">
    <div class="brand">✦ THE ASTRAL COURT</div>
    <div class="turn-pill ${state.phase === 'player' ? 'your-turn' : 'foe-turn'}">${state.phase === 'player' ? 'YOUR TURN — play a card or end turn' : state.phase === 'ai' ? 'RIVAL KEEPER IS THINKING…' : 'THE COURT IS DECIDED'}</div>
    <div class="top-actions"><button id="btn-rules" class="ghost">Rules</button><button id="btn-mute" class="ghost">🔊 Sound</button><button id="btn-restart" class="ghost">↻ Restart</button></div>
  </header>
  <section class="foe-zone">
    <div class="foe-head"><span class="avatar foe-av">☾</span><div><b>Vesper, Rival Keeper</b><i>${aiIntent(state)}</i></div></div>
    ${wardBar(foe, 'Rival')}
    <div class="hand foe-hand" id="foe-hand"></div>
    <div class="board-row" id="foe-board"></div>
  </section>
  <section class="mid-zone">
    <div class="shrines" title="First to 15 stars, or reduce the rival Ward to 0, claims the Court.">
      <span class="shrine">✦ Dawn Shrine</span><span class="shrine-goal">FIRST TO ${WIN_STARS} ★ WINS &nbsp;·&nbsp; OR BREAK THE RIVAL WARD</span><span class="shrine">✦ Dusk Shrine</span>
    </div>
    <div class="banner" id="banner">${state.log[0] || 'The stars are listening.'}</div>
    <div class="gamelog" id="gamelog">${state.log.slice(0, 6).map((l) => `<div>${l}</div>`).join('')}</div>
  </section>
  <section class="you-zone">
    <div class="board-row" id="you-board"></div>
    <div class="you-head"><span class="avatar you-av">☀</span><div><b>You — Keeper of the Dawn</b><i>Click a card, then click it again to play it. 1–7 selects, Space ends turn.</i></div>
    ${wardBar(you, 'You')}</div>
    <div class="hand you-hand" id="you-hand"></div>
    <div class="actions"><button id="btn-end" class="primary" ${state.phase !== 'player' ? 'disabled' : ''}>END TURN ⏎</button>
    <span class="hint">Turn ${state.turn} · Deck ${you.deck.length} · ${you.hand.length} cards in hand</span></div>
  </section>`;

  const foeHand = root.querySelector('#foe-hand');
  foe.hand.forEach(() => foeHand.appendChild(cardElement({ id: 'back', name: '', family: 'veil', cost: 0, n: 0, text: '' }, { faceDown: true, small: true })));
  const foeBoard = root.querySelector('#foe-board');
  foe.board.forEach((b) => foeBoard.appendChild(miniCardElement(b.cardId, b.yield)));
  if (!foe.board.length) foeBoard.innerHTML = '<span class="board-empty">No rival constellations yet</span>';
  const youBoard = root.querySelector('#you-board');
  you.board.forEach((b) => youBoard.appendChild(miniCardElement(b.cardId, b.yield)));
  if (!you.board.length) youBoard.innerHTML = '<span class="board-empty">Your constellations will shine here — play Star Chart, Gravity Well or Observatory</span>';

  const youHand = root.querySelector('#you-hand');
  you.hand.forEach((cardId, i) => {
    const card = CARD_BY_ID[cardId];
    const legal = canPlay(state, 0, i);
    const el = cardElement(card, {
      selected: state.selected === i,
      playable: state.phase === 'player' ? legal.ok : true,
      onClick: () => hooks.onCardClick(i),
    });
    el.style.setProperty('--i', i);
    if (!legal.ok && state.phase === 'player') el.title = `Cannot play: ${legal.why}`;
    youHand.appendChild(el);
  });

  root.querySelector('#btn-end').addEventListener('click', hooks.onEndTurn);
  root.querySelector('#btn-restart').addEventListener('click', hooks.onRestart);
  root.querySelector('#btn-rules').addEventListener('click', hooks.onRules);
  root.querySelector('#btn-mute').addEventListener('click', (e) => {
    hooks.onMute();
    e.target.textContent = hooks.muted() ? '🔇 Muted' : '🔊 Sound';
  });
}

export function renderTitle(root, hooks) {
  root.innerHTML = `
  <div class="title-screen">
    <div class="title-stars" aria-hidden="true">${'<i>✦</i>'.repeat(14)}</div>
    <p class="eyebrow">A TACTICAL CARD DUEL · MAKE.FUN BEST CARD GAME</p>
    <h1 class="logo">THE<br><span>ASTRAL COURT</span></h1>
    <p class="tagline">Two rival Keepers. Three shrines. One constellation to claim.<br>Outwit Vesper with Radiance, Veil, Orbit and Eclipse — first to <b>15 stars</b>, or break the rival Ward.</p>
    <button id="btn-play" class="primary big">▶ &nbsp;PLAY THE DUEL</button>
    <div class="title-cards" id="title-cards"></div>
    <div class="title-foot"><span>☀ Radiance — strike</span><span>◐ Veil — shield</span><span>◎ Orbit — build</span><span>☾ Eclipse — risk</span></div>
    <button id="btn-how" class="ghost">How to play</button>
  </div>`;
  const showcase = ['starfall', 'sanctuary', 'observatory', 'black-sun'];
  const wrap = root.querySelector('#title-cards');
  showcase.forEach((id) => wrap.appendChild(cardElement(CARD_BY_ID[id], { small: true })));
  root.querySelector('#btn-play').addEventListener('click', () => { playSound('turn'); hooks.onPlay(); });
  root.querySelector('#btn-how').addEventListener('click', hooks.onRules);
}

export function renderResult(root, state, hooks) {
  const won = state.screen === 'won';
  const you = state.players[0];
  const foe = state.players[1];
  root.innerHTML = `
  <div class="result-screen ${won ? 'win' : 'loss'}">
    <div class="result-burst">${won ? '✦ ✧ ✦' : '☾'}</div>
    <h1>${won ? 'THE COURT IS YOURS' : 'THE COURT FALLS DARK'}</h1>
    <p class="result-sub">${won ? 'Vesper bows. The constellation burns your name across the sky.' : 'Vesper claims the constellation — this time. The stars will deal again.'}</p>
    <div class="final-score">
      <div><span>FINAL SCORE</span><b>${you.stars} ★ — ${foe.stars} ★</b></div>
      <div><span>WARD LEFT</span><b>${you.ward} ♥ — ${foe.ward} ♥</b></div>
      <div><span>TURNS · CARDS PLAYED</span><b>${state.stats.turns} · ${state.stats.cardsPlayed}</b></div>
    </div>
    <div class="result-log"><span>HOW IT ENDED</span>${state.log.slice(0, 4).map((l) => `<div>✦ ${l}</div>`).join('')}</div>
    <p class="result-tip">${won ? 'Tip: your winning line is in the game log — try a riskier Eclipse line next duel.' : 'Tip: Veil cards buy time, Orbit cards win the long game. Build constellations early.'}</p>
    <button id="btn-again" class="primary big">↻ &nbsp;PLAY AGAIN</button>
    <button id="btn-title2" class="ghost">Back to title</button>
  </div>`;
  root.querySelector('#btn-again').addEventListener('click', hooks.onPlayAgain);
  root.querySelector('#btn-title2').addEventListener('click', hooks.onTitle);
  playSound(won ? 'win' : 'lose');
}

export function renderRules(root, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal';
  overlay.innerHTML = `<div class="modal-card">
    <h2>How to play — The Astral Court</h2>
    <p><b>Goal.</b> First to <b>15 stars ★</b>, or reduce the rival Keeper's <b>Ward ♥ to 0</b>.</p>
    <p><b>Turn.</b> You gain energy (up to 8), your constellations pay stars, you draw 2 cards. Click a card to select it, click again to play it. Energy is spent; unspent energy is lost.</p>
    <p><b>Families.</b> ☀ Radiance strikes and scores · ◐ Veil shields and heals · ◎ Orbit builds constellations that pay stars every turn · ☾ Eclipse hits hardest, at a price.</p>
    <p><b>Shield 🛡</b> blocks damage before Ward. <b>Gravity Well</b> makes rival cards cost +1. <b>Nova Rebirth</b> shatters a rival constellation.</p>
    <p><b>Keys.</b> 1–7 select a card · Enter plays the selected card · Space ends the turn.</p>
    <button class="primary" id="btn-close-rules">Got it</button></div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) onClose(); });
  overlay.querySelector('#btn-close-rules').addEventListener('click', onClose);
  root.appendChild(overlay);
}
