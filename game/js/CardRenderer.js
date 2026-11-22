// CardRenderer.js — turns a card definition into a readable DOM card.
// Big cost orb, family colour AND shape, large power number, short text.
// A card is a button so keyboard players can Tab to it and press Enter.

import { CARD_BY_ID, FAMILIES } from './CardDefinitions.js';
import { constellationSVG, emblemSVG } from './CardArt.js';

export function cardElement(card, opts = {}) {
  const f = FAMILIES[card.family];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `card fam-${card.family}${opts.small ? ' card-small' : ''}${opts.faceDown ? ' card-back' : ''}${opts.selected ? ' selected' : ''}${opts.playable === false ? ' unplayable' : ''}`;
  el.dataset.cardId = card.id;
  el.setAttribute('aria-label', `${card.name}, ${f.name}, cost ${card.cost}, ${card.text}`);
  if (opts.faceDown) {
    el.innerHTML = `<span class="card-back-art">✦</span><span class="card-back-name">ASTRAL<br>COURT</span>`;
    return el;
  }
  el.innerHTML = `
    <span class="cost" title="Energy cost">${card.cost}✦</span>
    <span class="power" title="Power">${card.n}</span>
    <span class="art">${constellationSVG(card)}<span class="emblem">${emblemSVG(card.family, 46)}</span></span>
    <span class="cname">${card.name}</span>
    <span class="cfam"><i class="glyph">${f.glyph}</i>${f.name}</span>
    <span class="ctext">${card.text}</span>`;
  if (opts.onClick) el.addEventListener('click', opts.onClick);
  return el;
}

export function miniCardElement(cardId, yieldN = 0) {
  const card = CARD_BY_ID[cardId];
  const f = FAMILIES[card.family];
  const el = document.createElement('div');
  el.className = `mini fam-${card.family}`;
  el.title = `${card.name} — ${card.text}`;
  el.innerHTML = `<span class="mini-glyph">${f.glyph}</span><span class="mini-name">${card.name}</span><span class="mini-yield">${yieldN ? `+${yieldN}★/turn` : 'rival pays +1✦'}</span>`;
  return el;
}
