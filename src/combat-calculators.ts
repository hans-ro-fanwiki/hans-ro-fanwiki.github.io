/** HANS V0.15.1 (2026-11-25) client formulas; not a server simulation.
 * All percentage inputs are display percentage points, not internal fractions.
 */
export function cooldownSeconds(base:number,haste:number,local=0,buff=0,modeMultiplier=1){
 return Math.max(0,base)/(1+Math.max(0,haste+local+buff)/100)*modeMultiplier;
}
export function castSeconds(base:number,dex:number,haste:number,area:boolean){
 return Math.max(0,base)*Math.max(0,1-dex/(area?150:100))/(1+Math.max(0,haste)/100);
}
export function effectiveRange(rawBonus:number){
 const x=1+rawBonus/100;
 return x<=1?x:1+(x-1)/(1+(x-1)/2);
}
// reduction is the sum of raw percentage points, before the character soft cap.
export function ownReduction(raw:number){
 return raw<=0?raw/100:.85*raw/(raw+40);
}
export function normalDamage(input:number,armor:number,reduction:number,buff:number,def:number,pvp=false){
 const own=ownReduction(reduction);
 const effectiveReduction=Math.min(pvp?.7:.85,1-(1-own)*(1-Math.max(0,Math.min(80,buff))/100));
 const defReduction=def>0?def/(def+80):0;
 return {ownReduction:own,effectiveReduction,defReduction,damage:Math.max(1,Math.round((input-armor)*(1-effectiveReduction)*(1-defReduction)))};
}
export function overflowCritDamage(critChance:number,pvp=false){
 return Math.max(0,critChance-100)*5*(pvp?.5:1);
}
export function effectiveFlee(own:number,buff:number,pvp=false){
 return Math.min(pvp?50:75,Math.min(50,own)+buff);
}
