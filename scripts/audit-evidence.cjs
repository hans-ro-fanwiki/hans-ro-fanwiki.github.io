const fs = require('node:fs');
const path = require('node:path');
const dir=process.argv[2];
const read=(name)=>fs.readFileSync(path.join(dir,name),'utf8');
const src=read('official-soul-linker.js');
const main=read('official-main.js');
const monsterDrops = new Map();
for (const m of src.matchAll(/([a-z][a-z0-9_]*):\[((?:\{id:\d+,rate:\d+\},?)+)\]/g)) {
  const vals=[...m[2].matchAll(/\{id:(\d+),rate:(\d+)\}/g)].map(x=>({id:Number(x[1]),rate:Number(x[2])}));
  if (vals.length) monsterDrops.set(m[1],vals);
}
for (const id of ['strouf','marina','dragon_fly','willow','baby_desert_wolf','poring']) console.log('officialMonsterDrops',id,monsterDrops.get(id)||null);
console.log('count',monsterDrops.size);
for (const needle of ['byalan:{','prontera:{','payon:{','willow','2603','4010','cooldown','cdReduction','reduceCooldown']) {
 const files=[['soul',src],['main',main]];
 console.log('SEARCH',needle);
 for (const [file,s] of files) {
   const all=[];let from=0,at;
   while((at=s.indexOf(needle,from))>=0){if(all.length<4)all.push(s.slice(Math.max(0,at-110),Math.min(at+420,s.length)).replace(/\s+/g,' '));from=at+needle.length;}
   console.log(file,'count',s.split(needle).length-1,all);
 }
}
