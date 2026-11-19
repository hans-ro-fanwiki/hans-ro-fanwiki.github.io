// Strict non-executing comparison with official equipment registrations.
// Only immutable ID/slot and literal base ATK/MATK/DEF are promoted to verified.
const assert=require('node:assert/strict');

function reviewEquipmentDefinitions(catalog,soul) {
  const slots=new Map(),bases=new Map();
  const classes=['Z','Pr','re','zo'];
  const rare=/,([A-Za-z_$][\w$]*)=\(t,e,a,o=\{\}\)=>\{[A-Za-z_$][\w$]*\.add\(t\),Z\(t,e,0,\[\],\{base:a,rare:!0,\.\.\.o\}\)\}/.exec(soul);
  assert.ok(rare,'Rare equipment registration changed');
  classes.push(rare[1]);
  const coverage={};
  for(const name of classes) {
    const regex=new RegExp('(?:^|[^\\w$])'+name+'\\((\\d+),"([a-z_]+)"','g');
    let count=0;
    for(const hit of soul.matchAll(regex)) {
      const id=Number(hit[1]),slot=hit[2];
      assert.ok(!slots.has(id)||slots.get(id)===slot,'Conflicting official equipment slot '+id);
      slots.set(id,slot);
      count++;
      if(['re','zo',rare[1]].includes(name)) {
        const segment=soul.slice(hit.index,hit.index+300);
        const stats=/\{atk:(-?[\d.]+),matk:(-?[\d.]+),def:(-?[\d.]+)/.exec(segment);
        assert.ok(stats,'Official base stat object changed: '+id);
        const base={atk:Number(stats[1]),matk:Number(stats[2]),def:Number(stats[3])};
        if(bases.has(id))assert.deepEqual(bases.get(id),base,'Conflicting base stats: '+id);
        bases.set(id,base);
      }
    }
    coverage[name]=count;
  }
  const cloneHit=/for\(const\[t,e\]of(\[\[[^;]+?\]\])\)[A-Za-z_$][\w$]*\(t,e\)/.exec(soul);
  assert.ok(cloneHit,'Festival clone registration changed');
  const clones=JSON.parse(cloneHit[1]);
  assert.equal(clones.length,31,'Festival clone list changed');
  for(const [base,id] of clones){
    assert.ok(slots.has(base),'Festival clone base ID missing: '+base);
    assert.ok(!slots.has(id),'Festival clone collides with existing ID: '+id);
    slots.set(id,slots.get(base));
    if(bases.has(base))bases.set(id,bases.get(base));
  }
  assert.equal(catalog.items.length,287);
  assert.equal(slots.size,287,'Official equipment registration count changed');
  for(const item of catalog.items){
    assert.equal(item.slot,slots.get(item.id),'Incorrect equipment slot: '+item.id);
    item.fieldProvenance.slot='official';
    const stats=bases.get(item.id);
    if(stats){
      for(const key of ['atk','matk','def'])assert.equal(Number(item.baseStats?.[key]||0),stats[key],'Incorrect equipment base stat: '+item.id+' '+key);
      item.fieldProvenance.baseStats='official';
    }
  }
  return {registered:slots.size,verifiedBaseStats:bases.size,constructors:coverage,festivalClones:clones.length,remainingEffectRules:'candidate; bonus function semantics and class equipment restrictions not yet fully decoded'};
}
module.exports={reviewEquipmentDefinitions};
