#!/usr/bin/env node
// Extract player-facing raid previews from a SHA-pinned HANS snapshot without executing it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const audit = require('../docs/HANS_RAID_SOURCE_20261123.json');
const directory = path.resolve(process.argv[2] || path.join(root, audit.directory));
const catalog = require('../public/data/catalog.json');

function audited(entry) {
  const bytes = fs.readFileSync(path.join(directory, entry.file));
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw Error('HANS SHA mismatch: ' + entry.file);
  return bytes.toString('utf8');
}

// These three literal boundaries were checked in the pinned preview and registration.
const main = audited(audit.main);
const soul = audited(audit.soul);
const manifest = JSON.parse(audited(audit.manifest));
const preview = main.match(/D:(\{"raids":\{"r1":.+?\},"ROLE_ICON":\{[^}]+\}\})/);
const lap = main.match(/RO_LAPC=(\{"stages":.+?\});var RO_C2T=/);
const clones = soul.match(/for\(const\[o,n\]of (\[\[1128,39001\],.+?\])\)gs\[o\]&&\(gs\[n\]=\{\.\.\.gs\[o\],id:n,xmas:1\}\)/);
if (!preview || !lap || !clones) throw Error('Audited HANS raid preview or registrations missing');

const cloneBase = new Map(JSON.parse(clones[1]).map(([base, id]) => [id, base]));
const items = new Set(catalog.items.map(item => item.id));
const cards = new Set(catalog.cards.filter(card => card.raid).map(card => card.id));
const rules = JSON.parse(lap[1]);
const raidCards = new Set(rules.raid.cards);
const extraItems = {};
const raids = Object.entries(JSON.parse(preview[1]).raids).map(([id, raid]) => {
  if (id !== 'r' + raid.no || manifest.maps[raid.key] !== 'maps/' + raid.key + '/map.json')
    throw Error('Invalid raid map: ' + id);
  for (const itemId of raid.pool) {
    if (items.has(itemId) || Object.hasOwn(extraItems, itemId)) continue;
    const baseId = cloneBase.get(itemId);
    const item = manifest.items[itemId];
    const translationKey = item && JSON.stringify(item.name) + ':';
    const translation = translationKey && soul.indexOf(translationKey);
    if (!items.has(baseId) || !item?.icon || !(translation >= 0))
      throw Error('No audited base item or translation: ' + itemId);
    const name = soul.slice(translation + translationKey.length).match(/^("(?:[^"\\]|\\.)*")/);
    if (!name) throw Error('No official name: ' + itemId);
    extraItems[itemId] = {baseId, name:JSON.parse(name[1]), originalName:item.name, icon:item.icon};
  }
  for (const cardId of raid.cards) {
    const baseId = cardId % rules.cardStep;
    if (!raidCards.delete(baseId) || !cards.has(baseId))
      throw Error('Unknown or duplicate raid card: ' + cardId);
  }
  return {
    id, name:raid.name, boss:raid.boss.name, map:raid.key, tier:raid.tier,
    gs:raid.pmin, minutes:raid.mins, gearPerBoss:raid.div, traits:raid.traits,
    healerRequirements:(raid.heal || []).filter(([players])=>players>=6).sort(([a],[b])=>a-b),
    baseHealers:raid.heal?.find(([players])=>players===1)?.[1] || 0,
    recommendedRoles:raid.mixRoles.map(({label,pct,min})=>({label,percent:Math.round(pct*100),min})),
    zones:raid.zones, gear:raid.pool, cards:raid.cards.map(id => id % rules.cardStep),
    materials:raid.ores, firstClear:raid.first,
  };
});
if (raids.length !== 8 || raidCards.size || rules.raid.mult !== 4.2) throw Error('Incomplete raid coverage');

const lines = raids.map(raid => '    ' + JSON.stringify(raid));
const output = '{\n  "raids": [\n' + lines.join(',\n') + '\n  ],\n  "extraItems": ' + JSON.stringify(extraItems, null, 2).replace(/\n/g, '\n  ') + '\n}\n';
fs.writeFileSync(path.join(root, 'src/data/hans-raids.json'), output);
