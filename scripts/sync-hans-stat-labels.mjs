// Apply audited label-only changes without rebuilding source registrations or changing numeric data.
import fs from 'node:fs';
import labels from '../src/data/hans-stat-labels.json' with {type:'json'};
const oldLabels=new Map(Object.entries(labels).flatMap(([id,{label,aliases}])=>[label,...aliases].map(name=>[name,id])));
let changed=0;
const update=(file,transform)=>{
 const raw=fs.readFileSync(file,'utf8');
 const data=JSON.parse(raw);
 transform(data);
 const pretty=raw.includes('\n  "');
 const rendered=JSON.stringify(data,null,pretty?2:undefined)+(raw.endsWith('\n')?'\n':'');
 const next=raw.includes('\r\n')?rendered.replace(/\n/g,'\r\n'):rendered;
 if(next!==raw)fs.writeFileSync(file,next);
};
function bonus(line,id){
 const match=line.match(/^(.+?)( [+-]\d.*)$/);
 if(!match)return line;
 const label=labels[id??oldLabels.get(match[1])]?.label;
 if(!label||label===match[1])return line;
 changed++;return label+match[2];
}
update('public/data/catalog.json',data=>{
 for(const card of data.cards)card.bonuses=card.bonuses.map((line,i)=>bonus(line,card.effects[i]?.stat));
 for(const item of data.items)item.bonuses=item.bonuses.map(line=>bonus(line));
});
const talentLabels=Object.entries(labels).flatMap(([id,{aliases}])=>aliases.map(alias=>[alias,labels[id].label]));
function walk(o,visit){
 if(!o||typeof o!=='object')return;
 visit(o);for(const v of Object.values(o))walk(v,visit);
}
update('public/data/talents.json',data=>walk(data,node=>{
 if(typeof node.summary!=='string')return;
 for(const [old,label] of talentLabels)if(node.summary.startsWith(old+'每級 ')){
  node.summary=label+node.summary.slice(old.length);changed++;break;
 }
}));
update('src/combat-compatibility.json',data=>walk(data,entry=>{
 if(entry.source==='global'&&typeof entry.stat==='string'&&labels[entry.statId]&&entry.stat!==labels[entry.statId].label){
  entry.stat=labels[entry.statId].label;changed++;
 }
}));
console.log('Updated '+changed+' existing stat labels; numerical values unchanged.');
