/** HANS V0.15.1 client formulas; not a server or mode-specific simulation.
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
export function normalDamage(input:number,armor:number,reduction:number,buff:number,def:number){
 const effectiveReduction=Math.min(75,Math.min(60,reduction)+Math.min(60,buff))/100;
 const defReduction=def>0?def/(def+80):0;
 return {effectiveReduction,defReduction,damage:Math.max(1,Math.round((input-armor)*(1-effectiveReduction)*(1-defReduction)))};
}
