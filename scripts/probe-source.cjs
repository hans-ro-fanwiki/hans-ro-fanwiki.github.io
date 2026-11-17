const fs = require('node:fs');
const path = require('node:path');
const dir = process.argv[2];
if (!dir) throw Error('Usage: node scripts/probe-source.cjs <research-directory>');
const bundles = ['official-main.js','official-soul-linker.js'];
const tokens = ['id:2603','id:1104','id:4010','strouf','baby_desert_wolf','"prontera"','"payon_cave"','"acc"','cooldownReduction','cardDrop','dropChance'];
for (const file of bundles) {
  const text = fs.readFileSync(path.join(dir,file),'utf8');
  const rows = [];
  for (const needle of tokens) {
    const at = text.indexOf(needle);
    const count = text.split(needle).length - 1;
    rows.push({needle,count,context:at<0?null:text.slice(Math.max(0,at-145),Math.min(text.length,at+230)).replace(/\s+/g,' ')});
  }
  console.log(JSON.stringify({file,length:text.length,rows},null,2));
}
