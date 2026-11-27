export const qualityNames=['普通','優良','稀有','史詩','傳說'] as const;
const weights=[55,25,13,6.6,1.5] as const;
// Additional Discovery is in percentage points; the minimum quality excludes lower tiers.
export function discoveryProbabilities(percent:number,minimum=0){
 const d=Math.max(0,Number.isFinite(percent)?percent:0)/100;
 const factor=1+d/(1+d);
 const min=Math.max(0,Math.min(4,Math.trunc(minimum)||0));
 const adjusted=weights.map((w,i)=>i<min?0:w*factor**i);
 const total=adjusted.reduce((sum,w)=>sum+w,0);
 return adjusted.map(w=>w/total);
}
