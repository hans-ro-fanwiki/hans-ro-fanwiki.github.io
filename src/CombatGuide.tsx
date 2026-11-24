import {useEffect, useId, useRef, useState} from 'react';
import compatibility from './combat-compatibility.json';
import './combat.css';

const VERSION = `HANS V${compatibility.version}`;

const defenses = [
  ['角色減傷上限', '60%', '裝備、卡片等給的角色減傷，合計最多算到 60%。'],
  ['加上暫時減傷後', '通常 75%', '一般受傷時，角色減傷和適用的暫時減傷加起來，通常最多算到 75%。'],
  ['護甲', '先扣固定值', '護甲 10，就先從這次傷害扣 10，再算百分比減傷。'],
  ['DEF', '剩下的再減', 'DEF 80 時，前面算完的傷害再減半。DEF 越高，每多一點帶來的差異越小。'],
] as const;

type CompatibilityRow = (typeof compatibility.skills)[keyof typeof compatibility.skills][number];
const compatibilityBySkill: Partial<Record<string, CompatibilityRow[]>> = compatibility.skills;
const sourcesByStat: Partial<Record<string, Record<string, string[]>>> = compatibility.namedSources;
type SourceDetail = (typeof compatibility.sourceDetails)[keyof typeof compatibility.sourceDetails];
const sourceDetails: Partial<Record<string, SourceDetail>> = compatibility.sourceDetails;
const deityBySkill: Partial<Record<string, {bonuses:string[];triggers:string[]}>> = compatibility.deities;

function ItemSources({groups, unaffected}: {groups: [string, string[]][]; unaffected: boolean}) {
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const activeId = hovered ?? focused ?? selected;
  const active = activeId ? sourceDetails[activeId] : undefined;

  useEffect(() => {
    if (!selected) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setSelected(undefined);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [selected]);

  return <div ref={container} className="combat-item-sources" onKeyDown={event => {
    if (event.key === 'Escape') {
      setHovered(undefined);
      setFocused(undefined);
      setSelected(undefined);
    }
  }}>
    {unaffected && <p className="combat-source-exclusion">這些道具加的是其他效果：</p>}
    <dl aria-label={unaffected ? '不影響這項效果的道具' : '可用道具與神格'}>
      {groups.map(([group, ids]) => <div className="combat-source-group" key={group}>
        <dt>{group}</dt>
        <dd>{ids.map(id => {
          const item = sourceDetails[id];
          if (!item) return null;
          return <button key={id} type="button" className="combat-source-chip"
            data-group={item.group} aria-expanded={activeId===id} aria-controls={activeId===id ? panelId : undefined}
            onPointerEnter={event=>{if(event.pointerType==='mouse')setHovered(id);}}
            onPointerLeave={()=>setHovered(current=>current===id ? undefined : current)}
            onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))setFocused(id);}}
            onBlur={()=>setFocused(current=>current===id ? undefined : current)}
            onClick={()=>{
              setFocused(undefined);
              setSelected(current=>current===id ? undefined : id);
            }}>{item.name}</button>;
        })}</dd>
      </div>)}
    </dl>
    {active && <div id={panelId} className={`combat-source-panel${selected?' is-pinned':''}`} role="region" aria-label={active.name+'的效果'}>
      <div className="combat-source-title"><strong>{active.name}</strong><span>{active.group}</span></div>
      <p className="combat-source-caption">首次取得，依品質</p>
      <ul>{active.effects.map(effect=><li key={effect}>{effect}</li>)}</ul>
      {active.changesRange && <p className="combat-source-caption">角色的範圍加成越高，實際增加的距離越少。</p>}
    </div>}
  </div>;
}

function CompatibilityRows({rows}: {rows: CompatibilityRow[]}) {
  return <ul className="combat-effects">{rows.map(({source, stat, statId, effect, status, condition, note}) => {
    const items = source === 'global' ? Object.entries(sourcesByStat[statId] ?? {}) : [];
    const unaffected = status === 'ineffective';
    return <li key={JSON.stringify([statId, stat, effect, status, condition, note])}>
      <strong>{stat}</strong><span>{note ?? effect}{condition && `（${condition}）`}</span>
      {items.length > 0 && <ItemSources groups={items} unaffected={unaffected}/>}
    </li>;
  })}</ul>;
}

export function SkillCompatibility({skillId, skillName}: {skillId: string; skillName: string}) {
  const rows = Object.hasOwn(compatibilityBySkill, skillId) ? compatibilityBySkill[skillId] : undefined;
  const global = rows?.filter(row => row.source === 'global') ?? [];
  const local = rows?.filter(row => row.source === 'local') ?? [];
  const deity = rows?.filter(row => row.source === 'deity') ?? [];
  const deityInfo = Object.hasOwn(deityBySkill,skillId) ? deityBySkill[skillId] : undefined;
  const onlyTiming = !!rows?.length && rows.every(row => row.stat === '急速' || row.stat === '冷卻加成');
  const section = onlyTiming || skillId === 'ruwach' ? 'timing' : 'geometry';

  return <section className="combat-compat">
    <h3>哪些詞條會影響這招？</h3>
    {!rows?.length && <p>這招還沒查到可確認的效果。</p>}
    {global.length > 0 && <CompatibilityRows rows={[
      ...global.filter(row=>row.status!=='ineffective'),
      ...global.filter(row=>row.status==='ineffective'),
    ]}/>}
    {local.length > 0 && <details className="combat-effect-group">
      <summary>這招自己的加成</summary>
      <CompatibilityRows rows={local}/>
    </details>}
    {deityInfo && <details className="combat-effect-group">
      <summary>{skillName}的神格效果</summary>
      {deityInfo.bonuses.length > 0 && <>
        <p className="combat-note">第 1 階加成</p>
        <ul className="combat-deity-list">{deityInfo.bonuses.map(bonus=><li key={bonus}>{bonus}</li>)}</ul>
      </>}
      {deityInfo.triggers.length > 0 && <>
        <p className="combat-note">拿到神格後追加的效果</p>
        <ul className="combat-deity-list">{deityInfo.triggers.map(effect=><li key={effect}>{effect}</li>)}</ul>
      </>}
      {deity.length > 0 && <details className="combat-effect-group">
        <summary>看加成用在這招的哪裡</summary>
        <CompatibilityRows rows={deity}/>
      </details>}
      <p className="combat-note">上面是神格給的加成。實際增加的傷害、範圍或冷卻還會依這招的規則計算。</p>
      <p className="combat-note">這招的神格和禁錮之神等全域神格用同一個欄位，換上新的會取代原本的。</p>
    </details>}
    <p className="combat-note">{onlyTiming ? '目前查到的詞條效果：冷卻。' : '詞條清單只列已查證的項目。'} · {VERSION}</p>
    <a href={`?page=combat#${section}`}>查看戰鬥機制</a>
  </section>;
}

export function CombatGuide() {
  useEffect(() => {
    const section = location.hash.slice(1);
    if (['defense', 'geometry', 'timing'].includes(section)) {
      document.getElementById(section)?.scrollIntoView();
    }
  }, []);
  return <div className="combat-guide">
    <p className="combat-note">{VERSION} · 依遊戲客戶端核對</p>
    <nav aria-label="戰鬥機制目錄" className="combat-jump">
      <a href="#defense">承傷與減傷</a>
      <a href="#geometry">範圍與近戰距離</a>
      <a href="#timing">急速與計時</a>
    </nav>

    <section id="defense" aria-labelledby="combat-defense-title">
      <h2 id="combat-defense-title">承傷與減傷</h2>
      <p className="combat-intro">一般受到攻擊時，先扣護甲，再算百分比減傷，最後算 DEF。</p>
      <dl className="combat-defenses">{defenses.map(([name, value, description]) => <div key={name}>
        <dt>{name}<strong>{value}</strong></dt>
        <dd>{description}</dd>
      </div>)}</dl>
      <details className="combat-details">
        <summary>承傷公式與算例</summary>
        <p>正 DEF 的減傷比例為 DEF ÷ (DEF + 80)。傷害最後四捨五入，這一步最低為 1。輸入傷害已包含攻擊者與玩法的前置修正。</p>
        <p className="combat-formula">傷害 = max(1, round((輸入傷害 − 護甲) × (1 − 有效減傷) × (1 − DEF 減傷比例)))</p>
        <p>輸入傷害 100、護甲 10、有效減傷 75%、DEF 80 時，<strong>90 × 0.25 × 0.5 = 11.25，最後為 11 傷害</strong>。</p>
      </details>
      <details className="combat-details">
        <summary>防禦特例與玩法差異</summary>
        <p>負重增加的暫時防護本身超過 75% 時，這一層的上限會跟著提高。免疫、閃避與護盾另有規則。</p>
        <p>團隊副本與世界王部分招式直接按最大 HP 比例扣血，適用該招式的獨立規則。</p>
      </details>
    </section>

    <section id="geometry" aria-labelledby="combat-geometry-title">
      <h2 id="combat-geometry-title">範圍與近戰距離</h2>
      <p><strong>廣域藥水</strong>加的是範圍效果，例如天羅地網打得到的區域。<strong>範圍藥水</strong>加的是近戰物理距離。兩種加成各自計算，堆得越高，同樣一次加成帶來的距離越少。</p>
      <div className="combat-jump">
        <a href="?page=skills&sj=sura">修羅技能</a>
        <a href="?page=skills&sk=triangle_shot">三角射擊</a>
        <a href="?page=skills&sk=rolling_cutter">迴旋斬</a>
        <a href="?page=skills&sk=storm_gust">暴風雪</a>
      </div>
    </section>

    <section id="timing" aria-labelledby="combat-timing-title">
      <h2 id="combat-timing-title">急速與計時</h2>
      <p><strong>急速</strong>讓一般技能的冷卻更快結束。<strong>施法急速</strong>和 DEX 會縮短讀條時間。召喚、持續傷害和追加效果可能各有自己的計時方式。</p>
      <a href="?page=skills&sk=ruwach">查看光獵的兩種計時器</a>
    </section>
  </div>;
}
