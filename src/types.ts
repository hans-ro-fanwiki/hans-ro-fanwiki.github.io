export type Verified = 'official'|'candidate'|'unknown';
export type Kind = 'item'|'card'|'monster'|'stage';
export type Page = 'items'|'cards'|'stages'|'skills'|'talents'|'balance'|'experience';
export type SourceType='monsterDrop'|'bossDrop'|'story'|'event'|'reward'|'starter'|string;
export interface StageRef {stageId:string;boss:boolean;verified:boolean;verificationState:Verified}
export interface Source {sourceType:SourceType;detail?:string;raidId?:string;sourceTier?:number;monsterId:string|null;stageRefs:StageRef[];rawRate?:number|null;verificationState:Verified;evidence:{file:string;hash:string;kind:string;key:string}|null}
export interface ImageEvidence {assetId:string;officialPath:string;rights:'not-cleared';renderAllowed:false}
export interface Equipment {id:number;name:string;nameAliases?:string[];originalName:string;slot:string;jobs:string[];gender:string|null;bonuses:string[];baseStats?:{atk?:number;matk?:number;def?:number;wlv?:number;elv?:number}|null;starBonuses?:string[];starBonusesMax?:string[];sources:Source[];image:ImageEvidence|null;icon:ImageEvidence|null;fieldProvenance:Record<string,Verified>}
export interface CardEffect {stat:string;value:number}
export interface Card {id:number;raidVariant?:true;raid?:{mult:number;suffix:string};name:string;nameAliases?:string[];originalName:string;monsterId:string|null;bonuses:string[];effects:CardEffect[];bossRank:'normal'|'mini'|'mvp';tags:string[];equipSlot:string|null;sources:Source[];image:ImageEvidence|null;fieldProvenance:Record<string,Verified>}
export interface Monster {id:string;name:string;nameAliases?:string[];boss:boolean;stages:{id:string;boss:boolean;verified:boolean}[];sprite:ImageEvidence|null;spriteFrame?:{url:string;x:number;y:number;width:number;height:number;sheetWidth:number;sheetHeight:number}|null;fieldProvenance:Record<string,Verified>}
export interface Stage {id:string;name:string;tier:number;chapter:1|2;gsMin:number;lapTiers:(number|null)[];lapGS:(number|null)[];levels:string;image:ImageEvidence|null;open:boolean;season:boolean;story:boolean;planned:boolean;normalMonsterIds:string[];bossMonsterIds:string[];intruderBossId?:string;candidatePoolCount:number;candidateBossCount:number;provenance:Record<string,Verified>}
export interface LapRules {
 max:number;cardStep:number;suffix:string[];labels:string[];multipliers:number[];
 noScaleCardIds:number[];bossFloors:{mini:number;mvp:number};
 scoring:{base:Record<string,number>;classes:Record<string,Record<string,number>>;relative:Record<string,number>};
 jobs:{id:string;name:string;rank:number;scaling:string}[];
}
export interface Catalog {server:'hans';schemaVersion:number;generatedAt:string;sourceVersion:string;official:{main:{file:string;sha256:string};soul:{file:string;sha256:string};manifest:{file:string;sha256:string};baseUrl:string};policy:string;lapRules:LapRules;items:Equipment[];cards:Card[];monsters:Monster[];stages:Stage[]}
