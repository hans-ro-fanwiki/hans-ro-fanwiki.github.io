import {experienceData} from './experience';

const laps=['一','二','三','四','五','六'];
const {lap,base,spawn}=experienceData;
const chapterTwo=experienceData.stages.find(stage=>stage.chapterTwoBase!==undefined)!;
const f=(value:number)=>Number(value.toFixed(3)).toString();

export function ExperienceFormula({baseLevel}:{baseLevel?:number}){
  return <details className="xp-advanced xp-formula" id="xp-formula">
    <summary><span>計算依據與公式</span><small>HANS V{experienceData.source.version} · 點擊展開</small></summary>
    <div className="xp-formula-body">
      <p className="xp-hint">依 HANS 客戶端的怪物經驗、週目設定與結算規則重建。下列倍率是逐隻怪物的計算依據，不是每場實際獲得的保證經驗。</p>
      {baseLevel!==undefined&&<p className="xp-formula-focus">你目前輸入 Base Lv {baseLevel}：{baseLevel<lap.minLv
        ? `第二章一至六週目的 Base 週目加成相同；達到 Lv ${lap.minLv} 才開始使用對應週目倍率。`
        : '第二章一、二、三週目 Base 週目加成逐步增加，三至六週目相同。'}若在單場中升等，計算機會從升等時起套用新等級。</p>}
      <section className="xp-formula-section">
        <h3>01 <span>等級差懲罰</span></h3>
        <p>只有當角色等級高於怪物等級才會扣減；差距 D = max(0, 角色等級 − 怪物等級)。</p>
        <div className="xp-equation"><span>第一章 1–2 週目</span><code>max({f(base.legacyFloor)}, {f(base.legacyDecay)} ^ D)</code></div>
        <div className="xp-equation"><span>第一章 3–6 週目、第二章全部</span><code>max({f(lap.pen.floor)}, 1 − {f(lap.pen.slope)} × D)</code></div>
      </section>
      <section className="xp-formula-section">
        <h3>02 <span>Base 經驗</span></h3>
        <p>新制套用以下乘法；未滿 Lv {lap.minLv} 的週目倍率固定使用 {lap.lowMult}，達標才使用該週目倍率。</p>
        <div className="xp-equation xp-equation-main"><code>怪物原始 EXP × 關卡經驗係數 × 等級差係數 × {f(lap.baseK)} × 週目倍率 × 菁英係數 × 全服加成</code></div>
        <p>第一章 1–2 週目改用舊制等級差係數，不乘新制的 {f(lap.baseK)} 與週目獎勵。第一章較高週目還會調整怪物等級及關卡經驗係數；第二章怪物等級不因週目提高。</p>
        <h4>第二章 Base 週目倍率表</h4>
        <div className="xp-formula-table">
          <table>
            <thead><tr><th>週目</th><th>Lv 1–69</th><th>Lv 70 以上</th></tr></thead>
            <tbody>{chapterTwo.chapterTwoBase!.map((mult,index)=><tr key={index}>
              <th scope="row">{laps[index]}週目</th>
              <td>{f(lap.lowMult*lap.baseK)}×</td>
              <td>{f(mult*lap.baseK)}×</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="xp-hint">表格僅含新制 Base 係數；尚須乘怪物原始經驗、等級差、菁英及全服加成。</p>
      </section>
      <section className="xp-formula-section">
        <h3>03 <span>Job 經驗</span></h3>
        <div className="xp-equation xp-equation-main"><code>怪物原始 EXP × 關卡經驗係數 × 等級差係數 × Job 係數 × 職業階段修正 × 軟上限修正 × 菁英係數 × 全服加成</code></div>
        <p>新制的 Job 係數為 {f(lap.jobK)}，不會隨週目升高。第一章 1–2 週目不乘此係數，採舊制等級差規則。Job 還會依轉職階段與該關卡的 Job 軟上限修正。</p>
      </section>
      <section className="xp-formula-section">
        <h3>04 <span>怪物、事件與每分鐘效率</span></h3>
        <div className="xp-equation"><span>普通怪物出怪量</span><code>來源波次每秒數量 × 怪物數量倍率</code></div>
        <div className="xp-equation"><span>菁英／怪物潮間隔</span><code>{spawn.eliteInterval} 秒／事件倍率、{spawn.hordeInterval} 秒／事件倍率</code></div>
        <p>菁英替代普通怪物生成，結算基礎經驗視同 5 倍。怪物潮增加出怪量；每分鐘擊殺上限會限制能算進去的擊殺數。</p>
        <div className="xp-equation"><span>比較排名</span><code>模擬全場累計 EXP ÷（最後頭目出場秒數 + {experienceData.victorySeconds} 秒 + 額外整備秒數）× 60</code></div>
      </section>
      <p className="xp-formula-disclaimer">試算限制：不模擬怪物堆積、移動、死亡、打王耗時變化或不同週目怪物血量對清怪速度的影響。GS 只用來過濾入場門檻，不會當作擊殺能力。相同經驗時，排行榜優先顯示較低週目；如要比較實際效率，請以遊戲結算紀錄校準。</p>
      <a className="xp-formula-link" href="https://github.com/hans-ro-fanwiki/hans-ro-fanwiki.github.io/blob/main/docs/HANS_EXPERIENCE_20261123.md" target="_blank" rel="noopener noreferrer">查看來源、假設與實測方法</a>
    </div>
  </details>;
}
