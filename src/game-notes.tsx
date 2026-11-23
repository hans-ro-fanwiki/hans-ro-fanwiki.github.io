export const gameSite='https://ro.hans-webgametw.com/';

const festivalStages:Record<string,{duo:string;intruder:string;mvp:string;length:number;points:number}>={
 louyang:{duo:'5:30 豬婆龍、紙妖',intruder:'8:00 墨蛇君',mvp:'13:30 白素貞',length:16,points:13},
 xmas:{duo:'8:40 卡崙、卡崙寶寶',intruder:'7:10 冰暴騎士',mvp:'12:30 安東尼奧',length:15,points:12},
};

export function FestivalNotes({id}:{id:string}){
 const event=festivalStages[id];
 if(!event)return null;
 return <div className="stage-lap-note">
  <strong>活動流程</strong>
  <ul>
   <li>雙王 {event.duo}。靠近時互相回血，擊倒一隻後另一隻會強化並召怪。</li>
   <li>闖入首領 {event.intruder}（10% 機率）。遇到時須擊倒才能通關，擊倒後額外獲得 1 點節慶點數。</li>
   <li>MVP {event.mvp}。全關 {event.length} 分鐘，至少撐過 {event.points} 分鐘才能獲得節慶點數。</li>
  </ul>
  活動開放狀態依遊戲內為準。
 </div>;
}

export function GameNotes(){
 return <details className="stage-lap-note">
  <summary>世界王與其他活動</summary>
  <h3>世界王</h3>
  <p>11/22 公告為暫停維修，當前狀態以遊戲內為準。11/21 規則為每場 10 個戰場、每個戰場 400 人，全服共 4,000 席，設參加獎與傷害排名獎。</p>
  <h3>無限之塔</h3>
  <p>樓層隨第二章延伸。開放樓層依各角色進度；節慶關卡不列入塔的進度。</p>
  <h3>節慶司儀與卡片回收</h3>
  <p>公告列出元宵燈會裝備池 32 件，聖誕裝備池含燈會裝備共 119 件。卡片回收員已加入第二章卡片，各池的個別品項請以遊戲內為準。</p>
  <a href={gameSite}>漢斯服最新消息</a>
 </details>;
}
