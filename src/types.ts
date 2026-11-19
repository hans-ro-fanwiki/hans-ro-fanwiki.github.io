export type Verified = 'official'|'candidate'|'unknown';
export type Kind = 'item'|'card'|'monster'|'stage';
export type Page = 'items'|'cards'|'stages';
export type SourceType='monsterDrop'|'bossDrop'|'story'|'event'|'reward'|'starter'|string;
export interface StageRef {stageId:string;boss:boolean;verified:boolean;verificationState:Verified}
export interface Source {sourceType:SourceType;detail?:string;sourceTier?:number;monsterId:string|null;stageRefs:StageRef[];rawRate?:number|null;verificationState:Verified;evidence:{file:string;hash:string;kind:string;key:string}|null}
export interface ImageEvidence {assetId:string;officialPath:string;rights:'not-cleared';renderAllowed:false}
export interface Equipment {id:number;name:string;nameAliases?:string[];originalName:string;slot:string;jobs:string[];gender:string|null;bonuses:string[];baseStats?:{atk?:number;matk?:number;def?:number;wlv?:number;elv?:number}|null;starBonuses?:string[];starBonusesMax?:string[];sources:Source[];image:ImageEvidence|null;icon:ImageEvidence|null;fieldProvenance:Record<string,Verified>}
export interface Card {id:number;name:string;nameAliases?:string[];originalName:string;monsterId:string|null;bonuses:string[];tags:string[];equipSlot:string|null;sources:Source[];image:ImageEvidence|null;fieldProvenance:Record<string,Verified>}
export interface Monster {id:string;name:string;nameAliases?:string[];boss:boolean;stages:{id:string;boss:boolean;verified:boolean}[];sprite:ImageEvidence|null;spriteFrame?:{url:string;x:number;y:number;width:number;height:number;sheetWidth:number;sheetHeight:number}|null;fieldProvenance:Record<string,Verified>}
export interface Stage {id:string;name:string;tier:number;levels:string;open:boolean;season:boolean;story:boolean;planned:boolean;normalMonsterIds:string[];bossMonsterIds:string[];candidatePoolCount:number;candidateBossCount:number;provenance:Record<string,Verified>}
export interface Catalog {server:'hans';schemaVersion:number;generatedAt:string;sourceVersion:string;official:{main:{file:string;sha256:string};soul:{file:string;sha256:string};manifest:{file:string;sha256:string};baseUrl:string};policy:string;items:Equipment[];cards:Card[];monsters:Monster[];stages:Stage[]}
